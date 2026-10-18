/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/orders/[id]
 * =======================================================================
 * Handles operations for a specific order by ID (Tracking & Updates)
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PATCH, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

function getDatabase(env) {
  return env.DB || env.ORDERS_DB || env.DATABASE || null;
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

export async function onRequestGet(context) {
  const { request, params, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);
  const orderId = params.id;

  if (!db) {
    return new Response(
      JSON.stringify({ error: "D1 database binding missing" }),
      { status: 500, headers }
    );
  }

  try {
    const row = await db
      .prepare("SELECT raw_json FROM orders WHERE id = ?")
      .bind(orderId)
      .first();

    if (!row) {
      return new Response(
        JSON.stringify({ error: `Order #${orderId} not found` }),
        { status: 404, headers }
      );
    }

    return new Response(row.raw_json, { status: 200, headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch order", details: err.message }),
      { status: 500, headers }
    );
  }
}

export async function onRequestPatch(context) {
  const { request, params, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);
  const orderId = params.id;

  if (!db) {
    return new Response(
      JSON.stringify({ error: "D1 database binding missing" }),
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
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
