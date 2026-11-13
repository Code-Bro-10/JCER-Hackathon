# TrafficAI Machine Learning Microservice (`ml-service`)

High-performance Machine Learning microservice powering intelligent urban traffic flow prediction, anomaly detection, incident severity classification, and dynamic routing for TrafficAI.

---

## 1. Architecture & Frameworks

- **FastAPI 0.115+**: Async, OpenAPI-compliant high-throughput REST service (`http://127.0.0.1:8001`)
- **XGBoost 3.4+**: Gradient boosted decision tree regressors for multi-horizon traffic speed forecasting
- **Scikit-Learn 1.9+**: Isolation Forest anomaly detection & Random Forest incident classification
- **Pandas 2.2+ & NumPy 2.2+**: Spatio-temporal rolling window lag engineering
- **Joblib 1.4+**: Optimized binary serialization for trained model artifacts

---

## 2. Models & Evaluation Metrics

All models are trained with strict chronological train/validation/test splits on authentic loop detector telemetry.

| Model | Algorithm | Dataset & Samples | Horizon | Metric 1 | Metric 2 | Status |
|---|---|---|---|---|---|---|
| **Speed Forecaster (15m)** | XGBoost Regressor | METR-LA (138,276 engineered samples) | +15 min ($t+3$) | **MAE: 5.18 km/h** | **R²: 0.8241** (MAPE: 8.15%) | Saved (`speed_15min_xgb.joblib`) |
| **Speed Forecaster (30m)** | XGBoost Regressor | METR-LA (138,276 engineered samples) | +30 min ($t+6$) | **MAE: 6.24 km/h** | **R²: 0.7473** (MAPE: 10.55%) | Saved (`speed_30min_xgb.joblib`) |
| **Anomaly Detector** | Isolation Forest | Multi-dim deceleration shockwave | Real-time | **Contamination: 4.5%** | **138,276 evaluated** | Saved (`anomaly_detector.joblib`) |
| **Incident Severity** | Random Forest Classifier | FHWA TIM Labeled Prototype (3,200 samples) | Real-time | **Accuracy: 86.72%** | **Macro F1: 0.8710** | Saved (`severity_classifier.joblib`) |

---

## 3. Data Source Provenance & Disclosures

1. **METR-LA Speed & Adjacency Benchmark**:
   - 207 real-world highway loop detector stations located in Los Angeles County (Caltrans PeMS).
   - 2,016 continuous timesteps sampled at 5-minute intervals across 7 full consecutive days (417,312 speed readings).
   - 207x207 network topology adjacency matrix and pairwise distance graph.
2. **Incident Severity Training Data**:
   - Clearly labeled prototype dataset: `[SYNTHETIC-PROTOTYPE-DATASET-V1]`.
   - Calibrated against FHWA Traffic Incident Management (TIM) handbook criteria.

---

## 4. API Endpoints

- `GET /health`: Health probe and loaded models counter
- `GET /info`: Model inventory, framework versions, and dataset metadata
- `GET /metrics`: Training, validation, and test performance metrics
- `POST /predict/speed`: Predicts 15m and 30m speeds with delta and congestion classification
- `POST /detect/anomalies`: Isolation Forest multidimensional anomaly scoring
- `POST /classify/severity`: Random Forest severity classification with class probabilities and contributing factors
- `POST /routes/ml-score`: Reuses road graph and evaluates ML travel time across candidate routes

---

## 5. Running the Service on Windows

```powershell
# 1. Install dependencies
pip install -r ml-service/requirements.txt

# 2. Re-train models (Optional, pre-trained binaries included)
python ml-service/src/train.py

# 3. Start FastAPI microservice (Port 8001)
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --app-dir ml-service
```

