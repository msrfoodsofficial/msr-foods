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
  ('cat-organic', 'Natural Organics', 'organics', 'Pure raw mountain honey and wellness superfoods', 3),
  ('general', 'General Catalog', 'general', 'General Store Products', 99);

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

-- Seed default products catalog
INSERT OR IGNORE INTO products (
  id, slug, group_slug, title, subtitle, category_id,
  price, compare_price, stock, is_active, weight, badge,
  featured, images_json, short_desc, full_desc, raw_json
) VALUES
(
  'msr-500', 'honey-nut-mix-500g', 'honey-nut-mix',
  'HONEY NUT MIX (500g)', 'Artisanal Roasted Dry Fruits Drenched in Raw Mountain Honey',
  'cat-honey-nuts', 1599, 1850, 45, 1, '500g', 'Most Popular', 1,
  '{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"}',
  'A nourishing artisanal blend of almonds, walnuts, cashews, pistachios and peanuts drenched in 100% pure mountain honey.',
  'MSR Honey Nut Mix brings together hand-selected roasted almonds, crunchy walnuts, buttery cashews, pistachios, and peanuts with rich golden honey in one premium blend. It is an energizing, convenient snack for busy mornings, active gym lifestyles, or any moment you crave pure wholesome sweetness.',
  '{"id":"msr-500","slug":"honey-nut-mix-500g","group":"honey-nut-mix","name":"MSR Honey Nut Mix","title":"HONEY NUT MIX (500g)","subtitle":"Artisanal Roasted Dry Fruits Drenched in Raw Mountain Honey","weight":"500g","netWeight":"500g","price":1599,"comparePrice":1850,"stock":45,"featured":true,"badge":"Most Popular","maxQty":20,"img":{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"},"shortDesc":"A nourishing artisanal blend of almonds, walnuts, cashews, pistachios and peanuts drenched in 100% pure mountain honey.","fullDesc":"MSR Honey Nut Mix brings together hand-selected roasted almonds, crunchy walnuts, buttery cashews, pistachios, and peanuts with rich golden honey in one premium blend. It is an energizing, convenient snack for busy mornings, active gym lifestyles, or any moment you crave pure wholesome sweetness.","packaging":"Airtight clear jar with double freshness hygiene seal","shelfLife":"12 months from packing date"}'
),
(
  'msr-1kg', 'honey-nut-mix-1kg', 'honey-nut-mix',
  'HONEY NUT MIX (1kg Family Pack)', 'Value Family Jar for Daily Immunity & Natural Energy',
  'cat-honey-nuts', 2999, 3499, 25, 1, '1kg', 'Best Value', 1,
  '{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"}',
  'Double the nutritious goodness for the whole household with our 1kg value family pack.',
  'Double the goodness for the entire household. Packed with essential micronutrients, healthy unsaturated fats, minerals, and natural slow-burning energy. Ideal for sharing with family or stocking your pantry for the month.',
  '{"id":"msr-1kg","slug":"honey-nut-mix-1kg","group":"honey-nut-mix","name":"MSR Honey Nut Mix","title":"HONEY NUT MIX (1kg Family Pack)","subtitle":"Value Family Jar for Daily Immunity & Natural Energy","weight":"1kg","netWeight":"1kg (1000g)","price":2999,"comparePrice":3499,"stock":25,"featured":true,"badge":"Best Value","maxQty":20,"img":{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"},"shortDesc":"Double the nutritious goodness for the whole household with our 1kg value family pack.","fullDesc":"Double the goodness for the entire household. Packed with essential micronutrients, healthy unsaturated fats, minerals, and natural slow-burning energy. Ideal for sharing with family or stocking your pantry for the month.","packaging":"Heavyweight pantry jar with double seal protection","shelfLife":"12 months from packing date"}'
),
(
  'msr-250', 'honey-nut-mix-250g', 'honey-nut-mix',
  'HONEY NUT MIX (250g Starter Jar)', 'Compact Snacking Jar · Perfect Daily Portion & Trial Size',
  'cat-honey-nuts', 899, 1099, 60, 1, '250g', '✨ New Starter Size', 1,
  '{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"}',
  'The perfect introduction to pure honey-roasted nuts. Convenient compact jar for desk snacking or travel.',
  'The brand new 250g edition gives you the exact same gold-standard recipe of whole California almonds, Kashmiri walnuts, roasted cashews, Iranian pistachios, and peanuts drenched in raw mountain honey in an ultra-portable, convenient personal jar.',
  '{"id":"msr-250","slug":"honey-nut-mix-250g","group":"honey-nut-mix","name":"MSR Honey Nut Mix","title":"HONEY NUT MIX (250g Starter Jar)","subtitle":"Compact Snacking Jar · Perfect Daily Portion & Trial Size","weight":"250g","netWeight":"250g","price":899,"comparePrice":1099,"stock":60,"featured":true,"prominent":true,"badge":"✨ New Starter Size","maxQty":20,"img":{"front":"assets/images/products/front.webp","back":"assets/images/products/back.webp","pair":"assets/images/products/pair.webp"},"shortDesc":"The perfect introduction to pure honey-roasted nuts. Convenient compact jar for desk snacking or travel.","fullDesc":"The brand new 250g edition gives you the exact same gold-standard recipe of whole California almonds, Kashmiri walnuts, roasted cashews, Iranian pistachios, and peanuts drenched in raw mountain honey in an ultra-portable, convenient personal jar.","packaging":"Compact airtight jar with tamper-proof seal","shelfLife":"12 months from packing date"}'
);

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

-- 8. STOCK NOTIFICATIONS & RESTOCK WAITLIST
CREATE TABLE IF NOT EXISTS stock_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  product_title TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  want_whatsapp INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, notified
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_notif_product ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notif_status ON stock_notifications(status);
