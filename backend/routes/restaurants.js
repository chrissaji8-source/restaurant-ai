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
    const { name, owner_name, phone, city, lat, lon, cuisine_type, avg_ticket_size, seating_capacity, delivery_enabled, plan } = req.body;
    const query = `
      UPDATE restaurants 
      SET name = $1, owner_name = $2, phone = $3, city = $4, lat = $5, lon = $6, cuisine_type = $7, avg_ticket_size = $8, seating_capacity = $9, delivery_enabled = $10, plan = $11
      WHERE id = $12
      RETURNING *
    `;
    const params = [name, owner_name, phone, city, lat, lon, cuisine_type, avg_ticket_size, seating_capacity, delivery_enabled, plan, req.params.id];
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

module.exports = router;
