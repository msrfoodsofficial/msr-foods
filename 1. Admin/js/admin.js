/**
 * =======================================================================
 * ADMIN PORTAL CONTROLLER & DATA MANAGEMENT
 * =======================================================================
 */

const ICON = {
  phone: '<svg class="i" style="width:14px;height:14px;display:inline" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  x: '<svg class="i" style="width:18px;height:18px" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  check: '<svg class="i" style="width:16px;height:16px" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
};

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = `<span>${msg}</span>`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

// ==========================================================================
// Admin Authentication & Session Management
// ==========================================================================
const AUTH_STORAGE_KEY = "msr_admin_session_auth";

function isAdminAuthenticated() {
  const sessionToken = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
  return !!sessionToken;
}

function checkAdminAuth() {
  const authScreen = document.getElementById("adminAuthScreen");
  const appContainer = document.getElementById("adminAppContainer");

  if (isAdminAuthenticated()) {
    document.documentElement.classList.remove("admin-logged-out");
    document.documentElement.classList.add("admin-logged-in");
    if (authScreen) authScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";
    return true;
  } else {
    document.documentElement.classList.remove("admin-logged-in");
    document.documentElement.classList.add("admin-logged-out");
    if (authScreen) authScreen.style.display = "flex";
    if (appContainer) appContainer.style.display = "none";
    const uInput = document.getElementById("loginUsername");
    if (uInput) setTimeout(() => uInput.focus(), 150);
    return false;
  }
}

async function handleAdminSignIn(e) {
  if (e && e.preventDefault) e.preventDefault();
  const uInput = document.getElementById("loginUsername");
  const pInput = document.getElementById("loginPassword");
  const rememberCheckbox = document.getElementById("rememberMe");
  const errBox = document.getElementById("authErrorMsg");
  const submitBtn = e && e.target ? (e.target.querySelector('button[type="submit"]') || e.target) : null;

  const username = (uInput ? uInput.value : "").trim().toLowerCase();
  const password = (pInput ? pInput.value : "").trim();

  if (!username || !password) {
    if (errBox) {
      errBox.textContent = "Please enter both username and password.";
      errBox.style.display = "block";
    }
    return;
  }

  if (submitBtn && submitBtn.tagName === "BUTTON") {
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying with Database...";
  }

  // 1. Database Authentication via Cloudflare D1 (/api/auth)
  try {
    const authEndpoint = (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl)
      ? window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/auth"
      : "/api/auth";

    const res = await fetch(authEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.token) {
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem(AUTH_STORAGE_KEY, data.token);
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, data.token);
        }
        if (data.admin) {
          sessionStorage.setItem("admin_profile", JSON.stringify(data.admin));
        }

        if (errBox) errBox.style.display = "none";
        document.documentElement.classList.remove("admin-logged-out");
        document.documentElement.classList.add("admin-logged-in");

        const authScreen = document.getElementById("adminAuthScreen");
        const appContainer = document.getElementById("adminAppContainer");
        if (authScreen) authScreen.style.display = "none";
        if (appContainer) appContainer.style.display = "flex";

        toast(`Welcome back, ${data.admin ? data.admin.name : "Merchant Admin"}!`);
        initAdmin();
        return;
      }
    }
  } catch (err) {
    console.warn("D1 Auth API unreachable, checking local credentials fallback:", err);
  } finally {
    if (submitBtn && submitBtn.tagName === "BUTTON") {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In to Admin Portal →";
    }
  }

  // 2. Offline / Local Fallback
  const cfg = (window.BRAND_CONFIG && window.BRAND_CONFIG.auth) || {};
  const validUser = (cfg.username || "admin").toLowerCase();
  const validPass = cfg.password || "password123";
  const fallbacks = (cfg.fallbackPasswords || []).concat(["msr2026", "admin123", "password123", "admin"]);

  const userMatches = username === validUser || username === "msr" || username === "admin" || username === "msrfoods";
  const passMatches = password === validPass || fallbacks.includes(password);

  if (userMatches && passMatches) {
    if (errBox) errBox.style.display = "none";
    const token = "auth_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, token);
    }

    document.documentElement.classList.remove("admin-logged-out");
    document.documentElement.classList.add("admin-logged-in");

    const authScreen = document.getElementById("adminAuthScreen");
    const appContainer = document.getElementById("adminAppContainer");
    if (authScreen) authScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";

    toast("Welcome back, Merchant Admin!");
    initAdmin();
  } else {
    if (errBox) {
      errBox.textContent = "Invalid username or password. Default: admin / msr2026";
      errBox.style.display = "block";
    }
    if (pInput) {
      pInput.value = "";
      pInput.focus();
    }
  }
}

function togglePasswordVisibility() {
  const p = document.getElementById("loginPassword");
  if (!p) return;
  p.type = p.type === "password" ? "text" : "password";
}

function fillDemoCredentials() {
  const u = document.getElementById("loginUsername");
  const p = document.getElementById("loginPassword");
  if (u) u.value = "admin";
  if (p) p.value = "msr2026";
  const errBox = document.getElementById("authErrorMsg");
  if (errBox) errBox.style.display = "none";
}

function adminSignOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  
  document.documentElement.classList.remove("admin-logged-in");
  document.documentElement.classList.add("admin-logged-out");

  const authScreen = document.getElementById("adminAuthScreen");
  const appContainer = document.getElementById("adminAppContainer");
  if (appContainer) appContainer.style.display = "none";
  if (authScreen) authScreen.style.display = "flex";

  const pInput = document.getElementById("loginPassword");
  if (pInput) pInput.value = "";
  const errBox = document.getElementById("authErrorMsg");
  if (errBox) errBox.style.display = "none";

  try {
    history.replaceState(null, "", window.location.pathname);
  } catch (e) {}

  toast("Signed out successfully.");
}

async function handleAdminPasswordChange() {
  const username = ($("#changeUsername") ? $("#changeUsername").value : "admin").trim();
  const currentPassword = $("#currentAdminPass") ? $("#currentAdminPass").value : "";
  const newPassword = $("#newAdminPass") ? $("#newAdminPass").value : "";
  const msgEl = $("#passChangeMsg");

  if (!currentPassword || !newPassword) {
    if (msgEl) {
      msgEl.style.color = "#ef4444";
      msgEl.textContent = "Please fill in all password fields.";
    }
    return;
  }

  if (newPassword.length < 6) {
    if (msgEl) {
      msgEl.style.color = "#ef4444";
      msgEl.textContent = "New password must be at least 6 characters.";
    }
    return;
  }

  if (msgEl) {
    msgEl.style.color = "var(--gold-hi)";
    msgEl.textContent = "Updating password in database...";
  }

  try {
    const authEndpoint = (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl)
      ? window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/auth"
      : "/api/auth";

    const res = await fetch(authEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change_password",
        username,
        currentPassword,
        newPassword
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (msgEl) {
        msgEl.style.color = "#34d399";
        msgEl.textContent = "✅ Password successfully updated in Cloudflare D1!";
      }
      toast("Admin password updated successfully in database!");
      if ($("#currentAdminPass")) $("#currentAdminPass").value = "";
      if ($("#newAdminPass")) $("#newAdminPass").value = "";
    } else {
      if (msgEl) {
        msgEl.style.color = "#ef4444";
        msgEl.textContent = "❌ " + (data.error || "Failed to update password");
      }
    }
  } catch (err) {
    if (msgEl) {
      msgEl.style.color = "#ef4444";
      msgEl.textContent = "❌ Network error updating password";
    }
  }
}

window.handleAdminPasswordChange = handleAdminPasswordChange;
window.handleAdminSignIn = handleAdminSignIn;
window.togglePasswordVisibility = togglePasswordVisibility;
window.fillDemoCredentials = fillDemoCredentials;
window.adminSignOut = adminSignOut;
window.checkAdminAuth = checkAdminAuth;

