const db = require('../db/connect');

const checkSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Lookup user's restaurant and check subscription_end
    const userRes = await db.query(
      `SELECT r.subscription_end, r.plan 
       FROM users u
       JOIN restaurants r ON u.restaurant_id = r.id
       WHERE u.id = $1`, 
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User or restaurant not found' });
    }

    const restaurant = userRes.rows[0];

    // Check if subscription has expired
    if (!restaurant.subscription_end || new Date(restaurant.subscription_end) < new Date()) {
      return res.status(403).json({
        error: 'subscription_expired',
        message: 'Your plan has expired. Please renew.'
      });
    }

    next();
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({ message: 'Server error checking subscription' });
  }
};

module.exports = checkSubscription;
