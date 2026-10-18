-- =======================================================================
-- ENTERPRISE MULTI-NICHE E-COMMERCE DATABASE SCHEMA (Cloudflare D1)
-- =======================================================================
-- Designed for horizontal scale: Multi-Niche Catalogs, Dynamic Theming,
-- Admin RBAC Auth, Order Lifecycle Auditing, and Real-Time Inventory.
-- =======================================================================

-- 1. ADMIN USERS (Authentication & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'superadmin', -- superadmin, manager, staff
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default initial superadmin (Username: admin | Password: msr2026)
INSERT OR IGNORE INTO admins (id, username, password_hash, name, email, role, is_active, created_at)
VALUES (
  'adm-master-1',
  'admin',
  '769b6fd7dc81981c423f6950164c263092e8e1419080e9ead8f13b10a093b06c', -- SHA-256 of 'msr2026'
  'Lead Merchant Admin',
  'admin@store.com',
  'superadmin',
  1,
  datetime('now')
);

-- 2. ADMIN SESSIONS (Secure Session Tokens)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- 3. CATEGORIES & NICHES (Multi-Niche Scalability)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
  ('cat-honey-nuts', 'Honey Nut Blends', 'honey-nuts', 'Artisanal roasted dry fruits drenched in pure mountain honey', 1),
  ('cat-dry-fruits', 'Premium Dry Fruits', 'dry-fruits', 'Whole California almonds, Kashmiri walnuts and cashews', 2),
  ('cat-organic', 'Natural Organics', 'organics', 'Pure raw mountain honey and wellness superfoods', 3);

-- 4. PRODUCTS & INVENTORY CATALOG
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  group_slug TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  category_id TEXT REFERENCES categories(id),
  price REAL NOT NULL,
  compare_price REAL,
  stock INTEGER NOT NULL DEFAULT 50, -- <= 0 denotes Out of Stock
  is_active INTEGER NOT NULL DEFAULT 1, -- 0 for archived/deleted
  weight TEXT, -- Pack size: 250g, 500g, 1kg, etc.
  badge TEXT, -- "Most Popular", "Best Seller", "New"
  featured INTEGER NOT NULL DEFAULT 1,
  images_json TEXT NOT NULL DEFAULT '[]',
  short_desc TEXT,
  full_desc TEXT,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- 5. ORDERS & FULFILLMENT
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Processing, Dispatched, Delivered, Cancelled
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_province TEXT,
  customer_zip TEXT,
  customer_notes TEXT,
  subtotal REAL DEFAULT 0,
  shipping REAL DEFAULT 0,
  total REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cod',
  items_json TEXT DEFAULT '[]',
  tracking_json TEXT DEFAULT '{}',
  timeline_json TEXT DEFAULT '[]',
  raw_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(customer_city);

-- 6. ORDER ACTIVITY AUDIT LOG (Complete status change history & accountability)
CREATE TABLE IF NOT EXISTS order_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  admin_name TEXT,
  action TEXT NOT NULL, -- e.g. "Approved", "Marked Dispatched", "Courier Assigned"
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_logs ON order_activity_logs(order_id);

-- 7. DYNAMIC STORE SETTINGS (White-Label Rebranding Engine)
-- Allows updating brand identity, theme tokens, contact details, currency, and logos on the fly.
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY, -- e.g. "brand_identity", "theme_tokens", "contact_info"
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