// ==========================================================================
// Live Order Synchronization with Storefront & Server
// ==========================================================================
async function syncRemoteOrders() {
  if (!isAdminAuthenticated()) return;
  try {
    const endpoint = (typeof getOrdersApiEndpoint === "function")
      ? getOrdersApiEndpoint()
      : "/api/orders";

    const res = await fetch(endpoint);
    if (res.ok) {
      const serverOrders = await res.json();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        let localOrders = Store.get("app_orders") || [];

        // If real orders are coming in from D1, remove dummy demo orders
        const demoOrderIds = new Set(["MSR-261014-9124", "MSR-261013-8412", "MSR-261012-7319", "MSR-261010-5201"]);
        const hasRealServerOrders = serverOrders.some(so => !demoOrderIds.has(so.id));
        if (hasRealServerOrders) {
          localOrders = localOrders.filter(lo => !demoOrderIds.has(lo.id));
        }

        const localMap = new Map(localOrders.map(o => [o.id, o]));
        let hasNew = false;
        let hasChanged = false;

        serverOrders.forEach(so => {
          if (!localMap.has(so.id)) {
            hasNew = true;
            localMap.set(so.id, so);
          } else {
            const current = localMap.get(so.id);
            if (current.status !== so.status || (so.updatedAt && current.updatedAt !== so.updatedAt)) {
              hasChanged = true;
              localMap.set(so.id, so);
            }
          }
        });

        if (hasNew || hasChanged) {
          const merged = Array.from(localMap.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          Store.set("app_orders", merged);
          renderDashboard();
          if (typeof renderOrdersTable === "function") renderOrdersTable();

          if (hasNew) {
            toast("🔔 New live order received from website!");
            try {
              // Pleasant chime sound for new live orders
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
              gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {
    // Local / Offline fallback: Already read from localStorage
  }
}

// Seed initial orders if empty so dashboard is active immediately
function seedDefaultOrders() {
  const existing = Store.get("app_orders");
  if (!existing || existing.length === 0) {
    const demoOrders = [
      {
        id: "MSR-261014-9124",
        createdAt: "2026-10-14T11:42:00Z",
        status: "Pending",
        items: [{ id: "msr-500", name: "MSR Honey Nut Mix", weight: "500g", qty: 2, price: 1599 }],
        subtotal: 3198,
        shipping: 200,
        total: 3398,
        paymentMethod: "cod",
        customer: {
          name: "Muhammad Usman",
          phone: "03001234567",
          email: "usman.pk@gmail.com",
          address: "House 14-B, Street 5, F-7/2",
          city: "Islamabad",
          province: "Islamabad Capital Territory",
          zip: "44000",
          notes: "Please call before arrival"
        }
      },
      {
        id: "MSR-261013-8412",
        createdAt: "2026-10-13T16:15:00Z",
        status: "Processing",
        items: [{ id: "msr-1kg", name: "MSR Honey Nut Mix", weight: "1kg (1000g)", qty: 1, price: 2999 }],
        subtotal: 2999,
        shipping: 200,
        total: 3199,
        paymentMethod: "easypaisa",
        customer: {
          name: "Dr. Ayesha Tariq",
          phone: "03335558899",
          email: "ayesha.t@outlook.com",
          address: "Apartment 402, Royal Heights, Gulberg III",
          city: "Lahore",
          province: "Punjab",
          zip: "54000",
          notes: "Hand over to building security if not home"
        }
      },
      {
        id: "MSR-261012-7319",
        createdAt: "2026-10-12T10:05:00Z",
        status: "Shipped",
        items: [
          { id: "msr-500", name: "MSR Honey Nut Mix", weight: "500g", qty: 1, price: 1599 },
          { id: "msr-1kg", name: "MSR Honey Nut Mix", weight: "1kg (1000g)", qty: 1, price: 2999 }
        ],
        subtotal: 4598,
        shipping: 200,
        total: 4798,
        paymentMethod: "bank",
        customer: {
          name: "Hamza Shafiq",
          phone: "03214447788",
          email: "hamza.s@yahoo.com",
          address: "B-24, Phase 6, DHA",
          city: "Karachi",
          province: "Sindh",
          zip: "75500",
          notes: "TCS tracking # 771829031"
        }
      },
      {
        id: "MSR-261010-5201",
        createdAt: "2026-10-10T14:30:00Z",
        status: "Delivered",
        items: [{ id: "msr-500", name: "MSR Honey Nut Mix", weight: "500g", qty: 3, price: 1599 }],
        subtotal: 4797,
        shipping: 200,
        total: 4997,
        paymentMethod: "jazzcash",
        customer: {
          name: "Sarmad Ali",
          phone: "03459992211",
          email: "sarmad.ali@gmail.com",
          address: "Sector B-1, Hayatabad",
          city: "Peshawar",
          province: "KPK",
          zip: "25000",
          notes: "Satisfied customer - reorder"
        }
      }
    ];
    Store.set("app_orders", demoOrders);
  }
}

// Current Filter State
let currentOrderFilter = "all";

// Tab Navigation
function switchTab(tabId) {
  if (!isAdminAuthenticated()) {
    checkAdminAuth();
    return;
  }

  const navItems = $$(".sidebar-nav .nav-item");
  const panels = $$(".tab-panel");
  const titleEl = $("#topbarTitle");

  navItems.forEach(n => n.classList.toggle("active", n.dataset.tab === tabId));
  panels.forEach(p => p.classList.toggle("active", p.id === `tab-${tabId}`));

  const activeItem = navItems.find(n => n.dataset.tab === tabId);
  if (titleEl && activeItem) {
    const span = activeItem.querySelector("span");
    if (span) titleEl.textContent = span.textContent;
  }

  if (tabId === "orders") renderOrdersTable();
  if (tabId === "products") {
    renderProductsGrid();
    if (typeof fetchWaitlists === "function") fetchWaitlists().then(() => renderProductsGrid());
  }
  if (tabId === "dashboard") renderDashboard();
  if (tabId === "settings") loadStoreSettingsForm();
  try {
    history.replaceState(null, "", `#${tabId}`);
  } catch (e) {}
}

// Tab Navigation
function initTabs() {
  if (!isAdminAuthenticated()) {
    checkAdminAuth();
    return;
  }

  const navItems = $$(".sidebar-nav .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => switchTab(item.dataset.tab));
  });

  const hash = (location.hash || "").replace(/^#/, "");
  if (hash && $(`#tab-${hash}`)) {
    switchTab(hash);
  }
}

// Render Dashboard Overview
function renderDashboard() {
  const orders = Store.get("app_orders") || [];
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status === "Pending" || o.status === "Processing").length;
  const totalUnits = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.qty || 0), 0), 0);
  const aov = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  $("#kpiRevenue").textContent = money(totalRevenue);
  $("#kpiOrders").textContent = orders.length;
  $("#kpiUnits").textContent = totalUnits;
  $("#kpiAov").textContent = money(aov);

  // Render Recent Orders in Dashboard
  const recentTbody = $("#recentOrdersTable");
  if (!recentTbody) return;

  const recent = orders.slice(0, 5);
  recentTbody.innerHTML = recent.map(o => `
    <tr>
      <td>
        <button class="order-id-link" onclick="openOrderModal('${o.id}')" title="Click to view full order details & change status">
          #${o.id}
        </button>
      </td>
      <td>${esc((o.customer && o.customer.name) || o.name || "Customer")}</td>
      <td>${new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
      <td><b>${money(o.total)}</b></td>
      <td><span class="status-pill status-${(o.status || 'pending').toLowerCase()}">${o.status}</span></td>
      <td>
        <button class="btn-dots" onclick="toggleActionsMenu(event, '${o.id}')" aria-label="Order Actions" title="Order Actions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2.2"></circle>
            <circle cx="12" cy="12" r="2.2"></circle>
            <circle cx="12" cy="19" r="2.2"></circle>
          </svg>
        </button>
      </td>
    </tr>
  `).join("");
}

// Render Full Orders Tab
function renderOrdersTable() {
  const tbody = $("#ordersTableBody");
  if (!tbody) return;

  let orders = (typeof getAllOrders === "function") ? getAllOrders() : (Store.get("app_orders") || []);
  if (currentOrderFilter !== "all") {
    orders = orders.filter(o => (o.status || "").toLowerCase() === currentOrderFilter.toLowerCase());
  }

  const query = $("#orderSearchInput") ? $("#orderSearchInput").value.trim().toLowerCase() : "";
  if (query) {
    orders = orders.filter(o => {
      const cust = o.customer || {};
      return (
        String(o.id || "").toLowerCase().includes(query) ||
        String(cust.name || o.name || "").toLowerCase().includes(query) ||
        String(cust.phone || o.phone || "").includes(query) ||
        String(cust.city || o.city || "").toLowerCase().includes(query) ||
        (o.tracking && String(o.tracking.trackingNumber || "").toLowerCase().includes(query))
      );
    });
  }

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--mute-dark)">No orders found matching filter "${esc(currentOrderFilter)}".</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const cust = o.customer || { name: o.name, phone: o.phone, city: o.city, address: o.addr };
    const dateFormatted = o.dateFormatted || (typeof formatOrderDate === "function" ? formatOrderDate(o.createdAt) : new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
    const cleanPhone = (cust.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
    const waReceiptUrl = cleanPhone ? `https://wa.me/92${cleanPhone}?text=${encodeURIComponent((typeof generateOrderWhatsAppMessage === "function") ? generateOrderWhatsAppMessage(o) : "Order " + o.id)}` : "#";
    const statusLower = (o.status || "pending").toLowerCase();

    return `
      <tr>
        <td>
          <button class="order-id-link" onclick="openOrderModal('${o.id}')" title="Click to view full order details & change status">
            #${o.id}
          </button>
          <div style="font-size:11.5px;color:var(--mute-dark);margin-top:2px">${dateFormatted}</div>
        </td>
        <td>
          <b>${esc(cust.name || "Customer")}</b>
          <div style="font-size:12.5px;color:var(--sand)">${esc(cust.city || "Pakistan")}</div>
          <small style="color:var(--mute-dark);font-size:11.5px">${esc((cust.address || "").slice(0, 24))}${cust.address && cust.address.length > 24 ? "..." : ""}</small>
        </td>
        <td>
          ${cleanPhone ? `
            <a href="${waReceiptUrl}" target="_blank" rel="noopener" class="tag tag-emerald" style="font-size:12px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px" title="Send WhatsApp Confirmation Receipt">
              💬 ${esc(cust.phone)}
            </a>
          ` : '<span style="color:var(--mute-dark)">No Phone</span>'}
        </td>
        <td>
          <b>${money(o.total)}</b>
          <br><small style="text-transform:uppercase;color:var(--gold)">${o.paymentMethod || o.pay || "COD"}</small>
        </td>
        <td>
          <span class="status-pill status-${statusLower}">${o.status}</span>
          ${o.tracking && o.tracking.trackingNumber ? `
            <div style="font-size:11px;color:var(--gold-hi);margin-top:4px">
              🚚 ${esc(o.tracking.courier)}: <span style="font-family:monospace">${esc(o.tracking.trackingNumber)}</span>
            </div>
          ` : ""}
        </td>
        <td>
          <button class="btn-dots" onclick="toggleActionsMenu(event, '${o.id}')" aria-label="Order Actions" title="Order Actions">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2.2"></circle>
              <circle cx="12" cy="12" r="2.2"></circle>
              <circle cx="12" cy="19" r="2.2"></circle>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Global 3-Dots Floating Actions Menu
let activeActionOrderId = null;

function toggleActionsMenu(e, orderId) {
  e.stopPropagation();
  const pop = $("#globalActionsPopover");
  if (!pop) return;

  if (activeActionOrderId === orderId && pop.style.display === "block") {
    closeActionsMenu();
    return;
  }

  activeActionOrderId = orderId;
  const orders = (typeof getAllOrders === "function") ? getAllOrders() : (Store.get("app_orders") || []);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const statusLower = (o.status || "pending").toLowerCase();

  pop.innerHTML = `
    <div class="pop-header">
      <span class="pop-order-id">#${esc(o.id)}</span>
      <span class="status-pill status-${statusLower}" style="font-size:10px;padding:2px 8px">${o.status}</span>
    </div>
    
    <button class="pop-item" onclick="execOrderAction('${o.id}', 'details')">
      <span class="pop-icon">👁️</span>
      <span>View Order Details</span>
    </button>
    <button class="pop-item" onclick="execOrderAction('${o.id}', 'whatsapp')">
      <span class="pop-icon">💬</span>
      <span>Send WhatsApp Receipt</span>
    </button>

    <div class="pop-divider"></div>

    ${statusLower === 'pending' ? `
      <button class="pop-item pop-highlight" onclick="execOrderAction('${o.id}', 'approve')">
        <span class="pop-icon">✓</span>
        <span>Approve & Confirm</span>
      </button>
    ` : ''}
    ${(statusLower === 'approved' || statusLower === 'processing') ? `
      <button class="pop-item pop-dispatch" onclick="execOrderAction('${o.id}', 'dispatch')">
        <span class="pop-icon">🚚</span>
        <span>Dispatch with Courier</span>
      </button>
    ` : ''}
    ${statusLower !== 'delivered' && statusLower !== 'cancelled' ? `
      <button class="pop-item pop-delivered" onclick="execOrderAction('${o.id}', 'delivered')">
        <span class="pop-icon">✅</span>
        <span>Mark as Delivered</span>
      </button>
    ` : ''}

    <div class="pop-divider"></div>
    <div class="pop-label">Change Status:</div>
    <div class="pop-status-chips">
      <button class="pop-chip ${statusLower === 'pending' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Pending')">Pending</button>
      <button class="pop-chip ${statusLower === 'approved' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Approved')">Approved</button>
      <button class="pop-chip ${statusLower === 'processing' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Processing')">Processing</button>
      <button class="pop-chip ${statusLower === 'dispatched' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Dispatched')">Dispatched</button>
      <button class="pop-chip ${statusLower === 'delivered' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Delivered')">Delivered</button>
      <button class="pop-chip ${statusLower === 'cancelled' ? 'active' : ''}" onclick="execOrderAction('${o.id}', 'status_Cancelled')">Cancel</button>
    </div>
  `;

  // Calculate position relative to clicked 3-dots button
  const rect = e.currentTarget.getBoundingClientRect();
  pop.style.display = "block";
  const popWidth = 240;
  let left = rect.right - popWidth;
  if (left < 10) left = 10;
  
  let top = rect.bottom + 6;
  const estimatedHeight = 310;
  if (top + estimatedHeight > window.innerHeight) {
    top = Math.max(10, rect.top - estimatedHeight - 6);
  }

  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;

  // Highlight active button
  $$(".btn-dots").forEach(b => b.classList.remove("active"));
  e.currentTarget.classList.add("active");
}

function closeActionsMenu() {
  const pop = $("#globalActionsPopover");
  if (pop) pop.style.display = "none";
  $$(".btn-dots").forEach(b => b.classList.remove("active"));
  activeActionOrderId = null;
}

// Global click outside listener to dismiss 3-dots popover
document.addEventListener("click", e => {
  if (!e.target.closest("#globalActionsPopover") && !e.target.closest(".btn-dots")) {
    closeActionsMenu();
  }
});

// Dismiss on escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeActionsMenu();
});

// Dismiss on window scroll
window.addEventListener("scroll", closeActionsMenu, true);

// Execute Order Action Dispatcher
function execOrderAction(orderId, action) {
  closeActionsMenu();
  if (!action) return;
  if (action === "details") {
    openOrderModal(orderId);
  } else if (action === "whatsapp") {
    sendCustomerWhatsAppMessage(orderId);
  } else if (action === "approve") {
    approveOrder(orderId);
  } else if (action === "dispatch") {
    openDispatchModal(orderId);
  } else if (action === "delivered") {
    markOrderDelivered(orderId);
  } else if (action.startsWith("status_")) {
    const newStatus = action.replace("status_", "");
    updateOrderStatus(orderId, newStatus);
  }
}

// 1-Click Approve Order
function approveOrder(orderId) {
  const o = (typeof updateOrderStatusInDb === "function") 
    ? updateOrderStatusInDb(orderId, "Approved", "Order confirmed & approved by merchant. Ready for warehouse dispatch.")
    : null;

  toast(`Order #${orderId} marked as APPROVED!`);
  renderDashboard();
  renderOrdersTable();

  const cust = o ? (o.customer || { phone: o.phone, name: o.name }) : null;
  const phone = cust ? (cust.phone || "").replace(/[^0-9]/g, "") : "";
  if (phone) {
    if (confirm(`Order #${orderId} approved successfully!\n\nWould you like to send an instant WhatsApp confirmation receipt to customer ${cust.name || ''} (${cust.phone}) now?`)) {
      sendCustomerWhatsAppMessage(orderId);
    }
  }
}

// 1-Click Send Customer WhatsApp Receipt
function sendCustomerWhatsAppMessage(orderId) {
  const orders = (typeof getAllOrders === "function") ? getAllOrders() : (Store.get("app_orders") || []);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const cust = o.customer || { phone: o.phone, name: o.name };
  const cleanPhone = (cust.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
  if (!cleanPhone) {
    alert("Customer phone number not available for this order.");
    return;
  }

  const msg = (typeof generateOrderWhatsAppMessage === "function") 
    ? generateOrderWhatsAppMessage(o) 
    : `Order #${o.id} confirmation for ${cust.name}`;

  window.open(`https://wa.me/92${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

// Open Modal to Add New Manual Order
function openAddOrderModal() {
  let modal = $("#dlg-add-order-modal");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-add-order-modal";
    document.body.appendChild(modal);
  }

  const prods = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const deliveryCfg = (window.BRAND_CONFIG && window.BRAND_CONFIG.delivery) || { fee: 200, freeShippingThreshold: 5000 };

  const prov = [
    "Punjab", "Sindh", "Islamabad Capital Territory", "Khyber Pakhtunkhwa",
    "Balochistan", "Gilgit-Baltistan", "Azad Jammu & Kashmir"
  ];

  modal.innerHTML = `
    <div class="dlg" style="width:min(740px,94vw);max-height:90vh;overflow-y:auto">
      <style>
        #dlg-add-order-modal label { color: #f4d77f !important; font-size: 13.5px !important; font-weight: 600 !important; margin-bottom: 6px !important; display: flex !important; align-items: center !important; gap: 6px !important; }
        #dlg-add-order-modal input, #dlg-add-order-modal select, #dlg-add-order-modal textarea { background: #14100a !important; color: #fffdf8 !important; border: 1.5px solid rgba(214, 167, 54, 0.35) !important; padding: 12px 14px !important; border-radius: 8px !important; width: 100% !important; box-sizing: border-box !important; }
        #dlg-add-order-modal input::placeholder, #dlg-add-order-modal textarea::placeholder { color: rgba(189, 174, 142, 0.55) !important; }
        #dlg-add-order-modal .req { color: #ef4444 !important; font-weight: 700 !important; }
        #dlg-add-order-modal .hint { color: #bdae8e !important; font-size: 11.5px !important; font-weight: normal !important; }
      </style>
      <button class="ic dlg-x" onclick="document.getElementById('dlg-add-order-modal').close()">${ICON.x}</button>
      
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;border-bottom:1px solid var(--hair);padding-bottom:14px">
        <div style="width:46px;height:46px;border-radius:var(--r-sm);background:rgba(214,167,54,0.15);color:var(--gold-hi);display:grid;place-items:center;font-size:24px">📦</div>
        <div>
          <h3 style="font-size:22px;margin:0">Create New Customer Order</h3>
          <p style="font-size:13.5px;color:var(--mute-dark);margin:2px 0 0">Manually record a phone, WhatsApp, or in-person order directly into the database.</p>
        </div>
      </div>

      <form id="addOrderForm" onsubmit="event.preventDefault(); createManualOrder();">
        <h4 style="color:var(--cream);font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span>1. Customer & Shipping Details</span>
        </h4>
        <div class="fgrid">
          <div class="f">
            <label for="moCustName">Customer Full Name <span class="req">*</span></label>
            <input id="moCustName" placeholder="e.g. Muhammad Usman" required>
          </div>

          <div class="f">
            <label for="moCustPhone">WhatsApp / Mobile Number <span class="req">*</span></label>
            <input id="moCustPhone" placeholder="03XXXXXXXXX" required>
          </div>

          <div class="f full">
            <label for="moCustEmail">Email Address <span class="hint">(Optional)</span></label>
            <input id="moCustEmail" type="email" placeholder="customer@example.com">
          </div>

          <div class="f full">
            <label for="moCustAddress">Street Address / House / Landmark <span class="req">*</span></label>
            <input id="moCustAddress" placeholder="House #, Street name, Sector / Area" required>
          </div>

          <div class="f">
            <label for="moCustCity">Destination City <span class="req">*</span></label>
            <input id="moCustCity" placeholder="e.g. Lahore, Karachi, Islamabad" required>
          </div>

          <div class="f">
            <label for="moCustProvince">Province <span class="req">*</span></label>
            <select id="moCustProvince">
              ${prov.map(p => `<option value="${p}">${p}</option>`).join("")}
            </select>
          </div>

          <div class="f full">
            <label for="moCustNotes">Order Notes / Landmark Instructions <span class="hint">(Optional)</span></label>
            <textarea id="moCustNotes" rows="2" placeholder="e.g. Deliver during business hours, call before arrival"></textarea>
          </div>
        </div>

        <h4 style="color:var(--cream);font-size:15px;margin:22px 0 12px;display:flex;align-items:center;gap:8px">
          <span>2. Select Order Products & Quantities</span>
        </h4>

        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--hair);border-radius:var(--r-md);padding:14px;margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid var(--hair);color:var(--gold-hi);font-size:12px;text-transform:uppercase">
                <th style="text-align:left;padding:8px">Product Item</th>
                <th style="text-align:center;padding:8px">Price</th>
                <th style="text-align:center;padding:8px;width:120px">Quantity</th>
                <th style="text-align:right;padding:8px">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${prods.map((p, idx) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                  <td style="padding:10px 8px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <img src="${(p.img && (p.img.front || p.img.pair)) || 'assets/images/products/front.webp'}" alt="${p.name}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;background:#000">
                      <div>
                        <b style="color:var(--cream);font-size:13.5px">${esc(p.name)}</b>
                        <div style="font-size:12px;color:var(--sand)">${esc(p.weight)} ${p.badge ? `· <span style="color:var(--gold-hi)">${p.badge}</span>` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align:center;padding:10px 8px;font-size:13.5px;color:var(--sand)">
                    ${money(p.price)}
                  </td>
                  <td style="text-align:center;padding:10px 8px">
                    <input type="number" min="0" max="50" value="${idx === 0 ? '1' : '0'}" class="mo-item-qty" data-pid="${p.id}" data-price="${p.price}" data-name="${esc(p.name)}" data-weight="${esc(p.weight)}" oninput="recalcManualOrderTotal()" style="width:80px !important;text-align:center !important;padding:6px !important;margin:0 auto !important">
                  </td>
                  <td style="text-align:right;padding:10px 8px;font-weight:700;color:var(--cream);font-size:14px" id="moLineSub_${p.id}">
                    ${money(idx === 0 ? p.price : 0)}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid var(--hair)">
            <div style="width:280px;font-size:13.5px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="color:var(--mute-dark)">Products Subtotal:</span>
                <b id="moSubtotalDisplay" style="color:var(--cream)">PKR 0</b>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="color:var(--mute-dark)">Courier Shipping:</span>
                <div style="width:110px">
                  <input type="number" id="moShipping" value="${deliveryCfg.fee || 200}" min="0" oninput="recalcManualOrderTotal()" style="padding:4px 8px !important;font-size:13px !important;text-align:right !important">
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--hair);font-size:16px">
                <span style="font-weight:700;color:var(--gold-hi)">Total Amount:</span>
                <b id="moTotalDisplay" style="font-weight:700;color:var(--gold-hi)">PKR 0</b>
              </div>
            </div>
          </div>
        </div>

        <h4 style="color:var(--cream);font-size:15px;margin:22px 0 12px;display:flex;align-items:center;gap:8px">
          <span>3. Order Status & Payment Method</span>
        </h4>
        <div class="fgrid">
          <div class="f">
            <label for="moStatus">Initial Order Status <span class="req">*</span></label>
            <select id="moStatus">
              <option value="Approved" selected>Approved (Confirmed & Ready)</option>
              <option value="Pending">Pending Verification</option>
              <option value="Processing">Processing / Packed</option>
              <option value="Dispatched">Dispatched with Courier</option>
            </select>
          </div>

          <div class="f">
            <label for="moPaymentMethod">Payment Method <span class="req">*</span></label>
            <select id="moPaymentMethod">
              <option value="Cash on Delivery (COD)" selected>Cash on Delivery (COD)</option>
              <option value="Direct Bank Transfer">Direct Bank Transfer</option>
              <option value="JazzCash Mobile Account">JazzCash</option>
              <option value="Easypaisa Mobile Account">Easypaisa</option>
              <option value="Advance Paid (Verified)">Advance Paid (Verified)</option>
            </select>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;border-top:1px solid var(--hair);padding-top:18px">
          <button type="button" class="btn btn-line btn-sm" onclick="document.getElementById('dlg-add-order-modal').close()">Cancel</button>
          <button type="submit" class="btn btn-gold btn-sm">Create Order & Save to Database</button>
        </div>
      </form>
    </div>
  `;

  modal.showModal();
  recalcManualOrderTotal();
}

// Recalculate Live Subtotal and Total for Manual Order Form
function recalcManualOrderTotal() {
  const inputs = $$(".mo-item-qty");
  let subtotal = 0;

  inputs.forEach(inp => {
    const qty = Math.max(parseInt(inp.value) || 0, 0);
    const price = parseFloat(inp.dataset.price) || 0;
    const lineSub = qty * price;
    subtotal += lineSub;
    const lineDisplay = $(`#moLineSub_${inp.dataset.pid}`);
    if (lineDisplay) lineDisplay.textContent = money(lineSub);
  });

  const shipInput = $("#moShipping");
  const shipping = shipInput ? Math.max(parseFloat(shipInput.value) || 0, 0) : 0;
  const total = subtotal + shipping;

  const subDisplay = $("#moSubtotalDisplay");
  const totalDisplay = $("#moTotalDisplay");
  if (subDisplay) subDisplay.textContent = money(subtotal);
  if (totalDisplay) totalDisplay.textContent = money(total);
}

// Create Manual Order and Save to Database
function createManualOrder() {
  const name = $("#moCustName").value.trim();
  const phone = $("#moCustPhone").value.trim();
  const email = $("#moCustEmail").value.trim();
  const address = $("#moCustAddress").value.trim();
  const city = $("#moCustCity").value.trim();
  const province = $("#moCustProvince").value;
  const notes = $("#moCustNotes").value.trim();
  const status = $("#moStatus").value;
  const paymentMethod = $("#moPaymentMethod").value;

  const items = [];
  $$(".mo-item-qty").forEach(inp => {
    const qty = Math.max(parseInt(inp.value) || 0, 0);
    if (qty > 0) {
      items.push({
        id: inp.dataset.pid,
        name: inp.dataset.name,
        weight: inp.dataset.weight,
        qty: qty,
        price: parseFloat(inp.dataset.price) || 0
      });
    }
  });

  if (!items.length) {
    alert("Please select at least 1 product quantity for this order.");
    return;
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const shipInput = $("#moShipping");
  const shipping = shipInput ? Math.max(parseFloat(shipInput.value) || 0, 0) : 0;
  const total = subtotal + shipping;

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderId = `MSR-${yy}${mm}${dd}-${rand}`;
  const dateFormatted = (typeof formatOrderDate === "function") ? formatOrderDate(now) : now.toLocaleString();

  const timeline = [
    {
      status: "Pending",
      title: "Order Created Manually",
      time: dateFormatted,
      note: "Order recorded manually via Admin Portal"
    }
  ];

  if (status === "Approved") {
    timeline.push({
      status: "Approved",
      title: "Order Approved & Confirmed",
      time: dateFormatted,
      note: "Order confirmed & approved upon manual entry"
    });
  } else if (status === "Processing") {
    timeline.push({
      status: "Processing",
      title: "Packed & Ready for Dispatch",
      time: dateFormatted,
      note: "Order set to Processing by merchant"
    });
  } else if (status === "Dispatched") {
    timeline.push({
      status: "Dispatched",
      title: "Dispatched with Courier Partner",
      time: dateFormatted,
      note: "Order dispatched with courier partner"
    });
  }

  const order = {
    id: orderId,
    createdAt: now.toISOString(),
    dateFormatted,
    status,
    paymentMethod,
    pay: paymentMethod,
    subtotal,
    shipping,
    total,
    items,
    customer: {
      name,
      phone,
      email,
      address,
      city,
      province,
      notes
    },
    name,
    phone,
    email,
    addr: address,
    city,
    prov: province,
    note: notes,
    tracking: {
      courier: "",
      trackingNumber: "",
      dispatchedAt: status === "Dispatched" ? now.toISOString() : null,
      deliveredAt: null
    },
    timeline
  };

  if (typeof saveOrder === "function") {
    saveOrder(order);
  } else {
    const orders = Store.get("app_orders") || [];
    orders.unshift(order);
    Store.set("app_orders", orders);
  }

  const modal = $("#dlg-add-order-modal");
  if (modal) modal.close();

  toast(`Order #${orderId} created successfully!`);
  renderDashboard();
  renderOrdersTable();

  const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "");
  if (cleanPhone) {
    if (confirm(`Order #${orderId} created successfully in database!\n\nWould you like to send an instant WhatsApp order confirmation receipt to customer ${name} (${phone}) now?`)) {
      sendCustomerWhatsAppMessage(orderId);
    }
  }
}

// 1-Click Dispatch Order Modal
function openDispatchModal(orderId) {
  const orders = (typeof getAllOrders === "function") ? getAllOrders() : (Store.get("app_orders") || []);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  let modal = $("#dlg-dispatch-modal");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-dispatch-modal";
    document.body.appendChild(modal);
  }

  const cust = o.customer || { name: o.name, city: o.city };

  modal.innerHTML = `
    <div class="dlg" style="width:min(520px,94vw)">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-dispatch-modal').close()">${ICON.x}</button>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:rgba(168,85,247,0.15);color:#d8b4fe;display:grid;place-items:center;font-size:22px">🚚</div>
        <div>
          <h3 style="font-size:20px;margin:0">Dispatch Order #${o.id}</h3>
          <p style="font-size:13px;color:var(--mute-dark);margin:2px 0 0">Customer: ${esc(cust.name)} (${esc(cust.city || "Pakistan")})</p>
        </div>
      </div>

      <form onsubmit="event.preventDefault(); applyDispatch('${o.id}');">
        <div class="f" style="margin-bottom:14px">
          <label for="dispatchCourier">Select Courier Service Partner *</label>
          <select id="dispatchCourier" required style="padding:12px 14px">
            <option value="TCS Express">TCS Express (Air Cargo / Overnight)</option>
            <option value="Leopards Courier">Leopards Courier Service</option>
            <option value="Trax Logistics">Trax Express Delivery</option>
            <option value="Call Courier">Call Courier</option>
            <option value="M&P Express">M&P Logistics</option>
            <option value="PostEx">PostEx Courier</option>
            <option value="Pakistan Post">Pakistan Post (Registered)</option>
          </select>
        </div>

        <div class="f" style="margin-bottom:14px">
          <label for="dispatchTracking">Consignment / Tracking Number *</label>
          <input id="dispatchTracking" placeholder="e.g. TCS-77291048 or LEOP-99214" required style="font-size:16px;font-family:monospace;padding:12px 14px">
        </div>

        <div class="f" style="margin-bottom:18px">
          <label for="dispatchNotes">Dispatch Notes / Remarks</label>
          <input id="dispatchNotes" placeholder="e.g. Handed over to courier driver, ETA 2 business days">
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px">
          <button type="button" class="btn btn-line btn-sm" onclick="document.getElementById('dlg-dispatch-modal').close()">Cancel</button>
          <button type="submit" class="btn btn-gold btn-sm">Confirm Dispatch & Update Tracking</button>
        </div>
      </form>
    </div>
  `;

  modal.showModal();
}

function applyDispatch(orderId) {
  const courier = $("#dispatchCourier").value;
  const trackingNumber = $("#dispatchTracking").value.trim();
  const notes = $("#dispatchNotes").value.trim();

  const o = (typeof updateOrderStatusInDb === "function")
    ? updateOrderStatusInDb(orderId, "Dispatched", notes || `Dispatched via ${courier} (#${trackingNumber})`, { courier, trackingNumber })
    : null;

  const modal = $("#dlg-dispatch-modal");
  if (modal) modal.close();

  toast(`Order #${orderId} dispatched via ${courier}! Tracking: ${trackingNumber}`);
  renderDashboard();
  renderOrdersTable();

  const custPhone = (o && o.customer && o.customer.phone) || (o && o.phone) || "";
  if (custPhone && confirm(`Order #${orderId} dispatched with ${courier}!\n\nSend tracking link and consignment details to customer's WhatsApp now?`)) {
    sendCustomerWhatsAppMessage(orderId);
  }
}

// 1-Click Mark Order Delivered
function markOrderDelivered(orderId) {
  if (!confirm(`Mark Order #${orderId} as successfully DELIVERED and payment received?`)) return;
  if (typeof updateOrderStatusInDb === "function") {
    updateOrderStatusInDb(orderId, "Delivered", "Delivered successfully to customer address. Payment collected.");
  }
  toast(`Order #${orderId} marked as DELIVERED!`);
  renderDashboard();
  renderOrdersTable();
}

// General Update Order Status Dropdown
function updateOrderStatus(orderId, newStatus) {
  if (typeof updateOrderStatusInDb === "function") {
    updateOrderStatusInDb(orderId, newStatus, `Status updated to ${newStatus}`);
  } else {
    const orders = Store.get("app_orders") || [];
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.status = newStatus;
      Store.set("app_orders", orders);
    }
  }
  toast(`Order #${orderId} updated to ${newStatus}`);
  renderDashboard();
  renderOrdersTable();
}

// Order Details & Timeline Modal
function openOrderModal(orderId) {
  const orders = (typeof getAllOrders === "function") ? getAllOrders() : (Store.get("app_orders") || []);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const cust = o.customer || { name: o.name, phone: o.phone, email: o.email, address: o.addr, city: o.city, province: o.prov, notes: o.note };
  const modal = $("#dlg-order-details");
  if (!modal) return;

  const cleanPhone = (cust.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
  const waReceiptUrl = cleanPhone ? `https://wa.me/92${cleanPhone}?text=${encodeURIComponent((typeof generateOrderWhatsAppMessage === "function") ? generateOrderWhatsAppMessage(o) : "Order " + o.id)}` : "#";
  const statusLower = (o.status || "pending").toLowerCase();
  const trackUrl = (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.websiteUrl)
    ? `${window.BRAND_CONFIG.urls.websiteUrl.replace(/\/$/, "")}/#/track/${o.id}`
    : `#/track/${o.id}`;

  modal.innerHTML = `
    <div class="dlg" style="width:min(760px,95vw);max-height:92vh;overflow-y:auto">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-order-details').close()">${ICON.x}</button>
      
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;border-bottom:1px solid var(--hair);padding-bottom:14px">
        <div>
          <span style="font-size:12px;color:var(--gold-hi);text-transform:uppercase;letter-spacing:0.05em">Order Information</span>
          <h3 style="font-size:22px;margin:2px 0 0;color:var(--cream);display:flex;align-items:center;gap:8px">
            Order #${o.id}
            <button class="btn btn-xs btn-line" onclick="navigator.clipboard.writeText('${o.id}'); toast('Order ID copied!');" title="Copy Order ID" style="font-size:11px;padding:2px 8px">📋 Copy</button>
          </h3>
          <small style="color:var(--mute-dark)">Placed on ${o.dateFormatted || (typeof formatOrderDate === "function" ? formatOrderDate(o.createdAt) : new Date(o.createdAt).toLocaleString())}</small>
        </div>
        <div style="text-align:right">
          <span class="status-pill status-${statusLower}" style="font-size:13px;padding:6px 14px">${o.status}</span>
          <div style="margin-top:4px;font-size:13px;color:var(--sand)">Payment: <b>${o.paymentMethod || o.pay || "Cash on Delivery (COD)"}</b></div>
        </div>
      </div>

      <!-- Interactive Order Status & Fulfillment Control Bar -->
      <div class="status-change-box">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <label for="modalOrderStatusSelect" style="font-weight:700;color:var(--cream);font-size:13.5px;display:flex;align-items:center;gap:6px">
            <span>⚡ Change Status:</span>
          </label>
          <select id="modalOrderStatusSelect" class="modal-status-select" onchange="updateOrderStatusFromModal('${o.id}', this.value)">
            <option value="Pending" ${o.status === "Pending" ? "selected" : ""}>⏳ Pending</option>
            <option value="Approved" ${o.status === "Approved" ? "selected" : ""}>✓ Approved</option>
            <option value="Processing" ${o.status === "Processing" ? "selected" : ""}>⚙️ Processing</option>
            <option value="Dispatched" ${o.status === "Dispatched" ? "selected" : ""}>🚚 Dispatched</option>
            <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>✅ Delivered</option>
            <option value="Cancelled" ${o.status === "Cancelled" ? "selected" : ""}>❌ Cancelled</option>
          </select>
          <button class="btn btn-xs btn-gold" onclick="updateOrderStatusFromModal('${o.id}')">Apply Status</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-xs btn-warning" onclick="document.getElementById('dlg-order-details').close(); openDispatchModal('${o.id}');">🚚 Set Courier Tracking</button>
          ${cleanPhone ? `<a class="btn btn-xs btn-line" href="${waReceiptUrl}" target="_blank" rel="noopener" style="color:#25D366;border-color:rgba(37,211,102,0.4)">💬 WhatsApp Customer</a>` : ""}
        </div>
      </div>

      <!-- Consignment Tracking Details (if any) -->
      ${o.tracking && o.tracking.trackingNumber ? `
        <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:var(--r-sm);padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;color:#d8b4fe;text-transform:uppercase;font-weight:600">Active Consignment</div>
            <div style="font-size:16px;color:#fff;font-weight:700">🚚 ${esc(o.tracking.courier)}</div>
            <div style="font-size:13px;color:var(--sand)">Tracking ID: <b style="font-family:monospace;color:var(--gold-hi)">${esc(o.tracking.trackingNumber)}</b></div>
          </div>
          <button class="btn btn-xs btn-line" onclick="navigator.clipboard.writeText('${esc(o.tracking.trackingNumber)}'); toast('Tracking number copied!');">Copy</button>
        </div>
      ` : ""}

      <!-- 2 Columns: Customer Info & Ordered Items -->
      <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:20px;margin-bottom:20px">
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--hair);border-radius:var(--r-sm);padding:16px">
          <h4 style="color:var(--gold-hi);margin:0 0 10px;font-size:14px;text-transform:uppercase">Customer & Destination</h4>
          <p style="margin:0 0 6px"><b>Name:</b> ${esc(cust.name || "Customer")}</p>
          <p style="margin:0 0 6px"><b>Phone:</b> ${cust.phone ? `<a href="tel:${cust.phone}" style="color:var(--gold-hi)">${esc(cust.phone)}</a>` : "N/A"}</p>
          ${cust.email ? `<p style="margin:0 0 6px"><b>Email:</b> ${esc(cust.email)}</p>` : ""}
          <p style="margin:0 0 6px"><b>Address:</b> ${esc(cust.address || "")}, ${esc(cust.city || "")}, ${esc(cust.province || "")}</p>
          ${cust.notes ? `<p style="margin:0;font-size:12.5px;color:var(--mute-dark)"><b>Notes:</b> <i>${esc(cust.notes)}</i></p>` : ""}
        </div>

        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--hair);border-radius:var(--r-sm);padding:16px">
          <h4 style="color:var(--gold-hi);margin:0 0 10px;font-size:14px;text-transform:uppercase">Ordered Products</h4>
          <table class="admin-table" style="font-size:13.5px">
            ${(o.items || []).map(i => `
              <tr>
                <td style="padding:6px 0"><b>${esc(i.name)}</b><br><small style="color:var(--mute-dark)">${esc(i.weight || "")}</small></td>
                <td style="text-align:center;padding:6px 0">× ${i.qty}</td>
                <td style="text-align:right;padding:6px 0"><b>${money(i.qty * i.price)}</b></td>
              </tr>
            `).join("")}
            <tr style="border-top:1px solid var(--hair)">
              <td colspan="2" style="padding:6px 0">Delivery Shipping</td>
              <td style="text-align:right;padding:6px 0">${o.shipping === 0 ? '<span class="tag tag-emerald">FREE</span>' : money(o.shipping || 200)}</td>
            </tr>
            <tr style="border-top:1.5px solid var(--gold)">
              <td colspan="2" style="padding:8px 0"><b style="font-size:15px;color:var(--cream)">Total Amount</b></td>
              <td style="text-align:right;padding:8px 0"><b style="font-size:17px;color:var(--gold-hi)">${money(o.total)}</b></td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Live Order Lifecycle Milestones Timeline -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid var(--hair);border-radius:var(--r-sm);padding:18px;margin-bottom:20px">
        <h4 style="color:var(--gold-hi);margin:0 0 12px;font-size:14px;text-transform:uppercase">Consignment Milestones & History</h4>
        <div style="display:flex;flex-direction:column;gap:12px;border-left:2px solid var(--gold);padding-left:16px;margin-left:6px">
          ${(o.timeline || []).slice().reverse().map(ev => `
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <b style="color:var(--cream);font-size:14px">${esc(ev.title)}</b>
                <small style="color:var(--mute-dark);font-size:12px">${esc(ev.time)}</small>
              </div>
              <p style="margin:2px 0 0;font-size:13px;color:var(--sand)">${esc(ev.note || "")}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <a class="btn btn-line btn-sm" href="${trackUrl}" target="_blank" rel="noopener">View Customer Tracking Page ↗</a>
        <div style="display:flex;gap:10px">
          ${cleanPhone ? `<a class="btn btn-gold btn-sm" href="${waReceiptUrl}" target="_blank" rel="noopener">Send WhatsApp Invoice</a>` : ""}
          <button class="btn btn-line btn-sm" onclick="document.getElementById('dlg-order-details').close()">Close</button>
        </div>
      </div>
    </div>
  `;

  modal.showModal();
}

function updateOrderStatusFromModal(orderId, chosenStatus) {
  if (!chosenStatus) {
    const sel = document.getElementById("modalOrderStatusSelect");
    if (sel) chosenStatus = sel.value;
  }
  if (!chosenStatus) return;
  updateOrderStatus(orderId, chosenStatus);
  openOrderModal(orderId);
}

// Global window exposure for inline onclick handlers
window.approveOrder = approveOrder;
window.sendCustomerWhatsAppMessage = sendCustomerWhatsAppMessage;
window.openDispatchModal = openDispatchModal;
window.applyDispatch = applyDispatch;
window.markOrderDelivered = markOrderDelivered;
window.openOrderModal = openOrderModal;

// Product Catalog & Inventory State
let currentProdFilter = "all";
let tempUploadedImage = null;


// =======================================================================
// CUSTOMER RESTOCK WAITLIST CONTROLLER (Cloudflare D1 & Offline Fallback)
// =======================================================================
function getNotifyEndpoint(suffix) {
  suffix = suffix || "";
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    return window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/notify" + suffix;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "https://msrfoodsofficial.food/api/notify" + suffix;
  }
  return "/api/notify" + suffix;
}

let appWaitlists = [];

async function fetchWaitlists() {
  try {
    const res = await fetch(getNotifyEndpoint());
    if (res.ok) {
      const data = await res.json();
      appWaitlists = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn("Could not fetch waitlist from /api/notify:", e);
  }

  // Merge local storage restock requests
  if (typeof Store !== "undefined") {
    const local = Store.get("app_restock_requests") || [];
    local.forEach(loc => {
      const exists = appWaitlists.some(w => 
        (loc.email && w.customer_email === loc.email) || 
        (loc.phone && w.customer_phone === loc.phone)
      );
      if (!exists) {
        appWaitlists.push({
          id: loc.id || 'loc-' + Math.random().toString(36).slice(2, 8),
          product_id: loc.productId,
          product_title: loc.productTitle || "",
          customer_name: loc.name || "Customer",
          customer_email: loc.email || "",
          customer_phone: loc.phone || "",
          want_whatsapp: loc.wantWhatsapp ? 1 : 0,
          status: loc.status || 'pending',
          created_at: loc.createdAt || new Date().toISOString()
        });
      }
    });
  }
}

async function copyWaitlistEmails(productId) {
  const pending = (appWaitlists || []).filter(w => w.product_id === productId && w.status !== "notified");
  const emails = pending.map(c => c.customer_email).filter(Boolean);
  if (emails.length === 0) {
    toast("No customer emails found for this product.");
    return;
  }
  const emailStr = emails.join(", ");
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(emailStr);
    toast(`Copied ${emails.length} customer email(s) to clipboard!`);
  } else {
    prompt("Copy customer emails:", emailStr);
  }
}

async function markProductWaitlistNotified(productId) {
  try {
    await fetch(getNotifyEndpoint(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, status: "notified" })
    });
  } catch (err) {
    console.warn("Could not patch notify status:", err);
  }

  // Update local in-memory cache & store
  if (Array.isArray(appWaitlists)) {
    appWaitlists.forEach(w => {
      if (w.product_id === productId) w.status = "notified";
    });
  }
  if (typeof Store !== "undefined") {
    const local = Store.get("app_restock_requests") || [];
    local.forEach(r => {
      if (r.productId === productId) r.status = "notified";
    });
    Store.set("app_restock_requests", local);
  }

  toast("✓ Marked all customers for this product as notified!");
  restockProduct(productId);
  renderProductsGrid();
}

async function markSingleWaitlistNotified(id, productId) {
  try {
    await fetch(getNotifyEndpoint(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "notified" })
    });
  } catch (err) {
    console.warn("Could not patch single notify status:", err);
  }

  if (Array.isArray(appWaitlists)) {
    const item = appWaitlists.find(w => String(w.id) === String(id));
    if (item) item.status = "notified";
  }
  if (typeof Store !== "undefined") {
    const local = Store.get("app_restock_requests") || [];
    const item = local.find(r => String(r.id) === String(id));
    if (item) item.status = "notified";
    Store.set("app_restock_requests", local);
  }

  toast("✓ Customer marked as notified!");
  restockProduct(productId);
  renderProductsGrid();
}

window.fetchWaitlists = fetchWaitlists;
window.copyWaitlistEmails = copyWaitlistEmails;
window.markProductWaitlistNotified = markProductWaitlistNotified;
window.markSingleWaitlistNotified = markSingleWaitlistNotified;

// Render Products & Inventory Grid
function renderProductsGrid() {
  const container = $("#inventoryGridContainer");
  if (!container) return;

  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);

  // Update counts
  const inStockCount = allProducts.filter(p => (p.stock == null || p.stock > 0)).length;
  const outOfStockCount = allProducts.filter(p => p.stock !== undefined && p.stock <= 0).length;

  if ($("#countAllProds")) $("#countAllProds").textContent = allProducts.length;
  if ($("#countInStock")) $("#countInStock").textContent = inStockCount;
  if ($("#countOutOfStock")) $("#countOutOfStock").textContent = outOfStockCount;

  let filtered = allProducts;
  if (currentProdFilter === "instock") {
    filtered = allProducts.filter(p => p.stock == null || p.stock > 0);
  } else if (currentProdFilter === "outofstock") {
    filtered = allProducts.filter(p => p.stock !== undefined && p.stock <= 0);
  }

  const query = $("#productSearchInput") ? $("#productSearchInput").value.trim().toLowerCase() : "";
  if (query) {
    filtered = filtered.filter(p =>
      (p.title || p.name || "").toLowerCase().includes(query) ||
      (p.weight || "").toLowerCase().includes(query) ||
      (p.shortDesc || "").toLowerCase().includes(query)
    );
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border: 1px solid var(--hair); border-radius: var(--r-md); color: var(--mute-dark);">
        <p style="font-size: 16px; margin-bottom: 12px;">No products found matching your current filter.</p>
        <button class="btn btn-gold btn-sm" onclick="openAddProductModal()">+ Add New Product</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isOutOfStock = p.stock !== undefined && p.stock <= 0;
    const stockQty = p.stock !== undefined ? p.stock : 25;
    const stockPillClass = isOutOfStock ? "rose" : (stockQty <= 5 ? "amber" : "emerald");
    const stockText = isOutOfStock ? "Out of Stock" : (stockQty <= 5 ? `Low Stock (${stockQty})` : `In Stock (${stockQty})`);
    const imgSrc = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";

    return `
      <div class="inventory-card ${isOutOfStock ? 'out-of-stock' : ''}">
        <div class="inventory-card-img">
          <span class="pill" style="position:absolute;top:12px;left:12px;z-index:3">${esc(p.weight || "Standard")}</span>
          ${p.badge ? `<span class="tag tag-gold" style="position:absolute;top:12px;right:12px;z-index:3">${esc(p.badge)}</span>` : ""}
          ${isOutOfStock ? `<div class="out-of-stock-overlay">OUT OF STOCK</div>` : ""}
          <img src="${imgSrc}" alt="${esc(p.name || p.title)}" loading="lazy">
        </div>

        <div class="inventory-card-body">
          <h3 style="font-size:18px;margin:0;color:var(--cream)">${esc(p.title || p.name)}</h3>
          <p style="font-size:13.5px;color:var(--mute-dark);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.shortDesc || p.subtitle || "")}</p>
          
          ${(() => {
            const pendingForP = (appWaitlists || []).filter(w => w.product_id === p.id && w.status !== "notified");
            const waitlistBadge = pendingForP.length > 0
              ? `<button type="button" class="tag tag-gold" style="cursor:pointer;font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;background:rgba(214,167,54,0.18);border:1px solid rgba(214,167,54,0.35);color:var(--gold-hi)" onclick="restockProduct('${p.id}')" title="Customers waiting for restock">🔔 ${pendingForP.length} Waiting</button>`
              : "";
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:12px;border-top:1px solid var(--hair);flex-wrap:wrap;gap:6px">
                <div>
                  <b style="font-size:18px;color:var(--gold-hi)">${money(p.price)}</b>
                  ${p.comparePrice ? `<small style="text-decoration:line-through;color:var(--mute-dark);margin-left:6px">${money(p.comparePrice)}</small>` : ""}
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  ${waitlistBadge}
                  <span class="tag tag-${stockPillClass}">
                    ${stockText}
                  </span>
                </div>
              </div>
            `;
          })()}

          <div class="prod-actions">
            <button type="button" class="btn btn-xs btn-line" onclick="openEditProductModal('${p.id}')">
              ✏️ Edit
            </button>
            ${isOutOfStock ? `
              <button type="button" class="btn btn-xs btn-success" onclick="restockProduct('${p.id}')">
                📦 Restock
              </button>
            ` : `
              <button type="button" class="btn btn-xs btn-warning" onclick="markOutOfStock('${p.id}')">
                ⚠️ Out of Stock
              </button>
            `}
            <button type="button" class="btn btn-xs btn-danger" style="grid-column: 1 / -1" onclick="deleteProduct('${p.id}')">
              🗑️ Remove Product
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Open Modal to Add New Product
function openAddProductModal() {
  tempUploadedImage = null;
  const modal = $("#dlg-product-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="dlg" style="width:min(720px,94vw)">
      <style>
        #dlg-product-modal label { color: #f4d77f !important; font-size: 13.5px !important; font-weight: 600 !important; margin-bottom: 6px !important; display: flex !important; align-items: center !important; gap: 6px !important; }
        #dlg-product-modal input, #dlg-product-modal select, #dlg-product-modal textarea { background: #14100a !important; color: #fffdf8 !important; border: 1.5px solid rgba(214, 167, 54, 0.35) !important; padding: 12px 14px !important; border-radius: 8px !important; width: 100% !important; box-sizing: border-box !important; }
        #dlg-product-modal input::placeholder, #dlg-product-modal textarea::placeholder { color: rgba(189, 174, 142, 0.55) !important; }
        #dlg-product-modal .req { color: #ef4444 !important; font-weight: 700 !important; }
        #dlg-product-modal .hint { color: #bdae8e !important; font-size: 11.5px !important; font-weight: normal !important; }
      </style>
      <button class="ic dlg-x" onclick="document.getElementById('dlg-product-modal').close()">${ICON.x}</button>
      <h3 style="font-size:22px;margin-bottom:6px">Add New Product</h3>
      <p style="font-size:14px;color:var(--mute-dark);margin-bottom:20px">Create a new item in your store catalog with images, pricing, and initial stock.</p>

      <form id="productForm" onsubmit="event.preventDefault(); saveProductForm(null);">
        <div class="fgrid">
          <div class="f full">
            <label for="prodTitle">Product Title / Name <span class="req">*</span></label>
            <input id="prodTitle" placeholder="e.g. Pure Honey Walnut Crunch" required>
          </div>

          <div class="f">
            <label for="prodWeight">Weight / Size / Pack <span class="req">*</span></label>
            <input id="prodWeight" placeholder="e.g. 500g, 1kg, 250g Jar" required>
          </div>

          <div class="f">
            <label for="prodBadge">Product Badge <span class="hint">(Optional - e.g. Best Seller, Organic, New)</span></label>
            <input id="prodBadge" placeholder="e.g. Best Seller, New, Organic">
          </div>

          <div class="f">
            <label for="prodPrice">Selling Price (PKR) <span class="req">*</span></label>
            <input id="prodPrice" type="number" min="1" placeholder="1599" required>
          </div>

          <div class="f">
            <label for="prodComparePrice">Original / Compare Price (PKR) <span class="hint">(Optional discount anchor)</span></label>
            <input id="prodComparePrice" type="number" min="0" placeholder="1850">
          </div>

          <div class="f">
            <label for="prodStock">Initial Stock Units <span class="req">*</span></label>
            <input id="prodStock" type="number" min="0" value="50" required>
          </div>

          <div class="f">
            <label for="prodCategory">Category / Group <span class="hint">(e.g. honey-nut-mix)</span></label>
            <input id="prodCategory" placeholder="e.g. honey-nut-mix">
          </div>

          <!-- Featured Image Section -->
          <div class="f full" style="margin-top:10px">
            <label>Featured Image Upload & Preview <span class="req">*</span></label>
            <div class="dropzone-box" onclick="document.getElementById('prodImgFileInput').click()">
              <input type="file" id="prodImgFileInput" accept="image/*" style="display:none" onchange="handleProductImageUpload(event)">
              <p style="margin:0;font-size:14.5px;color:var(--gold-hi)"><b>Click or Drop to Upload Image File</b></p>
              <p style="margin-top:4px;font-size:12.5px;color:var(--mute-dark)">Supports PNG, WebP, JPG up to 5MB</p>
            </div>

            <div style="margin-top:12px">
              <label for="prodImgUrlInput" style="font-size:13px;color:var(--gold-hi)">Or Enter Image URL / Asset Path</label>
              <input id="prodImgUrlInput" placeholder="assets/images/products/front.webp or https://..." oninput="previewImageFromUrl(this.value)">
            </div>

            <div style="margin-top:10px">
              <span style="font-size:12.5px;color:var(--mute-dark)">Quick Preset Jars:</span>
              <div class="preset-img-chips">
                <span class="preset-chip active" onclick="selectPresetImage('assets/images/products/front.webp', this)">Front View Jar</span>
                <span class="preset-chip" onclick="selectPresetImage('assets/images/products/back.webp', this)">Back Label Jar</span>
                <span class="preset-chip" onclick="selectPresetImage('assets/images/products/pair.webp', this)">Pair Collection</span>
              </div>
            </div>

            <div style="text-align:center;margin-top:12px" id="imagePreviewContainer">
              <img id="prodImagePreview" class="image-preview-thumb" src="assets/images/products/front.webp" alt="Preview">
            </div>
          </div>

          <div class="f full">
            <label for="prodShortDesc">Short Summary / Subtitle <span class="hint">(Shown on product cards)</span></label>
            <input id="prodShortDesc" placeholder="Brief 1-line hook displayed on product cards">
          </div>

          <div class="f full">
            <label for="prodFullDesc">Full Detailed Description <span class="hint">(Health benefits, ingredients, taste)</span></label>
            <textarea id="prodFullDesc" placeholder="Describe the health benefits, taste profile, and packaging..." rows="3"></textarea>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
          <button type="button" class="btn btn-line btn-sm" onclick="document.getElementById('dlg-product-modal').close()">Cancel</button>
          <button type="submit" class="btn btn-gold btn-sm">Add Product</button>
        </div>
      </form>
    </div>
  `;

  modal.showModal();
}

// Open Modal to Edit Existing Product
function openEditProductModal(productId) {
  tempUploadedImage = null;
  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;

  const modal = $("#dlg-product-modal");
  if (!modal) return;

  const currentImg = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";

  modal.innerHTML = `
    <div class="dlg" style="width:min(720px,94vw)">
      <style>
        #dlg-product-modal label { color: #f4d77f !important; font-size: 13.5px !important; font-weight: 600 !important; margin-bottom: 6px !important; display: flex !important; align-items: center !important; gap: 6px !important; }
        #dlg-product-modal input, #dlg-product-modal select, #dlg-product-modal textarea { background: #14100a !important; color: #fffdf8 !important; border: 1.5px solid rgba(214, 167, 54, 0.35) !important; padding: 12px 14px !important; border-radius: 8px !important; width: 100% !important; box-sizing: border-box !important; }
        #dlg-product-modal input::placeholder, #dlg-product-modal textarea::placeholder { color: rgba(189, 174, 142, 0.55) !important; }
        #dlg-product-modal .req { color: #ef4444 !important; font-weight: 700 !important; }
        #dlg-product-modal .hint { color: #bdae8e !important; font-size: 11.5px !important; font-weight: normal !important; }
      </style>
      <button class="ic dlg-x" onclick="document.getElementById('dlg-product-modal').close()">${ICON.x}</button>
      <h3 style="font-size:22px;margin-bottom:6px">Edit Product: ${esc(p.title || p.name)}</h3>
      <p style="font-size:14px;color:var(--mute-dark);margin-bottom:20px">Update pricing, description, stock units, or product photography.</p>

      <form id="productForm" onsubmit="event.preventDefault(); saveProductForm('${p.id}');">
        <div class="fgrid">
          <div class="f full">
            <label for="prodTitle">Product Title / Name <span class="req">*</span></label>
            <input id="prodTitle" value="${esc(p.title || p.name)}" required>
          </div>

          <div class="f">
            <label for="prodWeight">Weight / Size / Pack <span class="req">*</span></label>
            <input id="prodWeight" value="${esc(p.weight || '500g')}" required>
          </div>

          <div class="f">
            <label for="prodBadge">Product Badge <span class="hint">(Optional - e.g. Best Seller, Organic, New)</span></label>
            <input id="prodBadge" value="${esc(p.badge || '')}">
          </div>

          <div class="f">
            <label for="prodPrice">Selling Price (PKR) <span class="req">*</span></label>
            <input id="prodPrice" type="number" min="1" value="${p.price || ''}" required>
          </div>

          <div class="f">
            <label for="prodComparePrice">Original / Compare Price (PKR) <span class="hint">(Optional discount anchor)</span></label>
            <input id="prodComparePrice" type="number" min="0" value="${p.comparePrice || ''}">
          </div>

          <div class="f">
            <label for="prodStock">Current Stock Units <span class="req">*</span></label>
            <input id="prodStock" type="number" min="0" value="${p.stock !== undefined ? p.stock : 25}" required>
          </div>

          <div class="f">
            <label for="prodCategory">Category / Group <span class="hint">(e.g. honey-nut-mix)</span></label>
            <input id="prodCategory" value="${esc(p.group || 'honey-nut-mix')}">
          </div>

          <!-- Featured Image Section -->
          <div class="f full" style="margin-top:10px">
            <label>Featured Image Upload & Preview <span class="req">*</span></label>
            <div class="dropzone-box" onclick="document.getElementById('prodImgFileInput').click()">
              <input type="file" id="prodImgFileInput" accept="image/*" style="display:none" onchange="handleProductImageUpload(event)">
              <p style="margin:0;font-size:14.5px;color:var(--gold-hi)"><b>Click or Drop to Upload New Image</b></p>
              <p style="margin-top:4px;font-size:12.5px;color:var(--mute-dark)">Leave unchanged to keep existing image</p>
            </div>

            <div style="margin-top:12px">
              <label for="prodImgUrlInput" style="font-size:13px;color:var(--gold-hi)">Or Edit Image URL Path</label>
              <input id="prodImgUrlInput" value="${currentImg}" oninput="previewImageFromUrl(this.value)">
            </div>

            <div style="margin-top:10px">
              <span style="font-size:12.5px;color:var(--mute-dark)">Quick Preset Jars:</span>
              <div class="preset-img-chips">
                <span class="preset-chip" onclick="selectPresetImage('assets/images/products/front.webp', this)">Front View Jar</span>
                <span class="preset-chip" onclick="selectPresetImage('assets/images/products/back.webp', this)">Back Label Jar</span>
                <span class="preset-chip" onclick="selectPresetImage('assets/images/products/pair.webp', this)">Pair Collection</span>
              </div>
            </div>

            <div style="text-align:center;margin-top:12px" id="imagePreviewContainer">
              <img id="prodImagePreview" class="image-preview-thumb" src="${currentImg}" alt="Preview">
            </div>
          </div>

          <div class="f full">
            <label for="prodShortDesc">Short Summary / Subtitle <span class="hint">(Shown on product cards)</span></label>
            <input id="prodShortDesc" value="${esc(p.shortDesc || p.subtitle || '')}">
          </div>

          <div class="f full">
            <label for="prodFullDesc">Full Detailed Description <span class="hint">(Health benefits, ingredients, taste)</span></label>
            <textarea id="prodFullDesc" rows="3">${esc(p.fullDesc || '')}</textarea>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
          <button type="button" class="btn btn-line btn-sm" onclick="document.getElementById('dlg-product-modal').close()">Cancel</button>
          <button type="submit" class="btn btn-gold btn-sm">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  modal.showModal();
}

// Image handling helpers for product modal
function handleProductImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    tempUploadedImage = evt.target.result;
    const preview = $("#prodImagePreview");
    if (preview) preview.src = tempUploadedImage;
    if ($("#prodImgUrlInput")) $("#prodImgUrlInput").value = "Uploaded Image (Data)";
    toast("Image uploaded successfully!");
  };
  reader.readAsDataURL(file);
}

function selectPresetImage(url, chip) {
  tempUploadedImage = null;
  const preview = $("#prodImagePreview");
  if (preview) preview.src = url;
  if ($("#prodImgUrlInput")) $("#prodImgUrlInput").value = url;
  $$(".preset-chip").forEach(c => c.classList.remove("active"));
  if (chip) chip.classList.add("active");
}

function previewImageFromUrl(url) {
  tempUploadedImage = null;
  const preview = $("#prodImagePreview");
  if (preview && url) preview.src = url;
}

// Save Product Form (Add or Edit)
function saveProductForm(editingId) {
  const title = $("#prodTitle").value.trim();
  const weight = $("#prodWeight").value.trim();
  const price = +$("#prodPrice").value;
  const comparePrice = $("#prodComparePrice").value ? +$("#prodComparePrice").value : null;
  const stock = +$("#prodStock").value;
  const badge = $("#prodBadge").value.trim();
  const group = $("#prodCategory").value.trim() || "honey-nut-mix";
  const shortDesc = $("#prodShortDesc").value.trim() || `${title} in ${weight} packaging.`;
  const fullDesc = $("#prodFullDesc").value.trim() || shortDesc;

  let imagePath = tempUploadedImage || ($("#prodImgUrlInput") ? $("#prodImgUrlInput").value.trim() : "") || "assets/images/products/front.webp";

  if (!title || isNaN(price) || price <= 0) {
    alert("Please provide a valid product title and price.");
    return;
  }

  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);

  if (editingId) {
    // Edit existing product
    const target = allProducts.find(p => p.id === editingId);
    if (target) {
      target.title = title;
      target.name = title;
      target.weight = weight;
      target.netWeight = weight;
      target.price = price;
      target.comparePrice = comparePrice;
      target.stock = stock;
      target.badge = badge;
      target.group = group;
      target.shortDesc = shortDesc;
      target.subtitle = shortDesc;
      target.fullDesc = fullDesc;
      if (imagePath && imagePath !== "Uploaded Image (Data)") {
        target.img = target.img || {};
        target.img.front = imagePath;
        if (!target.img.pair) target.img.pair = imagePath;
        if (!target.img.back) target.img.back = imagePath;
      }
      toast(`Product "${title}" updated successfully!`);
    }
  } else {
    // Create new product
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + weight.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const id = "prod-" + Date.now();

    const newProd = {
      id,
      slug,
      group,
      name: title,
      title,
      subtitle: shortDesc,
      weight,
      netWeight: weight,
      price,
      comparePrice,
      stock,
      featured: true,
      badge: badge || "New",
      maxQty: 20,
      img: {
        front: imagePath,
        back: imagePath,
        pair: imagePath
      },
      shortDesc,
      fullDesc,
      packaging: "Airtight clear jar with double freshness seal",
      shelfLife: "12 months from packing date",
      note: ""
    };

    allProducts.unshift(newProd);
    toast(`Product "${title}" created successfully!`);
  }

  if (typeof saveProducts === "function") {
    saveProducts(allProducts);
  } else {
    Store.set("app_products", allProducts);
    window.PRODUCTS = allProducts;
  }

  // Cloudflare D1 Remote Sync
  if (typeof saveProductRemote === "function") {
    const savedItem = editingId ? allProducts.find(p => p.id === editingId) : allProducts[0];
    if (savedItem) saveProductRemote(savedItem, !editingId);
  }

  const modal = $("#dlg-product-modal");
  if (modal) modal.close();

  renderProductsGrid();
}

// Mark Product Out of Stock
function markOutOfStock(productId) {
  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const target = allProducts.find(p => p.id === productId);
  if (!target) return;

  target.stock = 0;
  if (typeof saveProducts === "function") {
    saveProducts(allProducts);
  } else {
    Store.set("app_products", allProducts);
    window.PRODUCTS = allProducts;
  }

  // Cloudflare D1 Remote Sync
  if (typeof updateProductStockRemote === "function") {
    updateProductStockRemote(productId, 0);
  }

  toast(`"${target.title || target.name}" marked Out of Stock`);
  renderProductsGrid();
}

// Open Dedicated Restock Modal with Waitlist Notifications
async function restockProduct(productId) {
  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const target = allProducts.find(p => p.id === productId);
  if (!target) return;

  const current = target.stock || 0;
  let modal = $("#dlg-restock-modal");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-restock-modal";
    modal.setAttribute("aria-label", "Restock Product");
    document.body.appendChild(modal);
  }

  // Fetch waitlist for this product
  let waitlist = [];
  try {
    const res = await fetch(getNotifyEndpoint(`?productId=${encodeURIComponent(target.id)}`));
    if (res.ok) {
      const data = await res.json();
      waitlist = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn("Could not fetch remote waitlist:", err);
  }

  // Include local Store fallback items if any
  if (typeof Store !== "undefined") {
    const local = (Store.get("app_restock_requests") || []).filter(r => r.productId === target.id);
    local.forEach(loc => {
      const exists = waitlist.some(w => 
        (loc.email && w.customer_email === loc.email) || 
        (loc.phone && w.customer_phone === loc.phone)
      );
      if (!exists) {
        waitlist.push({
          id: loc.id || 'loc-' + Math.random().toString(36).slice(2, 8),
          product_id: target.id,
          product_title: target.title || target.name,
          customer_name: loc.name || "Customer",
          customer_email: loc.email || "",
          customer_phone: loc.phone || "",
          want_whatsapp: loc.wantWhatsapp ? 1 : 0,
          status: loc.status || 'pending',
          created_at: loc.createdAt || new Date().toISOString()
        });
      }
    });
  }

  // Update in-memory waitlists cache
  if (Array.isArray(appWaitlists)) {
    appWaitlists = appWaitlists.filter(w => w.product_id !== target.id).concat(waitlist);
  }

  const pending = waitlist.filter(w => w.status !== "notified");
  const notified = waitlist.filter(w => w.status === "notified");
  const emailList = pending.map(c => c.customer_email).filter(Boolean);
  const phoneList = pending.map(c => c.customer_phone).filter(Boolean);

  const productUrl = `https://msrfoodsofficial.food/#/product/${target.slug || target.id}`;
  const emailSubject = `MSR Foods: ${target.title} is Back in Stock!`;
  const emailBody = `Salam / Hello!

Great news! The product you asked to be notified about, "${target.title} (${target.weight || 'Standard'})", is now back in stock and ready to order at MSR Foods!

You can order directly online right now:
${productUrl}

Fast nationwide delivery across Pakistan with Cash on Delivery is available.

Warm regards,
MSR Foods Team
Official Store: https://msrfoodsofficial.food
WhatsApp Support: 0336-8835501`;

  const mailtoBroadcastUrl = `mailto:?bcc=${encodeURIComponent(emailList.join(","))}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  modal.innerHTML = `
    <div class="dlg" style="width:min(580px,94vw);max-height:90vh;overflow-y:auto">
      <style>
        #dlg-restock-modal label { color: #f4d77f !important; font-size: 13.5px !important; font-weight: 600 !important; margin-bottom: 6px !important; display: flex !important; }
        #dlg-restock-modal input { background: #14100a !important; color: #f4d77f !important; border: 1.5px solid rgba(214, 167, 54, 0.35) !important; padding: 12px 14px !important; border-radius: 8px !important; width: 100% !important; box-sizing: border-box !important; }
      </style>
      <button class="ic dlg-x" onclick="document.getElementById('dlg-restock-modal').close()">${ICON.x}</button>
      
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:rgba(16,185,129,0.15);color:#34d399;display:grid;place-items:center;font-size:22px">📦</div>
        <div>
          <h3 style="font-size:20px;margin:0">Restock Product</h3>
          <p style="font-size:13.5px;color:var(--mute-dark);margin:2px 0 0">${esc(target.title || target.name)} (${esc(target.weight || '')})</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--hair);border-radius:var(--r-sm);padding:12px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13.5px;color:var(--mute-dark)">Current Inventory:</span>
        <span class="tag tag-${current > 0 ? 'emerald' : 'rose'}">${current > 0 ? `In Stock (${current} units)` : 'Out of Stock (0 units)'}</span>
      </div>

      <!-- Restock Quantity Form -->
      <form onsubmit="event.preventDefault(); applyRestock('${target.id}', parseInt(document.getElementById('restockQtyInput').value));">
        <div class="f">
          <label for="restockQtyInput">Units to Add into Inventory:</label>
          <input type="number" id="restockQtyInput" min="1" max="9999" value="25" required style="font-size:20px;font-weight:700;text-align:center;color:var(--gold-hi)">
        </div>

        <div style="margin-top:12px">
          <span style="font-size:12px;color:var(--mute-dark)">1-Click Quick Add:</span>
          <div class="preset-img-chips" style="margin-top:6px">
            <span class="preset-chip" onclick="applyRestock('${target.id}', 10)">+10 Units</span>
            <span class="preset-chip active" onclick="applyRestock('${target.id}', 25)">+25 (Standard)</span>
            <span class="preset-chip" onclick="applyRestock('${target.id}', 50)">+50 (Bulk)</span>
            <span class="preset-chip" onclick="applyRestock('${target.id}', 100)">+100 (Carton)</span>
          </div>
        </div>

        <!-- CUSTOMER WAITLIST NOTIFICATION PANEL -->
        <div style="margin-top:22px;border-top:1px solid var(--hair);padding-top:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--gold-hi);display:flex;align-items:center;gap:6px">
                <span>🔔</span>
                <span>Restock Waitlist (${pending.length} Waiting)</span>
              </div>
              <div style="font-size:12px;color:var(--mute-dark);margin-top:2px">
                ${emailList.length} customer(s) with Email · ${phoneList.length} with Phone
              </div>
            </div>
            ${pending.length > 0 ? `
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${emailList.length > 0 ? `
                  <a href="${mailtoBroadcastUrl}" class="btn btn-xs btn-gold" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                    📢 Send Email (BCC)
                  </a>
                  <button type="button" class="btn btn-xs btn-line" onclick="copyWaitlistEmails('${target.id}')">
                    📋 Copy Emails
                  </button>
                ` : ''}
                <button type="button" class="btn btn-xs btn-line" onclick="markProductWaitlistNotified('${target.id}')" style="color:#34d399">
                  ✓ Mark All Notified
                </button>
              </div>
            ` : ''}
          </div>

          ${pending.length === 0 ? `
            <div style="background:rgba(255,255,255,0.02);border:1px dashed var(--hair);border-radius:var(--r-sm);padding:14px;text-align:center;color:var(--mute-dark);font-size:13px">
              ℹ️ No pending restock waitlist requests for this product.
              ${notified.length > 0 ? `<div style="font-size:11.5px;color:#34d399;margin-top:4px">✓ ${notified.length} customer(s) were notified in previous restocks.</div>` : ''}
            </div>
          ` : `
            <div style="max-height:190px;overflow-y:auto;border:1px solid var(--hair);border-radius:8px;background:rgba(0,0,0,0.3)">
              <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
                <thead style="background:rgba(255,255,255,0.05);color:var(--sand);position:sticky;top:0">
                  <tr>
                    <th style="padding:7px 10px">Customer</th>
                    <th style="padding:7px 10px">Email</th>
                    <th style="padding:7px 10px">Phone</th>
                    <th style="padding:7px 10px">Date</th>
                    <th style="padding:7px 10px;text-align:right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pending.map(c => {
                    const cleanPhone = (c.customer_phone || '').replace(/[^0-9]/g, '');
                    const waText = encodeURIComponent(`Salam ${c.customer_name || ''}! ${target.title} is now back in stock at MSR Foods! Order here: ${productUrl}`);
                    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : ('92' + cleanPhone.replace(/^0/, ''))}?text=${waText}` : '';
                    const mailSingleUrl = c.customer_email ? `mailto:${c.customer_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : '';
                    return `
                      <tr style="border-top:1px solid rgba(255,255,255,0.05)">
                        <td style="padding:7px 10px;font-weight:600;color:var(--cream)">${esc(c.customer_name || 'Customer')}</td>
                        <td style="padding:7px 10px;color:var(--mute-dark)">${c.customer_email ? `<a href="${mailSingleUrl}" style="color:var(--gold-hi);text-decoration:none">${esc(c.customer_email)}</a>` : '—'}</td>
                        <td style="padding:7px 10px;color:var(--mute-dark)">
                          ${c.customer_phone ? `
                            <span>${esc(c.customer_phone)}</span>
                            ${waUrl ? `<a href="${waUrl}" target="_blank" rel="noopener" style="margin-left:4px;color:#25D366;text-decoration:none;font-weight:600" title="WhatsApp message">💬</a>` : ''}
                          ` : '—'}
                        </td>
                        <td style="padding:7px 10px;color:var(--mute-dark);white-space:nowrap">${new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                        <td style="padding:7px 10px;text-align:right;white-space:nowrap">
                          <button type="button" class="btn btn-xs btn-line" onclick="markSingleWaitlistNotified('${c.id}', '${target.id}')" style="padding:2px 6px;font-size:10px" title="Mark as notified">
                            ✓ Done
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;border-top:1px solid var(--hair);padding-top:16px">
          <button type="button" class="btn btn-line btn-sm" onclick="document.getElementById('dlg-restock-modal').close()">Cancel</button>
          <button type="submit" class="btn btn-gold btn-sm">Confirm Restock</button>
        </div>
      </form>
    </div>
  `;

  modal.showModal();
}

function applyRestock(productId, qty) {
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid positive quantity.");
    return;
  }

  const allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const target = allProducts.find(p => p.id === productId);
  if (!target) return;

  const current = target.stock || 0;
  target.stock = current + qty;

  if (typeof saveProducts === "function") {
    saveProducts(allProducts);
  } else {
    Store.set("app_products", allProducts);
    window.PRODUCTS = allProducts;
  }

  // Cloudflare D1 Remote Sync
  if (typeof updateProductStockRemote === "function") {
    updateProductStockRemote(productId, target.stock);
  }

  const modal = $("#dlg-restock-modal");
  if (modal) modal.close();

  // Check if there are waiting customers for this product
  const pendingCustomers = (appWaitlists || []).filter(w => w.product_id === productId && w.status !== "notified");
  if (pendingCustomers.length > 0) {
    toast(`"${target.title || target.name}" restocked with +${qty} units! ${pendingCustomers.length} customer(s) are on the restock waitlist.`);
  } else {
    toast(`"${target.title || target.name}" restocked with +${qty} units!`);
  }

  renderProductsGrid();
  if (typeof renderDashboard === "function") renderDashboard();
}

// Global window exposure for inline onclick handlers
window.restockProduct = restockProduct;
window.applyRestock = applyRestock;
window.markOutOfStock = markOutOfStock;
window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;
window.executeDeleteProduct = executeDeleteProduct;
window.openAddOrderModal = openAddOrderModal;
window.recalcManualOrderTotal = recalcManualOrderTotal;
window.createManualOrder = createManualOrder;
window.handleOrderAction = execOrderAction;
window.toggleActionsMenu = toggleActionsMenu;
window.closeActionsMenu = closeActionsMenu;
window.execOrderAction = execOrderAction;
window.switchTab = switchTab;

// Delete Product - In-App Custom Confirmation Dialog (Replaces native confirm)
function deleteProduct(productId) {
  let allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const target = allProducts.find(p => p.id === productId);
  if (!target) return;

  let modal = $("#dlg-confirm-delete");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-confirm-delete";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="dlg" style="width:min(440px,94vw);text-align:center;padding:32px 24px">
      <div style="width:58px;height:58px;border-radius:50%;background:rgba(239,68,68,0.15);color:#ef4444;display:grid;place-items:center;font-size:26px;margin:0 auto 16px">
        🗑️
      </div>
      <h3 style="font-size:20px;color:var(--cream);margin-bottom:8px">Remove Product?</h3>
      <p style="font-size:14px;color:var(--sand);margin-bottom:24px;line-height:1.5">
        Are you sure you want to permanently remove <b style="color:var(--gold-hi)">"${esc(target.title || target.name)}"</b> from your store catalog?
      </p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button type="button" class="btn btn-sm btn-line" onclick="document.getElementById('dlg-confirm-delete').close()">Cancel</button>
        <button type="button" class="btn btn-sm btn-danger" onclick="executeDeleteProduct('${productId}')">Yes, Remove Product</button>
      </div>
    </div>
  `;

  modal.showModal();
}

function executeDeleteProduct(productId) {
  // Record in permanently deleted products registry
  let deletedIds = Store.get("app_deleted_products") || [];
  if (!deletedIds.includes(productId)) {
    deletedIds.push(productId);
    Store.set("app_deleted_products", deletedIds);
  }

  let allProducts = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  allProducts = allProducts.filter(p => p.id !== productId);

  if (typeof saveProducts === "function") {
    saveProducts(allProducts);
  } else {
    Store.set("app_products", allProducts);
    window.PRODUCTS = allProducts;
  }

  // Cloudflare D1 Remote Sync
  if (typeof deleteProductRemote === "function") {
    deleteProductRemote(productId);
  }

  const modal = $("#dlg-confirm-delete");
  if (modal) modal.close();

  toast(`Product removed successfully`);
  renderProductsGrid();
}

// White-Label Theme Customizer Controller
function initCustomizer() {
  const presetSelect = $("#themePresetSelect");
  const brandNameInput = $("#customBrandName");
  const taglineInput = $("#customTagline");
  const primaryColorInput = $("#customPrimaryColor");
  const hexLabel = $("#primaryHexLabel");

  // Load current values
  if (brandNameInput) brandNameInput.value = window.BRAND_CONFIG.brand.name;
  if (taglineInput) taglineInput.value = window.BRAND_CONFIG.brand.tagline;

  // Preset Switcher
  if (presetSelect) {
    presetSelect.addEventListener("change", e => {
      const presetId = e.target.value;
      applyTheme(presetId);
      updateCustomizerInputsFromTheme(presetId);
      toast(`Switched theme to ${THEME_PRESETS[presetId].name}`);
    });
  }

  // Live Brand Name input
  if (brandNameInput) {
    brandNameInput.addEventListener("input", e => {
      const newName = e.target.value.trim() || "Brand Name";
      window.BRAND_CONFIG.brand.name = newName;
      $$(".brand-name-dynamic").forEach(el => el.textContent = newName);
      $("#previewBrandName").textContent = newName;
    });
  }

  // Primary Color input
  if (primaryColorInput) {
    primaryColorInput.addEventListener("input", e => {
      const hex = e.target.value;
      if (hexLabel) hexLabel.textContent = hex.toUpperCase();
      applyTheme("custom", {
        "--gold": hex,
        "--gold-hi": hex,
        "--gold-grad": `linear-gradient(135deg, ${hex} 0%, ${hex} 60%, #000 100%)`
      });
    });
  }
}

function updateCustomizerInputsFromTheme(presetId) {
  const preset = THEME_PRESETS[presetId];
  if (!preset) return;
  const primary = preset.colors["--gold"];
  const colorInput = $("#customPrimaryColor");
  const hexLabel = $("#primaryHexLabel");
  if (colorInput && primary.startsWith("#")) colorInput.value = primary;
  if (hexLabel) hexLabel.textContent = primary.toUpperCase();
}

async function syncAndBuildDeployments() {
  const currentProds = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const currentBrand = window.BRAND_CONFIG || {};
  const theme = localStorage.getItem('app_active_theme') || 'luxury-gold';
  
  // Persist white-label brand and theme settings in Cloudflare D1
  try {
    const endpoint = (currentBrand && currentBrand.urls && currentBrand.urls.apiUrl)
      ? currentBrand.urls.apiUrl.replace(/\/$/, "") + "/api/settings"
      : "/api/settings";

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: currentBrand, theme: theme })
    });
  } catch (err) {
    console.warn("Could not save brand settings to Cloudflare D1:", err);
  }

  try {
    const res = await fetch('/api/sync-and-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: currentProds,
        brandConfig: currentBrand,
        theme: theme
      })
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Sync build server request failed:', err);
  }
  return false;
}

async function downloadWebsitePackage() {
  toast("📦 Preparing latest Storefront ZIP for Cloudflare...");
  await syncAndBuildDeployments();
  const a = document.createElement('a');
  a.href = '/cloudflare-website.zip?t=' + Date.now();
  a.download = 'cloudflare-website.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast("✅ Storefront ZIP downloaded! Upload this folder or ZIP to Cloudflare Pages.");
}

async function downloadAdminPackage() {
  toast("⚙️ Preparing latest Admin Portal ZIP for Cloudflare...");
  await syncAndBuildDeployments();
  const a = document.createElement('a');
  a.href = '/cloudflare-admin.zip?t=' + Date.now();
  a.download = 'cloudflare-admin.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast("✅ Admin Portal ZIP downloaded! Upload this to your Cloudflare Pages Admin project.");
}

function exportBrandConfig() {
  const currentBrand = window.BRAND_CONFIG.brand;
  const currentDelivery = window.BRAND_CONFIG.delivery;
  const currentContact = window.BRAND_CONFIG.contact;
  const currentSocial = window.BRAND_CONFIG.social;

  const exportCode = `// Generated White-Label Configuration
const BRAND_CONFIG = {
  brand: {
    name: "${currentBrand.name}",
    fullName: "${currentBrand.fullName || currentBrand.name}",
    tagline: "${currentBrand.tagline}",
    slogan: "${currentBrand.slogan || ''}",
    description: "${currentBrand.description || ''}",
    defaultTheme: "${localStorage.getItem('app_active_theme') || 'luxury-gold'}"
  },
  logo: {
    type: "image",
    src: "assets/images/logo.webp",
    alt: "${currentBrand.name} Logo"
  },
  currency: {
    symbol: "PKR",
    code: "PKR",
    format: (amount) => "PKR " + Number(amount || 0).toLocaleString("en-US")
  },
  delivery: ${JSON.stringify(currentDelivery, null, 2)},
  contact: ${JSON.stringify(currentContact, null, 2)},
  social: ${JSON.stringify(currentSocial, null, 2)}
};`;

  const modal = $("#dlg-export-config");
  if (!modal) return;
  modal.innerHTML = `
    <div class="dlg" style="width:min(720px,94vw)">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-export-config').close()">${ICON.x}</button>
      <h3 style="font-size:22px;margin-bottom:8px">🚀 Cloudflare Pages Deployments & Export</h3>
      <p style="font-size:13.5px;color:var(--mute-dark);margin-bottom:16px">Download pre-packaged, separate ZIP archives ready for Cloudflare Pages Direct Upload.</p>
      
      <div style="background:rgba(214,167,54,0.08);border:1px solid rgba(214,167,54,0.25);border-radius:10px;padding:16px;margin-bottom:18px">
        <h4 style="font-size:15px;color:var(--gold-hi);margin-bottom:8px">📦 Cloudflare Pages Ready Packages</h4>
        <p style="font-size:12.5px;color:#d1c7b7;margin-bottom:14px;line-height:1.5">
          • <strong>Storefront Website</strong>: Main customer-facing site with <code>index.html</code>, product catalog, cart, and styles.<br>
          • <strong>Admin Portal</strong>: Dedicated admin site configured with <code>index.html</code> at the root so it loads directly at <code>admin.yourdomain.com</code> or <code>admin.pages.dev</code>.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-gold btn-sm" onclick="downloadWebsitePackage()">📥 Download Website ZIP</button>
          <button class="btn btn-line btn-sm" onclick="downloadAdminPackage()">⚙️ Download Admin ZIP</button>
        </div>
      </div>

      <h4 style="font-size:14px;color:var(--gold-hi);margin-bottom:6px">Raw Configuration Code (brand.config.js)</h4>
      <textarea class="f" style="width:100%;height:180px;font-family:monospace;font-size:12px;line-height:1.45;background:#000;color:#34d399;border-color:var(--hair)" readonly>${exportCode}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
        <button class="btn btn-line btn-sm" onclick="navigator.clipboard.writeText(\`${exportCode.replace(/`/g, '\\`')}\`); toast('Configuration copied to clipboard!')">Copy Code</button>
        <button class="btn btn-line btn-sm" onclick="document.getElementById('dlg-export-config').close()">Close</button>
      </div>
    </div>
  `;
  modal.showModal();
}

