import pandas as pd
from prophet import Prophet

def predict(model, days_ahead, regressors):
    future = model.make_future_dataframe(periods=days_ahead)
    
    future['temperature'] = regressors['temperature']
    future['has_local_event'] = regressors['has_local_event']
    future['is_holiday'] = regressors['is_holiday']
    
    forecast = model.predict(future)
    future_forecast = forecast.tail(days_ahead)
    
    predictions = []
    for _, row in future_forecast.iterrows():
        predictions.append({
            "date": row['ds'].strftime('%Y-%m-%d'),
            "predicted_revenue": round(row['yhat']),
            "lower": round(row['yhat_lower']),
            "upper": round(row['yhat_upper'])
        })
        
    return predictions
