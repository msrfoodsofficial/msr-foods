/**
 * =======================================================================
 * DATA STORE, CART & ORDER STATE MANAGEMENT
 * =======================================================================
 */

const Store = {
  get(key, storage = localStorage) {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Storage read error:", e);
      return null;
    }
  },

  set(key, val, storage = localStorage) {
    try {
      storage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage write error:", e);
    }
  }
};

// Global Helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const money = (amount) => {
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.currency && typeof window.BRAND_CONFIG.currency.format === "function") {
    return window.BRAND_CONFIG.currency.format(amount);
  }
  return "PKR " + Number(amount || 0).toLocaleString("en-US");
};

const MAXQ = 20;
const clampQ = (q) => Math.min(Math.max(parseInt(q) || 1, 1), MAXQ);

function getProductsApiEndpoint() {
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    return window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/products";
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "https://msrfoodsofficial.food/api/products";
  }
  return "/api/products";
}

async function syncProductsRemote(force = false) {
  const lastSync = Number(Store.get("app_products_last_sync") || 0);
  const cached = Store.get("app_products");

  // If local cache exists and was synced within the last 5 minutes, reuse immediately without network hit
  if (!force && cached && Array.isArray(cached) && cached.length > 0 && (Date.now() - lastSync < 300000)) {
    window.PRODUCTS = cached;
    return cached;
  }

  try {
    const endpoint = getProductsApiEndpoint() + (force ? `?_t=${Date.now()}` : "");
    const res = await fetch(endpoint);
    if (res.ok) {
      const serverProds = await res.json();
      if (Array.isArray(serverProds) && serverProds.length > 0) {
        window.PRODUCTS = serverProds;
        Store.set("app_products", serverProds);
        Store.set("app_products_last_sync", Date.now());
        if (typeof renderProductsGrid === "function") renderProductsGrid();
        return serverProds;
      }
    }
  } catch (e) {
    // offline / local storage fallback
  }
  return getProducts();
}

async function saveProductRemote(prod, isNew = false) {
  Store.set("app_products_last_sync", 0);
  try {
    const endpoint = getProductsApiEndpoint();
    // Use POST if full product object is present or new product, else PATCH
    const method = (isNew || (prod && prod.title && prod.price != null)) ? "POST" : "PATCH";
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prod)
    });
    if (res.ok) {
      const data = await res.json();
      return data && data.product ? data.product : prod;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("D1 Sync failed:", errData.error || res.statusText);
      if (typeof toast === "function") {
        toast(`⚠️ Cloud Sync Warning: ${errData.error || "Failed to update database"}`);
      }
    }
  } catch (e) {
    console.warn("Could not sync product to Cloudflare D1 immediately:", e);
  }
  return prod;
}

async function updateProductStockRemote(productId, newStock) {
  Store.set("app_products_last_sync", 0);
  try {
    const endpoint = getProductsApiEndpoint();
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, stock: Number(newStock) })
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("D1 Stock sync failed:", errData.error || res.statusText);
      if (typeof toast === "function") {
        toast(`⚠️ Cloud Sync Warning: ${errData.error || "Failed to update stock"}`);
      }
    }
  } catch (e) {
    console.warn("Could not sync stock to Cloudflare D1:", e);
  }
}

async function deleteProductRemote(productId) {
  Store.set("app_products_last_sync", 0);
  try {
    const endpoint = `${getProductsApiEndpoint()}?id=${encodeURIComponent(productId)}`;
    await fetch(endpoint, { method: "DELETE" });
  } catch (e) {
    console.warn("Could not delete product from Cloudflare D1:", e);
  }
}

function getProducts() {
  const deletedIds = Store.get("app_deleted_products") || [];
  let stored = Store.get("app_products");
  if (stored && Array.isArray(stored) && stored.length > 0) {
    stored = stored.filter(p => !deletedIds.includes(p.id));
    window.PRODUCTS = stored;
    return stored;
  }
  if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
    const initial = window.PRODUCTS.filter(p => !deletedIds.includes(p.id));
    Store.set("app_products", initial);
    return initial;
  }
  return [];
}

function saveProducts(prods) {
  window.PRODUCTS = prods;
  Store.set("app_products", prods);
}

const getP = (id) => getProducts().find((p) => p.id === id);
const getPBySlug = (slug) => getProducts().find((p) => p.slug === slug);
const canBuy = (p) => p && p.price != null && (p.stock == null || p.stock > 0);
const priceTxt = (p) => {
  if (!p) return "";
  if (p.stock !== undefined && p.stock <= 0) return "Out of Stock";
  return p.price != null ? money(p.price) : "Price on Request";
};

