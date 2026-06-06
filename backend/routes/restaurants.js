const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// POST /api/restaurants
router.post('/', async (req, res) => {
  try {
    const { name, owner_name, email, phone, city, lat, lon, cuisine_type, avg_ticket_size, seating_capacity } = req.body;
    
    const query = `
      INSERT INTO restaurants (name, owner_name, email, phone, city, lat, lon, cuisine_type, avg_ticket_size, seating_capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [name, owner_name, email, phone, city, lat, lon, cuisine_type, avg_ticket_size, seating_capacity];
    const result = await db.query(query, params);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get restaurant' });
  }
});

// GET /api/restaurants (Get all)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM restaurants');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get restaurants' });
  }
});

// PUT /api/restaurants/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, owner_name, phone, city, address, lat, lon, cuisine_type, avg_ticket_size, seating_capacity, delivery_enabled, peak_hours, logo_url } = req.body;
    const query = `
      UPDATE restaurants 
      SET name = $1, owner_name = $2, phone = $3, city = $4, address = $5, lat = $6, lon = $7, cuisine_type = $8, avg_ticket_size = $9, seating_capacity = $10, delivery_enabled = $11, peak_hours = $12, logo_url = $13
      WHERE id = $14 AND deleted_at IS NULL
      RETURNING *
    `;
    const params = [name, owner_name, phone, city, address, lat, lon, cuisine_type, avg_ticket_size, seating_capacity, delivery_enabled, peak_hours, logo_url, req.params.id];
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// PUT /api/restaurants/:id/notifications
router.put('/:id/notifications', async (req, res) => {
  try {
    const { prefs } = req.body;
    const result = await db.query(
      'UPDATE restaurants SET notification_prefs = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING notification_prefs',
      [prefs, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// POST /api/restaurants/:id/upload-sales
router.post('/:id/upload-sales', async (req, res) => {
  try {
    // Simulated CSV parsing
    const { csvData } = req.body;
    // Mock parsing and inserting
    res.json({ message: 'CSV processed successfully', rowsInserted: 142 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload sales data' });
  }
});

module.exports = router;
