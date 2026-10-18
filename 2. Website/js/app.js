/**
 * =======================================================================
 * CORE APPLICATION RUNTIME & INTERACTIVITY
 * =======================================================================
 */

const ICON = {
  search: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  bag: '<svg class="i" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  user: '<svg class="i" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  menu: '<svg class="i" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  truck: '<svg class="i" viewBox="0 0 24 24"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  shield: '<svg class="i" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  leaf: '<svg class="i" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 2c-.5 4-1 5.5-2.1 11.2A7 7 0 0 1 11 20z"/><path d="M2 21c0-3 1.8-6 5-7"/></svg>',
  heart: '<svg class="i" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  zap: '<svg class="i" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  sun: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  trash: '<svg class="i" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  phone: '<svg class="i" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  mail: '<svg class="i" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  pin: '<svg class="i" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  lock: '<svg class="i" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  arrow: '<svg class="i" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  facebook: '<svg class="i" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  instagram: '<svg class="i" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  tiktok: '<svg class="i" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
  youtube: '<svg class="i" viewBox="0 0 24 24"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9 10 15"/></svg>'
};

window.ICON = ICON;

let toastTimer = null;
function toast(msg, link) {
  const t = $("#toast");
  if (!t) return;
  t.innerHTML = `<span>${msg}</span>${link ? `<a href="${link[1]}">${link[0]}</a>` : ""}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 4200);
}

function updateBadge(bump = false) {
  const b = $("#badge");
  if (!b) return;
  const n = itemCount();
  b.hidden = !n;
  b.textContent = n;
  const lbl = $("#cartLabel");
  if (lbl) lbl.textContent = `Cart, ${n} item${n === 1 ? "" : "s"}`;
  if (bump) {
    b.classList.remove("bump");
    void b.offsetWidth;
    b.classList.add("bump");
  }
}

function shell() {
  const B = window.BRAND_CONFIG.brand;
  const L = window.BRAND_CONFIG.logo;
  const C = window.BRAND_CONFIG.contact;

  const nav = [
    ["home", "Home", "#/"],
    ["shop", "Shop", "#/shop"],
    ["track", "Track Order", "#/track"],
    ["about", "About Us", "#/about"],
    ["contact", "Contact", "#/contact"]
  ];

  // Header
  const logoHtml = L.type === "image"
    ? `<img src="${L.src}" alt="${L.alt}" width="${L.width || 105}" height="${L.height || 62}">`
    : `<span class="logo-txt">${L.textFallback || B.name}</span>`;

  $("#hdr").innerHTML = `
    <div class="wrap hdr-in">
      <a class="logo" href="#/" aria-label="${B.name} Home">${logoHtml}</a>
      <nav class="nav" aria-label="Main Navigation">
        ${nav.map(n => `<a href="${n[2]}" data-nav="${n[0]}">${n[1]}</a>`).join("")}
      </nav>
      <div class="hdr-r">
        <button class="ic" data-act="search" aria-label="Search">${ICON.search}</button>
        <a class="ic" href="#/cart" aria-label="Cart">
          <span class="sr" id="cartLabel">Cart</span>
          ${ICON.bag}
          <span class="badge" id="badge" hidden>0</span>
        </a>
        <button class="ic" data-act="account" aria-label="Account">${ICON.user}</button>
        <a class="btn btn-gold btn-sm" href="#/shop">Shop Now</a>
        <button class="ic burger" data-act="menu" aria-label="Open navigation menu">${ICON.menu}</button>
      </div>
    </div>
  `;

  // Dialogs
  $("#dlg-menu").innerHTML = `
    <div class="dlg">
      <button class="ic dlg-x" data-act="close" aria-label="Close menu">${ICON.x}</button>
      <div style="height:50px"></div>
      <nav class="menu-links" aria-label="Mobile Navigation">
        ${nav.map(n => `<a href="${n[2]}" data-nav="${n[0]}">${n[1]}</a>`).join("")}
      </nav>
      <a class="btn btn-gold" style="margin-top:24px" href="#/shop" data-act="close">Shop Now</a>
    </div>
  `;

  $("#dlg-search").innerHTML = `
    <div class="dlg">
      <div class="search-box">
        ${ICON.search}
        <input id="sq" type="search" placeholder="Search products, ingredients, FAQs..." autocomplete="off">
        <button class="ic" data-act="close" aria-label="Close search">${ICON.x}</button>
      </div>
      <div class="search-res" id="sres" aria-live="polite"></div>
    </div>
  `;

  $("#dlg-account").innerHTML = `
    <div class="dlg acct">
      <button class="ic dlg-x" data-act="close" aria-label="Close">${ICON.x}</button>
      <h3>Guest Checkout</h3>
      <p>No customer login required. You can complete your order in seconds directly with Cash on Delivery or Mobile Wallets.</p>
      <a class="btn btn-gold" href="#/shop" data-act="close">Start Shopping</a>
    </div>
  `;

  // Footer
  const socKeys = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]];
  $("#ftr").innerHTML = `
    <div class="wrap">
      <div class="ftr-grid">
        <div>
          ${logoHtml}
          <p class="ftr-tag">${B.tagline}</p>
          <div class="soc">
            ${socKeys.map(s => {
              const u = window.BRAND_CONFIG.social[s[0]];
              return u
                ? `<a href="${u}" target="_blank" rel="noopener" aria-label="${s[1]}">${ICON[s[0]]}</a>`
                : `<a href="#/contact" aria-label="${s[1]}">${ICON[s[0]]}</a>`;
            }).join("")}
          </div>
        </div>
        <div>
          <h4>Navigation</h4>
          <ul>
            <li><a href="#/">Home</a></li>
            <li><a href="#/shop">Shop</a></li>
            <li><a href="#/about">About Us</a></li>
            <li><a href="#/contact">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4>Customer Care</h4>
          <ul>
            <li><a href="#/policy/shipping">Shipping & Delivery</a></li>
            <li><a href="#/policy/returns">Returns & Refunds</a></li>
            <li><a href="#/policy/privacy">Privacy Policy</a></li>
            <li><a href="#/policy/terms">Terms & Conditions</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact Information</h4>
          <ul class="ct">
            <li>${ICON.phone}<a href="tel:${C.phoneIntl}">${C.phone}</a></li>
            <li>${ICON.mail}<a href="mailto:${C.email}">${C.email}</a></li>
            <li>${ICON.pin}<span>${C.address.join("<br>")}</span></li>
          </ul>
        </div>
      </div>
      <div class="ftr-bot">
        <span>© ${B.foundedYear} ${B.name}. ${B.license}.</span>
        <span>Payment Supported: Cash on Delivery · Bank Transfer · Easypaisa · JazzCash</span>
      </div>
    </div>
  `;

  updateBadge();
}

// Search
function runSearch(q) {
  q = q.trim().toLowerCase();
  const index = [
    ...(window.PRODUCTS || []).map(p => ({
      t: `${p.name} (${p.weight})`,
      d: `${p.netWeight} · ${priceTxt(p)}`,
      u: `#/product/${p.slug}`,
      k: `${p.name} ${p.weight} ${p.subtitle} ${p.shortDesc} buy order`
    })),
    ...(window.INGREDIENTS || []).map(i => ({
      t: `${i.name} (Ingredient)`,
      d: i.desc,
      u: `#/product`,
      k: `${i.name} ingredient raw nut dry fruit`
    })),
    { t: "Shop Products", d: "Explore full store collection", u: "#/shop", k: "shop buy items catalog" },
    { t: "Contact & Support", d: "WhatsApp, phone and email", u: "#/contact", k: "contact help support phone whatsapp" },
    { t: "Shipping & Delivery", d: "Flat rate nationwide delivery", u: "#/policy/shipping", k: "shipping delivery charges fee couriers" }
  ];

  const results = q ? index.filter(i => (i.t + " " + i.d + " " + i.k).toLowerCase().includes(q)) : index.slice(0, 4);
  const container = $("#sres");
  if (!container) return;

  container.innerHTML = results.length
    ? results.map(r => `<a href="${r.u}" data-act="close"><b>${r.t}</b><span>${r.d}</span></a>`).join("")
    : `<div class="search-empty">No results found for “${esc(q)}”. Try searching for “honey”, “almonds” or “shipping”.</div>`;
}

