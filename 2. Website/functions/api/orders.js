/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/orders
 * =======================================================================
 * Serverless API for MSR Foods order placement & admin synchronization.
 * Backed by Cloudflare D1 SQL database.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

function getDatabase(env) {
  return env.DB || env.ORDERS_DB || env.DATABASE || null;
}

// -----------------------------------------------------------------------
// 1. OPTIONS — CORS Preflight
// -----------------------------------------------------------------------
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

// -----------------------------------------------------------------------
// 2. GET — Fetch Orders or Single Order
// -----------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(
      JSON.stringify({
        error: "D1 database binding missing. Please bind your D1 database to variable 'DB' in Cloudflare Pages Settings > Functions > D1 database bindings."
      }),
      { status: 500, headers }
    );
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");
  const statusFilter = url.searchParams.get("status");
  const searchQuery = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

  try {
    // A. Single Order Lookup (for tracking or detail view)
    if (orderId) {
      const row = await db
        .prepare("SELECT raw_json FROM orders WHERE id = ?")
        .bind(orderId.trim())
        .first();

      if (!row) {
        return new Response(
          JSON.stringify({ error: `Order #${orderId} not found` }),
          { status: 404, headers }
        );
      }

      return new Response(row.raw_json, { status: 200, headers });
    }

    // B. Filtered or Search Query
    let query = "SELECT raw_json FROM orders";
    const conditions = [];
    const params = [];

    if (statusFilter && statusFilter.toLowerCase() !== "all") {
      conditions.push("LOWER(status) = LOWER(?)");
      params.push(statusFilter);
    }

    if (searchQuery) {
      conditions.push("(id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)");
      const term = `%${searchQuery.trim()}%`;
      params.push(term, term, term);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const stmt = db.prepare(query).bind(...params);
    const { results } = await stmt.all();

    const orders = (results || []).map(r => {
      try {
        return JSON.parse(r.raw_json);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return new Response(JSON.stringify(orders), { status: 200, headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch orders", details: err.message }),
      { status: 500, headers }
    );
  }
}

// -----------------------------------------------------------------------
// 3. POST — Create New Order (Storefront Checkout)
// -----------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(
      JSON.stringify({
        error: "D1 database binding missing. Please bind your D1 database to 'DB' in Cloudflare Pages."
      }),
      { status: 500, headers }
    );
  }

  try {
    const order = await request.json();

    if (!order || (!order.items && !order.total)) {
      return new Response(
        JSON.stringify({ error: "Invalid order data" }),
        { status: 400, headers }
      );
    }

    const now = new Date();
    const orderId = order.id || `MSR-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const createdAt = order.createdAt || now.toISOString();
    const updatedAt = now.toISOString();
    const status = order.status || "Pending";

    const cust = order.customer || {};
    const custName = cust.name || order.name || "";
    const custPhone = cust.phone || order.phone || "";
    const custEmail = cust.email || order.email || "";
    const custAddress = cust.address || order.addr || "";
    const custCity = cust.city || order.city || "";
    const custProvince = cust.province || order.prov || "";
    const custZip = cust.zip || "";
    const custNotes = cust.notes || order.note || "";

    const subtotal = Number(order.subtotal || 0);
    const shipping = Number(order.shipping || 0);
    const total = Number(order.total || 0);
    const paymentMethod = order.paymentMethod || order.pay || "cod";

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
          time: now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          note: "Order placed online via storefront checkout"
        }
      ];
    }

    order.id = orderId;
    order.createdAt = createdAt;
    order.updatedAt = updatedAt;
    order.status = status;

    const itemsJson = JSON.stringify(order.items || []);
    const trackingJson = JSON.stringify(order.tracking || {});
    const timelineJson = JSON.stringify(order.timeline || []);
    const rawJson = JSON.stringify(order);

    await db
      .prepare(`
        INSERT INTO orders (
          id, created_at, updated_at, status,
          customer_name, customer_phone, customer_email,
          customer_address, customer_city, customer_province, customer_zip, customer_notes,
          subtotal, shipping, total, payment_method,
          items_json, tracking_json, timeline_json, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          updated_at = excluded.updated_at,
          status = excluded.status,
          customer_name = excluded.customer_name,
          customer_phone = excluded.customer_phone,
          customer_email = excluded.customer_email,
          customer_address = excluded.customer_address,
          customer_city = excluded.customer_city,
          customer_province = excluded.customer_province,
          customer_zip = excluded.customer_zip,
          customer_notes = excluded.customer_notes,
          subtotal = excluded.subtotal,
          shipping = excluded.shipping,
          total = excluded.total,
          payment_method = excluded.payment_method,
          items_json = excluded.items_json,
          tracking_json = excluded.tracking_json,
          timeline_json = excluded.timeline_json,
          raw_json = excluded.raw_json
      `)
      .bind(
        orderId, createdAt, updatedAt, status,
        custName, custPhone, custEmail,
        custAddress, custCity, custProvince, custZip, custNotes,
        subtotal, shipping, total, paymentMethod,
        itemsJson, trackingJson, timelineJson, rawJson
      )
      .run();

    // Record in order_activity_logs audit trail
    try {
      await db.prepare(`
        INSERT INTO order_activity_logs (order_id, admin_name, action, note, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(orderId, "Customer", "Order Placed", "Order placed online via storefront checkout", now.toISOString()).run();
    } catch (e) {}

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 201, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to save order", details: err.message }),
      { status: 500, headers }
    );
  }
}

// -----------------------------------------------------------------------
// 4. PATCH — Update Order Status / Tracking (Admin Portal)
// -----------------------------------------------------------------------
export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(
      JSON.stringify({ error: "D1 database binding missing" }),
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
    const orderId = body.id || (new URL(request.url).searchParams.get("id"));

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing order id" }),
        { status: 400, headers }
      );
    }

    const existingRow = await db
      .prepare("SELECT raw_json FROM orders WHERE id = ?")
      .bind(orderId)
      .first();

    if (!existingRow) {
      return new Response(
        JSON.stringify({ error: `Order #${orderId} not found` }),
        { status: 404, headers }
      );
    }

    let orderObj = JSON.parse(existingRow.raw_json);
    const now = new Date();
    const timeFormatted = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    if (body.status) {
      orderObj.status = body.status;
    }

    if (body.tracking) {
      orderObj.tracking = { ...(orderObj.tracking || {}), ...body.tracking };
      if (body.status === "Dispatched") orderObj.tracking.dispatchedAt = now.toISOString();
      if (body.status === "Delivered") orderObj.tracking.deliveredAt = now.toISOString();
    }

    if (body.timeline && Array.isArray(body.timeline)) {
      orderObj.timeline = body.timeline;
    } else if (body.status || body.note) {
      if (!orderObj.timeline) orderObj.timeline = [];
      let eventTitle = `Status updated to ${orderObj.status}`;
      if (orderObj.status === "Approved") eventTitle = "Order Approved & Confirmed";
      else if (orderObj.status === "Processing") eventTitle = "Packed & Ready for Dispatch";
      else if (orderObj.status === "Dispatched") eventTitle = "Dispatched with Courier Partner";
      else if (orderObj.status === "Delivered") eventTitle = "Delivered to Customer";
      else if (orderObj.status === "Cancelled") eventTitle = "Order Cancelled";

      orderObj.timeline.push({
        status: orderObj.status,
        title: eventTitle,
        time: timeFormatted,
        note: body.note || (body.tracking && body.tracking.courier ? `Courier: ${body.tracking.courier} (Tracking #${body.tracking.trackingNumber})` : `Order marked as ${orderObj.status}`)
      });
    }

    orderObj.updatedAt = now.toISOString();

    const trackingJson = JSON.stringify(orderObj.tracking || {});
    const timelineJson = JSON.stringify(orderObj.timeline || []);
    const rawJson = JSON.stringify(orderObj);

    await db
      .prepare(`
        UPDATE orders SET
          status = ?,
          updated_at = ?,
          tracking_json = ?,
          timeline_json = ?,
          raw_json = ?
        WHERE id = ?
      `)
      .bind(orderObj.status, orderObj.updatedAt, trackingJson, timelineJson, rawJson, orderId)
      .run();

    // Record in order_activity_logs audit trail
    try {
      const actionTitle = body.status ? `Status updated to ${body.status}` : "Order details modified";
      await db.prepare(`
        INSERT INTO order_activity_logs (order_id, admin_name, action, note, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(orderId, body.adminName || "Admin", actionTitle, body.note || (body.tracking && body.tracking.courier ? `Courier: ${body.tracking.courier} (#${body.tracking.trackingNumber})` : ""), now.toISOString()).run();
    } catch (e) {}

    return new Response(
      JSON.stringify({ success: true, order: orderObj }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to update order", details: err.message }),
      { status: 500, headers }
    );
  }
}