window.downloadWebsitePackage = downloadWebsitePackage;
window.downloadAdminPackage = downloadAdminPackage;
window.syncAndBuildDeployments = syncAndBuildDeployments;

// Initialize Admin Portal
function initAdmin() {
  if (!checkAdminAuth()) {
    return;
  }
  if (typeof loadLocalBrandSettings === "function") {
    loadLocalBrandSettings();
  }
  initTheme();
  seedDefaultOrders();
  initTabs();
  renderDashboard();
  initCustomizer();
  loadStoreSettingsForm();
  if (typeof syncSettingsRemote === "function") {
    syncSettingsRemote().then(() => {
      loadStoreSettingsForm();
    });
  }
  syncRemoteOrders();
  if (typeof syncProductsRemote === "function") {
    syncProductsRemote();
  }
  if (typeof fetchWaitlists === "function") {
    fetchWaitlists().then(() => {
      if (typeof currentTab !== "undefined" && currentTab === "products") {
        renderProductsGrid();
      }
    });
  }

  // Dynamic Live Store Link
  const liveBtn = $("#liveStoreBtn");
  if (liveBtn && window.BRAND_CONFIG && window.BRAND_CONFIG.urls) {
    const isCloudflare = window.location.hostname.includes("pages.dev");
    liveBtn.href = isCloudflare 
      ? (window.BRAND_CONFIG.urls.cloudflareWebsiteUrl || "https://msrfoods.pages.dev")
      : (window.BRAND_CONFIG.urls.websiteUrl || "http://localhost:8080/");
  }

  // Order Search
  const searchInput = $("#orderSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", renderOrdersTable);
  }

  // Order Filter Pills
  $$("#tab-orders .filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      $$("#tab-orders .filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentOrderFilter = pill.dataset.filter;
      renderOrdersTable();
    });
  });

  // Product Search
  const prodSearchInput = $("#productSearchInput");
  if (prodSearchInput) {
    prodSearchInput.addEventListener("input", renderProductsGrid);
  }

  // Product Filter Pills
  $$("#productFilterPills .filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      $$("#productFilterPills .filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentProdFilter = pill.dataset.prodFilter;
      renderProductsGrid();
    });
  });
  window.addEventListener("hashchange", () => {
    if (!isAdminAuthenticated()) {
      checkAdminAuth();
      return;
    }
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash && $(`#tab-${hash}`)) switchTab(hash);
  });
}

