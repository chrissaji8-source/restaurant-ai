const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const { getWeather } = require('../services/weather');
const { getLocalEvents } = require('../services/events');
const { generateDailyInsights } = require('../services/claude');

router.get('/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restRes = await db.query('SELECT * FROM restaurants WHERE id = $1', [restaurantId]);
    if (restRes.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const restaurant = restRes.rows[0];

    let weather = null;
    if (restaurant.lat && restaurant.lon) {
      weather = await getWeather(restaurant.lat, restaurant.lon);
    }

    const events = getLocalEvents(restaurant.city, new Date());
    const predictedRevenue = Math.floor(Math.random() * 50000) + 10000;
    
    const insights = await generateDailyInsights(restaurant, weather, events, predictedRevenue);

    const insertQuery = `
      INSERT INTO daily_insights (
        restaurant_id, date, predicted_revenue, confidence_score,
        weather_summary, local_events, instagram_caption, whatsapp_message,
        menu_tip, hashtags
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const insertParams = [
      restaurantId,
      predictedRevenue,
      insights.confidence_score,
      weather ? JSON.stringify(weather) : null,
      JSON.stringify(events),
      insights.instagram_caption,
      insights.whatsapp_message,
      insights.menu_tip,
      insights.hashtags
    ];

    const result = await db.query(insertQuery, insertParams);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Insights Route Error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
