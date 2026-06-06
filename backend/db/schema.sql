CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    lat DECIMAL,
    lon DECIMAL,
    cuisine_type VARCHAR(100),
    avg_ticket_size INTEGER,
    seating_capacity INTEGER,
    delivery_enabled BOOLEAN DEFAULT true,
    peak_hours JSONB,
    plan VARCHAR(20) DEFAULT 'starter',
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
    email VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
