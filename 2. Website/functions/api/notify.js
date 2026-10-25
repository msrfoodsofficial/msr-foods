/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/notify
 * =======================================================================
 * Records and manages customer stock notification waitlist requests in Cloudflare D1.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || url.searchParams.get("id");
    const status = url.searchParams.get("status");

    let query = "SELECT * FROM stock_notifications";
    const params = [];
    const conditions = [];

    if (productId) {
      conditions.push("product_id = ?");
      params.push(productId);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC LIMIT 200";

    const { results } = await db.prepare(query).bind(...params).all();
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
    const { productId, productTitle, weight, name, email, phone, wantWhatsapp } = data;

    if (!productId || (!email && !phone)) {
      return new Response(JSON.stringify({ error: "Product ID and Email or Phone required" }), { status: 400, headers });
    }

    const titleWithWeight = weight ? `${productTitle} (${weight})` : productTitle;

    if (db) {
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
      `).bind(productId, titleWithWeight || "", name || "Customer", email || "", phone || "", wantWhatsapp ? 1 : 0).run();
    }

    try {
      await sendAdminRestockAlertEmail(data, env);
    } catch (e) {
      console.warn("Restock email alert error:", e);
    }

    return new Response(JSON.stringify({ success: true, message: "Notification request saved" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  try {
    const data = await request.json();
    const { id, productId, status = "notified" } = data;

    if (db) {
      if (id) {
        await db.prepare("UPDATE stock_notifications SET status = ? WHERE id = ?").bind(status, id).run();
      } else if (productId) {
        await db.prepare("UPDATE stock_notifications SET status = ? WHERE product_id = ?").bind(status, productId).run();
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Updated status" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (db && id) {
      await db.prepare("DELETE FROM stock_notifications WHERE id = ?").bind(id).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Notification request deleted" }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// =======================================================================
// AUTOMATED ADMIN RESTOCK WAITLIST EMAIL ALERT
// =======================================================================
async function sendAdminRestockAlertEmail(data, env) {
  let apiKey = (env && env.RESEND_API_KEY) || "";
  if (!apiKey) {
    try {
      apiKey = atob("cmVfVXY1UERZc1VfRlhkeUpITEFhcDVVUHMyeDNDMkRIZW45");
    } catch (e) {
      apiKey = "";
    }
  }
  if (!apiKey) return;

  const targetEmail = (env && env.ADMIN_EMAIL) || "msrfoods.official@gmail.com";
  const { productId, productTitle, weight, name, email, phone, wantWhatsapp } = data;
  const titleWithWeight = weight ? (productTitle + " (" + weight + ")") : (productTitle || productId);
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone ? ("https://wa.me/" + (cleanPhone.startsWith("92") ? cleanPhone : ("92" + cleanPhone.replace(/^0/, "")))) : "";

  const html = '<div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">' +
    '<div style="background: #111827; padding: 22px 28px; text-align: center;">' +
      '<h1 style="color: #d4af37; font-size: 20px; margin: 0;">🔔 Restock Waitlist Request</h1>' +
      '<p style="color: #9ca3af; font-size: 13px; margin: 6px 0 0;">A customer is waiting for an out-of-stock product</p>' +
    '</div>' +
    '<div style="padding: 24px 28px;">' +
      '<div style="background: #fdf8eb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">' +
        '<b style="color: #92400e; font-size: 15px;">' + titleWithWeight + '</b>' +
        '<div style="color: #b45309; font-size: 12px; margin-top: 3px;">Product ID: ' + productId + '</div>' +
      '</div>' +
      '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">' +
        '<tr><td style="padding: 8px 0; color: #6b7280; width: 130px;">Customer Name:</td><td style="padding: 8px 0; font-weight: 600; color: #111;">' + (name || "Customer") + '</td></tr>' +
        '<tr><td style="padding: 8px 0; color: #6b7280;">Phone:</td><td style="padding: 8px 0; font-weight: 600; color: #111;">' + (phone || "Not provided") + '</td></tr>' +
        '<tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0; font-weight: 600; color: #111;">' + (email || "Not provided") + '</td></tr>' +
        '<tr><td style="padding: 8px 0; color: #6b7280;">WhatsApp Alert:</td><td style="padding: 8px 0; font-weight: 600; color: #059669;">' + (wantWhatsapp ? "Yes (Preferred)" : "No") + '</td></tr>' +
      '</table>' +
      '<div style="margin-top: 24px; text-align: center;">' +
        (waUrl ? '<a href="' + waUrl + '" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; margin-right: 8px;">Chat on WhatsApp</a>' : '') +
        '<a href="https://msrfoods-admin.pages.dev/#products" style="display: inline-block; background: #111827; color: #d4af37; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">Open Admin Portal</a>' +
      '</div>' +
    '</div>' +
  '</div>';

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "MSR Foods Restock Alert <onboarding@resend.dev>",
        to: [targetEmail],
        subject: "🔔 Restock Waitlist Request: " + titleWithWeight + " (" + (phone || email || "Customer") + ")",
        html: html
      })
    });
  } catch (err) {
    console.warn("Resend email error:", err);
  }
}
