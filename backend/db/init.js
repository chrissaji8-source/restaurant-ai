const fs = require('fs');
const path = require('path');
const db = require('./connect');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('Running database initialization check...');
  try {
    // 1. Run migrations/schema.sql if tables don't exist
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      // Simple check to see if tables exist by querying pg_tables
      const tableCheck = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
      );
      
      if (tableCheck.rows.length === 0) {
        console.log('Table "users" not found. Executing schema.sql to initialize database tables...');
        await db.query(sql);
        console.log('Database schema initialized successfully.');
      } else {
        console.log('Database tables already exist. Skipping schema initialization.');
      }

      // Run migrations for Stripe payment columns
      console.log('Checking and applying database migrations for Stripe payment integration...');
      await db.query(`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'razorpay';
      `);
      console.log('Stripe database migrations completed.');
    } else {
      console.warn('schema.sql not found at:', schemaPath);
    }

    // 2. Ensure default restaurant exists
    const defaultRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
    const restCheck = await db.query('SELECT id FROM restaurants WHERE id = $1', [defaultRestaurantId]);
    if (restCheck.rows.length === 0) {
      console.log('Seeding default restaurant (The Bombay Spice)...');
      await db.query(`
        INSERT INTO restaurants (
          id, name, owner_name, email, phone, city, address, cuisine_type, avg_ticket_size, seating_capacity, lat, lon, plan, subscription_end
        ) VALUES (
          $1, 'The Bombay Spice', 'Tarun Bhatia', 'tarun@bombayspice.com', '9876543210', 'Mumbai',
          '12, Linking Road, Santacruz West, Mumbai, Maharashtra 400054', 'Indian', 650, 45, 19.082522, 72.830267,
          'starter', NOW() + INTERVAL '30 days'
        )
      `, [defaultRestaurantId]);
    }

    // 3. Ensure default admin user exists
    const adminEmail = 'admin@salesai.com';
    const adminCheck = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default administrator account...');
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      // Look for a restaurant for admin or leave it null
      await db.query(`
        INSERT INTO users (
          name, email, password_hash, role, is_verified
        ) VALUES (
          'System Admin', $1, $2, 'admin', true
        )
      `, [adminEmail, passwordHash]);
      console.log('Admin user seeded: admin@salesai.com / admin123');
    }

    // 4. Ensure default demo owner user exists
    const ownerEmail = 'demo@salesai.com';
    const ownerCheck = await db.query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
    if (ownerCheck.rows.length === 0) {
      console.log('Seeding default restaurant owner account...');
      const passwordHash = await bcrypt.hash('demo123', 12);
      await db.query(`
        INSERT INTO users (
          restaurant_id, name, email, password_hash, role, is_verified
        ) VALUES (
          $1, 'Demo Owner', $2, $3, 'owner', true
        )
      `, [defaultRestaurantId, ownerEmail, passwordHash]);
      console.log('Demo user seeded: demo@salesai.com / demo123');
    }

    console.log('Database initialization completed.');
  } catch (error) {
    console.warn('⚠️ Database initialization bypassed/failed (Postgres might be offline):', error.message);
  }
}

module.exports = { initializeDatabase };
