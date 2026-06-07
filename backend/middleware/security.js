const helmet = require('helmet');
const cors = require('cors');

const securityHeaders = (app) => {
  // Use Helmet for standard secure HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.ALLOWED_ORIGIN || "http://localhost:3000", "http://localhost:5173"],
      },
    },
    frameguard: {
      action: 'deny' // Sets X-Frame-Options: DENY
    },
    xssFilter: true, // Sets X-XSS-Protection: 1; mode=block
  }));

  // CORS Configuration
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
                        origin.endsWith('.up.railway.app') ||
                        /^http:\/\/localhost:\d+$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Required for httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
};

module.exports = securityHeaders;
