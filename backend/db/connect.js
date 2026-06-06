const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let useMock = false;
const mockDbPath = path.join(__dirname, 'mock_db.json');

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection and log success
pool.connect()
  .then(client => {
    console.log('Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.warn('⚠️ PostgreSQL offline. Falling back to local file database: backend/db/mock_db.json');
    useMock = true;
    initMockDbFile();
  });

function initMockDbFile() {
  if (!fs.existsSync(mockDbPath)) {
    const defaultData = {
      restaurants: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'The Bombay Spice',
          owner_name: 'Tarun Bhatia',
          email: 'tarun@bombayspice.com',
          phone: '9876543210',
          city: 'Mumbai',
          address: '12, Linking Road, Santacruz West, Mumbai, Maharashtra 400054',
          cuisine_type: 'Indian',
          avg_ticket_size: 650,
          seating_capacity: 45,
          lat: 19.082522,
          lon: 72.830267,
          plan: 'starter',
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ],
      users: [
        {
          id: 'admin-user-uuid',
          name: 'System Admin',
          email: 'admin@salesai.com',
          // bcrypt hash of 'admin123'
          password_hash: '$2a$12$L7R2Q5iM8B/UqCegmUjFKe1yYg2Wd4pWp/Z5G6fI530b/n5B6cJeG',
          role: 'admin',
          is_verified: true,
          created_at: new Date().toISOString()
        }
      ],
      campaigns: [],
      payments: [],
      daily_insights: []
    };
    fs.writeFileSync(mockDbPath, JSON.stringify(defaultData, null, 2));
  }
}

function readMockDb() {
  initMockDbFile();
  try {
    return JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
  } catch (e) {
    console.error('Error reading mock DB, resetting file...', e);
    fs.unlinkSync(mockDbPath);
    initMockDbFile();
    return JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
  }
}

function writeMockDb(data) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

