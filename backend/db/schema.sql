CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    cuisine_type VARCHAR(100),
    avg_ticket_size INTEGER,
    seating_capacity INTEGER,
    delivery_enabled BOOLEAN DEFAULT false,
    peak_hours TEXT[],
    logo_url TEXT,
    notification_prefs JSONB DEFAULT '{"daily_insight_wa": false, "daily_insight_email": true, "weekly_report": true, "low_confidence": false, "renewal": true, "announcements": true}',
    plan VARCHAR(20) DEFAULT 'trial',
    subscription_end TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount INTEGER,
    plan VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    platform VARCHAR(20),
    type VARCHAR(50),
    tone VARCHAR(20),
    caption TEXT,
    hashtags TEXT[],
    best_time VARCHAR(50),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    predicted_revenue INTEGER,
    confidence_score DECIMAL(4,2),
    weather_summary JSONB,
    local_events JSONB,
    instagram_caption TEXT,
    whatsapp_message TEXT,
    menu_tip TEXT,
    hashtags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    revenue INTEGER,
    covers_count INTEGER,
    weather_temp DECIMAL,
    had_local_event BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'owner',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
