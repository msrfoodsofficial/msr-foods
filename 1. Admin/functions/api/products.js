/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/products
 * =======================================================================
 * Dynamic Multi-Niche Product & Inventory API backed by Cloudflare D1.
 * Supports catalog browsing, stock management, restock & product creation.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
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

// -----------------------------------------------------------------------
// GET /api/products — List Products with Search, Category & Stock Filter
// -----------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding missing" }), { status: 500, headers });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("id");
  const category = url.searchParams.get("category");
  const stockFilter = url.searchParams.get("stock"); // 'instock', 'outofstock'
  const searchQuery = url.searchParams.get("search");

  try {
    // Single Product lookup
    if (productId) {
      const row = await db
        .prepare("SELECT raw_json FROM products WHERE id = ? AND is_active = 1")
        .bind(productId)
        .first();

      if (!row) {
        return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers });
      }
      return new Response(row.raw_json, { status: 200, headers });
    }

    // List products
    let query = "SELECT raw_json FROM products WHERE is_active = 1";
    const params = [];

    if (category) {
      query += " AND (category_id = ? OR group_slug = ?)";
      params.push(category, category);
    }

    if (stockFilter === "instock") {
      query += " AND stock > 0";
    } else if (stockFilter === "outofstock") {
      query += " AND stock <= 0";
    }

    if (searchQuery) {
      query += " AND (title LIKE ? OR subtitle LIKE ? OR weight LIKE ?)";
      const term = `%${searchQuery.trim()}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY created_at ASC";

    const { results } = await db.prepare(query).bind(...params).all();
    const products = (results || []).map(r => {
      try {
        return JSON.parse(r.raw_json);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return new Response(JSON.stringify(products), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// POST /api/products — Create New Product
// -----------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database missing" }), { status: 500, headers });
  }

  try {
    const p = await request.json();

    if (!p.title || p.price == null) {
      return new Response(JSON.stringify({ error: "Product title and price required" }), { status: 400, headers });
    }

    const now = new Date().toISOString();
    const id = p.id || `prod-${Date.now()}`;
    const slug = p.slug || (p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + (p.weight ? p.weight.toLowerCase().replace(/[^a-z0-9]+/g, "") : Math.floor(Math.random() * 1000)));

    p.id = id;
    p.slug = slug;
    p.name = p.name || p.title;
    p.stock = p.stock != null ? Number(p.stock) : 50;
    p.price = Number(p.price);
    p.comparePrice = p.comparePrice != null ? Number(p.comparePrice) : null;
    p.featured = p.featured !== undefined ? !!p.featured : true;
    p.createdAt = p.createdAt || now;
    p.updatedAt = now;

    // Standardize images
    if (!p.img) {
      p.img = {
        front: p.image || "assets/images/products/front.webp",
        back: p.image || "assets/images/products/back.webp",
        pair: p.image || "assets/images/products/pair.webp"
      };
    }

    const imagesJson = JSON.stringify(p.img);
    const rawJson = JSON.stringify(p);

    await db
      .prepare(`
        INSERT INTO products (
          id, slug, group_slug, title, subtitle, category_id,
          price, compare_price, stock, is_active, weight, badge,
          featured, images_json, short_desc, full_desc, raw_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          title = excluded.title,
          subtitle = excluded.subtitle,
          price = excluded.price,
          compare_price = excluded.compare_price,
          stock = excluded.stock,
          is_active = 1,
          weight = excluded.weight,
          badge = excluded.badge,
          images_json = excluded.images_json,
          short_desc = excluded.short_desc,
          full_desc = excluded.full_desc,
          raw_json = excluded.raw_json,
          updated_at = excluded.updated_at
      `)
      .bind(
        id, slug, p.group || "general", p.title, p.subtitle || p.shortDesc || "",
        p.category || "general", p.price, p.comparePrice, p.stock,
        p.weight || "", p.badge || "", p.featured ? 1 : 0,
        imagesJson, p.shortDesc || "", p.fullDesc || "", rawJson,
        now, now
      )
      .run();

    return new Response(JSON.stringify({ success: true, product: p }), { status: 201, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// PATCH /api/products — Edit Product, Restock or Mark Out of Stock
// -----------------------------------------------------------------------
export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database missing" }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const id = body.id || new URL(request.url).searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Product id required" }), { status: 400, headers });
    }

    const existingRow = await db.prepare("SELECT raw_json FROM products WHERE id = ?").bind(id).first();
    if (!existingRow) {
      return new Response(JSON.stringify({ error: `Product #${id} not found` }), { status: 404, headers });
    }

    let p = JSON.parse(existingRow.raw_json);
    const now = new Date().toISOString();

    if (body.title) { p.title = body.title; p.name = body.title; }
    if (body.price != null) p.price = Number(body.price);
    if (body.comparePrice !== undefined) p.comparePrice = body.comparePrice ? Number(body.comparePrice) : null;
    if (body.stock !== undefined) p.stock = Number(body.stock);
    if (body.weight) { p.weight = body.weight; p.netWeight = body.weight; }
    if (body.badge !== undefined) p.badge = body.badge;
    if (body.shortDesc) { p.shortDesc = body.shortDesc; p.subtitle = body.shortDesc; }
    if (body.fullDesc) p.fullDesc = body.fullDesc;
    if (body.img) p.img = { ...(p.img || {}), ...body.img };
    if (body.image) {
      p.img = p.img || {};
      p.img.front = body.image;
      p.img.pair = body.image;
    }
    p.updatedAt = now;

    const imagesJson = JSON.stringify(p.img || {});
    const rawJson = JSON.stringify(p);

    await db
      .prepare(`
        UPDATE products SET
          title = ?,
          subtitle = ?,
          price = ?,
          compare_price = ?,
          stock = ?,
          weight = ?,
          badge = ?,
          images_json = ?,
          short_desc = ?,
          full_desc = ?,
          raw_json = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        p.title, p.subtitle || "", p.price, p.comparePrice, p.stock,
        p.weight || "", p.badge || "", imagesJson, p.shortDesc || "",
        p.fullDesc || "", rawJson, now, id
      )
      .run();

    return new Response(JSON.stringify({ success: true, product: p }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// DELETE /api/products — Soft Delete / Archive Product
// -----------------------------------------------------------------------
export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) return new Response(JSON.stringify({ error: "Database missing" }), { status: 500, headers });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing product id" }), { status: 400, headers });

  try {
    await db.prepare("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    return new Response(JSON.stringify({ success: true, message: `Product ${id} archived` }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