// ==========================================================================
// White-Label Store Settings & Social Links Management
// ==========================================================================
function loadStoreSettingsForm() {
  const currentBrand = window.BRAND_CONFIG || {};
  const social = currentBrand.social || {};
  const contact = currentBrand.contact || {};
  const delivery = currentBrand.delivery || {};

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.value = val;
  };

  // Social Links
  setVal("settingTiktok", social.tiktok || "");
  setVal("settingInstagram", social.instagram || "");
  setVal("settingFacebook", social.facebook || "");
  setVal("settingYoutube", social.youtube || "");

  // Contact Details
  setVal("settingWhatsapp", contact.whatsapp || "");
  setVal("settingPhone", contact.phone || "");
  setVal("settingPhoneIntl", contact.phoneIntl || "");
  setVal("settingEmail", contact.email || "");
  setVal("settingSupportHours", contact.supportHours || "");
  setVal("settingAddress", Array.isArray(contact.address) ? contact.address.join(", ") : (contact.address || ""));

  // Fulfillment Rates
  setVal("settingFee", delivery.fee != null ? delivery.fee : 200);
  setVal("settingFreeThreshold", delivery.freeShippingThreshold != null ? delivery.freeShippingThreshold : 5000);
  setVal("settingEta", delivery.eta || "3–5 working days");
}

