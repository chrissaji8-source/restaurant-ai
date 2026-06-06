import pandas as pd
from prophet import Prophet
import joblib
import os

def train_model(csv_path):
    df = pd.read_csv(csv_path)
    df = df.rename(columns={'date': 'ds', 'revenue': 'y'})
    
    m = Prophet(weekly_seasonality=True, daily_seasonality=False)
    m.add_regressor('temperature')
    m.add_regressor('has_local_event')
    m.add_regressor('is_holiday')
    
    m.fit(df)
    
    os.makedirs('model', exist_ok=True)
    joblib.dump(m, 'model/saved_model.pkl')
    print("Model trained and saved successfully")

if __name__ == "__main__":
    train_model('data/sample_data.csv')
