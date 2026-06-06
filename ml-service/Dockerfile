FROM python:3.11-slim
WORKDIR /app

# Install build tools required for prophet
RUN apt-get update && apt-get install -y build-essential

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate data and train model during build
RUN python generate_data.py
RUN python model/train.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
