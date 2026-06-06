const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Exclude specific auth paths from token verification
  const openRoutes = [
    '/api/auth/register', 
    '/api/auth/login', 
    '/api/auth/verify-otp', 
    '/api/auth/forgot-password', 
    '/api/auth/reset-password',
    '/api/payments/create-order',
    '/api/payments/webhook'
  ];
  
  if (openRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

const verifyRefreshToken = (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized: No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired refresh token' });
  }
};

module.exports = {
  verifyToken,
  verifyRefreshToken
};