async function executeMockQuery(sql, params = []) {
  const data = readMockDb();
  sql = sql.replace(/\s+/g, ' ').trim();

  // 1. Table check (used in init.js check)
  if (sql.includes('information_schema.tables')) {
    return { rows: [{ table_name: 'users' }] };
  }

  // 2. Select users by email
  if (sql.includes('SELECT * FROM users WHERE email = $1') || sql.includes('SELECT id FROM users WHERE email = $1') || sql.includes('SELECT id, name, email, role, is_verified, restaurant_id FROM users WHERE email = $1')) {
    const email = params[0];
    const user = data.users.find(u => u.email === email && !u.deleted_at);
    return { rows: user ? [user] : [] };
  }

  // 3. Select user by ID
  if (sql.includes('SELECT id, name, email, role, restaurant_id, created_at FROM users WHERE id = $1')) {
    const id = params[0];
    const user = data.users.find(u => u.id === id && !u.deleted_at);
    return { rows: user ? [user] : [] };
  }

  // 4. Select restaurant by ID
  if (sql.includes('SELECT * FROM restaurants WHERE id = $1')) {
    const id = params[0];
    const rest = data.restaurants.find(r => r.id === id && !r.deleted_at);
    return { rows: rest ? [rest] : [] };
  }

  // 5. Select all restaurants
  if (sql.includes('SELECT * FROM restaurants') && !sql.includes('WHERE')) {
    return { rows: data.restaurants.filter(r => !r.deleted_at) };
  }

  // 6. Insert restaurant
  if (sql.includes('INSERT INTO restaurants')) {
    let id = params[0];
    let name = params[1];
    let owner_name = params[2];
    let email = params[3];
    let phone = params[4];
    let city = params[5];
    let address = params[6];
    let cuisine_type = params[7];
    let avg_ticket_size = params[8];
    let seating_capacity = params[9];
    let plan = params[10] || 'trial';

    // Handle shift if ID is default gen_random_uuid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // It is generate table where ID is generated
      plan = params[9] || 'trial';
      seating_capacity = params[8];
      avg_ticket_size = params[7];
      cuisine_type = params[6];
      address = params[5];
      city = params[4];
      phone = params[3];
      email = params[2];
      owner_name = params[1];
      name = params[0];
      id = require('crypto').randomUUID();
    }

    const newRest = {
      id,
      name,
      owner_name,
      email,
      phone,
      city,
      address,
      cuisine_type,
      avg_ticket_size: parseInt(avg_ticket_size) || 500,
      seating_capacity: parseInt(seating_capacity) || 40,
      plan,
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    data.restaurants.push(newRest);
    writeMockDb(data);
    return { rows: [newRest] };
  }

  // 7. Insert user
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      id: require('crypto').randomUUID(),
      restaurant_id: params[0],
      name: params[1],
      email: params[2],
      password_hash: params[3],
      role: params[4] || 'owner',
      is_verified: params[5] || false,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    writeMockDb(data);
    return { rows: [newUser] };
  }

  // 8. Update user verified status
  if (sql.includes('UPDATE users SET is_verified = true WHERE email = $1')) {
    const email = params[0];
    const userIndex = data.users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      data.users[userIndex].is_verified = true;
      writeMockDb(data);
      return { rows: [data.users[userIndex]] };
    }
    return { rows: [] };
  }

  // 9. Update restaurant plan
  if (sql.includes('UPDATE restaurants SET plan = $1')) {
    const plan = params[0];
    const id = params[1];
    const restIndex = data.restaurants.findIndex(r => r.id === id);
    if (restIndex !== -1) {
      data.restaurants[restIndex].plan = plan;
      data.restaurants[restIndex].subscription_end = params[2] || data.restaurants[restIndex].subscription_end;
      writeMockDb(data);
      return { rows: [data.restaurants[restIndex]] };
    }
    return { rows: [] };
  }

  // 10. Update restaurant details
  if (sql.includes('UPDATE restaurants SET name = $1')) {
    const id = params[13] || params[11];
    const restIndex = data.restaurants.findIndex(r => r.id === id);
    if (restIndex !== -1) {
      data.restaurants[restIndex].name = params[0];
      data.restaurants[restIndex].owner_name = params[1];
      data.restaurants[restIndex].phone = params[2];
      data.restaurants[restIndex].city = params[3];
      data.restaurants[restIndex].address = params[4];
      data.restaurants[restIndex].lat = params[5];
      data.restaurants[restIndex].lon = params[6];
      data.restaurants[restIndex].cuisine_type = params[7];
      data.restaurants[restIndex].avg_ticket_size = params[8];
      data.restaurants[restIndex].seating_capacity = params[9];
      data.restaurants[restIndex].delivery_enabled = params[10];
      writeMockDb(data);
      return { rows: [data.restaurants[restIndex]] };
    }
    return { rows: [] };
  }

  // 11. Insert payment record
  if (sql.includes('INSERT INTO payments')) {
    const newPayment = {
      id: require('crypto').randomUUID(),
      restaurant_id: params[0],
      razorpay_order_id: params[1],
      razorpay_payment_id: params[2],
      amount: params[3],
      plan: params[4],
      status: 'success',
      stripe_session_id: params[5],
      stripe_payment_id: params[6],
      gateway: params[7] || 'razorpay',
      created_at: new Date().toISOString()
    };
    data.payments.push(newPayment);
    writeMockDb(data);
    return { rows: [newPayment] };
  }

  // 12. Insert campaign
  if (sql.includes('INSERT INTO campaigns')) {
    const newCamp = {
      id: require('crypto').randomUUID(),
      restaurant_id: params[0],
      platform: params[1],
      type: params[2],
      tone: params[3],
      caption: params[4],
      hashtags: params[5],
      best_time: params[6],
      created_at: new Date().toISOString()
    };
    data.campaigns.push(newCamp);
    writeMockDb(data);
    return { rows: [newCamp] };
  }

  // 13. Select campaigns
  if (sql.includes('SELECT * FROM campaigns WHERE restaurant_id = $1') || sql.includes('SELECT COUNT(*) FROM campaigns')) {
    const id = params[0];
    const camps = data.campaigns.filter(c => c.restaurant_id === id && !c.deleted_at);
    return { rows: camps, rowCount: camps.length };
  }

  // 14. Select daily insights
  if (sql.includes('SELECT * FROM daily_insights WHERE restaurant_id = $1')) {
    const id = params[0];
    const insights = data.daily_insights.filter(i => i.restaurant_id === id);
    return { rows: insights };
  }

  // 15. Insert daily insights
  if (sql.includes('INSERT INTO daily_insights')) {
    const newInsight = {
      id: require('crypto').randomUUID(),
      restaurant_id: params[0],
      date: new Date().toISOString().split('T')[0],
      predicted_revenue: params[1],
      confidence_score: params[2],
      weather_summary: params[3],
      local_events: params[4],
      instagram_caption: params[5],
      whatsapp_message: params[6],
      menu_tip: params[7],
      hashtags: params[8],
      created_at: new Date().toISOString()
    };
    data.daily_insights.push(newInsight);
    writeMockDb(data);
    return { rows: [newInsight] };
  }

  // 16. Join query for admin (select r.*, u.id as user_id ...)
  if (sql.includes('SELECT r.*, u.id as user_id')) {
    const joinedRows = data.restaurants.filter(r => !r.deleted_at).map(r => {
      const owner = data.users.find(u => u.restaurant_id === r.id && u.role === 'owner');
      const camps = data.campaigns.filter(c => c.restaurant_id === r.id);
      return {
        ...r,
        user_id: owner?.id || null,
        user_name: owner?.name || null,
        user_email: owner?.email || null,
        user_role: owner?.role || null,
        campaign_count: camps.length
      };
    });
    return { rows: joinedRows };
  }

  // 17. Delete restaurant / users (soft delete)
  if (sql.includes('UPDATE restaurants SET deleted_at = NOW() WHERE id = $1')) {
    const id = params[0];
    const idx = data.restaurants.findIndex(r => r.id === id);
    if (idx !== -1) {
      data.restaurants[idx].deleted_at = new Date().toISOString();
      writeMockDb(data);
      return { rows: [data.restaurants[idx]] };
    }
  }
  if (sql.includes('UPDATE users SET deleted_at = NOW() WHERE restaurant_id = $1')) {
    const id = params[0];
    data.users.forEach((u, index) => {
      if (u.restaurant_id === id) {
        data.users[index].deleted_at = new Date().toISOString();
      }
    });
    writeMockDb(data);
  }

  // Default empty fallback
  return { rows: [] };
}

module.exports = {
  query: (text, params) => {
    if (useMock) {
      return executeMockQuery(text, params);
    }
    return pool.query(text, params);
  }
};
