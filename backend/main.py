from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import os
import time
import httpx

app = FastAPI(title="AstroPulse NASA Space Apps Telemetry & AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "model/astro_health_models.joblib"
DATA_PATH = "data/astronaut_telemetry_30d.csv"

models = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
telemetry_df = pd.read_csv(DATA_PATH) if os.path.exists(DATA_PATH) else pd.DataFrame()

class VitalsInput(BaseModel):
    astronaut_id: str
    heart_rate_bpm: float
    hrv_ms: float
    spo2_pct: float
    core_temp_c: float
    radiation_msv_hr: float
    sleep_hours: float
    cabin_co2_mmhg: float = 3.8

def generate_recommendations(v: VitalsInput, readiness: int, is_anomaly: bool):
    recs = []
    affected_systems = []

    if v.heart_rate_bpm > 95 or v.hrv_ms < 42:
        affected_systems.append("cardiovascular")
        recs.append({
            "severity": "critical" if v.heart_rate_bpm > 115 else "warning",
            "system": "Cardiovascular",
            "title": "Elevated Cardiac Strain / Low HRV",
            "action": "Initiate 15-min guided paced breathing protocol & hydrate and recheck; contact the flight surgeon if it persists."
        })
    if v.radiation_msv_hr > 1.5:
        affected_systems.append("radiation")
        recs.append({
            "severity": "critical",
            "system": "Radiation Shielding",
            "title": "Solar Particle / High-Flux Radiation Spike",
            "action": "Relocate crew immediately to water-wall storm shelter module; follow the mission radiation protocol and notify the flight surgeon."
        })
    if v.sleep_hours < 5.8:
        affected_systems.append("circadian")
        recs.append({
            "severity": "warning",
            "system": "Circadian & Neurocognitive",
            "title": "Cumulative Sleep Debt Detected",
            "action": "Shift cabin LED spectrum to warm 2700K during pre-sleep window; defer non-critical EVA tasks."
        })
    if v.spo2_pct < 95.5 or v.cabin_co2_mmhg > 4.8:
        affected_systems.append("respiratory")
        recs.append({
            "severity": "critical" if v.spo2_pct < 94.0 else "warning",
            "system": "Respiratory & ECLSS",
            "title": "Hypoxic Drift / Elevated Partial CO2",
            "action": "Verify CDRA scrubber bed cycling in Node 3 and perform pulse-oximetry cross-check."
        })
    if v.core_temp_c > 37.6:
        affected_systems.append("thermoregulation")
        recs.append({
            "severity": "warning",
            "system": "Thermoregulation",
            "title": "Thermal Load Elevation",
            "action": "Increase Liquid Cooling and Ventilation Garment (LCVG) flow rate to MAX."
        })

    if not recs:
        recs.append({
            "severity": "optimal",
            "system": "All Systems Nominal",
            "title": "Crew Member Cleared for Nominal Ops & EVA",
            "action": "Maintain standard ARED resistance exercise schedule (90 min/day) and hydration baseline."
        })

    return recs, list(set(affected_systems))

@app.get("/api/health")
def health_check():
    return {"status": "online", "ml_loaded": models is not None, "records": len(telemetry_df)}

@app.get("/api/crew")
def get_crew_overview():
    if telemetry_df.empty:
        return []
    crew_list = []
    for astro_id, group in telemetry_df.groupby("astronaut_id"):
        latest = group.iloc[-1]
        history = group.tail(24)[["mission_day", "hour", "heart_rate_bpm", "hrv_ms", "spo2_pct", "core_temp_c", "radiation_msv_hr", "cumulative_rad_msv", "sleep_hours", "readiness_score"]].to_dict(orient="records")
        crew_list.append({
            "id": astro_id,
            "name": latest["name"],
            "role": latest["role"],
            "latest": latest.to_dict(),
            "history": history
        })
    return crew_list

@app.post("/api/predict")
def predict_readiness(vitals: VitalsInput):
    row = pd.DataFrame([[
        vitals.heart_rate_bpm,
        vitals.hrv_ms,
        vitals.spo2_pct,
        vitals.core_temp_c,
        vitals.radiation_msv_hr,
        vitals.sleep_hours,
        vitals.cabin_co2_mmhg
    ]], columns=["heart_rate_bpm", "hrv_ms", "spo2_pct", "core_temp_c", "radiation_msv_hr", "sleep_hours", "cabin_co2_mmhg"])

    if models is not None:
        pred_score = int(np.clip(round(models["rf_model"].predict(row)[0]), 10, 100))
        anomaly_pred = int(models["iso_forest"].predict(row)[0]) == -1
    else:
        penalty = (
            max(0, (vitals.heart_rate_bpm - 85) * 0.6)
            + max(0, (55 - vitals.hrv_ms) * 0.7)
            + max(0, (96.5 - vitals.spo2_pct) * 6.0)
            + max(0, (vitals.core_temp_c - 37.4) * 18.0)
            + max(0, (vitals.radiation_msv_hr - 1.2) * 6.5)
            + max(0, (6.5 - vitals.sleep_hours) * 5.5)
        )
        pred_score = int(np.clip(round(100 - penalty), 10, 100))
        anomaly_pred = pred_score < 68

    recs, affected_systems = generate_recommendations(vitals, pred_score, anomaly_pred)
    status = "CRITICAL" if pred_score < 55 else ("WARNING" if pred_score < 75 or anomaly_pred else "OPTIMAL")

    return {
        "astronaut_id": vitals.astronaut_id,
        "readiness_score": pred_score,
        "anomaly_detected": anomaly_pred,
        "status": status,
        "affected_systems": affected_systems,
        "recommendations": recs
    }


# ---- Guardrailed on-board assistant (Gemini) + delayed ground link ----
class AskInput(BaseModel):
    question: str
    summary: str
    crit: int = 0

class GroundMsg(BaseModel):
    id: str
    text: str
    delay_min: float = 0

ground = []
SYSTEM = ("You are an on-board health assistant for astronauts. Use ONLY the provided readings and standard "
          "self-care steps (rest, hydration, recheck, exercise, sleep hygiene, crew contact). Never diagnose or "
          "prescribe medication. Be concise (max 6 lines). If any reading is out of range, start with: CONTACT FLIGHT SURGEON.")

@app.post("/api/assistant")
async def assistant(q: AskInput):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return {"answer": None}
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    body = {"contents": [{"parts": [{"text": f"{SYSTEM}\n\nReadings: {q.summary}\nQuestion: {q.question}"}]}]}
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", json=body)
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return {"answer": None}
    if q.crit and "CONTACT FLIGHT SURGEON" not in text.upper():
        text = "CONTACT FLIGHT SURGEON.\n" + text
    return {"answer": text}

@app.post("/api/ground")
def send_ground(m: GroundMsg):
    d = m.model_dump(); d["eta"] = time.time() + m.delay_min * 60; ground.append(d); return d

@app.get("/api/ground")
def get_ground():
    return [{**m, "delivered": time.time() >= m["eta"]} for m in ground]
