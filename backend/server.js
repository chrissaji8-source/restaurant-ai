const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const securityHeaders = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { verifyToken } = require('./middleware/auth');

const app = express();

// Apply security headers, CORS, and sanitization
securityHeaders(app);

app.use(express.json());
app.use(cookieParser());

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply token verification to all API routes (auth middleware handles exclusions)
app.use('/api', verifyToken);

// Routes
const authRouter = require('./routes/auth');
const paymentsRouter = require('./routes/payments');
const insightsRouter = require('./routes/insights');
const restaurantsRouter = require('./routes/restaurants');
const checkSubscription = require('./middleware/checkSubscription');

const campaignsRouter = require('./routes/campaigns');

app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);

// Protected routes with subscription guard
app.use('/api/insights', checkSubscription, insightsRouter);
app.use('/api/campaigns', checkSubscription, campaignsRouter);

const forecastRouter = require('./routes/forecast');

app.use('/api/restaurants', restaurantsRouter);
app.use('/api/forecast', checkSubscription, forecastRouter);

// Initialize cron jobs
require('./cron/dailyRefresh');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RestaurantAI backend running on port ${PORT}`);
});