function updatePay() {
  const sel = $('input[name="pay"]:checked');
  const detailBox = $("#payDetail");
  if (!sel || !detailBox) return;
  const method = (window.BRAND_CONFIG.payments || []).find(x => x.id === sel.value) || {};
  detailBox.innerHTML = `
    <b>${method.name} Instructions</b>
    <p style="margin-top:6px;font-size:14.5px;color:var(--mute-dark)">${method.detail || method.short}</p>
  `;
}

// Order Dispatching
function placeOrder(e) {
  if (e && e.preventDefault) e.preventDefault();
  const g = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");
  const phone = g("f-phone").replace(/[\s-]/g, "");

  const checks = [
    ["f-name", g("f-name").length >= 2],
    ["f-phone", /^(\+92|0092|0)?3\d{9}$/.test(phone)],
    ["f-email", !g("f-email") || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g("f-email"))],
    ["f-addr", g("f-addr").length >= 5],
    ["f-city", g("f-city").length >= 2]
  ];

  let firstBad = null;
  checks.forEach(([id, ok]) => {
    const el = $("#" + id);
    if (!el) return;
    const parent = el.closest(".f");
    if (parent) parent.classList.toggle("bad", !ok);
    if (!ok && !firstBad) firstBad = id;
  });

  if (firstBad) {
    const target = $("#" + firstBad);
    if (target) {
      target.focus();
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return;
  }

  const L = lines();
  if (!L.length) {
    location.hash = "#/cart";
    return;
  }

  const submitBtn = (e && e.target ? (e.target.querySelector("button[type=\"submit\"]") || e.target) : null) || document.querySelector("#coForm button[type=\"submit\"]");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Your Order...";
  }

  const t = totals();
  const now = new Date();
  const dateStr = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  const randId = Math.floor(1000 + Math.random() * 9000);
  const orderId = `${window.BRAND_CONFIG.brand.name}-${dateStr}-${randId}`;

  const payVal = $('input[name="pay"]:checked') ? $('input[name="pay"]:checked').value : "cod";

  const order = {
    id: orderId,
    createdAt: now.toISOString(),
    status: "Pending",
    items: L.map(l => ({
      id: l.p.id,
      name: l.p.name,
      weight: l.p.netWeight,
      qty: l.qty,
      price: l.p.price
    })),
    subtotal: t.sub,
    shipping: t.ship,
    total: t.total,
    paymentMethod: payVal,
    customer: {
      name: g("f-name"),
      phone: g("f-phone"),
      email: g("f-email"),
      address: g("f-addr"),
      city: g("f-city"),
      province: $("#f-prov") ? $("#f-prov").value : "",
      zip: g("f-zip"),
      notes: g("f-note")
    },
    // Backwards compatibility with receipt views
    name: g("f-name"),
    phone: g("f-phone"),
    email: g("f-email"),
    addr: g("f-addr"),
    city: g("f-city"),
    prov: $("#f-prov") ? $("#f-prov").value : "",
    zip: g("f-zip"),
    note: g("f-note"),
    pay: payVal
  };

  saveOrder(order);

  // Clear cart
  cart.items = {};
  saveCart();

  location.hash = "#/confirmation";
}

