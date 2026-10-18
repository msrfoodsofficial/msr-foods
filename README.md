# MSR Foods — Enterprise Multi-Niche E-Commerce & Admin Platform

> A production-grade, white-label e-commerce storefront and live merchant operations dashboard backed by **Cloudflare Pages** and serverless **Cloudflare D1 SQL Database** ($0/month).

---

## 🏛️ Project Structure

```
.
├── 1. Admin/                     # Merchant Admin Portal & Operations Dashboard
│   ├── index.html / admin.html   # Standalone dashboard single-page application
│   ├── functions/api/            # Cloudflare Pages Functions serverless endpoints
│   │   ├── auth.js               # Database admin authentication (SHA-256)
│   │   ├── orders.js             # Live orders synchronization & status updates
│   │   ├── orders/[id].js        # Order details & tracking updates by ID
│   │   ├── products.js           # Multi-niche product catalog & inventory
│   │   └── settings.js           # Dynamic white-label rebranding engine
│   ├── config/                   # Brand identity & theme preset tokens
│   ├── js/                       # Store state & admin runtime controllers
│   ├── styles/                   # UI Kit tokens, theme styles & admin layouts
│   ├── data/                     # Default catalog & demo orders
│   ├── assets/                   # High-resolution WebP images & icons
│   └── schema.sql                # 7-table enterprise D1 database schema
│
├── 2. Website/                   # Customer-Facing Storefront
│   ├── index.html                # Responsive customer shopping application
│   ├── functions/api/            # Identical serverless API endpoints
│   ├── config/                   # Brand configuration & theme presets
│   ├── js/                       # Client router, reactive cart, live stepper tracking
│   ├── styles/                   # Storefront styles, UI kit & responsive layouts
│   ├── data/                     # Product catalog data
│   └── assets/                   # Product imagery & ingredients photography
│
├── CLOUDFLARE_D1_SETUP.md        # Complete 3-minute database & cloud setup guide
├── cloudflare-admin.zip          # Pre-packaged Cloudflare Pages Admin deployment
└── cloudflare-website.zip        # Pre-packaged Cloudflare Pages Storefront deployment
```

---

## 🚀 Key Features

### 1. 🛍️ Storefront Website (`2. Website`)
* **Multi-Niche Catalog**: Supports dynamic product categories (dry fruits, honey blends, organics, and more).
* **Reactive Cart & Checkout**: Cash on Delivery (COD), Bank Transfer, Easypaisa, and JazzCash payment options.
* **Live Parcel Stepper**: Real-time progress tracking (`#/track/:id`) pulling live consignment data from Cloudflare D1.
* **Instant WhatsApp Receipts**: Pre-formatted luxury order confirmations sent directly via WhatsApp.

### 2. 🛡️ Merchant Operations Portal (`1. Admin`)
* **Database Authentication**: Secure login backed by Cloudflare D1 with native SHA-256 password hashing.
* **Live Order Sound Alerts**: Plays an audio chime when new orders arrive anywhere in the world.
* **Audit Trail**: Every status change (*Approved*, *Processing*, *Dispatched*, *Delivered*) is recorded in `order_activity_logs`.
* **Courier Consignment Tracking**: Assign couriers (TCS, Leopards, Trax) and enter tracking numbers.
* **Product Catalog & Stock Management**: Add/edit items, 1-click out-of-stock toggle, and bulk restock modal.
* **White-Label Customizer**: 1-click theme switching (*Luxury Gold*, *Emerald Forest*, *Royal Sapphire*, *Crimson Velvet*, *Nordic Minimalist*), live color picker, and brand renaming.

### 3. ⚡ Cloudflare D1 Database & Serverless Edge
* 100,000 free writes/day & 5,000,000 free reads/day with 5 GB storage.
* Global edge latency (< 30ms worldwide).
* Zero ongoing server maintenance costs.

---

## 🛠️ Quick Local Development

You can run both projects using any local HTTP server:

```bash
# Terminal 1 — Run Storefront Website
cd "2. Website"
npx serve -l 8080 .

# Terminal 2 — Run Admin Portal
cd "1. Admin"
npx serve -l 3000 .
```

* **Storefront**: `http://localhost:8080`
* **Admin Portal**: `http://localhost:3000` (Default login: `admin` / `msr2026`)

---

## ☁️ Cloudflare Pages & D1 Deployment

Follow the comprehensive steps in [`CLOUDFLARE_D1_SETUP.md`](CLOUDFLARE_D1_SETUP.md):
1. Create a database named `msr-orders-db` in your Cloudflare dashboard.
2. Execute [`1. Admin/schema.sql`](1.%20Admin/schema.sql) in the Cloudflare D1 console.
3. Bind the variable `DB` to `msr-orders-db` in Pages Functions settings.
4. Upload `cloudflare-website.zip` and `cloudflare-admin.zip` directly to Cloudflare Pages.

---

## 📄 License & Ownership
Copyright © 2026 MSR Foods. All rights reserved.
