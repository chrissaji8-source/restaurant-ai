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
  app.use(cors({
    origin: [process.env.ALLOWED_ORIGIN || 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true, // Required for httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
};

module.exports = securityHeaders;