function getProductGallery(p) {
  if (!p) return ["assets/images/products/front.webp"];
  if (Array.isArray(p.gallery) && p.gallery.length > 0) {
    const clean = p.gallery.filter(Boolean);
    if (clean.length > 0) return clean;
  }
  const imgs = [];
  if (p.img) {
    const isStockPath = (u) => typeof u === "string" && u.startsWith("assets/images/products/");
    const hasCustomFront = p.img.front && !isStockPath(p.img.front);
    if (p.img.front) imgs.push(p.img.front);
    if (p.img.back && !imgs.includes(p.img.back) && (!hasCustomFront || !isStockPath(p.img.back))) {
      imgs.push(p.img.back);
    }
    if (p.img.pair && !imgs.includes(p.img.pair) && (!hasCustomFront || !isStockPath(p.img.pair))) {
      imgs.push(p.img.pair);
    }
  }
  return imgs.length ? imgs : ["assets/images/products/front.webp"];
}

function getProductPrimaryImage(p) {
  return getProductGallery(p)[0];
}

// Cart State
let cart = { items: {} };

function initCart() {
  const prods = getProducts();
  const savedCart = Store.get("app_cart") || Store.get("msr_cart") || {};
  const src = savedCart.items || {};
  prods.forEach((p) => {
    const q = Math.min(Math.max(parseInt(src[p.id]) || 0, 0), MAXQ);
    if (q && canBuy(p)) {
      cart.items[p.id] = q;
    }
  });
}

function saveCart() {
  Store.set("app_cart", cart);
  Store.set("msr_cart", cart); // Backward compatibility
  if (typeof updateBadge === "function") {
    updateBadge();
  }
}

function lines() {
  return (window.PRODUCTS || [])
    .map((p) => ({ p, qty: cart.items[p.id] || 0 }))
    .filter((l) => l.qty > 0 && canBuy(l.p));
}

function itemCount() {
  return lines().reduce((sum, line) => sum + line.qty, 0);
}

function isKohatCity(city) {
  if (!city) return false;
  const c = String(city).trim().toLowerCase();
  return c.includes("kohat");
}

function totals(city = "") {
  if (!city && typeof document !== "undefined") {
    const el = document.getElementById("f-city") || document.getElementById("moCity");
    if (el && el.value) city = el.value;
  }
  const sub = lines().reduce((s, l) => s + l.qty * l.p.price, 0);
  const deliveryCfg = (window.BRAND_CONFIG && window.BRAND_CONFIG.delivery) || { fee: 200, freeShippingThreshold: 5000 };
  const freeThreshold = deliveryCfg.freeShippingThreshold || 999999;
  const isCityFree = isKohatCity(city);
  const isFree = sub >= freeThreshold || isCityFree;
  const ship = sub === 0 ? 0 : (isFree ? 0 : (deliveryCfg.fee || 200));
  return { sub, ship, total: sub + ship, isFree, isCityFree };
}

// Order Management & Tracking DB Helpers
let lastOrder = Store.get("app_last_order", sessionStorage) || Store.get("msr_order", sessionStorage);

function formatOrderDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getAllOrders() {
  return Store.get("app_orders") || [];
}

function findOrder(query) {
  if (!query) return null;
  let decoded = "";
  try {
    decoded = decodeURIComponent(String(query)).trim();
  } catch (e) {
    decoded = String(query).trim();
  }
  const q = decoded.toLowerCase();
  const cleanQ = q.replace(/[^0-9a-z]/gi, "");
  const qDigits = decoded.replace(/[^0-9]/g, "");
  const last10 = qDigits.length >= 7 ? qDigits.slice(-10) : null;
  const last9 = qDigits.length >= 7 ? qDigits.slice(-9) : null;
  const orders = getAllOrders();

  return orders.find(o => {
    if (!o) return false;
    const cust = o.customer || {};
    const oId = String(o.id || "").toLowerCase();
    const cleanOId = oId.replace(/^#/, "");
    const phone = String(cust.phone || o.phone || "").replace(/[^0-9]/g, "");
    const email = String(cust.email || o.email || "").toLowerCase();

    // Order ID exact or partial match
    if (oId === q || cleanOId === q || cleanOId === cleanQ) return true;
    if (cleanQ.length >= 4 && cleanOId.includes(cleanQ)) return true;

    // Email exact match
    if (email && email === q) return true;

    // Phone match across 03XX, +923XX, 923XX formats
    if (last10 && phone.includes(last10)) return true;
    if (last9 && phone.includes(last9)) return true;
    if (qDigits.length >= 7 && phone.includes(qDigits)) return true;

    return false;
  });
}

function getOrdersApiEndpoint() {
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    return window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/orders";
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "https://msrfoodsofficial.food/api/orders";
  }
  return "/api/orders";
}

