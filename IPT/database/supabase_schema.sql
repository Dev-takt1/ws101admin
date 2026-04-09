-- Supabase (Postgres) Schema for De Las Armas Catering
-- Run this in your Supabase project's SQL Editor
-- Create tables in 'public' schema
-- Enable RLS on sensitive tables after creation

-- Core tables

CREATE TABLE addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  access_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('package', 'addon')),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  guestCount INTEGER DEFAULT 1,
  variantName VARCHAR(255),
  price NUMERIC(10,2)
);

CREATE TABLE gallery (
  id SERIAL PRIMARY KEY,
  image_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  courseName VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  event_address TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(10),
  event_start_time TIME,
  event_end_time TIME,
  message_concern TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partial')),
  created_at TIMESTAMPTZ DEFAULT now(),
  guest_count INTEGER DEFAULT 0,
  snapshot JSONB
);

CREATE TABLE order_items (
  item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  guest_count INTEGER DEFAULT 0
);

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reservation_date DATE NOT NULL,
  event_time VARCHAR(10),
  package_id INTEGER REFERENCES packages(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  guest_count INTEGER,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_address TEXT,
  event_date DATE,
  contact_number VARCHAR(15),
  status TEXT DEFAULT 'Paid'
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  fName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profilePic VARCHAR(255),
  email_verified BOOLEAN DEFAULT true,
  email_domain VARCHAR(100),
  verification_date TIMESTAMPTZ,
  otp VARCHAR(10),
  otp_created_at TIMESTAMPTZ
);

-- View equivalent (for daily_order_counts)
CREATE VIEW daily_order_counts AS
SELECT 
  event_date::date AS order_date,
  COUNT(*) AS total_orders
FROM sales 
GROUP BY event_date::date;

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sales_event_date ON sales(event_date);
CREATE INDEX idx_orders_event_date ON orders(event_date);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_carts_user ON carts(user_id);

-- Supabase RLS (Row Level Security) recommendations:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid()::text = user_id::text);
