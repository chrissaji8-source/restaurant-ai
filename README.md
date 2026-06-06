# RestaurantAI 🍽️

AI-powered sales intelligence and marketing automation platform tailored for local Indian restaurants.

## Project Structure
- **/frontend**: React + Vite + Tailwind CSS dashboard
- **/backend**: Node.js + Express API server 
- **/ml-service**: Python + FastAPI machine learning service

## Local Setup
1. Clone the repository
2. Set up environment variables by copying `.env.example` to `.env` in the `/backend` and `/frontend` folders.
3. Use Docker Compose to spin up the entire stack:
   ```bash
   docker-compose up -d --build
   ```

## Environment Variables
The application relies on several API keys (set in `/backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ANTHROPIC_API_KEY`: Key for Claude AI predictions
- `OPENWEATHER_API_KEY`: Key for local weather fetching

## Deployment
Each service is configured with a `railway.toml` for simple, scalable deployment on Railway.app.