async function sendOrderToServer(order) {
  try {
    const endpoint = getOrdersApiEndpoint();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    if (res.ok) {
      const data = await res.json();
      return data && data.order ? data.order : order;
    }
  } catch (err) {
    console.warn("Could not sync order to Cloudflare D1 immediately (offline or local dev):", err);
  }
  return order;
}

async function sendOrderStatusUpdateToServer(orderId, newStatus, note = "", trackingInfo = null, cancelReason = "") {
  try {
    const endpoint = getOrdersApiEndpoint();
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: orderId,
        status: newStatus,
        note,
        tracking: trackingInfo,
        cancelReason
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not sync status update to Cloudflare D1:", err);
  }
  return null;
}

async function fetchOrderRemote(orderId) {
  if (!orderId) return null;
  let decoded = "";
  try {
    decoded = decodeURIComponent(String(orderId)).trim();
  } catch (e) {
    decoded = String(orderId).trim();
  }
  const local = findOrder(decoded);

  try {
    const endpoint = `${getOrdersApiEndpoint()}?id=${encodeURIComponent(decoded)}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const order = await res.json();
      if (order && order.id) {
        const orders = getAllOrders();
        const idx = orders.findIndex(o => o.id === order.id);
        if (idx >= 0) orders[idx] = order;
        else orders.unshift(order);
        Store.set("app_orders", orders);

        if (lastOrder && lastOrder.id === order.id) {
          lastOrder = order;
          Store.set("app_last_order", order, sessionStorage);
          Store.set("msr_order", order, sessionStorage);
        }
        return order;
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote order from Cloudflare D1:", err);
  }
  return local;
}

function saveOrder(order) {
  const orders = getAllOrders();
  const now = new Date();
  const timeFormatted = formatOrderDate(now);

  order.createdAt = order.createdAt || now.toISOString();
  order.dateFormatted = formatOrderDate(order.createdAt);
  order.status = order.status || "Pending";
  
  if (!order.tracking) {
    order.tracking = {
      courier: "",
      trackingNumber: "",
      dispatchedAt: null,
      deliveredAt: null
    };
  }

  if (!order.timeline || !order.timeline.length) {
    order.timeline = [
      {
        status: "Pending",
        title: "Order Placed",
        time: timeFormatted,
        note: "Order placed online via storefront checkout"
      }
    ];
  }

  orders.unshift(order);
  Store.set("app_orders", orders);
  Store.set("app_last_order", order, sessionStorage);
  Store.set("msr_order", order, sessionStorage);
  lastOrder = order;

  // Asynchronously sync to Cloudflare D1
  sendOrderToServer(order);

  return order;
}

function updateOrderStatusInDb(orderId, newStatus, note = "", trackingInfo = null, cancelReason = "") {
  const orders = getAllOrders();
  const target = orders.find(o => o.id === orderId);
  if (!target) return null;

  target.status = newStatus;
  target.updatedAt = new Date().toISOString();
  if (cancelReason) {
    target.cancelReason = cancelReason;
    target.cancellationReason = cancelReason;
  }
  const timeFormatted = formatOrderDate(new Date());

  if (!target.timeline) target.timeline = [];

  let title = `Status updated to ${newStatus}`;
  if (newStatus === "Approved") title = "Order Approved & Confirmed";
  else if (newStatus === "Processing") title = "Packed & Ready for Dispatch";
  else if (newStatus === "Dispatched") title = "Dispatched with Courier Partner";
  else if (newStatus === "Delivered") title = "Delivered to Customer";
  else if (newStatus === "Cancelled") title = "Order Cancelled";

  if (trackingInfo) {
    target.tracking = { ...target.tracking, ...trackingInfo };
    if (newStatus === "Dispatched") target.tracking.dispatchedAt = target.updatedAt;
    if (newStatus === "Delivered") target.tracking.deliveredAt = target.updatedAt;
  }

  const finalNote = cancelReason 
    ? `Reason: ${cancelReason}` 
    : (note || (trackingInfo ? `Courier: ${trackingInfo.courier} (Tracking #${trackingInfo.trackingNumber})` : `Order marked as ${newStatus}`));

  target.timeline.push({
    status: newStatus,
    title,
    time: timeFormatted,
    note: finalNote
  });

  Store.set("app_orders", orders);
  if (lastOrder && lastOrder.id === orderId) {
    lastOrder = target;
    Store.set("app_last_order", target, sessionStorage);
    Store.set("msr_order", target, sessionStorage);
  }

  // Asynchronously sync status update to Cloudflare D1
  sendOrderStatusUpdateToServer(orderId, newStatus, note, trackingInfo, cancelReason);

  return target;
}

// Generate luxury WhatsApp confirmation receipt
function generateOrderWhatsAppMessage(order) {
  const brand = (window.BRAND_CONFIG && window.BRAND_CONFIG.brand) || { name: "MSR Foods" };
  const cust = order.customer || { name: order.name, phone: order.phone, address: order.addr, city: order.city };
  const itemsText = (order.items || []).map(i => `• ${i.name} (${i.weight || "Standard"}) × ${i.qty} = PKR ${(i.qty * i.price).toLocaleString()}`).join("\n");
  const trackUrl = `${window.location.origin}${window.location.pathname}#/track/${order.id}`;

  return `🌟 *ORDER CONFIRMATION — ${brand.name.toUpperCase()}* 🌟
-----------------------------------------
📋 *Order ID:* #${order.id}
📅 *Date:* ${order.dateFormatted || formatOrderDate(order.createdAt)}
🚦 *Current Status:* ${order.status.toUpperCase()}

👤 *Customer:* ${cust.name || "Customer"}
📞 *Phone:* ${cust.phone || ""}
📍 *Delivery Address:* ${cust.address || ""}, ${cust.city || ""}

📦 *Items Ordered:*
${itemsText}

🚚 *Delivery Fee:* ${order.shipping === 0 ? ((cust.city && isKohatCity(cust.city)) ? "FREE (Kohat Local Delivery 🎉)" : "FREE SHIPPING") : `PKR ${order.shipping}`}
💰 *TOTAL AMOUNT:* PKR ${(order.total || 0).toLocaleString()} (${order.paymentMethod || "Cash on Delivery"})
-----------------------------------------
🔍 *Live Order Tracking:*
${trackUrl}

Thank you for trusting ${brand.name}! Your order is being freshly packed with pure natural goodness.`;
}

if (typeof window !== "undefined") {
  window.Store = Store;
  window.money = money;
  window.cart = cart;
  window.initCart = initCart;
  window.saveCart = saveCart;
  window.lines = lines;
  window.itemCount = itemCount;
  window.totals = totals;
  window.isKohatCity = isKohatCity;
  window.getP = getP;
  window.getPBySlug = getPBySlug;
  window.canBuy = canBuy;
  window.priceTxt = priceTxt;
  window.clampQ = clampQ;
// ==========================================================================
// Dynamic White-Label Brand Settings & Social Channels Synchronization
// ==========================================================================
function getSettingsApiEndpoint() {
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    return window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/settings";
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "https://msrfoodsofficial.food/api/settings";
  }
  return "/api/settings";
}

function applyBrandSettings(data) {
  if (!data || typeof data !== "object") return false;

  // Robust unwrap: handle { brand: { brand: {...}, contact: {...} } } from API, or direct BRAND_CONFIG
  let cfg = data;
  if (cfg.brand_config && typeof cfg.brand_config === "object") {
    cfg = cfg.brand_config;
  } else if (cfg.brandConfig && typeof cfg.brandConfig === "object") {
    cfg = cfg.brandConfig;
  } else if (cfg.brand && typeof cfg.brand === "object" && (cfg.brand.brand || cfg.brand.contact || cfg.brand.logo)) {
    cfg = cfg.brand;
  }

  if (!window.BRAND_CONFIG) window.BRAND_CONFIG = {};

  if (cfg.brand && typeof cfg.brand === "object") {
    window.BRAND_CONFIG.brand = Object.assign({}, window.BRAND_CONFIG.brand || {}, cfg.brand);
  }
  if (cfg.contact && typeof cfg.contact === "object") {
    window.BRAND_CONFIG.contact = Object.assign({}, window.BRAND_CONFIG.contact || {}, cfg.contact);
  }
  if (cfg.social && typeof cfg.social === "object") {
    window.BRAND_CONFIG.social = Object.assign({}, window.BRAND_CONFIG.social || {}, cfg.social);
  }
  if (cfg.delivery && typeof cfg.delivery === "object") {
    window.BRAND_CONFIG.delivery = Object.assign({}, window.BRAND_CONFIG.delivery || {}, cfg.delivery);
  }
  if (cfg.urls && typeof cfg.urls === "object") {
    window.BRAND_CONFIG.urls = Object.assign({}, window.BRAND_CONFIG.urls || {}, cfg.urls);
  }
  if (cfg.logo && typeof cfg.logo === "object") {
    window.BRAND_CONFIG.logo = Object.assign({}, window.BRAND_CONFIG.logo || {}, cfg.logo);
  }
  if (cfg.hero && typeof cfg.hero === "object") {
    window.BRAND_CONFIG.hero = Object.assign({}, window.BRAND_CONFIG.hero || {}, cfg.hero);
  }
  if (cfg.currency && typeof cfg.currency === "object") {
    window.BRAND_CONFIG.currency = Object.assign({}, window.BRAND_CONFIG.currency || {}, cfg.currency);
  }
  if (Array.isArray(cfg.payments)) {
    window.BRAND_CONFIG.payments = cfg.payments;
  }
  if (Array.isArray(cfg.reviews)) {
    window.BRAND_CONFIG.reviews = cfg.reviews;
  }
  if (Array.isArray(cfg.features)) {
    window.BRAND_CONFIG.features = cfg.features;
  }
  if (data.theme && typeof applyTheme === "function") {
    applyTheme(data.theme);
  }
  Store.set("app_brand_config", window.BRAND_CONFIG);
  return true;
}

function loadLocalBrandSettings() {
  const cached = Store.get("app_brand_config");
  if (cached) {
    applyBrandSettings(cached);
    return true;
  }
  return false;
}

async function syncSettingsRemote(force = false) {
  const lastSync = Number(Store.get("app_brand_config_last_sync") || 0);
  const cached = Store.get("app_brand_config");

  // If local settings exist and were synced within the last 5 minutes, reuse immediately without network hit
  if (!force && cached && !cached.error && cached.found !== false && (Date.now() - lastSync < 300000)) {
    applyBrandSettings(cached);
    return cached;
  }

  try {
    const endpoint = getSettingsApiEndpoint() + (force ? `?_t=${Date.now()}` : "");
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error && data.found !== false) {
        applyBrandSettings(data);
        Store.set("app_brand_config", data);
        Store.set("app_brand_config_last_sync", Date.now());
        return data;
      }
    }
  } catch (e) {
    // offline fallback
  }
  return null;
}

