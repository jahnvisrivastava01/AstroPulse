# AstroPulse — Autonomous Crew Health & Readiness Monitoring System
**NASA Space Apps Challenge 2026 Submission — "Create Health Monitoring Software for Astronauts on Space Missions"**  
**Team:** Team Jahnvi · **Submitted by:** Jahnvi Srivastava

AstroPulse is a full-stack, AI-assisted biometric telemetry platform designed for deep-space missions (Artemis / Mars transit) where Earth communication latency (up to 24 minutes each way) requires autonomous onboard crew health monitoring.

---

## Live Deployment
- **Live Web App (Vercel):** https://astro-pulse-eta.vercel.app/
- **FastAPI ML Backend (Render):** https://astropulse-euyc.onrender.com/
- **API Health Check:** https://astropulse-euyc.onrender.com/api/health
- **Interactive API Docs (Swagger):** https://astropulse-euyc.onrender.com/docs
- **GitHub Repository:** https://github.com/jahnvisrivastava01/AstroPulse

*(Note: The Render backend runs on a free instance and may take ~15–30 seconds to wake up on the first request; during wake-up or offline deep-space transit, AstroPulse operates seamlessly using its embedded Edge AI engine.)*

---

## Key Features
1. **30-Day Synthetic NASA Mission Telemetry Dataset (`backend/data/astronaut_telemetry_30d.csv`)**: Realistic multi-astronaut physiological logs (Heart Rate, HRV, SpO2, Core Body Temp, Radiation Flux, Cumulative Radiation Dose, Sleep Architecture, and Cabin CO2).
2. **Machine Learning Anomaly & Readiness Engine (`backend/train_model.py` & `backend/main.py`)**:
   - **Isolation Forest** for unsupervised physiological drift & anomaly detection.
   - **Random Forest Regressor** for real-time EVA Readiness Scoring (0–100).
3. **Interactive Biometric Digital Twin (`BodySystemMap.jsx`)**: Visualizes affected physiological systems (Cardiovascular, Respiratory, Neuro/Circadian, Radiation, Thermoregulation) in real time.
4. **Automated Pre-Spacewalk EVA Airlock Go / No-Go Gate**: Evaluates objective physiological clearance criteria (`Readiness >= 75%`, `HRV >= 42 ms`, `Radiation < 1.2 mSv/h`, `Sleep >= 6.0 hrs`) with Flight Surgeon waiver override capability.
5. **Live Mission Event Simulator**: Trigger a **Solar Flare**, **EVA Exhaustion**, or **Circadian Drift** directly from the top bar during live demos to watch telemetry spike and trigger automated NASA-inspired medical countermeasures.
6. **Dual Role Modes & Interactive Mission Brief**: Toggle seamlessly between **Crew Tablet Mode** (glanceable interface, voice check-in, self-care hub, Mars ground link), **Flight Surgeon Mode** (PIN: `1969`, multi-crew triage matrix, deep time-series telemetry, Handover PDF export), and **Mission Brief**.

---

## Quick Start (Frontend — Runs Standalone Immediately)
```bash
cd frontend
npm install
npm run dev

```

Open `http://localhost:5173` in your browser. *(Note: The frontend includes an embedded Edge AI scoring engine + 30-day mission telemetry snapshot, so it runs smoothly even without starting the Python server!)*

## Quick Start (Optional Python FastAPI + ML Backend)

```bash
cd backend
pip install -r requirements.txt
python train_model.py
python -m uvicorn main:app --reload --port 8000

```

Once running, the frontend automatically detects `http://localhost:8000` (or `VITE_API_URL` in production) and displays `FastAPI ML Live` in the header.

## Self-Care, Guardrails & Ground Link

* **Crew self check-in** (HR, HRV, SpO2, temp, sleep, mood, and Web Speech voice check-in) feeding the same readiness engine.
* **Personal-baseline drift + forecast:** `2+ SD` from the astronaut's own early-mission baseline is flagged; trends estimate hours until a limit is crossed.
* **Guardrailed assistant:** set `GEMINI_API_KEY` for Gemini; out-of-range readings force `"CONTACT FLIGHT SURGEON"`. Offline it falls back to an on-device rule engine.
* **Ground link:** reports queue offline and deliver after a Mars-style delay (`4–24 min`).
* Training script creates `model/`; countermeasure wording defers to mission protocol instead of prescribing doses.

## Honest Notes

Telemetry is synthetic and the readiness labels come from a formula, so the Random Forest approximates that formula; present it as a demonstration pipeline to be retrained on real data. Reference ranges are simplified. Not medical advice.

## Theme, Hazards & Adaptive Baseline

* **Light/Dark toggle** (header) with a blue accent and rose secondary; palette is CSS-variable driven (`index.css`, `tailwind.config.js`).
* **HRP hazard risk scores** (`0–100`) for radiation, isolation, distance, gravity, and closed environment.
* **Adaptive baseline:** absorbs only healthy readings (`readiness >= 75`); crew can recalibrate or reset.
* **No Firebase or login required.** State is local, and the FastAPI backend is optional.

## Layout and Font

Content is left-aligned and full-width (no centered container). Font: Google Sans, bundled via `@fontsource/google-sans` so it also works offline.

---

*Team Jahnvi · Submitted by **Jahnvi Srivastava** · 2026*

```

