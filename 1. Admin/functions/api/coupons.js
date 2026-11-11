/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/coupons
 * =======================================================================
 * Dynamic Coupons & Auto-Applied Promo Campaigns API backed by D1.
 * Supports Admin CRUD, Storefront Promo Listing, and Live Code Validation.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Session-Token",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

function getDatabase(env) {
  return env.DB || env.ORDERS_DB || env.DATABASE || null;
}

async function ensureCouponsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'percent',
      value REAL NOT NULL DEFAULT 0,
      auto_apply INTEGER DEFAULT 0,
      show_banner INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      min_order REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      applies_to TEXT DEFAULT 'all',
      expires_at TEXT,
      raw_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

function isCouponExpired(expiresAt) {
  if (!expiresAt) return false;
  const s = String(expiresAt).trim();
  if (!s) return false;
  // Treat YYYY-MM-DD as valid until end of that day in Pakistan Time (+05:00)
  const endTs = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T23:59:59+05:00`).getTime()
    : new Date(s).getTime();
  if (isNaN(endTs)) return false;
  return Date.now() > endTs;
}

function normalizeCouponRow(row) {
  if (!row) return null;
  let extra = {};
  try {
    if (row.raw_json) extra = JSON.parse(row.raw_json);
  } catch (e) {}

  return {
    id: row.id,
    code: String(row.code || "").toUpperCase().trim(),
    title: row.title || extra.title || row.code,
    description: row.description || extra.description || "",
    type: row.type || "percent",
    value: Number(row.value || 0),
    autoApply: !!row.auto_apply,
    showBanner: row.show_banner !== undefined ? !!row.show_banner : true,
    isActive: !!row.is_active,
    minOrder: Number(row.min_order || 0),
    maxDiscount: Number(row.max_discount || 0),
    usageLimit: Number(row.usage_limit || 0),
    usedCount: Number(row.used_count || 0),
    appliesTo: extra.appliesTo || row.applies_to || "all",
    expiresAt: row.expires_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

// -----------------------------------------------------------------------
// GET /api/coupons — List Coupons or Validate Code (?code=XYZ)
// -----------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding missing" }), { status: 500, headers });
  }

  try {
    await ensureCouponsTable(db);

    const url = new URL(request.url);
    const codeParam = url.searchParams.get("code");
    const activeOnly = url.searchParams.get("active") === "1";

    // A. Validate specific promo code entered by customer
    if (codeParam) {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
      const cleanCode = codeParam.trim().toUpperCase();
      const row = await db.prepare("SELECT * FROM coupons WHERE UPPER(code) = ?").bind(cleanCode).first();
      if (!row) {
        return new Response(JSON.stringify({ valid: false, error: `Promo code "${cleanCode}" is invalid.` }), { status: 404, headers });
      }
      const c = normalizeCouponRow(row);
      if (!c.isActive) {
        return new Response(JSON.stringify({ valid: false, error: `Promo code "${c.code}" is currently inactive.` }), { status: 400, headers });
      }
      if (isCouponExpired(c.expiresAt)) {
        return new Response(JSON.stringify({ valid: false, error: `Promo code "${c.code}" has expired.` }), { status: 400, headers });
      }
      if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) {
        return new Response(JSON.stringify({ valid: false, error: `Promo code "${c.code}" redemption limit reached.` }), { status: 400, headers });
      }
      return new Response(JSON.stringify({ valid: true, coupon: c }), { status: 200, headers });
    }

    // B. Active Storefront Public List vs Full Admin List
    if (activeOnly) {
      headers["Cache-Control"] = "public, max-age=0, s-maxage=60, stale-while-revalidate=60";
      const { results } = await db
        .prepare("SELECT * FROM coupons WHERE is_active = 1 AND (auto_apply = 1 OR show_banner = 1) ORDER BY created_at DESC")
        .all();
      const activeList = (results || [])
        .map(normalizeCouponRow)
        .filter(c => c && !isCouponExpired(c.expiresAt) && (c.usageLimit <= 0 || c.usedCount < c.usageLimit));
      return new Response(JSON.stringify(activeList), { status: 200, headers });
    }

    // Full Admin list (never cached)
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    const { results } = await db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all();
    const list = (results || []).map(normalizeCouponRow).filter(Boolean);
    return new Response(JSON.stringify(list), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// POST /api/coupons — Create or Upsert Coupon (Admin)
// -----------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database missing" }), { status: 500, headers });
  }

  try {
    await ensureCouponsTable(db);
    const body = await request.json();

    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const title = String(body.title || code).trim();
    if (!code) {
      return new Response(JSON.stringify({ error: "Coupon code is required (letters/numbers only)" }), { status: 400, headers });
    }

    const type = ["percent", "fixed", "free_shipping"].includes(body.type) ? body.type : "percent";
    const value = type === "free_shipping" ? 0 : Math.max(0, Number(body.value || 0));
    if (type !== "free_shipping" && value <= 0) {
      return new Response(JSON.stringify({ error: "Discount value must be greater than 0" }), { status: 400, headers });
    }
    if (type === "percent" && value > 95) {
      return new Response(JSON.stringify({ error: "Percentage discount cannot exceed 95%" }), { status: 400, headers });
    }

    const now = new Date().toISOString();
    const id = body.id || `coup-${Date.now()}`;
    const autoApply = body.autoApply ? 1 : 0;
    const showBanner = body.showBanner !== undefined ? (body.showBanner ? 1 : 0) : 1;
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1;
    const minOrder = Math.max(0, Number(body.minOrder || 0));
    const maxDiscount = Math.max(0, Number(body.maxDiscount || 0));
    const usageLimit = Math.max(0, parseInt(body.usageLimit || 0, 10) || 0);
    const appliesTo = body.appliesTo || "all";
    const appliesToStr = Array.isArray(appliesTo) ? appliesTo.join(",") : String(appliesTo || "all");
    const expiresAt = String(body.expiresAt || "").trim();
    const description = String(body.description || "").trim();

    const couponObj = {
      id,
      code,
      title,
      description,
      type,
      value,
      autoApply: !!autoApply,
      showBanner: !!showBanner,
      isActive: !!isActive,
      minOrder,
      maxDiscount,
      usageLimit,
      usedCount: Number(body.usedCount || 0),
      appliesTo,
      expiresAt,
      createdAt: body.createdAt || now,
      updatedAt: now
    };

    const rawJson = JSON.stringify(couponObj);

    await db.prepare(`
      INSERT INTO coupons (
        id, code, title, description, type, value,
        auto_apply, show_banner, is_active, min_order, max_discount,
        usage_limit, used_count, applies_to, expires_at, raw_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        title = excluded.title,
        description = excluded.description,
        type = excluded.type,
        value = excluded.value,
        auto_apply = excluded.auto_apply,
        show_banner = excluded.show_banner,
        is_active = excluded.is_active,
        min_order = excluded.min_order,
        max_discount = excluded.max_discount,
        usage_limit = excluded.usage_limit,
        applies_to = excluded.applies_to,
        expires_at = excluded.expires_at,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `).bind(
      id, code, title, description, type, value,
      autoApply, showBanner, isActive, minOrder, maxDiscount,
      usageLimit, couponObj.usedCount, appliesToStr, expiresAt, rawJson,
      couponObj.createdAt, now
    ).run();

    return new Response(JSON.stringify({ success: true, coupon: couponObj }), { status: 201, headers });
  } catch (err) {
    const msg = String(err.message || "");
    if (msg.includes("UNIQUE") && msg.includes("code")) {
      return new Response(JSON.stringify({ error: "A coupon with this code already exists." }), { status: 409, headers });
    }
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// PATCH /api/coupons — Toggle Active / Auto-Apply or Partial Edit (Admin)
// -----------------------------------------------------------------------
export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database missing" }), { status: 500, headers });
  }

  try {
    await ensureCouponsTable(db);
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Coupon id is required" }), { status: 400, headers });
    }

    const row = await db.prepare("SELECT * FROM coupons WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Coupon not found" }), { status: 404, headers });
    }

    const current = normalizeCouponRow(row);
    const now = new Date().toISOString();

    const updated = {
      ...current,
      code: body.code ? String(body.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") : current.code,
      title: body.title !== undefined ? String(body.title).trim() : current.title,
      description: body.description !== undefined ? String(body.description).trim() : current.description,
      type: body.type !== undefined ? body.type : current.type,
      value: body.value !== undefined ? Number(body.value) : current.value,
      autoApply: body.autoApply !== undefined ? !!body.autoApply : current.autoApply,
      showBanner: body.showBanner !== undefined ? !!body.showBanner : current.showBanner,
      isActive: body.isActive !== undefined ? !!body.isActive : current.isActive,
      minOrder: body.minOrder !== undefined ? Number(body.minOrder) : current.minOrder,
      maxDiscount: body.maxDiscount !== undefined ? Number(body.maxDiscount) : current.maxDiscount,
      usageLimit: body.usageLimit !== undefined ? parseInt(body.usageLimit, 10) : current.usageLimit,
      appliesTo: body.appliesTo !== undefined ? body.appliesTo : current.appliesTo,
      expiresAt: body.expiresAt !== undefined ? String(body.expiresAt).trim() : current.expiresAt,
      updatedAt: now
    };

    const appliesToStr = Array.isArray(updated.appliesTo) ? updated.appliesTo.join(",") : String(updated.appliesTo || "all");

    await db.prepare(`
      UPDATE coupons SET
        code = ?, title = ?, description = ?, type = ?, value = ?,
        auto_apply = ?, show_banner = ?, is_active = ?, min_order = ?,
        max_discount = ?, usage_limit = ?, applies_to = ?, expires_at = ?,
        raw_json = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      updated.code, updated.title, updated.description, updated.type, updated.value,
      updated.autoApply ? 1 : 0, updated.showBanner ? 1 : 0, updated.isActive ? 1 : 0,
      updated.minOrder, updated.maxDiscount, updated.usageLimit, appliesToStr,
      updated.expiresAt, JSON.stringify(updated), now, id
    ).run();

    return new Response(JSON.stringify({ success: true, coupon: updated }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// DELETE /api/coupons — Remove Coupon (Admin)
// -----------------------------------------------------------------------
export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database missing" }), { status: 500, headers });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing coupon id" }), { status: 400, headers });
  }

  try {
    await ensureCouponsTable(db);
    await db.prepare("DELETE FROM coupons WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true, message: "Coupon deleted" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

