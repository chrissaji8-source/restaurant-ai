const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Lookup restaurantId securely from user JWT
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const restaurantId = userRes.rows[0].restaurant_id;

    // Call ML service
    let mlData;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        restaurant_id: restaurantId,
        days_ahead: days,
        temperature: 28.0,
        has_local_event: false,
        is_holiday: false
      });
      mlData = mlResponse.data;
    } catch (mlErr) {
      console.error('ML service failed, using fallback mock data:', mlErr.message);
      // Fallback data if ML service isn't running locally
      const baseVal = 12000;
      mlData = {
        predictions: Array.from({length: days}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          return {
            ds: d.toISOString().split('T')[0],
            yhat: baseVal + (Math.random() * 4000),
            yhat_lower: baseVal - 2000,
            yhat_upper: baseVal + 6000
          };
        }),
        confidence: 0.85
      };
    }

    const conditions = ['☀️ Sunny', '🌧️ Rain', '⛅ Cloudy'];
    const actions = [
      'Push delivery combos at 12 PM',
      'Run a Tuesday special offer',
      'Prepare extra thali portions',
      'Optimize staff for dinner rush',
      'Standard operations'
    ];

    // Enrich data
    let lastWeekAvg = 11000;
    const enriched = mlData.predictions.map((p, index) => {
      const d = new Date(p.ds);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const formatDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      
      const vsLastWeekNum = ((p.yhat - lastWeekAvg) / lastWeekAvg) * 100;
      const vsLastWeek = `${vsLastWeekNum > 0 ? '+' : ''}${vsLastWeekNum.toFixed(1)}% ${vsLastWeekNum > 0 ? '↑' : '↓'}`;
      
      const confValue = Math.floor(mlData.confidence * 100) - (index > 7 ? 10 : 0) - (index > 14 ? 15 : 0);

      return {
        dateStr: formatDate,
        rawDate: p.ds,
        dayName,
        predictedRevenue: Math.round(p.yhat),
        lower: Math.round(p.yhat_lower),
        upper: Math.round(p.yhat_upper),
        vsLastWeek,
        isUp: vsLastWeekNum > 0,
        weather: conditions[index % conditions.length],
        hasEvent: index === 5 || index === 12 ? 'Festival nearby' : 'None',
        confidence: confValue,
        action: actions[index % actions.length]
      };
    });

    res.json(enriched);

  } catch (error) {
    console.error('Forecast route error:', error);
    res.status(500).json({ message: 'Error fetching forecast' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    const restaurantId = userRes.rows[0].restaurant_id;

    // Mock history for 4 weeks
    const history = [
      { week: 'May 20 - May 26', predicted: 84000, actual: 85200, accuracy: 98 },
      { week: 'May 13 - May 19', predicted: 81000, actual: 78500, accuracy: 96 },
      { week: 'May 6 - May 12', predicted: 75000, actual: 76000, accuracy: 98 },
      { week: 'Apr 29 - May 5', predicted: 72000, actual: 68000, accuracy: 94 }
    ];

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;
