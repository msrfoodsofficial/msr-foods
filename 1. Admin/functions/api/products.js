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

    // Auto-seed initial catalog into D1 if products table is empty
    try {
      const countRow = await db.prepare("SELECT COUNT(*) as cnt FROM products").first();
      if (!countRow || countRow.cnt === 0) {
        await seedDefaultProducts(db);
      }
    } catch (seedErr) {
      console.warn("Auto-seed check/execution notice:", seedErr);
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

    // Verify or safely set category_id to prevent FOREIGN KEY constraint violation
    let categoryId = p.category || p.category_id || p.group || null;
    if (categoryId) {
      try {
        const catRow = await db.prepare("SELECT id FROM categories WHERE id = ? OR slug = ?").bind(categoryId, categoryId).first();
        categoryId = catRow ? catRow.id : null;
      } catch (e) {
        categoryId = null;
      }
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
          category_id = excluded.category_id,
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
        categoryId, p.price, p.comparePrice, p.stock,
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
// PATCH /api/products — Edit Product, Restock or Mark Out of Stock (with Upsert Fallback)
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
    const now = new Date().toISOString();

    // Auto-create / Upsert fallback if row doesn't exist in D1 yet
    if (!existingRow) {
      const defaults = {
        "msr-500": {
          id: "msr-500", slug: "honey-nut-mix-500g", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
          title: "HONEY NUT MIX (500g)", subtitle: "Artisanal Roasted Dry Fruits Drenched in Raw Mountain Honey",
          weight: "500g", netWeight: "500g", price: 1599, comparePrice: 1850, stock: 45,
          badge: "Most Popular", featured: true,
          img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
          shortDesc: "A nourishing artisanal blend of almonds, walnuts, cashews, pistachios and peanuts drenched in 100% pure mountain honey."
        },
        "msr-1kg": {
          id: "msr-1kg", slug: "honey-nut-mix-1kg", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
          title: "HONEY NUT MIX (1kg Family Pack)", subtitle: "Value Family Jar for Daily Immunity & Natural Energy",
          weight: "1kg", netWeight: "1kg (1000g)", price: 2999, comparePrice: 3499, stock: 25,
          badge: "Best Value", featured: true,
          img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
          shortDesc: "Double the nutritious goodness for the whole household with our 1kg value family pack."
        },
        "msr-250": {
          id: "msr-250", slug: "honey-nut-mix-250g", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
          title: "HONEY NUT MIX (250g Starter Jar)", subtitle: "Compact Snacking Jar · Perfect Daily Portion & Trial Size",
          weight: "250g", netWeight: "250g", price: 899, comparePrice: 1099, stock: 60,
          badge: "✨ New Starter Size", featured: true,
          img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
          shortDesc: "The perfect introduction to pure honey-roasted nuts. Convenient compact jar for desk snacking or travel."
        }
      };

      const base = defaults[id] || {};
      const newP = {
        id,
        slug: body.slug || base.slug || id,
        group: body.group || base.group || "honey-nut-mix",
        name: body.title || body.name || base.name || `Product #${id}`,
        title: body.title || base.title || `Product #${id}`,
        subtitle: body.shortDesc || body.subtitle || base.subtitle || "",
        weight: body.weight || base.weight || "",
        netWeight: body.weight || base.netWeight || "",
        price: body.price != null ? Number(body.price) : (base.price || 0),
        comparePrice: body.comparePrice !== undefined ? (body.comparePrice ? Number(body.comparePrice) : null) : (base.comparePrice || null),
        stock: body.stock !== undefined ? Number(body.stock) : (base.stock != null ? base.stock : 50),
        badge: body.badge !== undefined ? body.badge : (base.badge || ""),
        featured: body.featured !== undefined ? !!body.featured : (base.featured !== undefined ? base.featured : true),
        img: body.img || base.img || { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
        shortDesc: body.shortDesc || base.shortDesc || "",
        fullDesc: body.fullDesc || base.fullDesc || body.shortDesc || base.shortDesc || "",
        createdAt: now,
        updatedAt: now
      };

      if (body.image) {
        newP.img = newP.img || {};
        newP.img.front = body.image;
        newP.img.pair = body.image;
      }

      let catId = null;
      try {
        const catRow = await db.prepare("SELECT id FROM categories WHERE id = ? OR slug = ?").bind(newP.group, newP.group).first();
        if (catRow) catId = catRow.id;
      } catch (e) {}

      const imagesJson = JSON.stringify(newP.img || {});
      const rawJson = JSON.stringify(newP);

      await db
        .prepare(`
          INSERT INTO products (
            id, slug, group_slug, title, subtitle, category_id,
            price, compare_price, stock, is_active, weight, badge,
            featured, images_json, short_desc, full_desc, raw_json,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          newP.id, newP.slug, newP.group, newP.title, newP.subtitle,
          catId, newP.price, newP.comparePrice, newP.stock,
          newP.weight, newP.badge, newP.featured ? 1 : 0,
          imagesJson, newP.shortDesc, newP.fullDesc, rawJson,
          now, now
        )
        .run();

      return new Response(JSON.stringify({ success: true, product: newP, created: true }), { status: 200, headers });
    }

    let p = JSON.parse(existingRow.raw_json);

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

// -----------------------------------------------------------------------
// Auto-seed helper when products table in D1 is empty
// -----------------------------------------------------------------------
async function seedDefaultProducts(db) {
  const now = new Date().toISOString();

  // Ensure category exists
  try {
    await db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
        ('cat-honey-nuts', 'Honey Nut Blends', 'honey-nuts', 'Artisanal roasted dry fruits drenched in pure mountain honey', 1),
        ('general', 'General Catalog', 'general', 'General Store Products', 99)
    `).run();
  } catch (catErr) {}

  const seeds = [
    {
      id: "msr-500", slug: "honey-nut-mix-500g", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
      title: "HONEY NUT MIX (500g)", subtitle: "Artisanal Roasted Dry Fruits Drenched in Raw Mountain Honey",
      weight: "500g", netWeight: "500g", price: 1599, comparePrice: 1850, stock: 45,
      badge: "Most Popular", featured: true, categoryId: "cat-honey-nuts",
      img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
      shortDesc: "A nourishing artisanal blend of almonds, walnuts, cashews, pistachios and peanuts drenched in 100% pure mountain honey.",
      fullDesc: "MSR Honey Nut Mix brings together hand-selected roasted almonds, crunchy walnuts, buttery cashews, pistachios, and peanuts with rich golden honey in one premium blend. It is an energizing, convenient snack for busy mornings, active gym lifestyles, or any moment you crave pure wholesome sweetness.",
      packaging: "Airtight clear jar with double freshness hygiene seal", shelfLife: "12 months from packing date"
    },
    {
      id: "msr-1kg", slug: "honey-nut-mix-1kg", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
      title: "HONEY NUT MIX (1kg Family Pack)", subtitle: "Value Family Jar for Daily Immunity & Natural Energy",
      weight: "1kg", netWeight: "1kg (1000g)", price: 2999, comparePrice: 3499, stock: 25,
      badge: "Best Value", featured: true, categoryId: "cat-honey-nuts",
      img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
      shortDesc: "Double the nutritious goodness for the whole household with our 1kg value family pack.",
      fullDesc: "Double the goodness for the entire household. Packed with essential micronutrients, healthy unsaturated fats, minerals, and natural slow-burning energy. Ideal for sharing with family or stocking your pantry for the month.",
      packaging: "Heavyweight pantry jar with double seal protection", shelfLife: "12 months from packing date"
    },
    {
      id: "msr-250", slug: "honey-nut-mix-250g", group: "honey-nut-mix", name: "MSR Honey Nut Mix",
      title: "HONEY NUT MIX (250g Starter Jar)", subtitle: "Compact Snacking Jar · Perfect Daily Portion & Trial Size",
      weight: "250g", netWeight: "250g", price: 899, comparePrice: 1099, stock: 60,
      badge: "✨ New Starter Size", featured: true, categoryId: "cat-honey-nuts",
      img: { front: "assets/images/products/front.webp", back: "assets/images/products/back.webp", pair: "assets/images/products/pair.webp" },
      shortDesc: "The perfect introduction to pure honey-roasted nuts. Convenient compact jar for desk snacking or travel.",
      fullDesc: "The brand new 250g edition gives you the exact same gold-standard recipe of whole California almonds, Kashmiri walnuts, roasted cashews, Iranian pistachios, and peanuts drenched in raw mountain honey in an ultra-portable, convenient personal jar.",
      packaging: "Compact airtight jar with tamper-proof seal", shelfLife: "12 months from packing date"
    }
  ];

  for (const s of seeds) {
    try {
      const raw = JSON.stringify(s);
      const imgJson = JSON.stringify(s.img);
      await db.prepare(`
        INSERT OR IGNORE INTO products (
          id, slug, group_slug, title, subtitle, category_id,
          price, compare_price, stock, is_active, weight, badge,
          featured, images_json, short_desc, full_desc, raw_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        s.id, s.slug, s.group, s.title, s.subtitle, s.categoryId,
        s.price, s.comparePrice, s.stock, s.weight, s.badge, s.featured ? 1 : 0,
        imgJson, s.shortDesc, s.fullDesc, raw, now, now
      ).run();
    } catch (itemErr) {
      console.warn("Seed item error:", s.id, itemErr);
    }
  }
}