// Router trigger
function route() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  const key = parts[0] || "home";

  let v = null;
  if (key === "policy") v = views.policy(parts[1]);
  else if (key === "product") v = views.product(parts[1]);
  else if (views[key]) v = views[key](parts[1]);
  else v = views.home();

  if (!v) return;

  const app = $("#app");
  if (app) app.innerHTML = v.html;
  document.title = v.title;
  document.body.classList.toggle("has-mbar", !!v.mbar);

  // Highlight active navigation links
  $$(".nav a, .menu-links a").forEach(a => {
    a.classList.toggle("on", a.getAttribute("href") === location.hash || (location.hash === "" && a.dataset.nav === "home"));
  });

  window.scrollTo({ top: 0, behavior: "instant" });
  afterRender();
  updatePay();
}

function afterRender() {
  // Intersection Observer for smooth reveal
  const els = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add("in"));
  }

  // Interactive mouse parallax on hero jar
  const jar = $("#heroJar");
  const hero = $(".hero");
  if (jar && hero && matchMedia("(hover:hover)").matches) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      jar.style.transform = `translate(${x * -16}px, ${y * -12}px)`;
    });
    hero.addEventListener("pointerleave", () => {
      jar.style.transform = "";
    });
  }

  // Showcase orbs parallax
  const stage = $("#stage");
  if (stage && matchMedia("(hover:hover)").matches) {
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      $$(".orb", stage).forEach(o => {
        const factor = +o.dataset.p || 10;
        o.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });
  }
}

