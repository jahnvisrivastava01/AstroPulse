import os
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

FEATURES = [
    "heart_rate_bpm",
    "hrv_ms",
    "spo2_pct",
    "core_temp_c",
    "radiation_msv_hr",
    "sleep_hours",
    "cabin_co2_mmhg",
]

def train_models():
    df = pd.read_csv("data/astronaut_telemetry_30d.csv")
    X = df[FEATURES]
    y = df["readiness_score"]

    # 1. Unsupervised Anomaly Detection (Isolation Forest)
    iso_forest = IsolationForest(n_estimators=150, contamination=0.08, random_state=42)
    iso_forest.fit(X)

    # 2. Supervised Readiness Score Estimator (Random Forest)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    rf_model = RandomForestRegressor(n_estimators=120, random_state=42)
    rf_model.fit(X_train, y_train)

    preds = rf_model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Model trained successfully | Readiness MAE: {mae:.2f} points")

    os.makedirs("model", exist_ok=True)
    joblib.dump({"iso_forest": iso_forest, "rf_model": rf_model, "features": FEATURES}, "model/astro_health_models.joblib")

if __name__ == "__main__":
    train_models()
