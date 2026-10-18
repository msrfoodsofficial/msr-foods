# Enterprise Multi-Niche Cloudflare D1 Architecture & Deployment Guide

This project is architected for **high scalability, multi-niche brand expansion, and 100% serverless cloud persistence** on Cloudflare Pages and Cloudflare D1 ($0 / month).

---

## 🏛️ Scalable Multi-Niche Architecture Overview

```
                      [ Worldwide Customers ]
                                 │
                    (Browsing / Placing Orders)
                                 ▼
                     [ 2. Website (Storefront) ]
              (Multi-Category Dynamic Catalog & Live Tracking)
                                 │
                POST /api/orders │ GET /api/products
                                 ▼
         ┌──────────────────────────────────────────────┐
         │     CLOUDFLARE PAGES EDGE FUNCTIONS (API)    │
         │  • /api/auth     : Admin Database Login      │
         │  • /api/orders   : Live Orders & Status Sync │
         │  • /api/products : Catalog, Stock & Restock  │
         │  • /api/settings : Dynamic Re-Branding       │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │         CLOUDFLARE D1 SQL DATABASE           │
         │  • admins              • admin_sessions      │
         │  • categories (Niches) • products            │
         │  • orders              • order_activity_logs │
         │  • store_settings (White-Label UI Tokens)    │
         └──────────────────────▲───────────────────────┘
                                │
              Full Management & │ Real-Time Order Auditing
                                │
                     [ 1. Admin Portal (Live) ]
              (Auth Guard, Inventory, Order Stepper,
               1-Click Rebranding & Cloudflare Exporters)
```

---

## 1. Cloudflare D1 Database Setup (One-Time Setup)

### Step 1: Create Database
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Storage & Databases** → **D1 SQL Database**.
2. Click **Create database**, name it: `msr-orders-db`, and click **Create**.

### Step 2: Run the Enterprise Schema
1. Open [`schema.sql`](file:///Users/mzaidhayat/Desktop/DevProjects%202026/Website%20Projects/Products%20Selling%20Project/1.%20Admin/schema.sql) in your code editor.
2. In your Cloudflare D1 database, open the **Console** tab.
3. Paste the entire contents of `schema.sql` and click **Execute**.
   * It creates 7 tables: `admins`, `admin_sessions`, `categories`, `products`, `orders`, `order_activity_logs`, and `store_settings`.
   * It automatically seeds your superadmin account:
     * **Username:** `admin`
     * **Password:** `msr2026`

### Step 3: Link D1 to Your Cloudflare Pages Projects
1. In Cloudflare left sidebar, click **Workers & Pages**.
2. Click your **Website** Pages project → **Settings** → **Functions** → scroll to **D1 database bindings**.
3. Click **Add binding**:
   - Variable name: `DB`
   - D1 database: select `msr-orders-db`
4. Click **Save**.
5. Repeat for your **Admin** Pages project.

---

## 2. Core Scalable Features Built-In

### 🔐 1. Database-Backed Admin Authentication
* Admin credentials are now verified against the `admins` table in Cloudflare D1.
* Passwords are encrypted using native **SHA-256 WebCrypto**.
* **Change Password**: Go to **Settings** in the Admin Portal to update your password in D1 anytime.

### 📦 2. Dynamic Product Catalog & Real-Time Stock Management
* **Add New Product**: Click `+ Add New Product` to add items with pricing, weights, compare prices, and images. It writes directly to Cloudflare D1.
* **Edit Product**: Update titles, descriptions, images, and prices anytime.
* **1-Click Out of Stock**: Instantly sets stock to 0 in D1. The website storefront updates automatically without rebuilding.
* **Restock Modal**: Add `+10`, `+25`, `+50`, or custom units to inventory directly in D1.

### 📊 3. Order History & Audit Trail
* Every order status change (*Approved*, *Processing*, *Dispatched*, *Delivered*, *Cancelled*) is permanently recorded in both `orders` and `order_activity_logs`.
* Consignment tracking numbers (TCS, Leopards, Trax) update in D1 and are viewable live by customers.

### 🎨 4. Instant White-Label Rebranding for Any Niche
* In the Admin Portal's **Customizer** tab:
  * Switch between presets: *Luxury Gold*, *Emerald Forest*, *Royal Sapphire*, *Crimson Velvet*, or *Nordic Minimalist*.
  * Customize primary colors, store name, and taglines.
  * Click **Save** to persist the brand configuration to Cloudflare D1 (`store_settings`).
  * You can rebrand and launch a completely new niche in minutes!

---

## 3. Deploying Updates

Pre-packaged archives are generated and ready for Cloudflare Pages Direct Upload:
- **Storefront Website**: [`cloudflare-website.zip`](file:///Users/mzaidhayat/Desktop/DevProjects%202026/Website%20Projects/Products%20Selling%20Project/cloudflare-website.zip)
- **Admin Portal**: [`cloudflare-admin.zip`](file:///Users/mzaidhayat/Desktop/DevProjects%202026/Website%20Projects/Products%20Selling%20Project/cloudflare-admin.zip)