// Global Event Listeners
document.addEventListener("click", e => {
  const actBtn = e.target.closest("[data-act]");
  if (!actBtn) {
    if (e.target.tagName === "DIALOG") e.target.close();
    return;
  }

  const act = actBtn.dataset.act;

  if (act === "inc" || act === "dec") {
    const box = actBtn.closest(".qty");
    const inp = $("input", box);
    const newVal = clampQ(+inp.value + (act === "inc" ? 1 : -1));
    inp.value = newVal;
    if (box.dataset.cart) {
      const pid = box.dataset.pid;
      cart.items[pid] = newVal;
      saveCart();
      route();
    }
  } else if (act === "add") {
    const p = getP(actBtn.dataset.pid);
    if (!p || !canBuy(p)) return;
    const qInp = actBtn.dataset.q ? $("#" + actBtn.dataset.q) : null;
    const qty = clampQ(qInp ? qInp.value : 1);
    cart.items[p.id] = Math.min((cart.items[p.id] || 0) + qty, MAXQ);
    saveCart();
    updateBadge(true);
    toast(`${qty} × ${p.name} (${p.weight}) added to cart`, ["View Cart", "#/cart"]);
  } else if (act === "buy") {
    const p = getP(actBtn.dataset.pid);
    if (!p || !canBuy(p)) return;
    const qInp = actBtn.dataset.q ? $("#" + actBtn.dataset.q) : null;
    const qty = clampQ(qInp ? qInp.value : 1);
    cart.items[p.id] = Math.max(cart.items[p.id] || 0, qty);
    saveCart();
    location.hash = "#/checkout";
  } else if (act === "remove") {
    delete cart.items[actBtn.dataset.pid];
    saveCart();
    route();
    toast("Item removed from cart");
  } else if (act === "thumb") {
    const p = getP(actBtn.dataset.pid);
    $$(".thumb").forEach(t => t.setAttribute("aria-pressed", t === actBtn));
    const mainImg = $("#galMain");
    if (mainImg && p) {
      mainImg.src = p.img[actBtn.dataset.src] || p.img.front;
    }
  } else if (act === "search") {
    const d = $("#dlg-search");
    if (d) {
      d.showModal();
      runSearch("");
      $("#sq").value = "";
      $("#sq").focus();
    }
  } else if (act === "account") {
    const d = $("#dlg-account");
    if (d) d.showModal();
  } else if (act === "menu") {
    const d = $("#dlg-menu");
    if (d) d.showModal();
  } else if (act === "close") {
    const d = actBtn.closest("dialog");
    if (d) d.close();
  }
});

document.addEventListener("input", e => {
  if (e.target.id === "sq") runSearch(e.target.value);
  if (e.target.name === "pay") updatePay();
  if (e.target.matches(".qty input")) e.target.value = e.target.value.replace(/\D/g, "").slice(0, 2);
});

document.addEventListener("change", e => {
  if (e.target.name === "pay") updatePay();
  if (e.target.matches(".qty input")) {
    const v = clampQ(e.target.value);
    e.target.value = v;
    const box = e.target.closest(".qty");
    if (box && box.dataset.cart) {
      cart.items[box.dataset.pid] = v;
      saveCart();
      route();
    }
  }
});

document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "coForm") placeOrder(e);
  if (e.target.id === "contactForm") {
    const name = $("#c-name").value.trim();
    const msg = $("#c-msg").value.trim();
    const phone = $("#c-phone").value.trim();
    if (!name || !msg) return;
    const subject = encodeURIComponent(`Message from ${name} (${window.BRAND_CONFIG.brand.name} Store)`);
    const body = encodeURIComponent(`${msg}\n\nSender: ${name}${phone ? '\nPhone: ' + phone : ''}`);
    location.href = `mailto:${window.BRAND_CONFIG.contact.email}?subject=${subject}&body=${body}`;
  }
});

window.addEventListener("hashchange", route);

// Live Cross-Tab Synchronization with Admin Portal
window.addEventListener("storage", (e) => {
  if (e.key === "app_products" || e.key === "app_active_theme" || e.key === "app_custom_theme_tokens") {
    if (typeof initTheme === "function") initTheme();
    if (typeof getProducts === "function") getProducts();
    if (typeof shell === "function") shell();
    if (typeof route === "function") route();
  }
});

// Application Bootstrap
function initApp() {
  initTheme();
  initCart();
  shell();
  route();

  // Dynamic Multi-Niche Catalog Sync from Cloudflare D1
  if (typeof syncProductsRemote === "function") {
    syncProductsRemote().then(prods => {
      if (prods && prods.length > 0 && typeof route === "function") {
        route();
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", initApp);
