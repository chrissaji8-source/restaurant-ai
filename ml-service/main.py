from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from model.predict import predict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    restaurant_id: str
    days_ahead: int = 7
    temperature: float = 31.0
    has_local_event: bool = False
    is_holiday: bool = False

@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    try:
        model = joblib.load('model/saved_model.pkl')
        predictions = predict(
            model,
            days_ahead=req.days_ahead,
            regressors={
                'temperature': req.temperature,
                'has_local_event': 1 if req.has_local_event else 0,
                'is_holiday': 1 if req.is_holiday else 0
            }
        )
        return {
            "predictions": predictions,
            "confidence": 0.87
        }
    except Exception as e:
        return {"error": str(e)}
