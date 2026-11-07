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
  headers["Cache-Control"] = "no-cache, private, must-revalidate";
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
  const phoneParam = url.searchParams.get("phone");
  const queryParam = url.searchParams.get("query");
  const statusFilter = url.searchParams.get("status");
  const searchQuery = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

  try {
    // A. Single Order or Phone/Query Lookup (for live tracking or detail view)
    const lookupParam = (orderId || phoneParam || queryParam || "").trim();
    if (lookupParam) {
      const cleanId = lookupParam.replace(/^#/, "").trim();

      // 1. Try exact or uppercase Order ID match first
      let row = await db
        .prepare("SELECT raw_json FROM orders WHERE id = ? OR UPPER(id) = UPPER(?) OR id = ?")
        .bind(lookupParam, cleanId, cleanId.toUpperCase())
        .first();

      // 2. If not found by ID, check if lookupParam is a phone number (7+ digits)
      if (!row) {
        const digits = lookupParam.replace(/[^0-9]/g, "");
        if (digits.length >= 7) {
          const last10 = digits.slice(-10);
          const last9 = digits.slice(-9);
          const localFormat = "0" + last10;
          const intlFormat = "+92" + last10;
          const intlNoPlus = "92" + last10;

          const phoneResults = await db
            .prepare(`
              SELECT raw_json FROM orders 
              WHERE customer_phone = ? 
                 OR customer_phone = ? 
                 OR customer_phone = ? 
                 OR customer_phone = ? 
                 OR customer_phone LIKE ? 
                 OR customer_phone LIKE ? 
                 OR raw_json LIKE ? 
                 OR raw_json LIKE ?
              ORDER BY created_at DESC 
              LIMIT 5
            `)
            .bind(
              lookupParam,
              localFormat,
              intlFormat,
              intlNoPlus,
              `%${last10}%`,
              `%${last9}%`,
              `%"phone":"%${last10}%"`,
              `%${last10}%`
            )
            .all();

          if (phoneResults && phoneResults.results && phoneResults.results.length > 0) {
            try {
              const primaryOrder = JSON.parse(phoneResults.results[0].raw_json);
              if (phoneResults.results.length > 1) {
                primaryOrder.otherOrders = phoneResults.results.slice(1).map(r => {
                  try {
                    const o = JSON.parse(r.raw_json);
                    return {
                      id: o.id,
                      date: o.dateFormatted || o.createdAt,
                      status: o.status,
                      total: o.total,
                      itemCount: (o.items || []).length
                    };
                  } catch (e) {
                    return null;
                  }
                }).filter(Boolean);
              }
              return new Response(JSON.stringify(primaryOrder), { status: 200, headers });
            } catch (e) {
              row = phoneResults.results[0];
            }
          }
        }
      }

      // 3. If not found by phone, check if lookupParam is an email address
      if (!row && lookupParam.includes("@")) {
        row = await db
          .prepare("SELECT raw_json FROM orders WHERE customer_email = ? OR LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC LIMIT 1")
          .bind(lookupParam, lookupParam.toLowerCase())
          .first();
      }

      if (!row) {
        return new Response(
          JSON.stringify({ error: `Order #${lookupParam} not found` }),
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

    // Dispatch automated emails (both Admin alert + Customer confirmation receipt)
    try {
      await sendOrderEmails(order, env);
    } catch (emailErr) {
      console.warn("Order emails dispatch error:", emailErr);
    }

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

    if (body.cancelReason || body.cancellationReason) {
      const cReason = (body.cancelReason || body.cancellationReason).trim();
      orderObj.cancelReason = cReason;
      orderObj.cancellationReason = cReason;
    }

    if (body.shipping !== undefined) {
      orderObj.shipping = Number(body.shipping);
      if (orderObj.pricing) orderObj.pricing.shipping = Number(body.shipping);
      orderObj.total = Number(orderObj.subtotal || 0) + Number(body.shipping);
      if (orderObj.pricing) orderObj.pricing.total = orderObj.total;
    }

    if (body.total !== undefined) {
      orderObj.total = Number(body.total);
      if (orderObj.pricing) orderObj.pricing.total = Number(body.total);
    }

    if (body.tracking) {
      orderObj.tracking = { ...(orderObj.tracking || {}), ...body.tracking };
      if (body.status === "Dispatched") orderObj.tracking.dispatchedAt = now.toISOString();
      if (body.status === "Delivered") orderObj.tracking.deliveredAt = now.toISOString();
    }

    if (body.timeline && Array.isArray(body.timeline)) {
      orderObj.timeline = body.timeline;
    } else if (body.shipping !== undefined) {
      if (!orderObj.timeline) orderObj.timeline = [];
      orderObj.timeline.push({
        status: orderObj.status || "Pending",
        title: "Delivery Price Adjusted to FREE (Kohat)",
        time: timeFormatted,
        note: body.note || `Delivery fee adjusted to PKR ${orderObj.shipping} (Kohat Free Delivery applied). Total payable: PKR ${orderObj.total.toLocaleString()}.`
      });
    } else if (body.status || body.note || body.cancelReason) {
      if (!orderObj.timeline) orderObj.timeline = [];
      let eventTitle = `Status updated to ${orderObj.status}`;
      if (orderObj.status === "Approved") eventTitle = "Order Approved & Confirmed";
      else if (orderObj.status === "Processing") eventTitle = "Packed & Ready for Dispatch";
      else if (orderObj.status === "Dispatched") eventTitle = "Dispatched with Courier Partner";
      else if (orderObj.status === "Delivered") eventTitle = "Delivered to Customer";
      else if (orderObj.status === "Cancelled") eventTitle = "Order Cancelled";

      const eventNote = body.cancelReason 
        ? `Reason: ${body.cancelReason}`
        : (body.note || (body.tracking && body.tracking.courier ? `Courier: ${body.tracking.courier} (Tracking #${body.tracking.trackingNumber})` : `Order marked as ${orderObj.status}`));

      orderObj.timeline.push({
        status: orderObj.status,
        title: eventTitle,
        time: timeFormatted,
        note: eventNote
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
          shipping = ?,
          total = ?,
          updated_at = ?,
          tracking_json = ?,
          timeline_json = ?,
          raw_json = ?
        WHERE id = ?
      `)
      .bind(
        orderObj.status,
        Number(orderObj.shipping !== undefined ? orderObj.shipping : 0),
        Number(orderObj.total !== undefined ? orderObj.total : 0),
        orderObj.updatedAt,
        trackingJson,
        timelineJson,
        rawJson,
        orderId
      )
      .run();

    // Record in order_activity_logs audit trail
    try {
      const actionTitle = body.status ? `Status updated to ${body.status}` : "Order details modified";
      await db.prepare(`
        INSERT INTO order_activity_logs (order_id, admin_name, action, note, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(orderId, body.adminName || "Admin", actionTitle, body.note || (body.tracking && body.tracking.courier ? `Courier: ${body.tracking.courier} (#${body.tracking.trackingNumber})` : ""), now.toISOString()).run();
    } catch (e) {}

    // Dispatch status update email to customer whenever order status/tracking is modified
    try {
      if (body.status || body.cancelReason || body.tracking) {
        await sendOrderStatusUpdateEmail(orderObj, env);
      }
    } catch (emailErr) {
      console.warn("Failed sending order status update email:", emailErr);
    }

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

// =======================================================================
// AUTOMATED ORDER EMAILS (ADMIN NOTIFICATION + CUSTOMER RECEIPT)
// =======================================================================
async function sendOrderEmails(order, env) {
  const apiKey = (env && env.RESEND_API_KEY) || "";
  if (!apiKey) {
    console.warn("[Orders Email] RESEND_API_KEY not configured in Cloudflare environment variables.");
    return;
  }

  const targetAdminEmail = (env && env.ADMIN_EMAIL) || "msrfoods.official@gmail.com";
  const fromEmail = (env && env.EMAIL_FROM) || "MSR Foods <orders@msrfoodsofficial.food>";

  const cust = order.customer || {};
  const custName = cust.name || order.name || "Customer";
  const firstName = (custName || "Valued Customer").trim().split(" ")[0];
  const custPhone = cust.phone || order.phone || "Not provided";
  const custEmail = (cust.email || order.email || "").trim();
  const custAddress = cust.address || order.addr || "";
  const custCity = cust.city || order.city || "";
  const cleanPhone = String(custPhone).replace(/[^0-9]/g, "");
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : ('92' + cleanPhone.replace(/^0/, ''))}` : '';

  const subtotalNum = Number(order.subtotal || (order.pricing && order.pricing.subtotal) || 0);
  const shippingNum = Number(order.shipping || (order.pricing && order.pricing.shipping) || 0);
  const totalNum = Number(order.total || (order.pricing && order.pricing.total) || 0);
  const payMethodName = String(order.paymentMethod || order.pay || "Cash on Delivery").toUpperCase();

  const items = Array.isArray(order.items) ? order.items : [];

  // -------------------------------------------------------------------
  // 1. ADMIN NOTIFICATION EMAIL (Storefront Operations Alert)
  // -------------------------------------------------------------------
  try {
    const adminItemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
          <b style="color: #111;">${item.title || item.name}</b> ${item.weight ? `<span style="color:#d97706">(${item.weight})</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.qty || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">PKR ${Number(item.price || 0).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 700; color: #111;">
          PKR ${(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()}
        </td>
      </tr>
    `).join("");

    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <div style="background: #14100a; padding: 26px 24px; text-align: center; border-bottom: 3px solid #d6a736;">
          <h1 style="color: #f4d77f; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">MSR FOODS</h1>
          <p style="color: #ffffff; margin: 6px 0 0; font-size: 15px; font-weight: 500;">🔔 New Storefront Order Received!</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #fdfaf2; border: 1.5px solid #f4d77f; border-radius: 10px; padding: 16px 20px; margin-bottom: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 18px; font-weight: 800; color: #14100a;">Order #${order.id}</span>
              <span style="font-size: 14px; font-weight: 700; color: #b45309; text-transform: uppercase;">${payMethodName}</span>
            </div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT</div>
          </div>

          <h3 style="font-size: 14px; color: #374151; margin: 18px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Customer Delivery Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 22px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">Customer Name:</td><td style="padding: 6px 0; font-weight: 700; color: #111;">${custName}</td></tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Phone / WhatsApp:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #111;">
                <a href="tel:${custPhone}" style="color: #b45309; text-decoration: none;">${custPhone}</a>
                ${waUrl ? ` &nbsp;·&nbsp; <a href="${waUrl}" style="color: #25D366; text-decoration: none; font-weight: 600;" target="_blank">Open WhatsApp Chat →</a>` : ''}
              </td>
            </tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Email:</td><td style="padding: 6px 0; color: #111;">${custEmail || 'Not provided'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">City:</td><td style="padding: 6px 0; font-weight: 700; color: #111;">${custCity}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Full Address:</td><td style="padding: 6px 0; color: #111; line-height: 1.4;">${custAddress}</td></tr>
          </table>

          <h3 style="font-size: 14px; color: #374151; margin: 18px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f9fafb; color: #6b7280; text-align: left;">
                <th style="padding: 10px;">Product</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Unit Price</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${adminItemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px 10px 4px; text-align: right; color: #6b7280;">Subtotal:</td>
                <td style="padding: 10px 10px 4px; text-align: right; font-weight: 600;">PKR ${subtotalNum.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 4px 10px 10px; text-align: right; color: #6b7280;">Shipping Fee:</td>
                <td style="padding: 4px 10px 10px; text-align: right; font-weight: 600;">PKR ${shippingNum.toLocaleString()}</td>
              </tr>
              <tr style="font-size: 16px; border-top: 2px solid #14100a;">
                <td colspan="3" style="padding: 12px 10px; text-align: right; font-weight: 800; color: #14100a;">Grand Total:</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: 800; color: #b45309;">PKR ${totalNum.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 28px; text-align: center;">
            <a href="https://msrfoods-admin.pages.dev/#orders" style="background: #d6a736; color: #14100a; padding: 13px 30px; border-radius: 8px; font-weight: 800; text-decoration: none; font-size: 15px; display: inline-block;">
              Manage Order in Admin Portal →
            </a>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          MSR Foods Order Alert System · Pakistan
        </div>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetAdminEmail],
        reply_to: custEmail || targetAdminEmail,
        subject: `🔔 New Order #${order.id} (PKR ${totalNum.toLocaleString()}) - ${custName}`,
        html: adminEmailHtml
      })
    });
  } catch (errAdmin) {
    console.warn("Failed sending admin notification email:", errAdmin);
  }

  // -------------------------------------------------------------------
  // 2. CUSTOMER CONFIRMATION RECEIPT EMAIL ("Order Placed" Design Match)
  // -------------------------------------------------------------------
  if (custEmail && custEmail.includes("@")) {
    try {
      const customerReceiptRows = items.map(i => `
        <tr style="border-bottom: 1px solid #f1ece1;">
          <td style="padding: 12px 0; color: #14100a; font-size: 14.5px;">
            <strong style="color: #14100a;">${i.title || i.name}</strong>
            ${i.weight ? `<br><span style="color: #8c7647; font-size: 12.5px;">Size: ${i.weight}</span>` : ''}
          </td>
          <td style="padding: 12px 0; text-align: center; color: #6b7280; font-size: 14px;">× ${i.qty || 1}</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #14100a; font-size: 15px;">
            PKR ${(Number(i.price || 0) * Number(i.qty || 1)).toLocaleString()}
          </td>
        </tr>
      `).join("");

      const trackUrl = `https://msrfoodsofficial.food/#/track/${order.id}`;

      const customerEmailHtml = `
        <div style="background-color: #f6f3eb; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(27, 21, 12, 0.08); border: 1px solid #ebdcc4;">
            
            <!-- Brand Header -->
            <div style="background: #14100a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #d6a736;">
              <h1 style="color: #f4d77f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">MSR FOODS</h1>
              <p style="color: #d6a736; margin: 4px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Pure Taste · Natural Goodness</p>
            </div>

            <div style="padding: 32px 28px;">
              <!-- Celebration Header (Exact Match to Web Confirmation) -->
              <div style="text-align: center; margin-bottom: 26px;">
                <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #f7de8f, #d6a736); line-height: 56px; text-align: center; color: #14100a; font-size: 28px; font-weight: 900; margin-bottom: 12px; box-shadow: 0 6px 18px rgba(214, 167, 54, 0.35);">
                  ✓
                </div>
                <h2 style="font-size: 24px; color: #14100a; margin: 0 0 6px; font-weight: 800;">Thank you, ${firstName}!</h2>
                <p style="color: #6b6355; margin: 0; font-size: 15px;">Your order reference is <span style="background: #fdf6e2; border: 1px solid #d6a736; color: #946914; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-family: monospace;">#${order.id}</span></p>
              </div>

              <!-- Notice Box (Cash on Delivery) -->
              <div style="background: #fdfaf2; border-left: 4px solid #d6a736; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
                <div style="font-size: 15px; font-weight: 800; color: #14100a; margin-bottom: 4px;">Payment Method: Cash on Delivery (COD)</div>
                <p style="margin: 0 0 6px; font-size: 13.5px; color: #524737; line-height: 1.45;">Please keep the exact cash amount ready for the courier rider upon delivery at your doorstep.</p>
                <div style="font-size: 14.5px; color: #14100a;">Total Payable: <strong style="color: #b45309; font-size: 16px;">PKR ${totalNum.toLocaleString()}</strong></div>
              </div>

              <!-- Order Receipt Card (Exact Match to Web Receipt) -->
              <div style="border: 1px solid #ebdcc4; border-radius: 12px; padding: 22px; background: #faf8f3; margin-bottom: 28px;">
                <h3 style="margin: 0 0 14px; font-size: 17px; color: #14100a; font-weight: 800; border-bottom: 1px solid #e7dcce; padding-bottom: 10px;">Order Receipt</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
                  ${customerReceiptRows}
                </table>

                <div style="border-top: 1.5px solid #dfd2be; padding-top: 12px; font-size: 14px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; color: #6b6355;">Subtotal</td>
                      <td style="padding: 4px 0; text-align: right; color: #14100a; font-weight: 600;">PKR ${subtotalNum.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #6b6355;">Delivery Shipping</td>
                      <td style="padding: 4px 0; text-align: right;">${shippingNum === 0 ? '<strong style="color:#16a34a">FREE</strong>' : `PKR ${shippingNum.toLocaleString()}`}</td>
                    </tr>
                    <tr style="border-top: 2px solid #14100a;">
                      <td style="padding: 10px 0 0; font-size: 17px; font-weight: 800; color: #14100a;">Total</td>
                      <td style="padding: 10px 0 0; text-align: right; font-size: 17px; font-weight: 800; color: #b45309;">PKR ${totalNum.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>

                <div style="border-top: 1px solid #e7dcce; margin-top: 18px; padding-top: 14px; font-size: 13.5px; color: #524737; line-height: 1.5;">
                  <strong style="color: #14100a;">Delivery Details:</strong><br>
                  ${custName} · ${custPhone}<br>
                  ${custAddress}, ${custCity}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${trackUrl}" style="background: linear-gradient(135deg, #f7de8f, #d6a736); color: #14100a; padding: 14px 34px; border-radius: 99px; font-weight: 800; text-decoration: none; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(214, 167, 54, 0.4);">
                  Track Your Order Online →
                </a>
              </div>

              <!-- Reassurance / WhatsApp Help -->
              <div style="background: #ffffff; border: 1px dashed #d6a736; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #6b6355;">
                Need help or wish to change your delivery address? Reply to this email or WhatsApp us anytime at 
                <a href="https://wa.me/923159935600" style="color: #25D366; font-weight: 700; text-decoration: none;">+92 315 9935600</a>.
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #14100a; padding: 20px; text-align: center; color: #9c8e76; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 4px; color: #e5ded2; font-weight: 600;">MSR Foods · Kohat, Pakistan</p>
              <p style="margin: 0;">100% Pure Natural Honey & Premium Dry Fruits Blend.</p>
            </div>
          </div>
        </div>
      `;

      const custRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: [custEmail],
          reply_to: targetAdminEmail,
          subject: `🎉 Order Confirmed! Reference #${order.id} - MSR Foods`,
          html: customerEmailHtml
        })
      });

      if (!custRes.ok && custEmail.toLowerCase() !== targetAdminEmail.toLowerCase()) {
        const errJson = await custRes.json().catch(() => ({}));
        if (custRes.status === 403 || errJson.statusCode === 403) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromEmail,
              to: [targetAdminEmail],
              subject: `[Customer Copy for ${custEmail}] 🎉 Order Confirmed! #${order.id}`,
              html: `
                <div style="background:#fff3cd;border:1.5px solid #ffeeba;color:#856404;padding:14px 18px;border-radius:10px;margin:16px auto;max-width:600px;font-family:sans-serif;font-size:13.5px;line-height:1.5;">
                  ⚠️ <b>Resend Sandbox Notice:</b> The free testing sender (<code>onboarding@resend.dev</code>) only delivers to your account email (<code>${targetAdminEmail}</code>).
                  <br><br>
                  <b>To deliver directly to customers (${custEmail}):</b>
                  <ol style="margin:6px 0 0;padding-left:20px;">
                    <li>Add your domain <code>msrfoodsofficial.food</code> at <b>resend.com/domains</b></li>
                    <li>Add the 3 DNS records in Cloudflare DNS</li>
                    <li>Set <code>EMAIL_FROM=orders@msrfoodsofficial.food</code></li>
                  </ol>
                  <p style="margin:8px 0 0;font-weight:600;">Below is the exact email your customer will receive:</p>
                </div>
                ${customerEmailHtml}
              `
            })
          });
        }
      }
    } catch (errCust) {
      console.warn("Failed sending customer confirmation email:", errCust);
    }
  }
}

