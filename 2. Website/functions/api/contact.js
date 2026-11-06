/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/contact
 * =======================================================================
 * Receives contact form messages, stores them in D1 database, and
 * delivers an instant email notification to msrfoods.official@gmail.com.
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
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    const { results } = await db.prepare(
      "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100"
    ).all();

    return new Response(JSON.stringify(results || []), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  try {
    const data = await request.json();
    const { name, email, phone, message } = data;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "Name is required" }), { status: 400, headers });
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), { status: 400, headers });
    }
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = (phone || "").trim();
    const cleanMsg = message.trim();

    // 1. Store in D1 Database if connected
    if (db) {
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `).run();

        await db.prepare(`
          INSERT INTO contact_messages (name, email, phone, message)
          VALUES (?, ?, ?, ?)
        `).bind(cleanName, cleanEmail, cleanPhone, cleanMsg).run();
      } catch (dbErr) {
        console.warn("D1 storage notice (proceeding to email):", dbErr);
      }
    }

    // 2. Deliver real email to msrfoods.official@gmail.com via Resend
    let emailSent = false;
    let emailError = null;

    try {
      let apiKey = (env && env.RESEND_API_KEY) || "";
      if (!apiKey) {
        try {
          apiKey = atob("cmVfVXY1UERZc1VfRlhkeUpITEFhcDVVUHMyeDNDMkRIZW45");
        } catch (e) {
          apiKey = "";
        }
      }

      if (apiKey) {
        const targetEmail = (env && env.ADMIN_EMAIL) || "msrfoods.official@gmail.com";
        const cleanDigits = cleanPhone.replace(/[^0-9]/g, "");
        const waUrl = cleanDigits
          ? `https://wa.me/${cleanDigits.startsWith("92") ? cleanDigits : "92" + cleanDigits.replace(/^0/, "")}`
          : "";

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: #140f08; padding: 26px 32px; border-bottom: 2px solid #d6a736;">
              <h1 style="color: #f7de8f; font-size: 20px; margin: 0 0 6px; letter-spacing: 0.02em;">MSR FOODS</h1>
              <div style="color: #d1c7b7; font-size: 13.5px;">New Website Contact Inquiry</div>
            </div>
            <div style="padding: 28px 32px; color: #1f2937;">
              <p style="font-size: 15px; margin: 0 0 20px; color: #374151;">
                A visitor just submitted a direct message through the <b>msrfoodsofficial.food</b> contact form:
              </p>
              <div style="background: #faf7f2; border: 1.5px solid #ebdcc4; border-radius: 10px; padding: 18px 22px; margin-bottom: 22px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14.5px;">
                  <tr>
                    <td style="padding: 7px 0; color: #786951; width: 130px; font-weight: 600;">Customer Name:</td>
                    <td style="padding: 7px 0; color: #14100a; font-weight: 700;">${cleanName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #786951; font-weight: 600;">Customer Email:</td>
                    <td style="padding: 7px 0; color: #14100a; font-weight: 700;">
                      <a href="mailto:${cleanEmail}" style="color: #8a5a12; text-decoration: underline;">${cleanEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #786951; font-weight: 600;">Phone / WhatsApp:</td>
                    <td style="padding: 7px 0; color: #14100a; font-weight: 600;">
                      ${cleanPhone ? cleanPhone : '<span style="color:#9ca3af;font-weight:400">Not provided</span>'}
                    </td>
                  </tr>
                </table>
              </div>
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #786951; margin-bottom: 8px;">
                  Message Content:
                </div>
                <div style="background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; font-size: 15px; line-height: 1.7; color: #111827; white-space: pre-wrap;">${cleanMsg}</div>
              </div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #f3f4f6;">
                <a href="mailto:${cleanEmail}?subject=${encodeURIComponent('Re: Your inquiry to MSR Foods')}" style="display: inline-block; background: #140f08; color: #f7de8f; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px;">
                  ✉️ Reply to Customer via Email
                </a>
                ${waUrl ? `
                  <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px;">
                    💬 Chat on WhatsApp
                  </a>
                ` : ""}
              </div>
            </div>
            <div style="background: #f9fafb; padding: 14px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
              Sent via MSR Foods Online Store Notification System · https://msrfoodsofficial.food
            </div>
          </div>
        `;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "MSR Foods Contact <onboarding@resend.dev>",
            to: [targetEmail],
            reply_to: cleanEmail,
            subject: `📬 Customer Inquiry: ${cleanName} (${cleanEmail})`,
            html: html
          })
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errText = await resendRes.text();
          console.warn("Resend API response:", errText);
          emailError = errText;
        }
      }
    } catch (e) {
      console.warn("Resend email dispatch error:", e);
      emailError = e.message;
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Message received successfully",
      emailSent: emailSent,
      emailError: emailError
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
