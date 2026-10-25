/**
 * =======================================================================
 * SPA ROUTER & VIEW TEMPLATES
 * =======================================================================
 */

const views = {};

// View Helper Builders
function qtyCtl(id, val, extra = "") {
  return `
    <div class="qty" ${extra}>
      <button type="button" data-act="dec" aria-label="Decrease quantity">−</button>
      <input id="${id}" type="text" inputmode="numeric" value="${val}" aria-label="Quantity" readonly>
      <button type="button" data-act="inc" aria-label="Increase quantity">+</button>
    </div>
  `;
}

function accordion(id, title, body, open = false) {
  return `
    <details id="acc-${id}" ${open ? "open" : ""}>
      <summary>${title}</summary>
      <div class="acc-body">${body}</div>
    </details>
  `;
}

function secHero() {
  const B = window.BRAND_CONFIG.brand;
  const P = window.PRODUCTS[0];
  return `
    <section class="hero hex" aria-label="Introduction">
      <div class="hex-layer"></div>
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <h1>
            <span>Pure Taste.</span>
            <span class="g">Natural Goodness.</span>
          </h1>
          <p class="sub">${B.description || "A premium blend of raw mountain honey and golden-roasted dry fruits. Hand-selected nuts crafted for clean, everyday vitality."}</p>
          <div class="hero-cta">
            <a class="btn btn-gold" href="#/shop">Shop Now</a>
            <a class="btn btn-line" href="#/product/${P ? P.slug : 'honey-nut-mix-500g'}">Explore Product</a>
          </div>
        </div>
        <div class="hero-art">
          <svg class="ring" viewBox="0 0 560 560" aria-hidden="true">
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f7de8f"/>
                <stop offset="50%" stop-color="#d6a736"/>
                <stop offset="100%" stop-color="#9a6f1c"/>
              </linearGradient>
            </defs>
            <circle cx="280" cy="280" r="230"/>
            <circle class="c2" cx="280" cy="280" r="270"/>
          </svg>
          <img class="hero-jar" id="heroJar" src="${P ? P.img.front : 'assets/images/products/front.webp'}" alt="${B.name} Honey Nut Mix 500g" width="460" height="600">
        </div>
      </div>
    </section>
  `;
}

function secTrustStrip() {
  const D = window.BRAND_CONFIG.delivery;
  return `
    <div class="strip">
      <div class="wrap strip-in">
        <div>${ICON.truck}<div><b>Fast Pakistan Delivery</b><span>${D.area} (${D.eta})</span></div></div>
        <div>${ICON.leaf}<div><b>100% Pure Honey</b><span>Zero artificial sugars or preservatives</span></div></div>
        <div>${ICON.shield}<div><b>Double Freshness Seal</b><span>Hygienically sealed in clear premium jars</span></div></div>
      </div>
    </div>
  `;
}

function secWelcome() {
  const B = window.BRAND_CONFIG.brand;
  const P = window.PRODUCTS[0];
  return `
    <section class="sec sec-sand" aria-label="Welcome">
      <div class="wrap welcome">
        <div class="reveal">
          <span class="pill">Artisanal Excellence</span>
          <h2 class="h2" style="margin-top:14px">Welcome to ${B.fullName || B.name}</h2>
          <div class="rule"></div>
          <p class="lead">${B.name} was born out of a commitment to honest, pure food. We combine 100% natural, unadulterated honey with carefully sourced, crunchy dry fruits so that every spoon provides authentic nourishment.</p>
          <p class="lead" style="margin-top:14px">Whether energizing your mornings, fueling your workouts, or enjoying a mindful late-afternoon snack, our blend delivers complete satisfaction without compromise.</p>
          <div class="sign">Handcrafted for quality & purity</div>
          <div><a class="link" href="#/about">Our Brand Story ${ICON.arrow}</a></div>
        </div>
        <figure class="panel-sand reveal" style="--d:.2s">
          <img src="${P ? P.img.pair : 'assets/images/products/pair.webp'}" alt="${B.name} Product Jar Display">
          <figcaption>Available in 500g and 1kg family sizes.</figcaption>
        </figure>
      </div>
    </section>
  `;
}

function prodCard(p) {
  const buy = canBuy(p);
  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
  const isProminent = p.prominent || p.id === "msr-250";
  const imgSrc = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";
  return `
    <article class="pc reveal ${isOutOfStock ? "pc-out" : ""} ${isProminent ? "pc-prominent" : ""}">
      <div class="pc-img">
        <span class="pill pc-size ${isOutOfStock ? "pc-size-oos" : ""}">${isOutOfStock ? "Out of Stock" : (p.badge || p.weight)}</span>
        <img src="${imgSrc}" alt="${p.name} ${p.weight}" loading="lazy">
      </div>
      <div class="pc-body">
        <h3>${p.title}<span class="pc-w">(${p.weight})</span></h3>
        <p>${p.shortDesc}</p>
        <div class="price">
          <span>${money(p.price)}</span>
          ${p.comparePrice ? `<small style="text-decoration:line-through;opacity:0.6">${money(p.comparePrice)}</small>` : ""}
          <small>${p.netWeight}</small>
        </div>
        ${p.note ? `<p class="pc-note">${p.note}</p>` : ""}
        ${buy ? `
          <div class="buy-row">
            <button class="btn btn-gold btn-sm" data-act="add" data-pid="${p.id}">
              ${ICON.bag} Add to Cart
            </button>
            <button class="btn btn-line btn-sm" data-act="buy" data-pid="${p.id}">
              Buy Now
            </button>
          </div>
        ` : `
          <div class="oos-card-action" style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
            <div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#ef4444;background:rgba(239,68,68,0.1);padding:4px 10px;border-radius:6px;border:1px solid rgba(239,68,68,0.25);width:fit-content">
              <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block"></span>
              Out of Stock
            </div>
            <button type="button" class="btn btn-gold btn-sm btn-block" data-act="notify" data-pid="${p.id}" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px">
              🔔 Notify When Available
            </button>
          </div>
        `}
        <a class="pc-more" href="#/product/${p.slug}">View full product details →</a>
      </div>
    </article>
  `;
}

