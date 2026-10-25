/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/notify
 * =======================================================================
 * Records stock notification / restock waitlist requests in Cloudflare D1.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

function getDatabase(env) {
  return env.DB || env.ORDERS_DB || env.DATABASE || null;
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify([]), { status: 200, headers });
  }

  try {
    const { results } = await db.prepare("SELECT * FROM stock_notifications ORDER BY created_at DESC LIMIT 100").all();
    return new Response(JSON.stringify(results || []), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  try {
    const data = await request.json();
    const { productId, productTitle, name, email, phone, wantWhatsapp } = data;

    if (!productId || (!email && !phone)) {
      return new Response(JSON.stringify({ error: "Product ID and Email or Phone required" }), { status: 400, headers });
    }

    if (db) {
      // Auto-create table if not exists
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS stock_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          product_title TEXT,
          customer_name TEXT,
          customer_email TEXT,
          customer_phone TEXT,
          want_whatsapp INTEGER DEFAULT 1,
          status TEXT DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      await db.prepare(`
        INSERT INTO stock_notifications (product_id, product_title, customer_name, customer_email, customer_phone, want_whatsapp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(productId, productTitle || "", name || "", email || "", phone || "", wantWhatsapp ? 1 : 0).run();
    }

    return new Response(JSON.stringify({ success: true, message: "Notification request saved" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
