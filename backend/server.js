const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const insightsRouter = require('./routes/insights');
const restaurantsRouter = require('./routes/restaurants');

app.use('/api/insights', insightsRouter);
app.use('/api/restaurants', restaurantsRouter);

// Dummy routers for other endpoints
app.use('/api/campaigns', express.Router().get('/', (req, res) => res.json({ message: 'campaigns route' })));
app.use('/api/forecast', express.Router().get('/', (req, res) => res.json({ message: 'forecast route' })));
app.use('/api/auth', express.Router().get('/', (req, res) => res.json({ message: 'auth route' })));

// Initialize cron jobs
require('./cron/dailyRefresh');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RestaurantAI backend running on port ${PORT}`);
});