// =======================================================================
// 5. AUTOMATED ORDER STATUS UPDATE EMAIL (SENT TO CUSTOMER ON STATUS CHANGE)
// =======================================================================
async function sendOrderStatusUpdateEmail(order, env) {
  const apiKey = (env && env.RESEND_API_KEY) || "";
  if (!apiKey) {
    console.warn("[Orders Email] RESEND_API_KEY not configured in Cloudflare environment variables.");
    return;
  }

  const targetAdminEmail = (env && env.ADMIN_EMAIL) || "msrfoods.official@gmail.com";
  const fromEmail = (env && env.EMAIL_FROM) || "MSR Foods <orders@msrfoodsofficial.food>";

  const cust = order.customer || {};
  const custName = cust.name || order.name || "Valued Customer";
  const firstName = (custName || "Valued Customer").trim().split(" ")[0];
  const custPhone = cust.phone || order.phone || "";
  const custEmail = (cust.email || order.email || "").trim();
  const custAddress = cust.address || order.addr || "";
  const custCity = cust.city || order.city || "";

  if (!custEmail || !custEmail.includes("@")) {
    console.log(`[Status Email] Skipping email for order #${order.id} - no customer email address provided.`);
    return;
  }

  const status = (order.status || "Pending").trim();
  const statusLower = status.toLowerCase();
  const tracking = order.tracking || {};
  const cancelReason = order.cancelReason || order.cancellationReason || "";
  const trackUrl = `https://msrfoodsofficial.food/#/track/${encodeURIComponent(order.id)}`;
  const totalNum = Number(order.total || (order.pricing && order.pricing.total) || 0);
  const subtotalNum = Number(order.subtotal || (order.pricing && order.pricing.subtotal) || 0);
  const shippingNum = Number(order.shipping !== undefined ? order.shipping : (order.pricing ? order.pricing.shipping : 0));
  const items = Array.isArray(order.items) ? order.items : [];

  // Determine email visual badge and message per status
  let statusBadgeBg = "#d6a736";
  let statusBadgeText = "#14100a";
  let statusHeadline = `Order #${order.id} Status Updated`;
  let statusMessage = `Your order #${order.id} status has been updated to <strong>${status}</strong>.`;
  let subject = `Order #${order.id} Status: ${status} — MSR Foods`;

  if (statusLower === "approved") {
    statusBadgeBg = "#059669";
    statusBadgeText = "#ffffff";
    subject = `✓ Order #${order.id} Approved & Confirmed — MSR Foods`;
    statusHeadline = `Your Order Has Been Approved & Confirmed!`;
    statusMessage = `Hello ${firstName}, your order #${order.id} has been verified and confirmed by our fulfillment team. Our kitchen team is now preparing and packing your fresh artisanal honey and dry fruits.`;
  } else if (statusLower === "processing") {
    statusBadgeBg = "#d97706";
    statusBadgeText = "#ffffff";
    subject = `⚙️ Order #${order.id} Packed & Sealed — MSR Foods`;
    statusHeadline = `Your Order is Packed & Quality Sealed`;
    statusMessage = `Hello ${firstName}, your order #${order.id} has been freshly packed with double tamper-evident seal protection and is awaiting courier handover.`;
  } else if (statusLower === "dispatched") {
    statusBadgeBg = "#2563eb";
    statusBadgeText = "#ffffff";
    subject = `🚚 Order #${order.id} Dispatched${tracking.courier ? ' with ' + tracking.courier : ''} — MSR Foods`;
    statusHeadline = `Your Package Has Been Dispatched!`;
    statusMessage = `Exciting news, ${firstName}! Your order #${order.id} has been handed over to ${tracking.courier ? '<strong>' + tracking.courier + '</strong>' : 'our courier partner'} and is now on its way to your doorstep.`;
  } else if (statusLower === "delivered") {
    statusBadgeBg = "#10b981";
    statusBadgeText = "#ffffff";
    subject = `🎉 Order #${order.id} Delivered Successfully — MSR Foods`;
    statusHeadline = `Your Package Has Been Delivered!`;
    statusMessage = `Hello ${firstName}, your order #${order.id} has been marked as delivered. We hope you and your family enjoy the rich, wholesome taste of 100% pure MSR mountain honey & roasted nuts!`;
  } else if (statusLower === "cancelled") {
    statusBadgeBg = "#dc2626";
    statusBadgeText = "#ffffff";
    subject = `⚠️ Notice Regarding Order #${order.id} (Cancelled) — MSR Foods`;
    statusHeadline = `Order #${order.id} Has Been Cancelled`;
    statusMessage = `Hello ${firstName}, we are writing to notify you that your order #${order.id} has been cancelled.`;
  }

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f1ece1;">
      <td style="padding: 10px 0; color: #14100a; font-size: 14px;">
        <b>${item.title || item.name}</b> ${item.weight ? `<span style="color:#d97706; font-size:12.5px;">(${item.weight})</span>` : ''}
        <div style="color: #6b6355; font-size: 12.5px;">Qty: ${item.qty || 1} × PKR ${Number(item.price || 0).toLocaleString()}</div>
      </td>
      <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #14100a; font-size: 14.5px;">
        PKR ${(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()}
      </td>
    </tr>
  `).join("");

  const emailHtml = `
    <div style="background-color: #0b0906; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px 12px; min-height: 100%;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header Banner -->
        <div style="background: #14100a; padding: 28px 24px 24px; text-align: center; border-bottom: 3px solid #d6a736;">
          <h1 style="color: #f4d77f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">MSR FOODS</h1>
          <p style="color: #ffffff; margin: 6px 0 0; font-size: 13.5px; letter-spacing: 1px; text-transform: uppercase;">Quality Built For You</p>
        </div>

        <div style="padding: 28px 24px;">
          <!-- Status Pill -->
          <div style="text-align: center; margin-bottom: 18px;">
            <span style="background: ${statusBadgeBg}; color: ${statusBadgeText}; padding: 6px 18px; border-radius: 99px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">
              ● ${status}
            </span>
          </div>

          <h2 style="font-size: 22px; color: #14100a; margin: 0 0 10px; text-align: center; font-weight: 800;">
            ${statusHeadline}
          </h2>

          <p style="font-size: 14.5px; color: #4b5563; line-height: 1.6; margin: 0 0 20px; text-align: center;">
            ${statusMessage}
          </p>

          ${statusLower === "cancelled" ? `
            <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
              <b style="color: #991b1b; font-size: 13px; display: block; margin-bottom: 4px; text-transform: uppercase;">Reason for Cancellation:</b>
              <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.5;">
                ${cancelReason || 'Cancelled upon customer request or by store operations team.'}
              </p>
            </div>
          ` : ''}

          ${(statusLower === "dispatched" && tracking.trackingNumber) ? `
            <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 12px; text-transform: uppercase; color: #1e40af; font-weight: 700; letter-spacing: 0.5px;">Consignment Details</div>
              <div style="font-size: 17px; font-weight: 800; color: #1e3a8a; margin: 4px 0;">🚚 ${tracking.courier || 'Express Courier'}</div>
              <div style="font-size: 13.5px; color: #374151;">Tracking ID: <code style="font-family: monospace; font-size: 15px; font-weight: 700; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; color: #1e40af;">${tracking.trackingNumber}</code></div>
            </div>
          ` : ''}

          <!-- Live Tracking CTA -->
          <div style="text-align: center; margin-bottom: 26px;">
            <a href="${trackUrl}" style="background: linear-gradient(135deg, #f7de8f, #d6a736); color: #14100a; padding: 14px 34px; border-radius: 99px; font-weight: 800; text-decoration: none; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(214, 167, 54, 0.4);">
              ${statusLower === "cancelled" ? "View Order Status Online →" : "View Live Order Tracking →"}
            </a>
          </div>

          <!-- Order Summary Card -->
          <div style="border: 1px solid #ebdcc4; border-radius: 12px; padding: 20px; background: #faf8f3; margin-bottom: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 1px solid #e7dcce; padding-bottom: 8px;">
              <h3 style="margin: 0; font-size: 15px; color: #14100a; font-weight: 800; text-transform: uppercase;">Order Summary</h3>
              <span style="font-size: 13px; color: #946914; font-weight: 700;">#${order.id}</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              ${itemsHtml}
            </table>

            <div style="border-top: 1.5px solid #dfd2be; padding-top: 10px; font-size: 13.5px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 3px 0; color: #6b6355;">Subtotal</td>
                  <td style="padding: 3px 0; text-align: right; color: #14100a; font-weight: 600;">PKR ${subtotalNum.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #6b6355;">Delivery Shipping</td>
                  <td style="padding: 3px 0; text-align: right;">${shippingNum === 0 ? '<strong style="color:#16a34a">FREE</strong>' : `PKR ${shippingNum.toLocaleString()}`}</td>
                </tr>
                <tr style="border-top: 1.5px solid #14100a;">
                  <td style="padding: 8px 0 0; font-size: 16px; font-weight: 800; color: #14100a;">Total Payable:</td>
                  <td style="padding: 8px 0 0; text-align: right; font-size: 16px; font-weight: 800; color: #b45309;">PKR ${totalNum.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            ${custAddress ? `
              <div style="border-top: 1px solid #e7dcce; margin-top: 14px; padding-top: 10px; font-size: 13px; color: #524737; line-height: 1.45;">
                <strong style="color: #14100a;">Destination:</strong> ${custName} · ${custPhone}<br>${custAddress}, ${custCity}
              </div>
            ` : ''}
          </div>

          <!-- Reassurance / WhatsApp Contact -->
          <div style="background: #ffffff; border: 1px dashed #d6a736; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #6b6355;">
            Have questions about this update? Reply directly to this email or chat with us on WhatsApp at 
            <a href="https://wa.me/923159935600" style="color: #25D366; font-weight: 700; text-decoration: none;">+92 315 9935600</a>.
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #14100a; padding: 20px; text-align: center; color: #9c8e76; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0 0 4px; color: #e5ded2; font-weight: 600;">MSR Foods · Kohat, Pakistan</p>
          <p style="margin: 0;">100% Pure Natural Mountain Honey & Artisanal Dry Fruits.</p>
        </div>
      </div>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromEmail,
      to: [custEmail],
      reply_to: targetAdminEmail,
      subject,
      html: emailHtml
    })
  });
}
