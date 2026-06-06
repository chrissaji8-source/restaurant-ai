#!/bin/bash
if [ ! -f "model/saved_model.pkl" ]; then
    echo "Model not found. Training model..."
    python model/train.py
fi
uvicorn main:app --host 0.0.0.0 --port 8000