function openSaveSettingsConfirmation() {
  const tiktok = ($("#settingTiktok") ? $("#settingTiktok").value.trim() : "");
  const instagram = ($("#settingInstagram") ? $("#settingInstagram").value.trim() : "");
  const facebook = ($("#settingFacebook") ? $("#settingFacebook").value.trim() : "");
  const youtube = ($("#settingYoutube") ? $("#settingYoutube").value.trim() : "");
  const whatsapp = ($("#settingWhatsapp") ? $("#settingWhatsapp").value.trim() : "");
  const phone = ($("#settingPhone") ? $("#settingPhone").value.trim() : "");
  const phoneIntl = ($("#settingPhoneIntl") ? $("#settingPhoneIntl").value.trim() : "");
  const email = ($("#settingEmail") ? $("#settingEmail").value.trim() : "");
  const supportHours = ($("#settingSupportHours") ? $("#settingSupportHours").value.trim() : "");
  const address = ($("#settingAddress") ? $("#settingAddress").value.trim() : "");
  const fee = $("#settingFee") ? Number($("#settingFee").value) : 200;
  const freeThreshold = $("#settingFreeThreshold") ? Number($("#settingFreeThreshold").value) : 5000;
  const eta = ($("#settingEta") ? $("#settingEta").value.trim() : "3–5 working days");

  let modal = $("#dlg-confirm-settings");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-confirm-settings";
    modal.setAttribute("aria-label", "Confirm Store Settings Update");
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="dlg" style="width:min(600px,94vw);padding:28px 24px">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-confirm-settings').close()">${ICON.x}</button>
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;border-bottom:1px solid var(--hair);padding-bottom:14px">
        <div style="width:44px;height:44px;border-radius:10px;background:rgba(214,167,54,0.15);color:var(--gold-hi);display:grid;place-items:center;font-size:22px">
          💾
        </div>
        <div>
          <h3 style="font-size:20px;color:var(--cream);margin:0">Confirm Store & Social Updates</h3>
          <p style="font-size:13px;color:var(--mute-dark);margin:2px 0 0">Review changes before publishing live to the customer website</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.02);border:1px solid var(--hair);border-radius:8px;padding:16px;margin-bottom:18px;font-size:13px;line-height:1.6">
        <div style="color:var(--gold-hi);font-weight:700;margin-bottom:6px;text-transform:uppercase;font-size:11.5px;letter-spacing:0.05em">Summary of Updates:</div>
        <div style="display:grid;grid-template-columns:130px 1fr;gap:6px 12px;word-break:break-all">
          <span style="color:var(--sand)">🎵 TikTok:</span>
          <b>${esc(tiktok || "Not set")}</b>
          <span style="color:var(--sand)">📸 Instagram:</span>
          <b>${esc(instagram || "Not set")}</b>
          <span style="color:var(--sand)">📘 Facebook:</span>
          <b>${esc(facebook || "Not set")}</b>
          ${youtube ? `<span style="color:var(--sand)">▶️ YouTube:</span><b>${esc(youtube)}</b>` : ""}
          <span style="color:var(--sand)">💬 WhatsApp:</span>
          <b>${esc(whatsapp || "Not set")}</b>
          <span style="color:var(--sand)">📞 Phone:</span>
          <b>${esc(phone || "Not set")}</b>
          <span style="color:var(--sand)">✉️ Email:</span>
          <b>${esc(email || "Not set")}</b>
          <span style="color:var(--sand)">📍 Address:</span>
          <b>${esc(address || "Not set")}</b>
          <span style="color:var(--sand)">🚚 Shipping Fee:</span>
          <b>${money(fee)} (Free over ${money(freeThreshold)})</b>
        </div>
      </div>

      <div style="background:rgba(214,167,54,0.08);border:1px solid rgba(214,167,54,0.3);border-radius:8px;padding:14px;margin-bottom:20px">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <span style="font-size:18px">⚡</span>
          <p style="font-size:12.5px;color:#d1c7b7;margin:0;line-height:1.5">
            <strong>Direct Website Update:</strong> Once confirmed, these details will immediately save to your Cloudflare D1 database and update live on the storefront website (footer social links, contact page, quick WhatsApp ordering, and checkout shipping fee).
          </p>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px">
        <button type="button" class="btn btn-sm btn-line" onclick="document.getElementById('dlg-confirm-settings').close()">Cancel</button>
        <button type="button" id="btnConfirmPublishModal" class="btn btn-sm btn-gold" onclick="confirmSaveStoreSettings()">
          Confirm & Publish to Website
        </button>
      </div>
    </div>
  `;

  modal.showModal();
}

async function confirmSaveStoreSettings() {
  const btn = $("#btnConfirmPublishModal");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Publishing...";
  }

  const tiktok = ($("#settingTiktok") ? $("#settingTiktok").value.trim() : "");
  const instagram = ($("#settingInstagram") ? $("#settingInstagram").value.trim() : "");
  const facebook = ($("#settingFacebook") ? $("#settingFacebook").value.trim() : "");
  const youtube = ($("#settingYoutube") ? $("#settingYoutube").value.trim() : "");
  const whatsapp = ($("#settingWhatsapp") ? $("#settingWhatsapp").value.trim() : "");
  const phone = ($("#settingPhone") ? $("#settingPhone").value.trim() : "");
  const phoneIntl = ($("#settingPhoneIntl") ? $("#settingPhoneIntl").value.trim() : "");
  const email = ($("#settingEmail") ? $("#settingEmail").value.trim() : "");
  const supportHours = ($("#settingSupportHours") ? $("#settingSupportHours").value.trim() : "");
  const address = ($("#settingAddress") ? $("#settingAddress").value.trim() : "");
  const fee = $("#settingFee") ? Number($("#settingFee").value) : 200;
  const freeThreshold = $("#settingFreeThreshold") ? Number($("#settingFreeThreshold").value) : 5000;
  const eta = ($("#settingEta") ? $("#settingEta").value.trim() : "3–5 working days");

  if (!window.BRAND_CONFIG) window.BRAND_CONFIG = {};
  if (!window.BRAND_CONFIG.social) window.BRAND_CONFIG.social = {};
  window.BRAND_CONFIG.social.tiktok = tiktok;
  window.BRAND_CONFIG.social.instagram = instagram;
  window.BRAND_CONFIG.social.facebook = facebook;
  window.BRAND_CONFIG.social.youtube = youtube;

  if (!window.BRAND_CONFIG.contact) window.BRAND_CONFIG.contact = {};
  window.BRAND_CONFIG.contact.whatsapp = whatsapp;
  window.BRAND_CONFIG.contact.phone = phone;
  window.BRAND_CONFIG.contact.phoneIntl = phoneIntl || (phone.startsWith("0") ? "+92" + phone.slice(1) : phone);
  window.BRAND_CONFIG.contact.email = email;
  window.BRAND_CONFIG.contact.supportHours = supportHours;
  window.BRAND_CONFIG.contact.address = address ? [address] : ["Kohat, Pakistan"];

  if (!window.BRAND_CONFIG.delivery) window.BRAND_CONFIG.delivery = {};
  window.BRAND_CONFIG.delivery.fee = fee;
  window.BRAND_CONFIG.delivery.freeShippingThreshold = freeThreshold;
  window.BRAND_CONFIG.delivery.eta = eta;

  // Persist locally & remotely
  if (typeof saveBrandSettingsRemote === "function") {
    await saveBrandSettingsRemote(window.BRAND_CONFIG);
  } else {
    Store.set("app_brand_config", window.BRAND_CONFIG);
  }

  // Also sync and update packages
  if (typeof syncAndBuildDeployments === "function") {
    try {
      await syncAndBuildDeployments();
    } catch (e) {}
  }

  const modal = $("#dlg-confirm-settings");
  if (modal) modal.close();

  toast("✅ Store settings & social channels successfully published to website!");
}

window.loadStoreSettingsForm = loadStoreSettingsForm;
window.openSaveSettingsConfirmation = openSaveSettingsConfirmation;
window.confirmSaveStoreSettings = confirmSaveStoreSettings;
window.updateOrderStatusFromModal = updateOrderStatusFromModal;

// Start periodic live order polling
setInterval(syncRemoteOrders, 4000);

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}