async function saveBrandSettingsRemote(fullConfig, theme) {
  Store.set("app_brand_config_last_sync", 0);
  const activeTheme = theme || localStorage.getItem("app_active_theme") || "luxury-gold";
  applyBrandSettings(fullConfig);
  Store.set("app_brand_config", window.BRAND_CONFIG);

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("msr_brand_sync");
      channel.postMessage({
        type: "BRAND_SETTINGS_UPDATED",
        settings: window.BRAND_CONFIG,
        theme: activeTheme,
        timestamp: Date.now()
      });
      channel.close();
    }
  } catch (e) {}

  try {
    const endpoint = getSettingsApiEndpoint();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: window.BRAND_CONFIG,
        theme: activeTheme
      })
    });
    if (res.ok) {
      return { success: true };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.error || res.statusText };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

  window.getAllOrders = getAllOrders;
  window.findOrder = findOrder;
  window.saveOrder = saveOrder;
  window.updateOrderStatusInDb = updateOrderStatusInDb;
  window.formatOrderDate = formatOrderDate;
  window.generateOrderWhatsAppMessage = generateOrderWhatsAppMessage;
  window.getOrdersApiEndpoint = getOrdersApiEndpoint;
  window.sendOrderToServer = sendOrderToServer;
  window.sendOrderStatusUpdateToServer = sendOrderStatusUpdateToServer;
  window.fetchOrderRemote = fetchOrderRemote;
  window.getProductsApiEndpoint = getProductsApiEndpoint;
  window.syncProductsRemote = syncProductsRemote;
  window.saveProductRemote = saveProductRemote;
  window.updateProductStockRemote = updateProductStockRemote;
  window.deleteProductRemote = deleteProductRemote;
  window.getProductGallery = getProductGallery;
  window.getProductPrimaryImage = getProductPrimaryImage;
  window.getSettingsApiEndpoint = getSettingsApiEndpoint;
  window.applyBrandSettings = applyBrandSettings;
  window.loadLocalBrandSettings = loadLocalBrandSettings;
  window.syncSettingsRemote = syncSettingsRemote;
  window.saveBrandSettingsRemote = saveBrandSettingsRemote;
}
