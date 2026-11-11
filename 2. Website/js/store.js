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

  // Reuse local cache within 60s to shield API quota while keeping storefront fresh
  if (!force && cached && Array.isArray(cached) && cached.length > 0 && (Date.now() - lastSync < 60000)) {
    window.PRODUCTS = cached;
    return cached;
  }

  try {
    const endpoint = getProductsApiEndpoint() + (force ? `?_t=${Date.now()}` : "");
    const res = await fetch(endpoint, force ? { cache: "no-store" } : undefined);
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
      Store.set("app_products_last_sync", Date.now());
      return data && data.product ? data.product : prod;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("D1 Sync failed:", errData.error || res.statusText);
      if (typeof toast === "function") {
        toast(`⚠️ Cloud Save Failed: ${errData.error || res.statusText || "Database error"}`);
      }
      return null;
    }
  } catch (e) {
    console.warn("Could not sync product to Cloudflare D1 immediately:", e);
    if (typeof toast === "function") {
      toast(`⚠️ Network error saving to database: ${e.message || "Check connection"}`);
    }
    return null;
  }
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

// =======================================================================
// PROMO COUPONS & AUTO-DISCOUNT ENGINE
// =======================================================================
if (typeof window !== "undefined") {
  window.ACTIVE_COUPONS = window.ACTIVE_COUPONS || Store.get("app_active_coupons") || [];
  window.ALL_COUPONS = window.ALL_COUPONS || Store.get("app_all_coupons") || [];
}

function getCouponsApiEndpoint() {
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    return window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/coupons";
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "https://msrfoodsofficial.food/api/coupons";
  }
  return "/api/coupons";
}

function isCouponExpiredClient(expiresAt) {
  if (!expiresAt) return false;
  const s = String(expiresAt).trim();
  if (!s) return false;
  const endTs = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T23:59:59+05:00`).getTime()
    : new Date(s).getTime();
  if (isNaN(endTs)) return false;
  return Date.now() > endTs;
}

function formatCouponExpiry(expiresAt) {
  if (!expiresAt) return "";
  const s = String(expiresAt).trim();
  if (!s) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00+05:00`) : new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getActiveCoupons() {
  const list = (typeof window !== "undefined" && Array.isArray(window.ACTIVE_COUPONS))
    ? window.ACTIVE_COUPONS
    : (Store.get("app_active_coupons") || []);
  return list.filter(c =>
    c && c.isActive !== false &&
    !isCouponExpiredClient(c.expiresAt) &&
    (!(Number(c.usageLimit || 0) > 0) || Number(c.usedCount || 0) < Number(c.usageLimit || 0))
  );
}

function isProductEligibleForCoupon(product, coupon) {
  if (!product || !coupon) return false;
  const target = coupon.appliesTo;
  if (!target || target === "all") return true;
  const list = Array.isArray(target) ? target : String(target).split(",").map(s => s.trim()).filter(Boolean);
  if (!list.length || list.includes("all")) return true;
  return list.includes(product.id) || list.includes(product.slug);
}

function evaluateCoupon(coupon, cartLines, subtotal) {
  if (!coupon) return { valid: false, discount: 0, freeShipping: false, reason: "Invalid coupon" };
  if (coupon.isActive === false) return { valid: false, discount: 0, freeShipping: false, reason: `Code "${coupon.code}" is inactive` };
  if (isCouponExpiredClient(coupon.expiresAt)) return { valid: false, discount: 0, freeShipping: false, reason: `Code "${coupon.code}" has expired` };
  if (Number(coupon.usageLimit || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit || 0)) {
    return { valid: false, discount: 0, freeShipping: false, reason: `Code "${coupon.code}" limit reached` };
  }

  let eligibleSub = 0;
  if (Array.isArray(cartLines) && cartLines.length > 0) {
    eligibleSub = cartLines.reduce((sum, l) => {
      return isProductEligibleForCoupon(l.p, coupon) ? sum + (l.qty * l.p.price) : sum;
    }, 0);
  } else {
    eligibleSub = Number(subtotal || 0);
  }

  if (eligibleSub <= 0) {
    return { valid: false, discount: 0, freeShipping: false, reason: `Code "${coupon.code}" does not apply to items in cart` };
  }

  const minOrd = Number(coupon.minOrder || 0);
  if (minOrd > 0 && subtotal < minOrd) {
    const needed = Math.max(1, minOrd - subtotal);
    return { valid: false, discount: 0, freeShipping: false, reason: `Spend ${money(needed)} more to unlock ${coupon.code}` };
  }

  let discount = 0;
  let freeShipping = false;
  const val = Number(coupon.value || 0);

  if (coupon.type === "percent") {
    discount = Math.round(eligibleSub * (val / 100));
    const maxD = Number(coupon.maxDiscount || 0);
    if (maxD > 0) discount = Math.min(discount, maxD);
    discount = Math.min(discount, eligibleSub);
  } else if (coupon.type === "fixed") {
    discount = Math.min(eligibleSub, Math.round(val));
  } else if (coupon.type === "free_shipping") {
    freeShipping = true;
  }

  return {
    valid: true,
    coupon,
    discount: Math.max(0, discount),
    freeShipping,
    reason: "",
    isAuto: !!coupon.autoApply
  };
}

