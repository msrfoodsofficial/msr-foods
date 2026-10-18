/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/settings
 * =======================================================================
 * White-Label Multi-Brand Dynamic Customizer API.
 * Stores brand identity, active theme tokens, logo, and contact info in D1.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Session-Token",
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

  if (!db) return new Response(JSON.stringify({ error: "Database not bound" }), { status: 500, headers });

  try {
    const row = await db.prepare("SELECT value_json FROM store_settings WHERE key = 'brand_config'").first();
    if (!row) {
      return new Response(JSON.stringify({ found: false }), { status: 200, headers });
    }
    return new Response(row.value_json, { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) return new Response(JSON.stringify({ error: "Database not bound" }), { status: 500, headers });

  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const valueJson = JSON.stringify(body);

    await db
      .prepare(`
        INSERT INTO store_settings (key, value_json, updated_at)
        VALUES ('brand_config', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `)
      .bind(valueJson, now)
      .run();

    return new Response(JSON.stringify({ success: true, message: "Brand settings saved to database" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
