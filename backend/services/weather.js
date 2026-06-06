const axios = require('axios');
const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: 1 });

redis.on('error', (err) => {
  redis.get = async () => null;
  redis.set = async () => 'OK';
});

async function getWeather(lat, lon) {
  const cacheKey = `weather:${lat}:${lon}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Redis get error:', err.message);
  }

  try {
    // If we don't have an API key, return mock data
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'mock') {
      return { temp: 28, description: 'clear sky', humidity: 65, wind_speed: 4.5, icon: '01d' };
    }

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = {
      temp: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      wind_speed: response.data.wind.speed,
      icon: response.data.weather[0].icon
    };

    try {
      // 3 hours TTL
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 3 * 60 * 60);
    } catch (err) {
      console.error('Redis set error:', err.message);
    }

    return data;
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}

module.exports = { getWeather };