function getBestPromoForProduct(product) {
  if (!product || product.price == null) return null;
  const autos = getActiveCoupons().filter(c => c.autoApply && isProductEligibleForCoupon(product, c));
  if (!autos.length) return null;

  let best = null;
  const orig = Number(product.price || 0);
  for (const c of autos) {
    if (c.type === "free_shipping") continue;
    const minOrd = Number(c.minOrder || 0);
    if (minOrd > orig) continue; // Only highlight card-level discount if single unit meets minOrder
    const ev = evaluateCoupon(c, [{ p: product, qty: 1 }], orig);
    if (ev.valid && ev.discount > 0 && (!best || ev.discount > best.savings)) {
      const badgeText = c.type === "percent" ? `${c.value}% OFF` : `${money(ev.discount)} OFF`;
      best = {
        coupon: c,
        originalPrice: orig,
        promoPrice: Math.max(0, orig - ev.discount),
        savings: ev.discount,
        badgeText
      };
    }
  }
  return best;
}

function getManualCouponState() {
  const override = Store.get("msr_coupon_override", sessionStorage);
  if (override === "__NONE__") return { removed: true, coupon: null };
  const manual = Store.get("msr_manual_coupon", sessionStorage);
  return { removed: false, coupon: manual || null };
}

function removeCouponFromCart() {
  Store.set("msr_manual_coupon", null, sessionStorage);
  Store.set("msr_coupon_override", "__NONE__", sessionStorage);
}

