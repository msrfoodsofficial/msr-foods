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
  const url = new URL(request.url);
  const noCache = url.searchParams.has("_t") || url.searchParams.has("nocache");

  if (noCache) {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  } else {
    // Edge caches for 60s so admin settings/hero edits reflect quickly without exhausting D1
    headers["Cache-Control"] = "public, max-age=0, s-maxage=60, stale-while-revalidate=60";
  }

  const db = getDatabase(env);

  if (!db) return new Response(JSON.stringify({ error: "Database not bound" }), { status: 500, headers });

  try {
    const row = await db.prepare("SELECT value_json FROM store_settings WHERE key = 'brand_config'").first();
    let payload = {};
    if (row && row.value_json) {
      try {
        payload = JSON.parse(row.value_json);
      } catch (e) {
        payload = {};
      }
    } else {
      payload = { found: false };
    }

    // Attach active public & auto-applied coupons so storefront needs 0 extra API calls
    try {
      const cRes = await db
        .prepare("SELECT * FROM coupons WHERE is_active = 1 AND (auto_apply = 1 OR show_banner = 1) ORDER BY created_at DESC")
        .all();
      const nowMs = Date.now();
      payload.activeCoupons = (cRes && cRes.results ? cRes.results : [])
        .map(r => {
          let extra = {};
          try { if (r.raw_json) extra = JSON.parse(r.raw_json); } catch (e) {}
          const exp = r.expires_at || "";
          if (exp) {
            const endTs = /^\d{4}-\d{2}-\d{2}$/.test(exp) ? new Date(`${exp}T23:59:59+05:00`).getTime() : new Date(exp).getTime();
            if (!isNaN(endTs) && nowMs > endTs) return null;
          }
          const uLimit = Number(r.usage_limit || 0);
          const uCount = Number(r.used_count || 0);
          if (uLimit > 0 && uCount >= uLimit) return null;
          return {
            id: r.id,
            code: String(r.code || "").toUpperCase().trim(),
            title: r.title || r.code,
            description: r.description || "",
            type: r.type || "percent",
            value: Number(r.value || 0),
            autoApply: !!r.auto_apply,
            showBanner: r.show_banner !== undefined ? !!r.show_banner : true,
            isActive: true,
            minOrder: Number(r.min_order || 0),
            maxDiscount: Number(r.max_discount || 0),
            usageLimit: uLimit,
            usedCount: uCount,
            appliesTo: extra.appliesTo || r.applies_to || "all",
            expiresAt: exp
          };
        })
        .filter(Boolean);
    } catch (cErr) {
      // Coupons table might not exist before first coupon is created
      payload.activeCoupons = payload.activeCoupons || [];
    }

    return new Response(JSON.stringify(payload), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
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
