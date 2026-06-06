import pandas as pd
import numpy as np
import os
import random

os.makedirs('data', exist_ok=True)

dates = pd.date_range(start='2025-01-01', end='2025-12-31')
data = []

for d in dates:
    is_weekend = d.weekday() >= 5
    is_holiday = 1 if random.random() < 0.05 else 0
    has_local_event = 1 if random.random() < 0.1 else 0
    temperature = round(random.uniform(22.0, 38.0), 1)
    
    base_revenue = random.randint(10000, 18000)
    if is_weekend or is_holiday:
        base_revenue = int(base_revenue * 1.3)
    
    if temperature < 26:
        base_revenue = int(base_revenue * 0.9)
        
    if has_local_event:
        base_revenue = int(base_revenue * 1.2)
        
    data.append({
        'date': d.strftime('%Y-%m-%d'),
        'revenue': base_revenue,
        'temperature': temperature,
        'has_local_event': has_local_event,
        'is_holiday': is_holiday
    })

df = pd.DataFrame(data)
df.to_csv('data/sample_data.csv', index=False)
print("sample_data.csv generated")