async function applyCouponCodeToCart(rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Please enter a promo code." };

  const localMatch = getActiveCoupons().find(c => c.code === code);
  if (localMatch) {
    const cartLines = lines();
    const sub = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);
    const ev = evaluateCoupon(localMatch, cartLines, sub);
    if (!ev.valid) return { ok: false, error: ev.reason };
    Store.set("msr_manual_coupon", localMatch, sessionStorage);
    Store.set("msr_coupon_override", "", sessionStorage);
    return { ok: true, coupon: localMatch, result: ev };
  }

  try {
    const endpoint = `${getCouponsApiEndpoint()}?code=${encodeURIComponent(code)}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.valid || !data.coupon) {
      return { ok: false, error: data.error || `Promo code "${code}" is invalid or expired.` };
    }
    const cartLines = lines();
    const sub = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);
    const ev = evaluateCoupon(data.coupon, cartLines, sub);
    if (!ev.valid) return { ok: false, error: ev.reason };

    Store.set("msr_manual_coupon", data.coupon, sessionStorage);
    Store.set("msr_coupon_override", "", sessionStorage);
    return { ok: true, coupon: data.coupon, result: ev };
  } catch (e) {
    return { ok: false, error: "Unable to verify promo code right now. Please try again." };
  }
}

function resolveAppliedCoupon(cartLines, subtotal) {
  const state = getManualCouponState();
  if (state.coupon) {
    const ev = evaluateCoupon(state.coupon, cartLines, subtotal);
    if (ev.valid) return { ...ev, isAuto: !!state.coupon.autoApply };
  }
  if (state.removed) return null;

  const autos = getActiveCoupons().filter(c => c.autoApply);
  let best = null;
  for (const c of autos) {
    const ev = evaluateCoupon(c, cartLines, subtotal);
    if (ev.valid) {
      if (!best || ev.discount > best.discount || (ev.discount === best.discount && ev.freeShipping && !best.freeShipping)) {
        best = { ...ev, isAuto: true };
      }
    }
  }
  return best;
}

async function syncCouponsRemote(force = false) {
  try {
    const endpoint = getCouponsApiEndpoint() + (force ? `?_t=${Date.now()}` : "?active=1");
    const res = await fetch(endpoint, force ? { cache: "no-store" } : undefined);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        if (force) {
          window.ALL_COUPONS = list;
          Store.set("app_all_coupons", list);
          window.ACTIVE_COUPONS = list.filter(c => c.isActive && !isCouponExpiredClient(c.expiresAt));
          Store.set("app_active_coupons", window.ACTIVE_COUPONS);
        } else {
          window.ACTIVE_COUPONS = list;
          Store.set("app_active_coupons", list);
        }
        return list;
      }
    }
  } catch (e) {}
  return force ? (window.ALL_COUPONS || []) : getActiveCoupons();
}

async function saveCouponRemote(coupon, isPatch = false) {
  try {
    const endpoint = getCouponsApiEndpoint();
    const res = await fetch(endpoint, {
      method: isPatch ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.coupon) {
      return { ok: true, coupon: data.coupon };
    }
    return { ok: false, error: data.error || res.statusText || "Save failed" };
  } catch (e) {
    return { ok: false, error: e.message || "Network error" };
  }
}

async function deleteCouponRemote(id) {
  try {
    const res = await fetch(`${getCouponsApiEndpoint()}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function totals(city = "") {
  if (!city && typeof document !== "undefined") {
    const el = document.getElementById("f-city") || document.getElementById("moCity");
    if (el && el.value) city = el.value;
  }
  const cartLines = lines();
  const sub = cartLines.reduce((s, l) => s + l.qty * l.p.price, 0);
  const couponEval = resolveAppliedCoupon(cartLines, sub);
  const discount = couponEval ? couponEval.discount : 0;
  const isCouponFreeShipping = couponEval ? !!couponEval.freeShipping : false;
  const discountedSub = Math.max(0, sub - discount);

  const deliveryCfg = (window.BRAND_CONFIG && window.BRAND_CONFIG.delivery) || { fee: 200, freeShippingThreshold: 5000 };
  const freeThreshold = deliveryCfg.freeShippingThreshold || 999999;
  const isCityFree = isKohatCity(city);
  const isFree = discountedSub >= freeThreshold || isCityFree || isCouponFreeShipping;
  const ship = sub === 0 ? 0 : (isFree ? 0 : (deliveryCfg.fee || 200));

  return {
    sub,
    discount,
    discountedSub,
    ship,
    total: discountedSub + ship,
    isFree,
    isCityFree,
    isCouponFreeShipping,
    appliedCoupon: couponEval ? couponEval.coupon : null,
    isAutoCoupon: couponEval ? !!couponEval.isAuto : false
  };
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
${(order.discount > 0) ? `\n🎟️ *Promo Discount${order.couponCode ? ` (${order.couponCode})` : ""}:* -PKR ${Number(order.discount).toLocaleString()}` : ""}
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
  if (Array.isArray(data.activeCoupons)) {
    window.ACTIVE_COUPONS = data.activeCoupons;
    Store.set("app_active_coupons", data.activeCoupons);
  }
  Store.set("app_brand_config", window.BRAND_CONFIG);
  return true;
}

function loadLocalBrandSettings() {
  const savedCoupons = Store.get("app_active_coupons");
  if (Array.isArray(savedCoupons)) {
    window.ACTIVE_COUPONS = savedCoupons;
  }
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

  // Reuse local settings within 60s to shield API quota while keeping updates fast
  if (!force && cached && !cached.error && cached.found !== false && (Date.now() - lastSync < 60000)) {
    applyBrandSettings(cached);
    return cached;
  }

  try {
    const endpoint = getSettingsApiEndpoint() + (force ? `?_t=${Date.now()}` : "");
    const res = await fetch(endpoint, force ? { cache: "no-store" } : undefined);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.activeCoupons)) {
        window.ACTIVE_COUPONS = data.activeCoupons;
        Store.set("app_active_coupons", data.activeCoupons);
        Store.set("app_brand_config_last_sync", Date.now());
      }
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
  const activeTheme = theme || localStorage.getItem("app_active_theme") || "luxury-gold";
  applyBrandSettings(fullConfig);
  Store.set("app_brand_config", window.BRAND_CONFIG);
  Store.set("app_brand_config_last_sync", Date.now());

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
  window.getCouponsApiEndpoint = getCouponsApiEndpoint;
  window.getActiveCoupons = getActiveCoupons;
  window.getBestPromoForProduct = getBestPromoForProduct;
  window.evaluateCoupon = evaluateCoupon;
  window.applyCouponCodeToCart = applyCouponCodeToCart;
  window.removeCouponFromCart = removeCouponFromCart;
  window.formatCouponExpiry = formatCouponExpiry;
  window.isCouponExpiredClient = isCouponExpiredClient;
  window.syncCouponsRemote = syncCouponsRemote;
  window.saveCouponRemote = saveCouponRemote;
  window.deleteCouponRemote = deleteCouponRemote;
}
