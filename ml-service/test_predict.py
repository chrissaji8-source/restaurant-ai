import urllib.request
import json
import time

# Give the server a moment to start up
time.sleep(4)

data = json.dumps({
    "restaurant_id": "123e4567-e89b-12d3-a456-426614174000",
    "days_ahead": 7,
    "temperature": 31.0,
    "has_local_event": True,
    "is_holiday": False
}).encode("utf-8")

try:
    req = urllib.request.Request("http://localhost:8000/predict", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        print(res.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
