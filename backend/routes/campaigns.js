const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const { generateCampaign } = require('../services/anthropic');

const getWeatherData = async (city) => {
  return { condition: 'Clear', temp: '24°C', forecast: 'Pleasant evening' };
};

const getEventsData = async (city) => {
  return { events: ['Local food festival weekend', 'Cricket match screening'] };
};

router.post('/generate', async (req, res) => {
  try {
    const { platform, type, tone, context } = req.body;

    if (!platform || !type || !tone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const restaurantId = userRes.rows[0].restaurant_id;

    const restRes = await db.query('SELECT city FROM restaurants WHERE id = $1', [restaurantId]);
    const city = restRes.rows.length > 0 ? restRes.rows[0].city : 'Mumbai';

    const weather = await getWeatherData(city);
    const events = await getEventsData(city);

    const result = await generateCampaign(platform, type, tone, context || 'None', weather, events);

    res.json({
      caption: result.caption,
      hashtags: result.hashtags || [],
      bestTimeToPost: result.bestTime || 'Post at 6:00 PM',
      platform
    });
  } catch (error) {
    console.error('Generate campaign error:', error);
    res.status(500).json({ message: 'Error generating campaign content' });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { platform, type, tone, caption, hashtags, bestTime } = req.body;
    
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    const restaurantId = userRes.rows[0].restaurant_id;

    await db.query(
      `INSERT INTO campaigns (restaurant_id, platform, type, tone, caption, hashtags, best_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [restaurantId, platform, type, tone, caption, hashtags, bestTime]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Save campaign error:', error);
    res.status(500).json({ message: 'Error saving campaign' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    const restaurantId = userRes.rows[0].restaurant_id;

    const historyRes = await db.query(
      `SELECT id, platform, type, tone, caption, hashtags, best_time, created_at 
       FROM campaigns 
       WHERE restaurant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC 
       LIMIT 30`,
      [restaurantId]
    );

    res.json(historyRes.rows);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Error fetching campaign history' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    const restaurantId = userRes.rows[0].restaurant_id;

    const campRes = await db.query('SELECT restaurant_id FROM campaigns WHERE id = $1', [id]);
    if (campRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    if (campRes.rows[0].restaurant_id !== restaurantId) return res.status(403).json({ message: 'Forbidden' });

    await db.query('UPDATE campaigns SET deleted_at = NOW() WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Error deleting campaign' });
  }
});

module.exports = router;