function secFeatured() {
  const prods = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  return `
    <section class="sec sec-black" id="featured" aria-label="Featured Collection">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="pill">Our Collection</span>
          <h2 class="h2" style="margin-top:14px">Pure Honey Nut Blends</h2>
          <div class="rule"></div>
          <p class="lead">Select your preferred jar size. Same gold standard recipe in each package.</p>
        </div>
        <div class="pgrid">
          ${prods.map(p => prodCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

function secWhy() {
  const features = window.BRAND_CONFIG.features || [];
  return `
    <section class="sec sec-cream" aria-label="Why Choose Us">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="pill">The Standard</span>
          <h2 class="h2" style="margin-top:14px">Why Choose Our Blend</h2>
          <div class="rule"></div>
          <p class="lead">We believe in transparent ingredients, uncompromising freshness, and direct courier dispatch.</p>
        </div>
        <div class="grid4">
          ${features.map((f, i) => `
            <div class="card-w reveal" style="--d:${i * 0.1}s">
              <div class="ico-ring">${ICON[f.icon] || ICON.leaf}</div>
              <h3>${f.title}</h3>
              <p>${f.desc}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function secIngredients() {
  const items = window.INGREDIENTS || [];
  return `
    <section class="sec sec-coal" aria-label="Ingredients">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="pill">Wholesome Formula</span>
          <h2 class="h2" style="margin-top:14px">6 Powerhouse Ingredients</h2>
          <div class="rule"></div>
          <p class="lead">Every single jar contains only these six wholesome elements — nothing more, nothing less.</p>
        </div>
        <div class="grid3">
          ${items.map((ing, i) => `
            <div class="ing reveal" style="--d:${i * 0.08}s">
              <div class="ing-img"><img src="${ing.img}" alt="${ing.name}" loading="lazy"></div>
              <h3>${ing.name}</h3>
              <p>${ing.desc}</p>
            </div>
          `).join("")}
        </div>
        <p class="ing-note">Contains whole almonds, walnuts, cashews, pistachios, peanuts, and raw natural honey.</p>
      </div>
    </section>
  `;
}

function secMoments() {
  return `
    <section class="sec sec-sand" aria-label="Daily Use">
      <div class="wrap moments">
        <div class="reveal">
          <span class="pill">Lifestyle & Nutrition</span>
          <h2 class="h2" style="margin-top:14px">Crafted For Your Daily Rhythm</h2>
          <div class="rule"></div>
          <p class="lead">Enjoy by the spoonful, drizzle over Greek yogurt or morning oats, or pair with post-workout protein.</p>
        </div>
        <div class="moments-list">
          <div class="moment reveal">
            <div class="ico-ring">${ICON.sun}</div>
            <div><h3>Morning Fuel</h3><p>Start your dawn with sustained energy, essential healthy fats, and high-quality micronutrients.</p></div>
          </div>
          <div class="moment reveal" style="--d:.1s">
            <div class="ico-ring">${ICON.zap}</div>
            <div><h3>Pre / Post Workout</h3><p>Natural glycogen replenishment combined with plant protein for cellular recovery and stamina.</p></div>
          </div>
          <div class="moment reveal" style="--d:.2s">
            <div class="ico-ring">${ICON.heart}</div>
            <div><h3>Mindful Snacking</h3><p>Satisfies your sweet tooth cleanly without refined white sugar crashes or artificial additives.</p></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function secShowcase() {
  const P = window.PRODUCTS[0];
  const B = window.BRAND_CONFIG.brand;
  return `
    <section class="show hex" aria-label="Visual Showcase">
      <div class="hex-layer"></div>
      <div class="show-bg" aria-hidden="true">${B.name} · PURE BLEND</div>
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="pill">Visual Showcase</span>
          <h2>The Gold Standard In Every Jar</h2>
          <p class="lead">Look through the clear jar: packed to the brim with rich, crunchy dry fruits drenched in viscous golden honey.</p>
        </div>
        <div class="show-stage" id="stage">
          <img class="pair" src="${P ? P.img.pair : 'assets/images/products/pair.webp'}" alt="MSR Showcase Display" loading="lazy">
          <div class="orb" data-p="18" style="top:10%;left:8%"><img src="assets/images/ingredients/honey.webp" alt="Honey"></div>
          <div class="orb" data-p="-22" style="top:18%;right:10%"><img src="assets/images/ingredients/almonds.webp" alt="Almonds"></div>
          <div class="orb" data-p="26" style="bottom:12%;left:12%"><img src="assets/images/ingredients/walnuts.webp" alt="Walnuts"></div>
          <div class="orb" data-p="-16" style="bottom:16%;right:14%"><img src="assets/images/ingredients/cashews.webp" alt="Cashews"></div>
        </div>
      </div>
    </section>
  `;
}

function secAbout(full = false) {
  const B = window.BRAND_CONFIG.brand;
  const C = window.BRAND_CONFIG.contact;
  return `
    <section class="sec sec-coal" aria-label="About Us">
      <div class="wrap about">
        <div class="reveal">
          <span class="pill">Our Story</span>
          <h2 class="h2" style="margin-top:14px">Honest Food, Made For Life</h2>
          <div class="rule"></div>
          <p class="lead">${B.name} was established with one purpose: to replace hyper-processed, artificial snacks with genuine, nutrient-dense nutrition crafted from nature's purest treasures.</p>
          <p class="lead" style="margin-top:14px">We work directly with reliable suppliers, roast nuts carefully to maintain their wholesome micronutrient profile, and seal each batch fresh in Pakistan.</p>
          <ul class="checks">
            <li>${ICON.check} No synthetic colors, flavorings, or high-fructose corn syrups</li>
            <li>${ICON.check} 100% natural Pakistan & international nuts selected for freshness</li>
            <li>${ICON.check} Fast, verified courier dispatch to your doorstep</li>
          </ul>
        </div>
        <div class="brand-tile reveal" style="--d:.2s">
          <img src="${window.BRAND_CONFIG.logo.src}" alt="${B.name} Logo">
          <p style="margin-top:20px;font-size:15px;color:var(--mute-dark);text-align:center">Headquartered in ${C.address[2] || "Pakistan"} · Delivering Nationwide</p>
        </div>
      </div>
    </section>
  `;
}

function secReviews() {
  const reviews = window.BRAND_CONFIG.reviews || [];
  return `
    <section class="sec sec-sand" aria-label="Customer Reviews">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="pill">Customer Love</span>
          <h2 class="h2" style="margin-top:14px">Verified Experiences</h2>
          <div class="rule"></div>
          <p class="lead">Discover why families and fitness enthusiasts choose our Honey Nut Mix.</p>
        </div>
        <div class="grid3">
          ${reviews.map((r, i) => `
            <div class="rev reveal" style="--d:${i * 0.1}s">
              <div class="q">“</div>
              <h3>${r.title}</h3>
              <p>${r.text}</p>
              <div class="who">
                <b>${r.name}</b> · ${r.city} (${r.date})
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function secCTA() {
  const B = window.BRAND_CONFIG.brand;
  return `
    <section class="cta hex" aria-label="Call to Action">
      <div class="hex-layer"></div>
      <div class="wrap reveal">
        <h2>Taste The Difference Today</h2>
        <p>Order fresh ${B.name} Honey Nut Mix now. Delivered straight to your home with Cash on Delivery or digital payment.</p>
        <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap">
          <a class="btn btn-gold" href="#/shop">Order Your Jar</a>
          <a class="btn btn-line" href="#/contact">Speak With Us</a>
        </div>
      </div>
    </section>
  `;
}

// ==========================================
// VIEWS
// ==========================================

views.home = () => ({
  title: `${window.BRAND_CONFIG.brand.fullName} | ${window.BRAND_CONFIG.brand.tagline}`,
  html: secHero() + secTrustStrip() + secWelcome() + secFeatured() + secWhy() + secIngredients() + secMoments() + secShowcase() + secAbout() + secReviews() + secCTA()
});

views.shop = () => {
  const prods = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  return {
    title: `Shop | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>Shop</span></nav>
          <h1>Our Pure Honey Nut Collection</h1>
          <p>Choose from our convenient jar sizes or order our artisanal blends.</p>
        </div>
      </header>
      <section class="page-dark sec" style="padding-top:40px">
        <div class="wrap">
          <div class="pgrid">
            ${prods.map(p => prodCard(p)).join("")}
          </div>
        </div>
      </section>
      ${secTrustStrip()}
      ${secWhy()}
      ${secCTA()}
    `
  };
};

views.products = views.shop;

views.product = (slug) => {
  const allProds = (typeof getProducts === "function") ? getProducts() : (window.PRODUCTS || []);
  const p = getPBySlug(slug) || allProds[0];
  if (!p) return views.shop();
  const buy = canBuy(p);
  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
  const qid = "q-pdp";
  const D = window.BRAND_CONFIG.delivery;
  const C = window.BRAND_CONFIG.contact;
  const sameGroup = allProds.filter(x => x.group && x.group === p.group);
  const imgSrc = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";

  return {
    title: `${p.name} (${p.weight}) | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <section class="page light" style="padding-top:clamp(20px, 3vw, 36px)">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb" style="margin-bottom:20px">
            <a href="#/">Home</a> / <a href="#/shop">Shop</a> / <span>${p.title}</span>
          </nav>
          <div class="pdp">
            <div>
              <div class="gal-main">
                <img class="main" id="galMain" src="${imgSrc}" alt="${p.name} ${p.weight}">
              </div>
              <div class="thumbs">
                <button class="thumb" aria-pressed="true" data-act="thumb" data-pid="${p.id}" data-src="front" data-alt="front jar view">
                  <img src="${(p.img && p.img.front) || imgSrc}" alt="Front">
                </button>
                <button class="thumb" aria-pressed="false" data-act="thumb" data-pid="${p.id}" data-src="back" data-alt="back label view">
                  <img src="${(p.img && p.img.back) || imgSrc}" alt="Back">
                </button>
                <button class="thumb" aria-pressed="false" data-act="thumb" data-pid="${p.id}" data-src="pair" data-alt="product collection view">
                  <img src="${(p.img && p.img.pair) || imgSrc}" alt="Pair">
                </button>
              </div>
            </div>
            <div class="pdp-info">
              <span class="pill" style="${isOutOfStock ? "color:#ef4444;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25)" : ""}">${isOutOfStock ? "Out of Stock" : (p.badge || "Signature Selection")}</span>
              <h1 style="margin-top:14px">${p.title}</h1>
              <div class="price">
                <span>${money(p.price)}</span>
                ${p.comparePrice ? `<small style="text-decoration:line-through;opacity:0.6">${money(p.comparePrice)}</small>` : ""}
                <small>${p.netWeight}</small>
              </div>
              <p class="ing-line">Contains: Pure Honey, Almonds, Walnuts, Cashews, Pistachios & Peanuts.</p>
              ${sameGroup.length > 1 ? `
                <div class="sizes">
                  <span>Size:</span>
                  ${sameGroup.map(g => `<a href="#/product/${g.slug}" class="${g.id === p.id ? "on" : ""}">${g.weight}</a>`).join("")}
                </div>
              ` : ""}
              <p style="margin-top:18px;color:var(--mute-dark,#555);line-height:1.7">${p.fullDesc}</p>
              ${p.note ? `<p class="soon" style="margin-top:18px">${p.note}</p>` : ""}
              ${buy ? `
                <div class="buy-row" style="margin-top:24px">
                  ${qtyCtl(qid, 1)}
                  <button class="btn btn-gold" data-act="add" data-q="${qid}" data-pid="${p.id}">
                    ${ICON.bag} Add to Cart
                  </button>
                  <button class="btn btn-line" data-act="buy" data-q="${qid}" data-pid="${p.id}">
                    Buy Now
                  </button>
                </div>
              ` : `
                <div class="oos-pdp-box" style="margin-top:24px;padding:20px 22px;border-radius:14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.25)">
                  <div style="display:flex;align-items:center;gap:8px;color:#ef4444;font-weight:700;font-size:15px;margin-bottom:8px">
                    <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block"></span>
                    Currently Out of Stock
                  </div>
                  <p style="font-size:13.5px;color:var(--mute-dark,#444);margin:0 0 16px;line-height:1.55">
                    This artisanal batch has temporarily sold out due to high demand. Enter your contact details below to be notified first the second fresh jars arrive!
                  </p>
                  <button type="button" class="btn btn-gold btn-block" data-act="notify" data-pid="${p.id}" style="padding:14px;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
                    🔔 Notify When Available
                  </button>
                </div>
              `}
              <div class="info-box">
                <div>${ICON.truck}<div><b>Pakistan Delivery: Flat ${money(D.fee)}</b><span>${D.area} · Estimated ${D.eta}</span></div></div>
                <div>${ICON.shield}<div><b>Double Freshness Seal</b><span>${p.packaging}</span></div></div>
                <div>${ICON.bag}<div><b>Payment Methods</b><span>Cash on Delivery, Bank Transfer, Easypaisa, JazzCash</span></div></div>
              </div>
            </div>
          </div>
          <div class="acc-wrap">
            ${accordion("desc", "Detailed Description", `<p>${p.fullDesc}</p><p>Packed in a clear ${p.netWeight} jar so you can inspect the pristine dry fruit fusion with your own eyes.</p>`, true)}
            ${accordion("ing", "Ingredients & Allergens", `<p>100% Pure Natural Mountain Honey, Selected California Almonds, Kashmiri Walnuts, Roasted Cashews, Iranian Pistachios, Crunchy Peanuts.</p><p><b>Allergen Notice:</b> Contains tree nuts and peanuts.</p>`)}
            ${accordion("info", "Product Specs & Nutrition", `
              <table class="tbl">
                <tr><td>Net Weight</td><td>${p.netWeight}</td></tr>
                <tr><td>Packaging</td><td>${p.packaging}</td></tr>
                <tr><td>Shelf Life</td><td>${p.shelfLife}</td></tr>
              </table>
              <h4 style="margin-top:18px;color:var(--gold-lo)">Nutrition Facts (per 100g)</h4>
              <table class="tbl">
                ${(window.NUTRITION_FACTS || []).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
              </table>
            `)}
            ${accordion("faq", "Frequently Asked Questions", `
              ${(window.FAQS || []).map(f => `<div style="margin-bottom:14px"><b style="color:var(--gold-lo)">${f[0]}</b><p style="margin-top:4px">${f[1]}</p></div>`).join("")}
            `)}
          </div>
        </div>
      </section>
      <div class="mbar">
        <div><b>${money(p.price)}</b><small>${p.netWeight} · Delivery ${money(D.fee)}</small></div>
        ${buy ? `
          <button class="btn btn-gold btn-sm" data-act="add" data-q="${qid}" data-pid="${p.id}">
            Add to Cart
          </button>
        ` : `
          <button type="button" class="btn btn-gold btn-sm" data-act="notify" data-pid="${p.id}">
            🔔 Notify Me
          </button>
        `}
      </div>
    `,
    mbar: true
  };
};

views.cart = () => {
  const L = lines();
  const D = window.BRAND_CONFIG.delivery;
  if (!L.length) {
    return {
      title: `Your Cart | ${window.BRAND_CONFIG.brand.name}`,
      html: `
        <header class="page-head"><div class="wrap"><h1>Your Cart</h1></div></header>
        <section class="page light">
          <div class="wrap">
            <div class="box empty">
              <h2>Your cart is currently empty</h2>
              <p>Add our delicious Honey Nut Mix to begin your healthy snacking journey.</p>
              <a class="btn btn-gold" href="#/shop">Browse Products</a>
            </div>
          </div>
        </section>
      `
    };
  }
  const t = totals();
  return {
    title: `Your Cart | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>Cart</span></nav>
          <h1>Shopping Cart</h1>
        </div>
      </header>
      <section class="page light">
        <div class="wrap cart-grid">
          <div class="box">
            ${L.map(l => `
              <div class="li">
                <a class="li-img" href="#/product/${l.p.slug}"><img src="${l.p.img.front}" alt="${l.p.name}"></a>
                <div>
                  <h3>${l.p.name}</h3>
                  <small>${l.p.netWeight} · ${money(l.p.price)} each</small>
                  ${qtyCtl("q-cart-" + l.p.id, l.qty, `data-cart="1" data-pid="${l.p.id}"`)}
                </div>
                <div class="li-r">
                  <b>${money(l.qty * l.p.price)}</b>
                  <button class="rm" data-act="remove" data-pid="${l.p.id}">${ICON.trash} Remove</button>
                </div>
              </div>
            `).join("")}
          </div>
          <aside class="box sticky">
            <h2>Order Summary</h2>
            <div class="sum">
              <div><span>Subtotal</span><span>${money(t.sub)}</span></div>
              <div><span>Delivery</span><span>${t.isFree ? '<span class="tag tag-emerald">FREE SHIPPING</span>' : money(t.ship)}</span></div>
              <div class="tot"><span>Total</span><span>${money(t.total)}</span></div>
              <small>${D.area} · Estimated ${D.eta}<br>${t.isFree ? '🎉 You qualified for FREE delivery!' : `Flat ${money(D.fee)} courier delivery.`}</small>
            </div>
            <a class="btn btn-gold btn-block" style="margin-top:22px" href="#/checkout">Proceed to Checkout</a>
            <a class="btn btn-ink-line btn-block" style="margin-top:10px" href="#/shop">Continue Shopping</a>
          </aside>
        </div>
      </section>
    `
  };
};

views.checkout = () => {
  const L = lines();
  if (!L.length) {
    location.hash = "#/cart";
    return null;
  }
  const t = totals();
  const D = window.BRAND_CONFIG.delivery;
  const prov = [
    "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan",
    "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Jammu & Kashmir"
  ];

  return {
    title: `Checkout | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/cart">Cart</a> / <span>Checkout</span></nav>
          <h1>Complete Your Order</h1>
        </div>
      </header>
      <section class="page light">
        <form class="wrap co-grid" id="coForm" novalidate>
          <div class="box">
            <fieldset class="fs">
              <legend>1. Contact Information</legend>
              <div class="fgrid">
                <div class="f"><label for="f-name">Full Name</label><input id="f-name" autocomplete="name" required><span class="err">Please enter your full name.</span></div>
                <div class="f"><label for="f-phone">Mobile Number</label><input id="f-phone" autocomplete="tel" inputmode="tel" placeholder="03XXXXXXXXX" required><span class="err">Enter a valid mobile like 03001234567.</span></div>
                <div class="f full"><label for="f-email">Email Address <i>(optional)</i></label><input id="f-email" type="email" autocomplete="email"><span class="err">Enter a valid email address.</span></div>
              </div>
            </fieldset>

            <fieldset class="fs">
              <legend>2. Shipping Address</legend>
              <div class="fgrid">
                <div class="f full"><label for="f-addr">Street Address / House No.</label><input id="f-addr" autocomplete="street-address" placeholder="House/Apartment #, Street, Area landmark" required><span class="err">Enter your delivery address.</span></div>
                <div class="f"><label for="f-city">City</label><input id="f-city" autocomplete="address-level2" required><span class="err">Enter your city.</span></div>
                <div class="f"><label for="f-prov">Province</label><select id="f-prov">${prov.map(p => `<option>${p}</option>`).join("")}</select></div>
                <div class="f"><label for="f-zip">Postal Code <i>(optional)</i></label><input id="f-zip" inputmode="numeric"></div>
                <div class="f full"><label for="f-note">Delivery Notes / Special Instructions <i>(optional)</i></label><textarea id="f-note" placeholder="Nearest landmark, preferred delivery timing, etc."></textarea></div>
              </div>
            </fieldset>

            <fieldset class="fs" style="margin:0">
              <legend>3. Payment Method</legend>
              ${window.BRAND_CONFIG.payments.map((m, i) => `
                <label class="opt">
                  <input type="radio" name="pay" value="${m.id}" ${i === 0 ? "checked" : ""}>
                  <span>
                    <b>${m.name} ${m.badge ? `<span class="tag tag-gold" style="margin-left:8px">${m.badge}</span>` : ""}</b>
                    <span>${m.short}</span>
                  </span>
                </label>
              `).join("")}
              <div class="notice" id="payDetail" style="margin-top:16px;background:var(--coal);color:var(--cream);border-color:var(--gold)" aria-live="polite"></div>
            </fieldset>
          </div>

          <aside class="box sticky">
            <h2>Order Summary</h2>
            <div class="co-items">
              ${L.map(l => `
                <div class="li">
                  <div class="li-img"><img src="${l.p.img.front}" alt="${l.p.name}"></div>
                  <div><h3>${l.p.name}</h3><small>${l.p.netWeight} × ${l.qty}</small></div>
                  <b>${money(l.qty * l.p.price)}</b>
                </div>
              `).join("")}
            </div>
            <div class="sum" style="margin-top:16px">
              <div><span>Subtotal</span><span>${money(t.sub)}</span></div>
              <div><span>Delivery Fee</span><span>${t.isFree ? '<span class="tag tag-emerald">FREE SHIPPING</span>' : money(t.ship)}</span></div>
              <div class="tot"><span>Total Amount</span><span>${money(t.total)}</span></div>
            </div>
            <button class="btn btn-gold btn-block" style="margin-top:22px" type="submit">Place Order Now</button>
            <div class="secure">${ICON.lock} Safe & secure checkout. Your details are private.</div>
          </aside>
        </form>
      </section>
    `
  };
};

views.confirmation = () => {
  const o = lastOrder;
  if (!o || !o.items) {
    location.hash = "#/";
    return null;
  }
  const C = window.BRAND_CONFIG.contact;
  const payMethod = (window.BRAND_CONFIG.payments || []).find(p => p.id === (o.paymentMethod || o.pay)) || { name: (o.paymentMethod || o.pay || "Cash on Delivery") };
  const waMsg = (typeof generateOrderWhatsAppMessage === "function") ? generateOrderWhatsAppMessage(o) : orderMessage(o);

  const custPhone = (o.customer && o.customer.phone) || o.phone || "";
  const waToCustomer = custPhone ? `<a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="https://wa.me/92${custPhone.replace(/^0/, "")}?text=${encodeURIComponent(waMsg)}">💬 Receive WhatsApp Confirmation</a>` : "";
  const trackBtn = `<a class="btn btn-line btn-sm" href="#/track/${o.id}">🚚 Track Order Live</a>`;
  const emailBtn = `<button class="btn btn-line btn-sm" onclick="openOrderReceiptDialog('${o.id}')">✉ View & Send Receipt</button>`;

  return {
    title: `Order Placed | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <section class="page light">
        <div class="wrap done">
          <div class="tick">${ICON.check}</div>
          <h1>Thank you, ${esc((o.customer ? o.customer.name : o.name || "Customer").split(" ")[0])}!</h1>
          <p class="lead">Your order has been recorded successfully. Order reference: <span class="oid">#${o.id}</span></p>

          <!-- Auto Confirmation & WhatsApp Actions -->
          <div class="notice" style="background:var(--coal);color:var(--cream);border-color:var(--gold)">
            <h3 style="color:var(--gold-hi);margin-bottom:8px">Order Confirmation & Receipt</h3>
            <p style="font-size:14px;color:var(--sand);margin-bottom:14px">An official order record has been created in our database. Tap below to send confirmation directly to WhatsApp or track progress live:</p>
            <div class="row" style="display:flex;gap:10px;flex-wrap:wrap">${waToCustomer}${trackBtn}${emailBtn}</div>
          </div>

          <div class="notice">
            <h3>Payment Method: ${payMethod.name}</h3>
            <p>${payMethod.detail || "Please keep payment ready upon delivery."}</p>
            <p style="margin:0">Total Amount: <b style="color:var(--gold-hi)">${money(o.total)}</b></p>
          </div>

          <div class="box">
            <h2>Order Receipt</h2>
            <div class="sum">
              ${o.items.map(i => `<div><span>${esc(i.name)} (${esc(i.weight || "")}) × ${i.qty}</span><span>${money(i.qty * i.price)}</span></div>`).join("")}
              <div><span>Shipping</span><span>${money(o.shipping || o.ship || 0)}</span></div>
              <div class="tot"><span>Total</span><span>${money(o.total)}</span></div>
            </div>
            <hr style="border:0;border-top:1px solid rgba(27,21,12,.12);margin:22px 0">
            <p><b>Delivery To:</b><br>${esc(o.customer ? o.customer.name : o.name)} · ${esc(o.customer ? o.customer.phone : o.phone)}<br>${esc(o.customer ? o.customer.address : o.addr)}, ${esc(o.customer ? o.customer.city : o.city)}${o.zip ? " " + esc(o.zip) : ""}</p>
            <p style="margin-top:12px"><b>Payment:</b> ${payMethod.name}</p>
          </div>

          <div style="display:flex;justify-content:center;gap:14px;margin-top:28px;flex-wrap:wrap">
            <a class="btn btn-gold" href="#/track/${o.id}">Track Live Consignment</a>
            <a class="btn btn-ink-line" href="#/shop">Continue Shopping</a>
          </div>
        </div>
      </section>
    `
  };
};

views.track = (orderIdParam) => {
  const brand = window.BRAND_CONFIG.brand;
  const C = window.BRAND_CONFIG.contact;
  let o = orderIdParam ? (typeof findOrder === "function" ? findOrder(orderIdParam) : null) : (lastOrder || null);

  // Background Live Sync from Cloudflare D1
  if (orderIdParam && typeof fetchOrderRemote === "function" && !window._fetchingRemoteOrder) {
    window._fetchingRemoteOrder = true;
    fetchOrderRemote(orderIdParam).then(remote => {
      window._fetchingRemoteOrder = false;
      if (remote) {
        const changed = !o || remote.status !== o.status || remote.updatedAt !== o.updatedAt ||
          (remote.timeline && o.timeline && remote.timeline.length !== o.timeline.length) ||
          (remote.tracking && o.tracking && remote.tracking.trackingNumber !== o.tracking.trackingNumber);
        if (changed && typeof route === "function") {
          route();
          if (typeof toast === "function") toast(`🔔 Live Status: ${remote.status}`);
        }
      }
    }).catch(() => { window._fetchingRemoteOrder = false; });
  }

  // Periodic heartbeat polling while on track page (every 10s)
  if (orderIdParam && !window._trackHeartbeatActive) {
    window._trackHeartbeatActive = true;
    if (window._trackInterval) clearInterval(window._trackInterval);
    window._trackInterval = setInterval(() => {
      if (!location.hash.startsWith("#/track")) {
        clearInterval(window._trackInterval);
        window._trackHeartbeatActive = false;
        return;
      }
      if (typeof fetchOrderRemote === "function") {
        fetchOrderRemote(orderIdParam).then(remote => {
          if (remote && o) {
            const changed = remote.status !== o.status || remote.updatedAt !== o.updatedAt ||
              (remote.timeline && o.timeline && remote.timeline.length !== o.timeline.length) ||
              (remote.tracking && o.tracking && remote.tracking.trackingNumber !== o.tracking.trackingNumber);
            if (changed && typeof route === "function") {
              route();
              if (typeof toast === "function") toast(`🔔 Live Status Updated: ${remote.status}`);
            }
          }
        });
      }
    }, 10000);
  }

  const statusLevels = {
    "pending": 1,
    "approved": 2,
    "processing": 3,
    "dispatched": 4,
    "shipped": 4,
    "delivered": 5,
    "cancelled": 0
  };
  const currentLvl = o ? (statusLevels[(o.status || "pending").toLowerCase()] || 1) : 1;

  const trackContent = o ? `
    <div class="track-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;border-bottom:1px solid var(--hair);padding-bottom:20px;margin-bottom:24px">
        <div>
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--gold-hi)">Live Order Tracking</span>
          <h2 style="font-size:26px;color:var(--cream);margin:4px 0 2px">Order #${esc(o.id)}</h2>
          <small style="color:var(--mute-dark)">Placed on ${o.dateFormatted || (typeof formatOrderDate === "function" ? formatOrderDate(o.createdAt) : new Date(o.createdAt).toLocaleString())}</small>
          <div style="margin-top:8px">
            <button class="btn btn-line btn-sm" style="font-size:12px;padding:4px 11px;border-radius:6px" onclick="refreshTrackLive('${esc(o.id)}')">🔄 Refresh Live Status</button>
          </div>
        </div>
        <div style="text-align:right">
          <span class="status-pill status-${(o.status || 'pending').toLowerCase()}" style="font-size:13px;padding:6px 14px">${o.status}</span>
          <div style="margin-top:6px;font-size:13.5px;color:var(--sand)">Payment: <b>${o.paymentMethod || "Cash on Delivery"}</b></div>
        </div>
      </div>

      <!-- Visual 5-Step Progress Stepper -->
      <div class="track-stepper">
        <div class="step-node ${currentLvl >= 1 ? (currentLvl === 1 ? 'active' : 'completed') : ''}">
          <div class="step-circle">${currentLvl > 1 ? '✓' : '📝'}</div>
          <span class="step-label">Order Placed</span>
          <span class="step-time">${o.timeline && o.timeline[0] ? o.timeline[0].time : 'Recorded'}</span>
        </div>
        <div class="step-node ${currentLvl >= 2 ? (currentLvl === 2 ? 'active' : 'completed') : ''}">
          <div class="step-circle">${currentLvl > 2 ? '✓' : '✅'}</div>
          <span class="step-label">Approved</span>
          <span class="step-time">${currentLvl >= 2 ? 'Confirmed' : 'Pending'}</span>
        </div>
        <div class="step-node ${currentLvl >= 3 ? (currentLvl === 3 ? 'active' : 'completed') : ''}">
          <div class="step-circle">${currentLvl > 3 ? '✓' : '📦'}</div>
          <span class="step-label">Packed & Sealed</span>
          <span class="step-time">${currentLvl >= 3 ? 'Ready' : 'In Queue'}</span>
        </div>
        <div class="step-node ${currentLvl >= 4 ? (currentLvl === 4 ? 'active' : 'completed') : ''}">
          <div class="step-circle">${currentLvl > 4 ? '✓' : '🚚'}</div>
          <span class="step-label">Dispatched</span>
          <span class="step-time">${currentLvl >= 4 ? (o.tracking && o.tracking.courier ? o.tracking.courier : 'In Transit') : 'Awaiting'}</span>
        </div>
        <div class="step-node ${currentLvl === 5 ? 'completed active' : ''}">
          <div class="step-circle">${currentLvl === 5 ? '🎉' : '🏠'}</div>
          <span class="step-label">Delivered</span>
          <span class="step-time">${currentLvl === 5 ? 'Completed' : 'Expected'}</span>
        </div>
      </div>

      <!-- Courier Partner & Consignment Box -->
      ${o.tracking && o.tracking.trackingNumber ? `
        <div style="background:rgba(214,167,54,0.08);border:1.5px solid var(--gold);border-radius:var(--r-md);padding:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-size:12px;text-transform:uppercase;color:var(--gold-hi);font-weight:600">Courier Partner Details</div>
            <div style="font-size:18px;font-weight:700;color:var(--cream);margin-top:2px">🚚 ${esc(o.tracking.courier || "Courier Partner")}</div>
            <div style="font-size:13.5px;color:var(--sand);margin-top:2px">Tracking Number: <b style="font-family:monospace;color:var(--gold-hi);font-size:15px">${esc(o.tracking.trackingNumber)}</b></div>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-gold btn-sm" onclick="navigator.clipboard.writeText('${esc(o.tracking.trackingNumber)}'); toast('Tracking number copied!');">Copy Tracking ID</button>
          </div>
        </div>
      ` : `
        <div style="background:rgba(255,255,255,0.02);border:1px dashed var(--hair);border-radius:var(--r-md);padding:18px;margin-bottom:28px;display:flex;align-items:center;gap:12px">
          <span style="font-size:24px">📦</span>
          <div>
            <b style="color:var(--cream);font-size:14.5px">Standard Dispatch Courier Service</b>
            <p style="margin:2px 0 0;font-size:13px;color:var(--mute-dark)">Your items will be dispatched via express insured courier (TCS / Leopards / Trax) within 24–48 business hours.</p>
          </div>
        </div>
      `}

      <!-- 2 Columns: Order Items & Live Activity Log -->
      <div class="track-grid">
        <div>
          <h3 style="font-size:17px;color:var(--cream);margin-bottom:14px;border-bottom:1px solid rgba(214,167,54,0.15);padding-bottom:8px">Order Summary</h3>
          <div class="co-items" style="max-height:280px;overflow-y:auto">
            ${(o.items || []).map(i => `
              <div class="li" style="padding-block:10px">
                <div>
                  <h3 style="font-size:14.5px">${esc(i.name)}</h3>
                  <small style="color:var(--mute-dark)">${esc(i.weight || "")} × ${i.qty}</small>
                </div>
                <b>${money(i.qty * i.price)}</b>
              </div>
            `).join("")}
          </div>
          <div class="sum" style="margin-top:16px">
            <div><span>Subtotal</span><span>${money(o.subtotal || o.total)}</span></div>
            <div><span>Delivery</span><span>${o.shipping === 0 ? '<span class="tag tag-emerald">FREE SHIPPING</span>' : money(o.shipping || 0)}</span></div>
            <div class="tot"><span>Total Amount</span><span style="color:var(--gold-hi)">${money(o.total)}</span></div>
          </div>
          <div style="margin-top:16px;background:rgba(255,255,255,0.02);padding:14px;border-radius:var(--r-sm);border:1px solid var(--hair)">
            <b style="color:var(--cream);font-size:13px">Shipping Destination:</b>
            <p style="margin:4px 0 0;font-size:13px;color:var(--sand);line-height:1.4">
              ${esc(o.customer ? o.customer.name : o.name)} · ${esc(o.customer ? o.customer.phone : o.phone)}<br>
              ${esc(o.customer ? o.customer.address : o.addr)}, ${esc(o.customer ? o.customer.city : o.city)}
            </p>
          </div>
        </div>

        <div>
          <h3 style="font-size:17px;color:var(--cream);margin-bottom:14px;border-bottom:1px solid rgba(214,167,54,0.15);padding-bottom:8px">Tracking Activity & History</h3>
          <div class="track-timeline">
            ${(o.timeline || []).slice().reverse().map(ev => `
              <div class="timeline-item">
                <h4>${esc(ev.title)}</h4>
                <small>${esc(ev.time)}</small>
                <p>${esc(ev.note || "")}</p>
              </div>
            `).join("")}
          </div>

          <div style="margin-top:28px;padding-top:18px;border-top:1px solid var(--hair)">
            <b style="color:var(--cream);font-size:13.5px">Customer Service & WhatsApp Updates:</b>
            <p style="margin:4px 0 12px;font-size:13px;color:var(--mute-dark)">Need an instant update or modification? Chat directly with our fulfillment operations team:</p>
            <a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent('Hi ' + brand.name + ', I would like an update on my Order #' + o.id)}">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  ` : `
    <div class="track-card" style="max-width:580px;margin:40px auto;text-align:center;padding:44px 32px">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(214,167,54,0.15);color:var(--gold-hi);display:grid;place-items:center;font-size:30px;margin:0 auto 16px">🔍</div>
      <h2 style="font-size:24px;color:var(--cream);margin-bottom:8px">Track Your Order Status</h2>
      <p style="font-size:14.5px;color:var(--mute-dark);margin-bottom:28px">Enter your Order ID (e.g. MSR-261014-4821) or your 11-digit mobile number to view live consignment tracking.</p>
      
      <form onsubmit="event.preventDefault(); const q = document.getElementById('trackQueryInput').value.trim(); if(q) location.hash = '#/track/' + encodeURIComponent(q);">
        <div class="f" style="margin-bottom:16px">
          <input id="trackQueryInput" placeholder="Enter Order ID or Mobile Number (03XXXXXXXXX)" required style="font-size:16px;text-align:center;padding:14px">
        </div>
        <button type="submit" class="btn btn-gold btn-block" style="padding-block:14px">Search & Track Order</button>
      </form>

      ${lastOrder ? `
        <div style="margin-top:24px;padding-top:18px;border-top:1px solid var(--hair);font-size:13.5px;color:var(--sand)">
          <span>Recently placed order found: </span>
          <a href="#/track/${lastOrder.id}" style="color:var(--gold-hi);font-weight:600">Track #${lastOrder.id} →</a>
        </div>
      ` : ""}
    </div>
  `;

  return {
    title: `Order Tracking | ${brand.name}`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>Order Tracking</span></nav>
          <h1>Real-Time Order Tracking</h1>
          <p class="sub">Monitor live status, packaging milestones, and courier delivery progress.</p>
        </div>
      </header>
      <section class="page sec-black">
        <div class="wrap">
          ${trackContent}
        </div>
      </section>
    `
  };
};

function orderMessage(o) {
  const payMethod = (window.BRAND_CONFIG.payments || []).find(p => p.id === o.pay) || { name: o.pay };
  return [
    `New Order from ${window.BRAND_CONFIG.brand.name}`,
    `Order ID: ${o.id}`,
    `-------------------------`,
    ...o.items.map(i => `• ${i.name} (${i.weight}) x ${i.qty} = ${money(i.qty * i.price)}`),
    `Delivery: ${money(o.ship)}`,
    `Total: ${money(o.total)}`,
    `Payment: ${payMethod.name}`,
    `-------------------------`,
    `Customer: ${o.name}`,
    `Phone: ${o.phone}`,
    o.email ? `Email: ${o.email}` : null,
    `Address: ${o.addr}, ${o.city}, ${o.prov}${o.zip ? ' ' + o.zip : ''}`,
    o.note ? `Notes: ${o.note}` : null
  ].filter(Boolean).join("\n");
}

views.about = () => ({
  title: `About Us | ${window.BRAND_CONFIG.brand.fullName}`,
  html: `
    <header class="page-head">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>About Us</span></nav>
        <h1>About ${window.BRAND_CONFIG.brand.fullName}</h1>
        <p>${window.BRAND_CONFIG.brand.slogan}</p>
      </div>
    </header>
    ${secAbout(true)}
    ${secWelcome()}
    ${secWhy()}
    ${secCTA()}
  `
});

views.contact = () => {
  const C = window.BRAND_CONFIG.contact;
  return {
    title: `Contact | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>Contact</span></nav>
          <h1>Get In Touch</h1>
          <p>Questions regarding products, bulk orders, or shipping? We are here to assist.</p>
        </div>
      </header>
      <section class="page light">
        <div class="wrap contact-grid">
          <div class="cinfo">
            <a href="tel:${C.phoneIntl}">${ICON.phone}<div><b>Phone / Support</b><span>${C.phone}</span><small style="color:var(--mute-light)">${C.supportHours}</small></div></a>
            ${C.whatsapp ? `<a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">${ICON.zap}<div><b>WhatsApp Direct</b><span>Chat with our team instantly</span></div></a>` : ""}
            <a href="mailto:${C.email}">${ICON.mail}<div><b>Email Us</b><span>${C.email}</span></div></a>
            <div>${ICON.pin}<div><b>Location</b><span>${C.address.join("<br>")}</span></div></div>
          </div>
          <form class="box" id="contactForm" novalidate>
            <h2>Send us a Message</h2>
            <div class="fgrid">
              <div class="f"><label for="c-name">Your Name</label><input id="c-name" required><span class="err">Enter your name.</span></div>
              <div class="f"><label for="c-phone">Phone Number <i>(optional)</i></label><input id="c-phone" inputmode="tel"></div>
              <div class="f full"><label for="c-msg">Message</label><textarea id="c-msg" placeholder="How can we help you?" required></textarea><span class="err">Enter your message.</span></div>
            </div>
            <button class="btn btn-gold" style="margin-top:22px" type="submit">Send Message via Email</button>
          </form>
        </div>
      </section>
    `
  };
};

views.policy = (key) => {
  const D = window.BRAND_CONFIG.delivery;
  const C = window.BRAND_CONFIG.contact;
  const policies = {
    shipping: {
      title: "Shipping & Delivery Policy",
      body: `<h2>Nationwide Coverage</h2><p>We deliver across all cities, towns, and sectors in Pakistan through reputable couriers.</p><h2>Delivery Timelines</h2><p>Orders typically arrive within <b>${D.eta}</b> of dispatch.</p><h2>Delivery Charges</h2><p>Standard flat shipping fee of <b>${money(D.fee)}</b> per order across Pakistan.</p>`
    },
    returns: {
      title: "Returns & Refund Policy",
      body: `<h2>Freshness Guarantee</h2><p>If your jar arrives damaged or unsealed, notify us within 48 hours for an instant replacement.</p><h2>Customer Support</h2><p>Contact us at ${C.email} or call ${C.phone} with your order reference number.</p>`
    },
    privacy: {
      title: "Privacy Policy",
      body: `<h2>Data Protection</h2><p>Your address, phone number, and contact info are strictly utilized to fulfill your orders. We never sell, rent, or share customer data with third parties.</p>`
    },
    terms: {
      title: "Terms & Conditions",
      body: `<h2>Acceptance of Terms</h2><p>By purchasing from ${window.BRAND_CONFIG.brand.name}, you agree to our standard customer delivery and payment terms.</p>`
    }
  };
  const p = policies[key] || policies.shipping;
  return {
    title: `${p.title} | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head"><div class="wrap"><nav class="crumbs"><a href="#/">Home</a> / <span>${p.title}</span></nav><h1>${p.title}</h1></div></header>
      <section class="page light"><div class="wrap prose">${p.body}</div></section>
    `
  };
};

if (typeof window !== "undefined") {
  window.views = views;
}


// Interactive Email Receipt Modal Dialog
function openOrderReceiptDialog(orderId) {
  const o = (typeof findOrder === "function" ? findOrder(orderId) : null) || lastOrder;
  if (!o) {
    if (typeof toast === "function") toast("Order details not found.");
    return;
  }

  const C = (window.BRAND_CONFIG && window.BRAND_CONFIG.contact) || {};
  const recipientEmail = (o.customer && o.customer.email) || o.email || C.email || "msrfoods.official@gmail.com";
  const brandName = (window.BRAND_CONFIG && window.BRAND_CONFIG.brand && window.BRAND_CONFIG.brand.name) || "MSR Foods";
  const payMethod = (window.BRAND_CONFIG && window.BRAND_CONFIG.payments || []).find(p => p.id === (o.paymentMethod || o.pay)) || { name: (o.paymentMethod || o.pay || "Cash on Delivery") };

  const receiptLines = [
    `🧾 ${brandName.toUpperCase()} — OFFICIAL ORDER RECEIPT`,
    `Order Reference: #${o.id}`,
    `Placed On: ${o.dateFormatted || (typeof formatOrderDate === "function" ? formatOrderDate(o.createdAt) : new Date(o.createdAt).toLocaleString())}`,
    `Status: ${o.status || "Pending"}`,
    `Payment Method: ${payMethod.name}`,
    `--------------------------------------------------`,
    `ITEMS ORDERED:`,
    ...(o.items || []).map(i => `• ${i.name} (${i.weight || "Standard"}) × ${i.qty} = PKR ${(i.qty * i.price).toLocaleString()}`),
    `--------------------------------------------------`,
    `Subtotal: PKR ${(o.subtotal || o.total).toLocaleString()}`,
    `Delivery: ${o.shipping === 0 ? "FREE" : "PKR " + (o.shipping || 0).toLocaleString()}`,
    `TOTAL PAYABLE: PKR ${Number(o.total || 0).toLocaleString()}`,
    `--------------------------------------------------`,
    `DELIVERY DESTINATION:`,
    `Recipient: ${o.customer ? o.customer.name : o.name}`,
    `Contact Phone: ${o.customer ? o.customer.phone : o.phone}`,
    `Address: ${o.customer ? o.customer.address : o.addr}, ${o.customer ? o.customer.city : o.city}`,
    `--------------------------------------------------`,
    `Live Tracking Link: ${window.location.origin}${window.location.pathname}#/track/${o.id}`,
    `Support Email: ${C.email || "msrfoods.official@gmail.com"} | WhatsApp: +92${(C.whatsapp || "3368835501").replace(/^92/, "")}`
  ];

  const receiptText = receiptLines.join("\n");
  const subject = `Order Receipt #${o.id} - ${brandName}`;

  window._currentReceiptText = receiptText;

  let modal = document.getElementById("dlg-receipt-modal");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-receipt-modal";
    document.body.appendChild(modal);
  }

  const gmailWebUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(recipientEmail) + "&su=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(receiptText);
  const mailtoUrl = "mailto:" + recipientEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(receiptText);

  modal.innerHTML = `
    <div class="dlg" style="width:min(620px,94vw);max-height:90vh;overflow-y:auto">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-receipt-modal').close()">${ICON.x}</button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;border-bottom:1px solid var(--hair);padding-bottom:14px">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:rgba(214,167,54,0.15);color:var(--gold-hi);display:grid;place-items:center;font-size:22px">✉</div>
        <div>
          <h3 style="font-size:20px;margin:0;color:var(--cream)">Order Receipt #${o.id}</h3>
          <p style="font-size:13px;color:var(--mute-dark);margin:2px 0 0">Choose your preferred way to send, save, or copy this receipt:</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--hair);border-radius:var(--r-sm);padding:14px;margin-bottom:18px">
        <div style="font-size:12px;color:var(--gold-hi);text-transform:uppercase;font-weight:600">Recipient Email:</div>
        <div style="font-size:15px;color:var(--cream);font-weight:600;margin-top:2px">${esc(recipientEmail)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        <a class="btn btn-gold btn-block" style="text-align:center;padding:12px 16px" target="_blank" rel="noopener" href="${gmailWebUrl}">
          🌐 Open in Gmail Web (1-Click Compose)
        </a>
        <a class="btn btn-line btn-block" style="text-align:center;padding:12px 16px" href="${mailtoUrl}">
          📧 Open in Default Mail App (Apple Mail / Outlook)
        </a>
        <button class="btn btn-line btn-block" style="padding:12px 16px" onclick="if(window._currentReceiptText) { navigator.clipboard.writeText(window._currentReceiptText); if(typeof toast==='function') toast('📋 Full receipt copied to clipboard!'); }">
          📋 Copy Full Receipt to Clipboard
        </button>
        <button class="btn btn-line btn-block" style="padding:12px 16px" onclick="window.print();">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div style="border-top:1px solid var(--hair);padding-top:14px;display:flex;justify-content:flex-end">
        <button class="btn btn-line btn-sm" onclick="document.getElementById('dlg-receipt-modal').close()">Close</button>
      </div>
    </div>
  `;
  modal.showModal();
}
window.openOrderReceiptDialog = openOrderReceiptDialog;

// 1-Click Refresh Live Tracking from Cloudflare D1
window.refreshTrackLive = async function(id) {
  if (typeof toast === "function") toast("🔄 Checking Cloudflare D1 database for updates...");
  if (typeof fetchOrderRemote === "function") {
    const fresh = await fetchOrderRemote(id);
    if (fresh && typeof route === "function") {
      route();
      if (typeof toast === "function") toast(`✅ Live Status: ${fresh.status}`);
    } else {
      if (typeof toast === "function") toast("✅ Status is up to date.");
    }
  }
};


// =======================================================================
// STOCK RESTOCK WAITLIST & NOTIFICATION CONTROLLER
// =======================================================================
function openNotifyModal(pid) {
  const p = typeof getP === "function" ? getP(pid) : null;
  if (!p) return;

  let modal = document.getElementById("dlg-notify");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "dlg-notify";
    document.body.appendChild(modal);
  }

  const brand = (window.BRAND_CONFIG && window.BRAND_CONFIG.brand) || { name: "MSR Foods" };
  const imgSrc = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";

  modal.innerHTML = `
    <div class="dlg" style="width:min(480px,94vw);padding:28px 24px;border-radius:18px;background:var(--bg-card,#141414);color:var(--cream,#f5f5f0);border:1px solid var(--hair,rgba(255,255,255,0.12));position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-notify').close()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--sand,#aaa);font-size:20px;cursor:pointer">${ICON.x || "✕"}</button>
      
      <div style="text-align:center;margin-bottom:18px">
        <div style="width:52px;height:52px;border-radius:50%;background:rgba(212,175,55,0.15);color:var(--gold-hi,#d4af37);display:grid;place-items:center;font-size:24px;margin:0 auto 10px">
          🔔
        </div>
        <span class="pill" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--gold-hi,#d4af37);padding:4px 10px;border-radius:20px;background:rgba(212,175,55,0.1);display:inline-block;margin-bottom:6px">Priority Restock Alert</span>
        <h3 style="font-size:21px;font-family:var(--font-head);color:var(--cream,#f5f5f0);margin:4px 0 6px">Notify When Available</h3>
        <p style="font-size:13px;color:var(--sand,#c4baa9);margin:0;line-height:1.5">
          Get an instant alert the moment our next fresh batch of <b style="color:var(--gold-hi,#d4af37)">${p.title}</b> is bottled and ready for dispatch.
        </p>
      </div>

      <!-- Product Preview Snippet -->
      <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 14px;margin-bottom:18px">
        <img src="${imgSrc}" alt="${p.title}" style="width:46px;height:46px;object-fit:cover;border-radius:8px">
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;color:var(--cream,#f5f5f0)">${p.title}</div>
          <div style="font-size:12px;color:var(--gold-lo,#b38f26)">${money(p.price)} · ${p.weight || p.netWeight}</div>
        </div>
        <span style="font-size:11px;color:#f87171;background:rgba(239,68,68,0.12);padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid rgba(239,68,68,0.25)">Out of Stock</span>
      </div>

      <form id="stockNotifyForm" onsubmit="event.preventDefault(); submitStockNotification('${p.id}');">
        <div style="margin-bottom:12px">
          <label for="notifName" style="display:block;font-size:12px;color:var(--sand,#c4baa9);margin-bottom:5px;font-weight:500">Your Full Name</label>
          <input type="text" id="notifName" class="inp" placeholder="e.g. Zaid Hayat" required style="width:100%;box-sizing:border-box">
        </div>

        <div style="margin-bottom:12px">
          <label for="notifEmail" style="display:block;font-size:12px;color:var(--sand,#c4baa9);margin-bottom:5px;font-weight:500">Email Address (for Email Notification)</label>
          <input type="email" id="notifEmail" class="inp" placeholder="e.g. zaid@example.com" required style="width:100%;box-sizing:border-box">
        </div>

        <div style="margin-bottom:16px">
          <label for="notifPhone" style="display:block;font-size:12px;color:var(--sand,#c4baa9);margin-bottom:5px;font-weight:500">Phone or WhatsApp Number</label>
          <input type="tel" id="notifPhone" class="inp" placeholder="e.g. 0336 8835501" required style="width:100%;box-sizing:border-box">
        </div>

        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:18px;font-size:12px;color:var(--sand,#c4baa9);line-height:1.4">
          <input type="checkbox" id="notifWhatsappCheck" checked style="accent-color:var(--gold,#d4af37);margin-top:2px">
          <label for="notifWhatsappCheck" style="cursor:pointer">Send me an instant WhatsApp message when stock is replenished</label>
        </div>

        <button type="submit" id="notifSubmitBtn" class="btn btn-gold btn-block" style="padding:13px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
          🔔 Notify Me When Available
        </button>

        <p style="text-align:center;font-size:11px;color:var(--mute,#888);margin:12px 0 0">
          🔒 Zero spam promise. We will only contact you once for this restock.
        </p>
      </form>
    </div>
  `;

  modal.showModal();
}

async function submitStockNotification(pid) {
  const p = typeof getP === "function" ? getP(pid) : null;
  if (!p) return;

  const nameInput = document.getElementById("notifName");
  const emailInput = document.getElementById("notifEmail");
  const phoneInput = document.getElementById("notifPhone");
  const waCheck = document.getElementById("notifWhatsappCheck");
  const submitBtn = document.getElementById("notifSubmitBtn");

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const wantWa = waCheck ? waCheck.checked : true;

  if (!name || (!email && !phone)) {
    alert("Please provide your name and an email or phone number.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Saving Request...";
  }

  const brand = (window.BRAND_CONFIG && window.BRAND_CONFIG.brand) || { name: "MSR Foods" };
  const contact = (window.BRAND_CONFIG && window.BRAND_CONFIG.contact) || { email: "msrfoods.official@gmail.com", whatsapp: "923368835501" };
  const targetEmail = contact.email || "msrfoods.official@gmail.com";
  const targetWa = contact.whatsapp || "923368835501";

  const payload = {
    productId: p.id,
    productTitle: p.title || p.name,
    productWeight: p.weight || p.netWeight,
    productPrice: p.price,
    name,
    email,
    phone,
    wantWhatsapp: wantWa,
    createdAt: new Date().toISOString()
  };

  // 1. Save locally to Store
  if (typeof Store !== "undefined") {
    const storedList = Store.get("app_restock_requests") || [];
    storedList.unshift(payload);
    Store.set("app_restock_requests", storedList);
  }

  // 2. Send to Cloudflare D1 API /api/notify
  let endpoint = "/api/notify";
  if (window.BRAND_CONFIG && window.BRAND_CONFIG.urls && window.BRAND_CONFIG.urls.apiUrl) {
    endpoint = window.BRAND_CONFIG.urls.apiUrl.replace(/\/$/, "") + "/api/notify";
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("Could not sync waitlist to server:", err);
  }

  // 3. Prepare email record for the merchant (MSR Foods)
  const emailSubject = `🔔 Restock Request: ${p.title} (${p.weight}) - ${name}`;
  const emailBody = `🔔 RESTOCK WAITLIST REQUEST
--------------------------------------------------
Product: ${p.title} (${p.weight})
Product ID: ${p.id}
Price: PKR ${Number(p.price || 0).toLocaleString()}

CUSTOMER CONTACT:
Name: ${name}
Email: ${email}
Phone / WhatsApp: ${phone}
WhatsApp Alert Requested: ${wantWa ? "YES" : "No"}
Date: ${new Date().toLocaleString()}
--------------------------------------------------
Please notify this customer when this product is restocked!`;

  const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const waMsg = `Hi ${brand.name}! I would like to be notified when *${p.title} (${p.weight})* is back in stock. My name is ${name} (${phone}). Thank you!`;
  const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(waMsg)}`;

  // 4. Update Modal UI to Success Confirmation
  const modal = document.getElementById("dlg-notify");
  if (modal) {
    modal.innerHTML = `
      <div class="dlg" style="width:min(480px,94vw);padding:32px 24px;border-radius:18px;background:var(--bg-card,#141414);color:var(--cream,#f5f5f0);border:1px solid var(--hair,rgba(255,255,255,0.12));position:relative;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
        <button class="ic dlg-x" onclick="document.getElementById('dlg-notify').close()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--sand,#aaa);font-size:20px;cursor:pointer">${ICON.x || "✕"}</button>
        
        <div style="width:58px;height:58px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:grid;place-items:center;font-size:28px;margin:0 auto 16px">
          ✓
        </div>

        <span class="pill" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#10b981;padding:4px 10px;border-radius:20px;background:rgba(16,185,129,0.1);display:inline-block;margin-bottom:8px">Request Confirmed</span>
        <h3 style="font-size:22px;font-family:var(--font-head);color:var(--cream,#f5f5f0);margin:4px 0 8px">You're on the Priority List!</h3>
        <p style="font-size:14px;color:var(--sand,#c4baa9);line-height:1.5;margin-bottom:20px">
          Thank you, <b style="color:var(--cream,#f5f5f0)">${name}</b>! We have logged your request for <b style="color:var(--gold-hi,#d4af37)">${p.title}</b>. We will alert you at <b style="color:var(--gold-hi,#d4af37)">${phone || email}</b> the second the jars are sealed.
        </p>

        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:20px;text-align:left;font-size:12px;color:var(--sand,#c4baa9);line-height:1.6">
          <div style="font-weight:600;color:var(--cream,#f5f5f0);margin-bottom:4px">📨 Record Dispatched to Store Management</div>
          <div>Destination: <span style="color:var(--gold-hi,#d4af37)">${targetEmail}</span></div>
          <div>Ref: <span style="font-family:monospace">NOTIF-${Date.now().toString().slice(-6)}</span></div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-gold btn-block" style="padding:12px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;border-color:#25D366;color:#000;font-weight:600">
            💬 Quick Confirm via WhatsApp
          </a>
          <a href="${mailtoUrl}" class="btn btn-line btn-block" style="padding:12px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px">
            📧 Send Record Copy via Mail Client
          </a>
          <button type="button" class="btn btn-line btn-block" onclick="document.getElementById('dlg-notify').close()" style="padding:10px;font-size:13px">
            Done
          </button>
        </div>
      </div>
    `;
  }

  if (typeof toast === "function") {
    toast(`🔔 Restock alert requested for ${p.title}!`);
  }
}

window.openNotifyModal = openNotifyModal;
window.submitStockNotification = submitStockNotification;
