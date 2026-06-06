const cron = require('node-cron');
const db = require('../db/connect');
const { getWeather } = require('../services/weather');
const { getLocalEvents } = require('../services/events');
const { generateDailyInsights } = require('../services/claude');

// Runs every day at 6:00 AM IST (00:30 UTC)
cron.schedule('30 0 * * *', async () => {
  console.log('Starting daily insights refresh cron job...');
  try {
    const restRes = await db.query('SELECT * FROM restaurants');
    const restaurants = restRes.rows;

    for (const restaurant of restaurants) {
      try {
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
        `;
        const insertParams = [
          restaurant.id,
          predictedRevenue,
          insights.confidence_score,
          weather ? JSON.stringify(weather) : null,
          JSON.stringify(events),
          insights.instagram_caption,
          insights.whatsapp_message,
          insights.menu_tip,
          insights.hashtags
        ];

        await db.query(insertQuery, insertParams);
        console.log(`[SUCCESS] Generated insight for restaurant: ${restaurant.name}`);
      } catch (err) {
        console.error(`[FAILURE] Failed insight for restaurant: ${restaurant.name}`, err.message);
      }
    }
    console.log('Daily insights refresh cron job completed.');
  } catch (error) {
    console.error('Daily refresh cron job failed at DB level:', error.message);
  }
});

console.log('Cron jobs initialized.');
