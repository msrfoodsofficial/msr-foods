/**
 * =======================================================================
 * CLOUDFLARE PAGES FUNCTION — /api/auth
 * =======================================================================
 * Secure Database Authentication for Store Administrators.
 * Backed by Cloudflare D1 'admins' and 'admin_sessions' tables.
 * =======================================================================
 */

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Session-Token",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

function getDatabase(env) {
  return env.DB || env.ORDERS_DB || env.DATABASE || null;
}

async function hashPassword(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

// -----------------------------------------------------------------------
// GET /api/auth — Verify Session
// -----------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ authenticated: false, error: "Database not configured" }), { status: 200, headers });
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "") || request.headers.get("X-Session-Token") || new URL(request.url).searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers });
  }

  try {
    const session = await db
      .prepare(`
        SELECT s.token, s.expires_at, a.id, a.username, a.name, a.email, a.role
        FROM admin_sessions s
        JOIN admins a ON s.admin_id = a.id
        WHERE s.token = ? AND a.is_active = 1
      `)
      .bind(token)
      .first();

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ authenticated: false, error: "Session expired or invalid" }), { status: 200, headers });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      admin: {
        id: session.id,
        username: session.username,
        name: session.name,
        email: session.email,
        role: session.role
      }
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ authenticated: false, error: err.message }), { status: 500, headers });
  }
}

// -----------------------------------------------------------------------
// POST /api/auth — Login / Change Password / Logout
// -----------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const db = getDatabase(env);

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database not bound" }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const action = body.action || "login";

    // A. LOGIN ACTION
    if (action === "login") {
      const username = (body.username || "").trim().toLowerCase();
      const password = (body.password || "").trim();

      if (!username || !password) {
        return new Response(JSON.stringify({ success: false, error: "Username and password required" }), { status: 400, headers });
      }

      const inputHash = await hashPassword(password);

      // Query admin from D1
      const admin = await db
        .prepare("SELECT * FROM admins WHERE LOWER(username) = ? AND is_active = 1")
        .bind(username)
        .first();

      if (!admin || admin.password_hash !== inputHash) {
        return new Response(JSON.stringify({ success: false, error: "Invalid username or password" }), { status: 401, headers });
      }

      // Generate Session Token
      const token = "adm_" + crypto.randomUUID().replace(/-/g, "");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 Days

      // Record session in D1
      await db
        .prepare("INSERT INTO admin_sessions (token, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
        .bind(token, admin.id, now.toISOString(), expiresAt)
        .run();

      // Update last login timestamp
      await db
        .prepare("UPDATE admins SET last_login_at = ? WHERE id = ?")
        .bind(now.toISOString(), admin.id)
        .run();

      return new Response(JSON.stringify({
        success: true,
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }), { status: 200, headers });
    }

    // B. LOGOUT ACTION
    if (action === "logout") {
      const token = body.token || request.headers.get("X-Session-Token");
      if (token) {
        await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // C. CHANGE PASSWORD ACTION
    if (action === "change_password") {
      const { username, currentPassword, newPassword } = body;
      if (!username || !currentPassword || !newPassword) {
        return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400, headers });
      }

      const currentHash = await hashPassword(currentPassword);
      const admin = await db
        .prepare("SELECT * FROM admins WHERE LOWER(username) = ? AND is_active = 1")
        .bind(username.toLowerCase())
        .first();

      if (!admin || admin.password_hash !== currentHash) {
        return new Response(JSON.stringify({ success: false, error: "Current password does not match" }), { status: 403, headers });
      }

      const newHash = await hashPassword(newPassword);
      await db
        .prepare("UPDATE admins SET password_hash = ? WHERE id = ?")
        .bind(newHash, admin.id)
        .run();

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
  }
}
