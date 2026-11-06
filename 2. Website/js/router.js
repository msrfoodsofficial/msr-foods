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
          <img class="hero-jar" id="heroJar" src="${P ? P.img.front : 'assets/images/products/front.webp'}" alt="${B.name} Honey Nut Mix 500g" width="460" height="600" fetchpriority="high" decoding="sync">
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
          <img src="${P ? P.img.pair : 'assets/images/products/pair.webp'}" alt="${B.name} Product Jar Display" width="1340" height="996" loading="lazy" decoding="async" style="width:100%;max-width:660px;height:auto;aspect-ratio:1340/996;object-fit:contain;display:block;margin:0 auto">
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
    <article class="pc reveal ${isOutOfStock ? "pc-out" : ""} ${isProminent ? "pc-prominent" : ""}" data-href="#/product/${p.slug}">
      <a href="#/product/${p.slug}" class="pc-img" aria-label="${p.title} details">
        <span class="pill pc-size ${isOutOfStock ? "pc-size-oos" : ""}">${isOutOfStock ? "Out of Stock" : (p.badge || p.weight)}</span>
        <img src="${imgSrc}" alt="${p.name} ${p.weight}" width="240" height="240" loading="lazy" decoding="async">
      </a>
      <div class="pc-body">
        <h3><a href="#/product/${p.slug}" style="color:inherit;text-decoration:none">${p.title.replace(/\s*\([^)]*\)\s*$/, "")}</a> <span class="pc-w">(${p.weight})</span></h3>
        <p>${p.shortDesc}</p>
        <div class="price">
          <span>${money(p.price)}</span>
          ${p.comparePrice ? `<small style="text-decoration:line-through;opacity:0.6">${money(p.comparePrice)}</small>` : ""}
          <small>${p.netWeight}</small>
        </div>
        ${p.note ? `<p class="pc-note">${p.note}</p>` : ""}
        ${buy ? `
          <div class="buy-row">
            <button class="btn btn-line btn-sm" data-act="add" data-pid="${p.id}" title="Add to bag">
              ${ICON.bag} Add to Cart
            </button>
            <button class="btn btn-gold btn-sm" data-act="buy" data-pid="${p.id}" title="Proceed directly to checkout">
              Buy Now
            </button>
          </div>
        ` : `
          <div class="buy-row">
            <button class="btn btn-gold btn-sm" disabled style="opacity:0.65;cursor:not-allowed">
              Out of Stock
            </button>
            <button type="button" class="btn btn-line btn-sm" data-act="notify" data-pid="${p.id}" title="Notify me when restocked">
              🔔 Notify Me
            </button>
          </div>
        `}
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
          <h2 class="h2" style="margin-top:14px">${items.length} Powerhouse Ingredients</h2>
          <div class="rule"></div>
          <p class="lead">Every single jar contains only these ${items.length} wholesome elements — pure roasted dry fruits, premium seeds, and raw mountain honey.</p>
        </div>
        <div class="grid3">
          ${items.map((ing, i) => `
            <div class="ing reveal" style="--d:${i * 0.08}s">
              <div class="ing-img"><img src="${ing.img}" alt="${ing.name}" width="80" height="80" loading="lazy" decoding="async"></div>
              <h3>${ing.name}</h3>
              <p>${ing.desc}</p>
            </div>
          `).join("")}
        </div>
        <p class="ing-note">Contains whole almonds, walnuts, cashews, pistachios, peanuts, pumpkin seeds, sunflower seeds, sesame seeds, and raw natural honey.</p>
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
          <img class="pair" src="${P ? P.img.pair : 'assets/images/products/pair.webp'}" alt="MSR Showcase Display" width="1340" height="996" loading="lazy" decoding="async">
          <div class="orb" data-p="18" style="top:10%;left:8%"><img src="assets/images/ingredients/honey.webp" alt="Honey" width="80" height="80" loading="lazy" decoding="async"></div>
          <div class="orb" data-p="-22" style="top:18%;right:10%"><img src="assets/images/ingredients/almonds.webp" alt="Almonds" width="80" height="80" loading="lazy" decoding="async"></div>
          <div class="orb" data-p="26" style="bottom:12%;left:12%"><img src="assets/images/ingredients/walnuts.webp" alt="Walnuts" width="80" height="80" loading="lazy" decoding="async"></div>
          <div class="orb" data-p="-16" style="bottom:16%;right:14%"><img src="assets/images/ingredients/cashews.webp" alt="Cashews" width="80" height="80" loading="lazy" decoding="async"></div>
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
          <div style="margin-top:22px"><a class="link" href="#/about">Read Our Full Brand Story ${ICON.arrow}</a></div>
        </div>
        <div class="brand-tile reveal" style="--d:.2s">
          <img src="${window.BRAND_CONFIG.logo.src}" alt="${B.name} Logo" width="406" height="224" loading="lazy" decoding="async" style="width:100%;max-width:406px;height:auto;aspect-ratio:406/224;object-fit:contain">
          <p style="margin-top:20px;font-size:15px;color:var(--mute-dark);text-align:center">Headquartered in ${(C.address[C.address.length - 1] || C.address[0] || "Pakistan")} · Delivering Nationwide</p>
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
                <img class="main" id="galMain" src="${imgSrc}" alt="${p.name} ${p.weight}" width="600" height="600" decoding="async">
              </div>
              <div class="thumbs">
                <button class="thumb" aria-pressed="true" data-act="thumb" data-pid="${p.id}" data-src="front" data-alt="front jar view">
                  <img src="${(p.img && p.img.front) || imgSrc}" alt="Front" width="80" height="80" loading="lazy" decoding="async">
                </button>
                <button class="thumb" aria-pressed="false" data-act="thumb" data-pid="${p.id}" data-src="back" data-alt="back label view">
                  <img src="${(p.img && p.img.back) || imgSrc}" alt="Back" width="80" height="80" loading="lazy" decoding="async">
                </button>
                <button class="thumb" aria-pressed="false" data-act="thumb" data-pid="${p.id}" data-src="pair" data-alt="product collection view">
                  <img src="${(p.img && p.img.pair) || imgSrc}" alt="Pair" width="80" height="80" loading="lazy" decoding="async">
                </button>
              </div>
            </div>
            <div class="pdp-info">
              <span class="pill pdp-badge" style="${isOutOfStock ? "color:#ef4444;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25)" : "background:#140f08;color:#f7de8f;border:1.5px solid #d6a736;font-weight:700"}">${isOutOfStock ? "Out of Stock" : (p.badge || "Signature Selection")}</span>
              <h1 style="margin-top:14px">${p.title}</h1>
              <div class="price">
                <span>${money(p.price)}</span>
                ${p.comparePrice ? `<small style="text-decoration:line-through;opacity:0.6">${money(p.comparePrice)}</small>` : ""}
                <small>${p.netWeight}</small>
              </div>
              <p class="ing-line" style="color:#7a4c0c;font-weight:600;font-size:14.5px;margin-bottom:18px">Contains: Pure Honey, Almonds, Walnuts, Cashews, Pistachios & Peanuts.</p>
              ${sameGroup.length > 1 ? `
                <div class="sizes">
                  <span>Size:</span>
                  ${sameGroup.map(g => `<a href="#/product/${g.slug}" class="${g.id === p.id ? "on" : ""}">${g.weight}</a>`).join("")}
                </div>
              ` : ""}
              <p class="pdp-desc" style="margin-top:18px;color:#2e261d;line-height:1.8;font-size:15.5px">${p.fullDesc}</p>
              ${p.note ? `<p class="soon" style="margin-top:18px">${p.note}</p>` : ""}
              ${buy ? `
                <div class="buy-row" style="margin-top:24px">
                  ${qtyCtl(qid, 1)}
                  <button class="btn btn-line btn-add-cart" data-act="add" data-q="${qid}" data-pid="${p.id}" title="Add to Cart" style="border:2px solid #14100a;color:#14100a;background:#ffffff;font-weight:700">
                    ${ICON.bag} Add to Cart
                  </button>
                  <button class="btn btn-gold" data-act="buy" data-q="${qid}" data-pid="${p.id}" title="Proceed directly to checkout">
                    Buy Now
                  </button>
                </div>
              ` : `
                <div class="oos-pdp-box" style="margin-top:24px;padding:20px 22px;border-radius:14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.25)">
                  <div style="display:flex;align-items:center;gap:8px;color:#ef4444;font-weight:700;font-size:15px;margin-bottom:8px">
                    <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block"></span>
                    Currently Out of Stock
                  </div>
                  <p style="font-size:13.5px;color:#2e261d;margin:0 0 16px;line-height:1.6">
                    This artisanal batch has temporarily sold out due to high demand. Enter your contact details below to be notified first the second fresh jars arrive!
                  </p>
                  <div class="buy-row" style="margin-top:12px">
                    <button class="btn btn-gold" disabled style="opacity:0.65;cursor:not-allowed;flex:1">
                      Out of Stock
                    </button>
                    <button type="button" class="btn btn-line" data-act="notify" data-pid="${p.id}" style="flex:1;border:2px solid #14100a;color:#14100a;background:#ffffff;font-weight:700">
                      🔔 Notify When Available
                    </button>
                  </div>
                </div>
              `}
              <div class="info-box">
                <div>${ICON.truck}<div><b>Pakistan Delivery: Flat ${money(D.fee)} (FREE in Kohat)</b><span>${D.area} · Estimated ${D.eta}</span></div></div>
                <div>${ICON.shield}<div><b>Double Freshness Seal</b><span>${p.packaging}</span></div></div>
                <div>${ICON.bag}<div><b>Payment Methods</b><span>Cash on Delivery (COD)</span></div></div>
              </div>
            </div>
          </div>
          <div class="acc-wrap">
            ${accordion("desc", "Detailed Description", `<p style="color:#2e261d;line-height:1.8">${p.fullDesc}</p><p style="color:#2e261d;line-height:1.8">Packed in a clear ${p.netWeight} jar so you can inspect the pristine dry fruit fusion with your own eyes.</p>`, true)}
            ${accordion("ing", "Ingredients & Allergens", `<p style="color:#2e261d;line-height:1.8">100% Pure Natural Mountain Honey, Selected California Almonds, Kashmiri Walnuts, Roasted Cashews, Iranian Pistachios, Crunchy Peanuts.</p><p style="color:#2e261d;line-height:1.8"><b style="color:#14100a">Allergen Notice:</b> Contains tree nuts and peanuts.</p>`)}
            ${accordion("info", "Product Specs & Nutrition", `
              <table class="tbl">
                <tr><td>Net Weight</td><td>${p.netWeight}</td></tr>
                <tr><td>Packaging</td><td>${p.packaging}</td></tr>
                <tr><td>Shelf Life</td><td>${p.shelfLife}</td></tr>
              </table>
              <h4 style="margin-top:18px;color:#7a4c0c;font-weight:700">Nutrition Facts (per 100g)</h4>
              <table class="tbl">
                ${(window.NUTRITION_FACTS || []).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
              </table>
            `)}
            ${accordion("faq", "Frequently Asked Questions", `
              ${(window.FAQS || []).map(f => `<div style="margin-bottom:14px"><b style="color:#14100a;font-weight:700;display:block;margin-bottom:4px">${f[0]}</b><p style="margin:0;color:#2e261d;line-height:1.7">${f[1]}</p></div>`).join("")}
            `)}
          </div>
        </div>
      </section>
      <div class="mbar">
        <div><b>${money(p.price)}</b><small>${p.netWeight} · Delivery ${money(D.fee)} (FREE in Kohat)</small></div>
        ${buy ? `
          <button class="btn btn-gold btn-sm" data-act="add" data-q="${qid}" data-pid="${p.id}">
            Add to Cart
          </button>
        ` : `
          <button class="btn btn-gold btn-sm" disabled style="opacity:0.65;cursor:not-allowed">
            Out of Stock
          </button>
          <button type="button" class="btn btn-line btn-sm" data-act="notify" data-pid="${p.id}">
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
                <a class="li-img" href="#/product/${l.p.slug}"><img src="${l.p.img.front}" alt="${l.p.name}" width="72" height="72" loading="lazy" decoding="async"></a>
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
              <small>${D.area} · Estimated ${D.eta}<br>${t.isFree ? '🎉 You qualified for FREE delivery!' : `Flat ${money(D.fee)} courier delivery · <b style="color:#059669">FREE in Kohat!</b>`}</small>
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
  const prov = window.PAKISTAN_PROVINCES || [
    "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Islamabad Capital Territory",
    "Balochistan", "Azad Jammu & Kashmir", "Gilgit-Baltistan"
  ];
  const totalItemsCount = L.reduce((acc, item) => acc + (item.qty || 1), 0);

  return {
    title: `Checkout | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <header class="page-head" style="padding-top:calc(var(--hdr) + 16px);padding-bottom:18px;text-align:center">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center;margin-bottom:8px"><a href="#/">Home</a> / <a href="#/cart">Cart</a> / <span>Checkout</span></nav>
          <h1 style="font-size:clamp(1.8rem, 3.5vw, 2.6rem)">Complete Your Order</h1>
        </div>
      </header>

      <!-- Mobile Collapsible Order Summary Banner -->
      <div class="mob-summary-bar" id="mobileSummaryToggle">
        <div class="wrap" style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:17px">🛒</span>
            <span style="font-weight:700;color:#14100a;font-size:14px">
              Order Summary <span style="font-weight:500;color:#6b5d4b">(${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'})</span>
            </span>
            <svg class="mob-caret" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.25s ease"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div style="font-weight:800;font-size:15.5px;color:#14100a" id="mob-total-top">${money(t.total)}</div>
        </div>
      </div>

      <section class="page light checkout-page" style="padding-top:16px;padding-bottom:clamp(40px, 6vw, 90px)">
        <form class="wrap co-grid" id="coForm" novalidate>
          
          <!-- Left Column: Checkout Inputs Form -->
          <div class="box co-form-box">
            
            <!-- 1. Contact Information -->
            <fieldset class="fs">
              <legend>1. Contact Information</legend>
              <div class="fgrid">
                <div class="f">
                  <label for="f-name">Full Name <span style="color:#dc2626">*</span></label>
                  <input id="f-name" autocomplete="name" placeholder="e.g. Ahmad Khan" required>
                  <span class="err">Please enter your full name.</span>
                </div>
                <div class="f">
                  <label for="f-phone">Mobile Number <span style="color:#dc2626">*</span></label>
                  <input id="f-phone" autocomplete="tel" inputmode="tel" placeholder="03XXXXXXXXX" required>
                  <span class="err">Enter a valid mobile like 03001234567.</span>
                </div>
                <div class="f full">
                  <label for="f-email">Email Address <i>(optional)</i></label>
                  <input id="f-email" type="email" autocomplete="email" placeholder="name@example.com">
                  <span class="err">Enter a valid email address.</span>
                </div>
              </div>
            </fieldset>

            <!-- 2. Shipping Address -->
            <fieldset class="fs">
              <legend>2. Shipping Address</legend>
              <div class="fgrid">
                
                <div class="f full">
                  <label for="f-addr">Street Address / House No. <span style="color:#dc2626">*</span></label>
                  <input id="f-addr" autocomplete="street-address" placeholder="House/Apartment #, Street, Area landmark" required>
                  <span class="err">Enter your delivery address.</span>
                </div>

                <!-- PROVINCE FIRST -->
                <div class="f">
                  <label for="f-prov">Province <span style="color:#dc2626">*</span></label>
                  <div class="select-wrapper">
                    <select id="f-prov" class="custom-select" required>
                      <option value="" disabled selected>Select your province</option>
                      ${prov.map(p => `<option value="${p}">${p}</option>`).join("")}
                    </select>
                  </div>
                  <span class="err">Please select your province.</span>
                </div>

                <!-- CITY SECOND WITH SEARCHABLE DROPDOWN -->
                <div class="f city-field-wrap">
                  <label for="f-city">City <span style="color:#dc2626">*</span></label>
                  <div class="city-search-box">
                    <input id="f-city" type="text" autocomplete="off" placeholder="Search or select your city..." required>
                    <button type="button" id="btn-toggle-city" class="btn-city-chevron" aria-label="Toggle city list">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div id="city-dropdown-menu" class="city-dropdown-menu"></div>
                  </div>
                  <span class="err">Please choose or enter your city.</span>
                </div>

                <!-- Quick Popular City Pills (Full Width) -->
                <div class="f full city-pills-row">
                  <div class="city-pills-header">
                    <span>⚡ Quick select delivery cities:</span>
                  </div>
                  <div class="city-quick-pills">
                    <button type="button" class="btn-city-pill pill-kohat" data-city="Kohat">📍 Kohat (FREE Delivery 🎉)</button>
                    <button type="button" class="btn-city-pill" data-city="Peshawar">Peshawar</button>
                    <button type="button" class="btn-city-pill" data-city="Islamabad">Islamabad</button>
                    <button type="button" class="btn-city-pill" data-city="Rawalpindi">Rawalpindi</button>
                    <button type="button" class="btn-city-pill" data-city="Lahore">Lahore</button>
                    <button type="button" class="btn-city-pill" data-city="Karachi">Karachi</button>
                  </div>
                  <div id="city-delivery-msg" class="city-delivery-msg" style="display:none"></div>
                </div>

                <div class="f">
                  <label for="f-zip">Postal Code <i>(optional)</i></label>
                  <input id="f-zip" inputmode="numeric" placeholder="e.g. 26000">
                </div>
                <div class="f">
                  <label for="f-note">Delivery Notes / Landmark <i>(optional)</i></label>
                  <input id="f-note" placeholder="Nearest landmark or instructions">
                </div>

              </div>
            </fieldset>

            <!-- 3. Payment Method -->
            <fieldset class="fs" style="margin:0">
              <legend>3. Payment Method</legend>
              ${window.BRAND_CONFIG.payments.map((m, i) => `
                <label class="opt checkout-pay-opt">
                  <input type="radio" name="pay" value="${m.id}" ${i === 0 ? "checked" : ""}>
                  <span class="pay-opt-body">
                    <b class="pay-opt-title">${m.name} ${m.badge ? `<span class="tag tag-gold" style="margin-left:8px">${m.badge}</span>` : ""}</b>
                    <span class="pay-opt-desc">${m.short}</span>
                  </span>
                </label>
              `).join("")}
              <div class="notice pay-instructions-box" id="payDetail" aria-live="polite"></div>
            </fieldset>

          </div>

          <!-- Right Column: Order Summary (Desktop Sticky, Mobile Collapsible / Top) -->
          <aside class="box sticky co-summary-box" id="coAsideBox">
            <h2 style="font-size:1.35rem;margin-bottom:14px;color:#14100a;display:flex;align-items:center;justify-content:space-between">
              <span>Order Summary</span>
              <small style="font-size:13px;font-weight:500;color:#6b5d4b">(${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'})</small>
            </h2>
            <div class="co-items">
              ${L.map(l => `
                <div class="li" style="border-bottom:1px solid rgba(27,21,12,0.08);padding-bottom:12px;margin-bottom:12px">
                  <div class="li-img" style="background:#000;border:1px solid rgba(27,21,12,0.1);border-radius:8px;overflow:hidden">
                    <img src="${l.p.img.front}" alt="${l.p.name}" width="54" height="54" loading="lazy" decoding="async">
                  </div>
                  <div>
                    <h3 style="font-size:15px;font-weight:700;color:#14100a;line-height:1.3">${l.p.name}</h3>
                    <small style="color:#6b5d4b;font-size:13px">${l.p.netWeight} × ${l.qty}</small>
                  </div>
                  <b style="font-weight:700;color:#14100a;font-size:15px">${money(l.qty * l.p.price)}</b>
                </div>
              `).join("")}
            </div>
            <div class="sum" style="margin-top:16px">
              <div><span>Subtotal</span><span id="co-sub-val">${money(t.sub)}</span></div>
              <div id="co-ship-row">
                <span>Delivery Fee</span>
                <span id="co-ship-val">
                  ${t.isCityFree ? '<span class="tag tag-emerald" style="font-weight:700">🎉 FREE (Kohat Local Delivery)</span>' : (t.isFree ? '<span class="tag tag-emerald">FREE SHIPPING</span>' : money(t.ship))}
                </span>
              </div>
              <div class="tot" style="border-top:1.5px solid rgba(27,21,12,0.14);padding-top:14px;margin-top:10px">
                <span style="font-size:17px;font-weight:700">Total Amount</span>
                <span id="co-tot-val" style="font-size:20px;font-weight:800;color:#14100a">${money(t.total)}</span>
              </div>
            </div>
            <button class="btn btn-gold btn-block" style="margin-top:22px;font-weight:700;font-size:16.5px" type="submit">
              Place Order Now
            </button>
            <div class="secure" style="color:#6b5d4b;font-size:12.5px;margin-top:12px;text-align:center">
              ${ICON.lock} Safe & secure checkout. Cash on Delivery (COD).
            </div>
          </aside>

        </form>
      </section>

      <!-- Persistent Mobile Bottom Bar for Instant Checkout -->
      <div class="co-mob-bar" id="coMobBar">
        <div class="co-mob-bar-in">
          <div class="co-mob-info">
            <span class="co-mob-lbl">Total to Pay (COD)</span>
            <b class="co-mob-val" id="co-mob-tot-val">${money(t.total)}</b>
            <small class="co-mob-sub" id="co-mob-ship-sub">${t.isCityFree ? "FREE Delivery in Kohat 🎉" : "Flat PKR 200 Delivery"}</small>
          </div>
          <button class="btn btn-gold btn-mob-place" type="button" id="btn-mob-place">
            Place Order Now
          </button>
        </div>
      </div>
    `
  };
};

views.confirmation = () => {
  const o = lastOrder;
  if (!o || !o.items) {
    location.hash = "#/";
    return null;
  }
  const payMethod = (window.BRAND_CONFIG.payments || []).find(p => p.id === (o.paymentMethod || o.pay)) || { name: (o.paymentMethod || o.pay || "Cash on Delivery") };

  const customerName = (o.customer ? o.customer.name : o.name || "Valued Customer");
  const firstName = customerName.split(" ")[0];

  return {
    title: `Order Placed | ${window.BRAND_CONFIG.brand.name}`,
    html: `
      <section class="page light">
        <div class="wrap done">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(27,21,12,.1)">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:52px;height:52px;border-radius:50%;background:var(--gold-grad);display:grid;place-items:center;color:#14100a;flex-shrink:0;box-shadow:0 8px 24px -6px var(--accent-glow)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <h1 style="font-size:clamp(1.5rem, 3.2vw, 2.1rem);margin:0;line-height:1.2;text-align:left">Thank you, ${esc(firstName)}!</h1>
                <p style="margin:4px 0 0;color:var(--mute-body);font-size:0.95rem">Order reference: <span class="oid" style="font-size:0.9rem;padding:3px 12px">#${o.id}</span></p>
              </div>
            </div>
            <div>
              <a class="btn btn-gold" href="#/track/${o.id}">Track Order</a>
            </div>
          </div>

          <div class="notice">
            <h3>Payment Method: ${payMethod.name}</h3>
            <p>${payMethod.detail || "Please keep the exact cash amount ready for the courier rider upon delivery."}</p>
            <p style="margin:0">Total Payable: <b style="color:var(--gold-hi)">${money(o.total)}</b></p>
          </div>

          <div class="box">
            <h2>Order Receipt</h2>
            <div class="sum">
              ${o.items.map(i => `<div><span>${esc(i.name)} (${esc(i.weight || "")}) × ${i.qty}</span><span>${money(i.qty * i.price)}</span></div>`).join("")}
              <div><span>Shipping</span><span>${money(o.shipping || o.ship || 0)}</span></div>
              <div class="tot"><span>Total</span><span>${money(o.total)}</span></div>
            </div>
            <hr style="border:0;border-top:1px solid rgba(27,21,12,.12);margin:22px 0">
            <p><b>Delivery Details:</b><br>${esc(o.customer ? o.customer.name : o.name)} · ${esc(o.customer ? o.customer.phone : o.phone)}<br>${esc(o.customer ? o.customer.address : o.addr)}, ${esc(o.customer ? o.customer.city : o.city)}${o.zip ? " " + esc(o.zip) : ""}</p>
            <p style="margin-top:12px"><b>Payment Method:</b> ${payMethod.name}</p>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:28px;flex-wrap:wrap">
            <a class="btn btn-ink-line" href="#/shop">Continue Shopping</a>
            <a class="btn btn-gold" href="#/track/${o.id}">Track Order</a>
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
  title: `About MSR Foods | Pure Taste. Natural Goodness. — Pakistan's Premium Superfood Brand`,
  html: `
    <!-- 1. Editorial Hero Section -->
    <header class="page-head" style="padding-top:calc(var(--hdr) + 36px);padding-bottom:clamp(44px, 6vw, 76px);text-align:center;background:radial-gradient(ellipse at center top, #1a140a 0%, #000000 80%);border-bottom:1px solid var(--hair)">
      <div class="wrap" style="max-width:880px;margin:0 auto">
        <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center;margin-bottom:18px"><a href="#/">Home</a> / <span>About Us</span></nav>
        <span class="pill" style="margin-bottom:14px">Our Heritage & Purpose</span>
        <h1 style="font:600 clamp(2.4rem, 5vw, 3.8rem) var(--serif);color:var(--cream);line-height:1.2;margin:14px 0 16px">
          Pure Taste. <span style="background:var(--gold-grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Natural Goodness.</span>
        </h1>
        <p style="font-size:clamp(16px, 1.8vw, 19px);line-height:1.75;color:var(--mute-dark);max-width:700px;margin:0 auto">
          How an uncompromising commitment to honest, unadulterated nutrition sparked a movement to revive real superfoods in Pakistan.
        </p>
      </div>
    </header>

    <!-- 2. The Genesis: Editorial Brand Narrative (Warm Sand Surface) -->
    <section class="sec sec-sand" aria-label="Our Origin Story">
      <div class="wrap" style="max-width:960px">
        <div class="reveal" style="text-align:center;max-width:760px;margin:0 auto 42px">
          <span class="pill">The Genesis</span>
          <h2 class="h2" style="margin-top:14px;color:var(--ink)">Rooted in Nature, Built on Integrity</h2>
          <div class="rule" style="margin-inline:auto"></div>
        </div>

        <div class="reveal" style="font-size:17.5px;line-height:1.85;color:var(--mute-light);display:grid;gap:22px">
          <p style="font-size:1.25rem;line-height:1.75;color:var(--ink);font-weight:500">
            Founded in 2026 in the historic city of Kohat, Khyber Pakhtunkhwa, <strong>MSR Foods</strong> was established with a clear, singular conviction: to replace hyper-processed snacks, refined sugars, artificial essences, and chemical additives with genuine, untampered nourishment crafted straight from nature.
          </p>
          <p>
            Walk down modern grocery aisles in Pakistan, and you will see the same troubling reality: supermarket shelves flooded with industrial snacks, cheap hydrogenated palm oils, synthetic flavorings, and heated commercial honeys diluted with corn syrup. Real food has been replaced by shelf-stable chemistry.
          </p>
          <p>
            We set out to create an honest Pakistani wellness company that honors our land's rich agricultural heritage. We partner directly with ethical beekeepers across the northern mountain valleys for cold-extracted raw honey, select peak-harvest whole dry fruits and vitality seeds, and prepare every batch under strict commercial-grade hygienic standards.
          </p>
        </div>

        <!-- 3 Pillars of Integrity -->
        <div class="grid3" style="margin-top:48px">
          <div class="card-w reveal" style="--d:0s;padding:32px 26px;border-top:3px solid var(--gold)">
            <h3 style="color:var(--ink);font-size:1.25rem;margin-bottom:10px">Zero Adulteration</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65;margin:0">0% refined white sugar, 0% corn syrup, 0% chemical preservatives or synthetic food dyes. Honest, transparent nutrition you can trust with your eyes closed.</p>
          </div>
          <div class="card-w reveal" style="--d:0.1s;padding:32px 26px;border-top:3px solid var(--gold)">
            <h3 style="color:var(--ink);font-size:1.25rem;margin-bottom:10px">Artisanal Craftsmanship</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65;margin:0">Gentle, oil-free dry-roasting and cold-infusion methods that awaken natural aromatic oils while preserving heat-sensitive enzymes, vitamins, and minerals.</p>
          </div>
          <div class="card-w reveal" style="--d:0.2s;padding:32px 26px;border-top:3px solid var(--gold)">
            <h3 style="color:var(--ink);font-size:1.25rem;margin-bottom:10px">Double-Seal Hygiene</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65;margin:0">Manufactured in sanitized facilities with an airtight heat-induction seal and outer tamper-evident band, locking in 12 months of peak natural freshness.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Our Brand Pillars (Warm Cream Surface) -->
    <section class="sec sec-cream" aria-label="Our Commitments">
      <div class="wrap" style="max-width:1100px">
        <div class="sec-head center reveal">
          <span class="pill">Core Pillars</span>
          <h2 class="h2" style="margin-top:14px;color:var(--ink)">The Standards Behind Every MSR Product</h2>
          <div class="rule"></div>
          <p class="lead" style="color:var(--mute-light)">The enduring values that govern every recipe, supplier relationship, and customer delivery.</p>
        </div>
        <div class="grid4">
          <div class="card-w reveal" style="--d:0s">
            <div class="ico-ring">${ICON.leaf}</div>
            <h3 style="color:var(--ink)">100% Pure & Real</h3>
            <p style="color:var(--mute-light)">We believe true wellness requires no disguise. Every MSR Foods product is 100% natural, free from chemical preservatives, artificial sweeteners, bleaching agents, or synthetic additives.</p>
          </div>
          <div class="card-w reveal" style="--d:0.1s">
            <div class="ico-ring">${ICON.sun}</div>
            <h3 style="color:var(--ink)">Ancestral Wellness</h3>
            <p style="color:var(--mute-light)">Rooted in the timeless wisdom of traditional Pakistani nutrition — pure mountain honey, wholesome nuts, functional seeds, and upcoming Sunnah superfoods crafted for modern life.</p>
          </div>
          <div class="card-w reveal" style="--d:0.2s">
            <div class="ico-ring">${ICON.shield}</div>
            <h3 style="color:var(--ink)">Commercial Purity</h3>
            <p style="color:var(--mute-light)">Manufactured under strict commercial-grade hygiene protocols. Every container is protected by an airtight induction seal and tamper-evident outer band for 12 months of peak freshness.</p>
          </div>
          <div class="card-w reveal" style="--d:0.3s">
            <div class="ico-ring">${ICON.phone}</div>
            <h3 style="color:var(--ink)">24/7 Human Care</h3>
            <p style="color:var(--mute-light)">Dedicated customer care available <strong>24/7 (Open 24 Hours / 7 Days)</strong> via phone (<a href="tel:+923159935600" style="color:var(--gold-lo);font-weight:600">+92 315 9935600</a>) and WhatsApp with nationwide Cash on Delivery and transit guarantee.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Our Expanding Product Vision (Warm Sand Surface) -->
    <section class="sec sec-sand" aria-label="Our Growing Product Range">
      <div class="wrap" style="max-width:1100px">
        <div class="sec-head center reveal">
          <span class="pill">Product Philosophy</span>
          <h2 class="h2" style="margin-top:14px;color:var(--ink)">A House of Natural Wellness</h2>
          <div class="rule"></div>
          <p class="lead" style="color:var(--mute-light)">MSR Foods is building a diversified collection of pure superfoods for every Pakistani household.</p>
        </div>
        <div class="grid3">
          <div class="card-w reveal" style="--d:0s">
            <div style="font:700 2.2rem var(--serif);color:var(--gold-lo);margin-bottom:8px">🍯</div>
            <h3 style="color:var(--ink);font-size:1.35rem;margin-bottom:10px">Honey Nut Blends</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65">Our flagship line: cold-extracted raw mountain honey paired with slow dry-roasted royal nuts and active seeds. Clean daily energy, natural stamina, and essential micronutrients without sugar crashes.</p>
          </div>
          <div class="card-w reveal" style="--d:0.1s">
            <div style="font:700 2.2rem var(--serif);color:var(--gold-lo);margin-bottom:8px">🌿</div>
            <h3 style="color:var(--ink);font-size:1.35rem;margin-bottom:10px">Sunnah & Ancient Superfoods</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65">Reviving sacred, traditional superfoods including Talbina (barley & milk nutrition), pure single-origin mountain honey jars, and targeted seed cycling blends crafted for restorative vitality.</p>
          </div>
          <div class="card-w reveal" style="--d:0.2s">
            <div style="font:700 2.2rem var(--serif);color:var(--gold-lo);margin-bottom:8px">✨</div>
            <h3 style="color:var(--ink);font-size:1.35rem;margin-bottom:10px">Pure Farm Staples</h3>
            <p style="color:var(--mute-light);font-size:15px;line-height:1.65">Artisanal farm-fresh pantry staples including traditional Desi Ghee and natural seed protein mixes — uncompromised purity crafted to nourish growing children, parents, and elders alike.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Founder's Vision: Cinematic Dark Accent Band -->
    <section class="sec sec-coal" aria-label="Founder's Vision" style="border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)">
      <div class="wrap" style="max-width:920px;text-align:center">
        <div class="reveal">
          <div style="font:italic 700 4.2rem/1 var(--serif);color:var(--gold);margin-bottom:16px">“</div>
          <blockquote style="font:italic 400 clamp(1.4rem, 2.5vw, 2.1rem)/1.6 var(--serif);color:var(--cream);margin:0 0 24px;border:none;padding:0;background:transparent">
            We didn’t start MSR Foods to make just another product on a supermarket shelf. We started it to prove that Pakistan can produce world-class natural superfoods — pure, untampered, and deeply nourishing. When you open any MSR Foods product, you are tasting honest nature, crafted with pride.
          </blockquote>
          <div style="font-weight:600;font-size:16.5px;color:var(--gold-hi)">MSR Foods Leadership & Crafting Team</div>
          <div style="font-size:14px;color:var(--mute-dark);margin-top:6px">Kohat, Khyber Pakhtunkhwa, Pakistan · Established 2026</div>
        </div>
      </div>
    </section>

    <!-- 6. Official Brand Disambiguation & Entity Authority (Cream Surface) -->
    <section class="sec sec-cream" aria-label="Official Brand Authority">
      <div class="wrap" style="max-width:960px">
        <div class="card-w reveal" style="background:var(--white);border-left:4px solid var(--gold);padding:30px 32px">
          <h3 style="font-size:1.35rem;margin-bottom:10px;color:var(--ink)">Official Brand Identity & Direct Ordering Notice</h3>
          <p style="color:var(--mute-light);font-size:15px;line-height:1.7;margin:0">
            <strong>MSR Foods</strong> is an independent, specialized Pakistani natural superfoods company founded in 2026 in Kohat, Khyber Pakhtunkhwa (Wikidata Entity: <a href="https://www.wikidata.org/wiki/Q141989418" target="_blank" rel="noopener" style="color:var(--gold-lo);font-weight:600">Q141989418</a>). We are completely independent and <strong>NOT</strong> affiliated with, connected to, or related to foreign trading entities such as "MSR Foodstuff Trading LLC" (UAE/India/msrfoodstuff.net) or "MSR Fruits". Genuine MSR Foods products are sold exclusively through our official website (<a href="https://msrfoodsofficial.food" style="color:var(--gold-lo);font-weight:600">msrfoodsofficial.food</a>) and authorized channels, delivered with Cash on Delivery nationwide.
          </p>
        </div>
      </div>
    </section>

    <!-- 7. LocalBusiness & AboutPage JSON-LD Schemas -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": ["Organization", "OnlineStore", "Brand"],
      "name": "MSR Foods",
      "description": "MSR Foods is a premier Pakistani national e-commerce food brand founded in 2026 in Kohat, KPK, offering handcrafted honey nut mixes and superfoods delivered nationwide across all cities in Pakistan via Cash on Delivery, with free local delivery in Kohat.",
      "url": "https://msrfoodsofficial.food",
      "telephone": "+923159935600",
      "email": "msrfoods.official@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Commercial Center, Bannu Road",
        "addressLocality": "Kohat",
        "addressRegion": "Khyber Pakhtunkhwa",
        "postalCode": "26000",
        "addressCountry": "PK"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 33.5869,
        "longitude": 71.4460
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "priceRange": "PKR 899 - PKR 2999",
      "hasMap": "https://share.google/4qYt5oe9pBqKFpKce",
      "sameAs": [
        "https://share.google/4qYt5oe9pBqKFpKce",
        "https://www.wikidata.org/wiki/Q141989418",
        "https://www.youtube.com/@MSRFoods-official-pk",
        "https://www.instagram.com/msrfoods.official/",
        "https://www.tiktok.com/@msrfoodsoffical",
        "https://www.facebook.com/USSPRODUCTIONLEVEL"
      ],
        "https://www.facebook.com/USSPRODUCTIONLEVEL"
      ],
      "foundingDate": "2026",
      "areaServed": {
        "@type": "Country",
        "name": "Pakistan"
      }
    }
    <\/script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About MSR Foods — Our Story & Heritage",
      "url": "https://msrfoodsofficial.food/#/about",
      "description": "Discover the story of MSR Foods, our founding vision in Kohat, our sacred sourcing standards, and our commitment to pure natural superfoods across Pakistan.",
      "mainEntity": {
        "@type": "Organization",
        "name": "MSR Foods",
        "url": "https://msrfoodsofficial.food"
      }
    }
    <\/script>

    <!-- 8. Single Clear CTA Section -->
    ${secCTA()}
  `
});

// ==========================================
// BLOG SYSTEM
// ==========================================

const BLOG_POSTS = [
  {
    slug: "natural-protein-sources-gym-pakistan",
    title: "Best Natural Protein Sources for Gym in Pakistan (2026 Guide)",
    category: "Fitness & Nutrition",
    date: "November 2026",
    dateISO: "2026-11-01",
    readTime: "5 min read",
    excerpt: "Discover the top natural protein sources available in Pakistan for gym-goers and athletes who want to build muscle without artificial supplements.",
    body: `
      <p>In Pakistan's burgeoning fitness community, a common myth persists: that building lean muscle mass, recovering from intense resistance training, and achieving peak athletic performance is impossible without imported synthetic whey protein powders. Yet, experienced athletes and sports nutritionists know that whole-food, bioavailable nutrition remains the true gold standard for long-term health and sustainable gains.</p>

      <p>Synthetic supplements sold in local markets frequently pose challenges, ranging from counterfeit batches and hidden heavy metals to digestive distress, bloating, and steep price volatility. By contrast, natural Pakistani superfoods offer dense amino acid profiles accompanied by vital enzymes, micronutrients, and healthy fats that artificial isolates simply cannot match.</p>

      <h2>Why Whole-Food Protein Outperforms Synthetic Supplements</h2>
      <p>Whole-food protein sources provide complete nutrient matrices. When you consume natural protein, your digestive system absorbs amino acids alongside co-factors such as magnesium, zinc, B-complex vitamins, and essential fatty acids. This natural synergy enhances muscle protein synthesis (MPS) while supporting liver function, hormonal balance, and long-term gut integrity.</p>

      <blockquote>Natural nutrition does not just rebuild muscle fibers after a workout; it strengthens your hormonal foundation and immune resilience from within.</blockquote>

      <h2>The Top Natural Protein Sources Available in Pakistan</h2>
      <p>Here are the most effective, nutrient-dense natural protein staples you can easily incorporate into your daily routine:</p>
      <ul>
        <li><strong>Dry Fruits and Powerhouse Seeds:</strong> Almonds, walnuts, pistachios, cashews, and pumpkin seeds are unmatched sources of plant protein, L-arginine (which boosts blood flow and nitric oxide), and anti-inflammatory Omega-3 fatty acids.</li>
        <li><strong>Desi Farm Eggs:</strong> Offering the highest biological value of any whole food, eggs deliver 6 to 7 grams of complete protein per unit alongside choline for neurological focus.</li>
        <li><strong>Daal & Legumes (Lentils, Chickpeas & Black Gram):</strong> A traditional Pakistani staple providing 18 to 22 grams of protein per cooked cup, abundant in dietary fiber and slow-burning complex carbohydrates.</li>
        <li><strong>Raw Mountain Honey:</strong> While not a direct protein source, pure honey provides the precise enzymatic monosaccharides required to spike insulin just enough to shuttle amino acids directly into depleted muscle cells post-workout.</li>
      </ul>

      <h2>The Role of MSR Honey Nut Mix in Athletic Nutrition</h2>
      <p>One of the most practical and potent natural options for Pakistani lifters is <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a>. Delivering a remarkable <strong>15.4 grams of bioavailable protein per 100g</strong>, this handcrafted blend brings together dry-roasted California almonds, Kashmiri walnuts, Iranian pistachios, cashews, peanuts, and cold-extracted mountain honey with pumpkin, sunflower, and sesame seeds.</p>

      <p>Beyond protein, the mix delivers zinc and magnesium—two critical minerals that support natural testosterone production, deep sleep, and muscular contraction. Unlike sticky commercial snack bars filled with glucose syrup and maltodextrin, MSR Honey Nut Mix contains zero artificial preservatives or refined sugars.</p>

      <h2>How to Use Honey Nut Mix Around Your Workouts</h2>
      <h3>Pre-Workout Fuel (30 to 45 Minutes Before Training)</h3>
      <p>Take 1 to 2 tablespoons of MSR Honey Nut Mix directly or stirred into black coffee. The natural fructose and glucose from the raw honey provide immediate and steady cellular fuel, while the healthy fats sustain your stamina through intense lifting sets without a sugar crash.</p>

      <h3>Post-Workout Recovery Window</h3>
      <p>Pair 2 tablespoons of Honey Nut Mix with a cup of warm milk, Greek yogurt, or boiled egg whites within 45 minutes of finishing your workout. The honey swiftly replenishes depleted glycogen stores, driving the 15.4g plant protein and essential amino acids straight into recovering muscle fibers.</p>

      <p>Fueling your physique naturally in Pakistan does not require compromising on results. By anchoring your nutrition in proven whole foods and clean artisanal superfoods like <a href="#/shop">MSR Honey Nut Mix</a>, you build lasting strength, stamina, and vitality.</p>
    `
  },
  {
    slug: "pcos-natural-treatment-seeds-nuts-pakistan",
    title: "PCOS Natural Treatment: How Seeds and Nuts Help Balance Hormones in Pakistan",
    category: "Women's Health",
    date: "November 2026",
    dateISO: "2026-11-02",
    readTime: "6 min read",
    excerpt: "Learn how seed cycling, essential fatty acids, and natural nuts help manage PCOS symptoms and restore hormonal balance for Pakistani women.",
    body: `
      <p>Polycystic Ovary Syndrome (PCOS) has become one of the most widespread endocrine disorders among Pakistani women, with recent clinical estimates suggesting that nearly one in every four or five women of reproductive age is affected. Characterized by irregular menstrual cycles, persistent acne, hair thinning, weight fluctuations, and chronic fatigue, PCOS is deeply tied to underlying hormonal imbalances and insulin resistance.</p>

      <p>While pharmaceutical interventions are frequently prescribed, functional medicine and clinical nutrition increasingly emphasize the powerful role of lifestyle adjustments—specifically targeted dietary therapies using nutrient-rich seeds, healthy fats, and unrefined natural foods.</p>

      <h2>Understanding the Root Causes of PCOS</h2>
      <p>At its core, PCOS is driven by two interrelated metabolic factors: chronic low-grade inflammation and hyperinsulinemia (excess insulin in the bloodstream). Elevated insulin levels stimulate the ovaries to produce excess androgens (male hormones such as testosterone), which interrupt normal ovulation and trigger physical symptoms like hirsutism and breakouts.</p>

      <p>To reverse this cycle, the body requires micronutrients that enhance insulin receptor sensitivity, bind to excess hormones, and systematically quench cellular inflammation.</p>

      <h2>The Power of Seed Cycling for Hormonal Harmony</h2>
      <p>Seed cycling is an evidence-supported nutritional protocol that uses specific seed varieties across the two phases of the menstrual cycle to nurture natural estrogen and progesterone rhythms:</p>

      <h3>Phase 1: The Follicular Phase (Days 1 to 14)</h3>
      <p>From the first day of your period until ovulation, the body requires gentle estrogen support. <strong>Pumpkin seeds</strong> and flax seeds are the champions of this phase. Pumpkin seeds are exceptionally high in bioavailable zinc, which supports progesterone production for the upcoming second phase and prevents testosterone from converting into harmful dihydrotestosterone (DHT).</p>

      <h3>Phase 2: The Luteal Phase (Days 15 to 28)</h3>
      <p>Following ovulation until the next cycle begins, the body needs progesterone to maintain a healthy uterine lining. <strong>Sunflower seeds</strong> (rich in Vitamin E and selenium) and <strong>sesame seeds</strong> (packed with unique lignans that block excess estrogen accumulation) help maintain optimum luteal balance and minimize common PMS mood swings and water retention.</p>

      <blockquote>By nourishing the endocrine system with targeted seeds, women provide their bodies with the exact raw lipid building blocks needed for hormonal synthesis.</blockquote>

      <h2>Why Nuts and Mountain Honey Aid PCOS Recovery</h2>
      <p>In addition to seeds, whole tree nuts play a crucial role. <strong>Kashmiri walnuts</strong> are one of the world's richest plant sources of alpha-linolenic acid (ALA), an essential Omega-3 fatty acid shown to reduce luteinizing hormone (LH) hypersecretion and lower serum triglycerides in women with PCOS.</p>

      <p>Furthermore, replacing refined white sugar with pure, unprocessed <a href="#/about">raw mountain honey</a> provides valuable polyphenols and flavonoids without provoking the sharp insulin spikes that exacerbate androgen production. Honey acts as a natural prebiotic, supporting the estrobolome—the gut bacteria dedicated to metabolizing and eliminating used estrogens.</p>

      <h2>Integrating MSR Honey Nut Mix into Your Daily Routine</h2>
      <p>Consistently sourcing fresh, unsalted, high-grade seeds and nuts can be time-consuming. <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> brings together the core ingredients of hormonal wellness in a single, delicious spoonful: pumpkin seeds, sunflower seeds, and sesame seeds alongside golden-roasted California almonds, Kashmiri walnuts, cashews, and raw honey.</p>

      <ul>
        <li><strong>Morning Ritual:</strong> Take one generous tablespoon of MSR Honey Nut Mix each morning alongside a glass of warm water or cinnamon tea to kickstart insulin sensitivity.</li>
        <li><strong>Breakfast Booster:</strong> Fold a spoonful into rolled oats or unsweetened yogurt to add crunch and sustained satiety without glucose spikes.</li>
        <li><strong>Chai Sugar Replacement:</strong> Swap refined table sugar in your evening routine for a spoonful of raw honey and seeds to satisfy sweet cravings cleanly.</li>
      </ul>

      <p>Overcoming PCOS is a journey of patient, consistent self-care. By nourishing your body with authentic whole foods like <a href="#/shop">MSR Foods natural superfood blends</a>, you take control of your hormonal well-being naturally and sustainably.</p>
    `
  },
  {
    slug: "honey-nut-mix-pregnancy-benefits-pakistan",
    title: "Honey Nut Mix During Pregnancy: Why It’s Vital for Mother & Baby in Pakistan",
    category: "Maternal Health",
    date: "November 2026",
    dateISO: "2026-11-06",
    readTime: "6 min read",
    excerpt: "Learn why raw mountain honey and premium roasted dry fruits provide vital folate, bioavailable iron, and DHA precursors for expectant mothers and fetal development in Pakistan.",
    body: `
      <p>Pregnancy is a period of profound physiological transformation. In Pakistan, where maternal nutrition often faces significant hurdles—over 50% of pregnant women experience gestational anemia and chronic micronutrient deficiencies according to the National Nutrition Survey—prioritizing dense, clean, and bioavailable nutrition is essential for both mother and growing baby.</p>

      <p>Between morning sickness, fluctuating blood sugar levels, severe fatigue, and digestive sensitivity, expecting mothers need whole foods that deliver maximum nourishment without burdening digestion. Pairing pure, raw mountain honey with slow-roasted premium dry fruits and nutrient-rich seeds creates an exceptional, time-tested maternal superfood.</p>

      <h2>Vital Nutrients for Fetal Growth in Every Spoonful</h2>
      <p>Each ingredient in <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> has been selected to deliver targeted building blocks necessary for fetal organogenesis and maternal vitality:</p>

      <h3>1. Natural Folate (Vitamin B9) for Neural Tube Development</h3>
      <p>Folate is indispensable during pregnancy for cell division and the proper formation of the fetal neural tube, preventing serious birth anomalies like spina bifida. Almonds, walnuts, and pumpkin seeds are rich in natural, food-state folates that the body easily assimilates alongside synergistic co-vitamins.</p>

      <h3>2. Plant Iron & Copper to Combat Pregnancy Anemia</h3>
      <p>During pregnancy, maternal blood volume expands by nearly 50% to nurture the placenta and growing fetus. This dramatically elevates iron requirements. Synthetic iron pills frequently trigger severe constipation, nausea, and stomach cramps. The natural iron found in pumpkin seeds, cashews, and almonds—enhanced by trace copper and organic acids in raw honey—supports healthy hemoglobin production gently and comfortably.</p>

      <h3>3. Omega-3 Fatty Acids (ALA) for Baby’s Brain & Retinal Growth</h3>
      <p>The third trimester sees explosive growth in fetal brain mass and neural connections. <strong>Kashmiri walnuts</strong> are exceptionally rich in alpha-linolenic acid (ALA), a vital plant Omega-3 fatty acid that serves as a direct precursor to DHA, the structural fatty acid composing over 20% of the brain's cerebral cortex and retina.</p>

      <h3>4. Magnesium & Calcium for Strong Bones & Cramp Relief</h3>
      <p>Skeletal mineralization draws heavily on maternal calcium stores. The calcium in almonds and sesame seeds, combined with the dense magnesium in pumpkin seeds, ensures the baby develops strong skeletal architecture while shielding the mother from painful nocturnal leg and calf cramps.</p>

      <blockquote>A mother's nutrition during the first 1,000 days from conception lays the genetic and metabolic foundation for her child's entire lifetime of health.</blockquote>

      <h2>Soothing Maternal Morning Sickness & Acid Reflux</h2>
      <p>Many Pakistani women suffer debilitating nausea and acidity during the first and third trimesters. Unlike refined table sugar or artificial bakery items that trigger sharp insulin spikes and acid flare-ups, cold-extracted mountain honey contains natural enzymes, mild antiseptic flavonoids, and soothing properties that coat the esophagus and gently settle turbulent stomach acids.</p>

      <h2>Safety and Quality: Why Purity Matters in Pregnancy</h2>
      <p>Expectant mothers must avoid contaminated or raw unhygienic foods. MSR Foods adheres to uncompromising hygiene standards: all dry fruits and seeds are thoroughly cleaned and golden dry-roasted under controlled temperatures to eliminate surface microbes, then preserved in pure raw mountain honey within hermetically sealed food-grade jars. There are zero chemical additives, zero artificial colors, and zero high-fructose corn syrups.</p>

      <h2>How Expectant Mothers Can Enjoy Honey Nut Mix</h2>
      <ul>
        <li><strong>Morning Vitality Spoon:</strong> Take 1 to 2 tablespoons in the morning alongside a glass of lukewarm milk or fresh lassi for clean, sustained morning energy.</li>
        <li><strong>Midday Nausea Buffer:</strong> Keep a 250g jar on your bedside table or office desk; a small spoonful gently stabilizes dipping blood sugar between meals.</li>
        <li><strong>Nutrient-Dense Porridge Topping:</strong> Fold a generous spoonful into warm oats, suji kheer, or yogurt for added crunch and mineral density.</li>
      </ul>

      <p><em>Medical Note:</em> As with any dietary addition during pregnancy, mothers diagnosed with gestational diabetes or specific nut allergies should consult their obstetrician or healthcare professional before modifying their meal plans. Explore our pure, double-sealed <a href="#/shop">MSR Honey Nut Mix Jars</a> today.</p>
    `
  },
  {
    slug: "quick-healthy-energy-busy-moms-pakistan",
    title: "The 60-Second Nutrition Fix: Why Busy Pakistani Moms Rely on Honey Nut Mix",
    category: "Family & Lifestyle",
    date: "November 2026",
    dateISO: "2026-11-07",
    readTime: "5 min read",
    excerpt: "Balancing school runs, household chores, and careers leaves Pakistani mothers exhausted. Discover how a 60-second power spoonful of honey and nuts restores daily vitality.",
    body: `
      <p>From the moment the alarm rings at 6:00 AM, a Pakistani mother's day is a non-stop marathon: packing school lunchboxes, ironing uniforms, preparing family breakfasts, managing household chores, and often heading out to professional jobs or running home businesses. In this relentless rush, mothers are almost always the last ones to eat.</p>

      <p>The common result? "Tired All The Time" (TATT) syndrome. Millions of Pakistani mothers survive on two or three cups of heavily sweetened chai, skipped breakfasts, and whatever cold leftovers remain. This creates a relentless cycle of mid-morning brain fog, afternoon energy crashes, and chronic irritability.</p>

      <h2>The Problem with the 'Chai & Biscuit' Routine</h2>
      <p>When exhaustion strikes, reaching for a cup of sweet tea and packaged bakery biscuits feels like the easiest fix. However, refined white flour (maida) and processed sugar trigger an immediate spike in blood glucose, followed within 90 minutes by a steep hormonal crash. This crash depletes adrenal glands, exacerbates mood swings, and leaves you feeling more depleted than before.</p>

      <blockquote>Mothers are the heartbeat of every Pakistani home. When a mother's energy is drained, the entire family feels the strain. Investing in self-nourishment is not selfish—it is foundational.</blockquote>

      <h2>The 60-Second Solution: One Spoonful of Pure Vitality</h2>
      <p>Busy mothers do not have 45 minutes to prepare complex superfood smoothies or gourmet fitness bowls. They need instant, bioavailable nutrition that requires <strong>zero cooking, zero chopping, and zero cleanup</strong>. That is exactly why <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> has become the secret weapon of smart Pakistani moms.</p>

      <p>Just unscrew the jar and take one heaped tablespoon. In 60 seconds, your body receives:</p>
      <ul>
        <li><strong>Clean, Sustained Glucose:</strong> Unpasteurized mountain honey provides instant mental clarity and lifts morning brain fog without a glycemic crash.</li>
        <li><strong>Plant Protein & Healthy Fats:</strong> Roasted California almonds, cashews, and Kashmiri walnuts deliver 15.4g of protein per 100g and heart-healthy lipids that sustain cellular energy for 4 to 5 hours.</li>
        <li><strong>Magnesium & B-Vitamins:</strong> Nature's ultimate anti-stress minerals found in pumpkin and sunflower seeds, calming maternal anxiety and supporting adrenal health.</li>
        <li><strong>Natural Iron:</strong> Keeps hemoglobin high, combating the pale fatigue and lightheadedness that affect so many Pakistani women.</li>
      </ul>

      <h2>A Wholesome Treat the Entire Family Loves</h2>
      <p>Beyond personal nourishment, MSR Honey Nut Mix solves another major daily headache: finding healthy snacks for growing children. Instead of processed chocolate spreads loaded with hydrogenated palm oil and synthetic chemicals, mothers can offer a spoonful of honey-roasted nuts and seeds over toast, fruit slices, or evening milk. Children love the natural golden sweetness and satisfying crunch, while receiving essential brain nutrients for school performance.</p>

      <h2>Three Effortless Ways to Incorporate It into Your Day</h2>
      <ol>
        <li><strong>The Morning Dawn Kickstart (6:30 AM):</strong> Take 1 tablespoon with your morning glass of water before the household chaos begins to establish a calm, nourished baseline.</li>
        <li><strong>The 3:00 PM School-Pickup Revival:</strong> Instead of sugary bakery treats, take a spoonful before driving to school pickup or beginning afternoon homework sessions.</li>
        <li><strong>The Guilt-Free Late-Night Treat:</strong> Satisfy post-dinner sweet cravings cleanly with a single spoon that promotes restful, restorative sleep thanks to walnut melatonin.</li>
      </ol>

      <p>Reclaim your vitality and take care of yourself so you can continue taking care of those you love. Experience the pure goodness of handcrafted <a href="#/shop">MSR Honey Nut Mix</a> today.</p>
    `
  },
  {
    slug: "honey-nut-mix-for-runners-pakistan-endurance",
    title: "Fueling the Long Run: Why Runners in Pakistan Are Replacing Gels with Honey Nut Mix",
    category: "Running & Endurance",
    date: "November 2026",
    dateISO: "2026-11-08",
    readTime: "5 min read",
    excerpt: "Say goodbye to chemical energy gels and runner’s gut. Discover how raw mountain honey and golden-roasted nuts optimize glycogen loading, stamina, and recovery for Pakistani runners.",
    body: `
      <p>Pakistan's endurance running community is undergoing a massive cultural resurgence. From the early morning paces along Islamabad's Margalla road loops and Karachi's Seaview coastline to organized marathon clubs across Lahore and Peshawar, more Pakistanis than ever are training for 5Ks, 10Ks, half-marathons, and full 42km distances.</p>

      <p>Yet, as weekly mileage climbs, runners face a universal obstacle: nutritional fueling. For years, runners relied on imported synthetic carbohydrate gels. Today, elite endurance athletes and sports science researchers are rediscovering nature's ultimate high-performance fuel: pure mountain honey paired with nutrient-dense roasted nuts and seeds.</p>

      <h2>The Pitfalls of Synthetic Gels & 'Runner’s Gut'</h2>
      <p>Commercial energy gels are largely composed of concentrated maltodextrin, synthetic fructose syrups, artificial flavorings, and chemical preservatives. While convenient, they frequently cause severe gastrointestinal distress—commonly known in the running community as "runner's trots" or stomach cramping.</p>

      <p>When high concentrations of artificial sugars hit the stomach during intense running, blood is diverted away from the gut to working leg muscles, resulting in poor absorption, nausea, and sharp hypoglycemic crashes 30 minutes later.</p>

      <h2>The Science of Honey: Multiple Transportable Carbohydrates (MTC)</h2>
      <p>Sports nutrition science has established that the human digestive system absorbs carbohydrates most rapidly when utilizing multiple intestinal transporter pathways simultaneously:</p>

      <ul>
        <li><strong>Glucose</strong> enters the bloodstream via sodium-dependent <em>SGLT1</em> transporters.</li>
        <li><strong>Fructose</strong> is absorbed via distinct <em>GLUT5</em> transporters.</li>
      </ul>

      <p>Because raw mountain honey naturally contains a perfect, enzyme-balanced ratio of bioavailable glucose and fructose, it allows runners to oxidize up to <strong>50% more carbohydrates per hour</strong> without saturating intestinal receptors or causing gastrointestinal upset.</p>

      <blockquote>Raw honey provides an optimal, gut-friendly glycemic index that elevates blood glucose smoothly and sustains muscle glycogen far longer than artificial glucose syrups.</blockquote>

      <h2>Protecting Joints & Accelerating Post-Run Recovery</h2>
      <p>Distance running places extreme mechanical stress on knees, ankles, and myofibrillar tissues. Every foot strike sends shockwaves through the lower kinetic chain, elevating inflammatory biomarkers such as C-reactive protein (CRP) and interleukin-6 (IL-6).</p>

      <p><a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> delivers targeted anti-inflammatory protection:</p>
      <ul>
        <li><strong>Kashmiri Walnuts:</strong> Abundant in plant-based Omega-3 (ALA), helping lubricate articular cartilage and suppress post-run joint soreness.</li>
        <li><strong>California Almonds:</strong> Packed with alpha-tocopherol (Vitamin E), which neutralizes the heavy exercise-induced oxidative stress generated by high-volume aerobic breathing.</li>
        <li><strong>Pumpkin & Sunflower Seeds:</strong> Supply bioavailable magnesium, potassium, and zinc to replenish electrolytes lost through heavy sweating and halt nocturnal muscle cramps.</li>
        <li><strong>15.4g Protein per 100g:</strong> Supplies branched-chain amino acids (BCAAs) and L-arginine to stimulate muscle protein synthesis and repair micro-tears.</li>
      </ul>

      <h2>The Runner’s Fueling Strategy with MSR Honey Nut Mix</h2>
      <h3>1. Pre-Run Primer (40 Minutes Before Lacing Up)</h3>
      <p>Consume 1 to 2 tablespoons of MSR Honey Nut Mix with a glass of water or black coffee. The honey tops off liver glycogen for immediate stride responsiveness, while the healthy fats provide a slow-burning metabolic floor for miles 5 through 15.</p>

      <h3>2. Post-Run Golden Window (Within 30 Minutes)</h3>
      <p>Immediately after finishing your long run or tempo workout, take 2 generous tablespoons paired with water or milk. Honey swiftly sparks an insulin response that drives amino acids and glycogen straight into depleted leg muscles, drastically cutting recovery time before your next session.</p>

      <p>Step up your personal records with clean, wholesome sports nutrition. Fuel your next long run with <a href="#/shop">MSR Foods Honey Nut Mix</a>.</p>
    `
  },
  {
    slug: "best-hiking-trail-snack-pakistan-honey-nuts",
    title: "The Ultimate High-Altitude Trail Fuel: Why Hikers in Pakistan Choose Honey Nut Mix",
    category: "Outdoor & Adventure",
    date: "November 2026",
    dateISO: "2026-11-09",
    readTime: "5 min read",
    excerpt: "Heading to Miranjani, Mushkpuri, Fairy Meadows, or the Karakoram? Discover why high-density honey nut mix is Pakistan’s premier lightweight trail snack for hikers and trekkers.",
    body: `
      <p>Pakistan is blessed with some of the most spectacular mountain topography on planet Earth. From brisk weekend morning ascents on Trail 3 and Trail 5 in Islamabad's Margalla Hills to snow-dusted ridges on Mushkpuri and Miranjani in Galyat, and legendary expeditions across Fairy Meadows, Nanga Parbat Base Camp, and the Karakoram trails—hiking has become a cherished passion for thousands of adventurous Pakistanis.</p>

      <p>However, mountain trails present a unique physiological test: high elevation gain, steep ascents, fluctuating alpine weather, and severe caloric burn. Navigating these trails requires trail nutrition that is lightweight, calorie-dense, and highly resilient.</p>

      <h2>The Alpine Caloric Deficit</h2>
      <p>Trekking uphill with a loaded backpack burns between <strong>500 and 700 calories per hour</strong>. On a typical 6 to 8 hour day hike, your body can easily burn over 4,000 calories. If you fail to supply consistent fuel, you will hit "the wall"—characterized by trembling leg muscles, sudden altitude dizziness, mental fatigue, and dangerous loss of footing on narrow ridges.</p>

      <p>Unfortunately, standard trail snacks carried by novice hikers in Pakistan fall short:</p>
      <ul>
        <li><strong>Commercial Chocolate Bars:</strong> Melt into an unappetizing sludge in summer heat or freeze rock-hard in alpine winters, providing only brief sugar rushes followed by heavy crashes.</li>
        <li><strong>Bakery Biscuits:</strong> Crumble into dust inside your rucksack, providing empty carbohydrates with virtually zero electrolyte or protein value.</li>
        <li><strong>Canned or Heavy Foods:</strong> Add unnecessary dead weight to your backpack and leave messy waste behind.</li>
      </ul>

      <h2>The Dual-Stage Engine: Why Honey & Roasted Nuts Excel</h2>
      <p>Seasoned mountain guides and high-altitude trekkers rely on the biological synergy of <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> because it operates as a dual-stage endurance engine:</p>

      <h3>Stage 1: Immediate Elevation Power (Raw Mountain Honey)</h3>
      <p>When you encounter a brutal 30-degree incline, your muscles demand immediate glucose. The raw, enzymatic mountain honey delivers fast-acting monosaccharides that absorb quickly without placing heavy demands on a digestive system stressed by thin air.</p>

      <h3>Stage 2: Sustained 6-Hour Alpine Stamina (Roasted Nuts & Seeds)</h3>
      <p>While honey powers the climb, the slow-burning, dense healthy fats and 15.4g plant protein from California almonds, Kashmiri walnuts, cashews, pistachios, and seeds release a steady trickle of ATP energy hour after hour, keeping your legs fresh through grueling ridge crossings.</p>

      <blockquote>At 9,000 feet above sea level, every ounce in your backpack counts. Packing nutrient-dense whole foods ensures you summit safely without unnecessary pack weight.</blockquote>

      <h2>Natural Electrolyte Defense Against Trail Cramps</h2>
      <p>Climbing under the Pakistani sun leads to heavy mineral loss through perspiration. Dehydration combined with magnesium and potassium depletion causes agonizing calf and hamstring spasms on rocky descents. The dense natural matrix of magnesium, potassium, zinc, and natural sea salts found in roasted pumpkin seeds, almonds, and peanuts replenishes cellular electrolytes naturally, ensuring sure-footed agility.</p>

      <h2>Pack-Ready, Weatherproof Durability</h2>
      <p>MSR Honey Nut Mix comes in sturdy, double-sealed food-grade jars that will not crush, leak, or spoil in your rucksack. It requires zero camp stoves, zero boiling water, and leaves zero sticky plastic wrappers along pristine mountain paths.</p>

      <h2>Trail Protocol for Pakistani Trekkers</h2>
      <ol>
        <li><strong>Trailhead Ignition:</strong> Take 1 tablespoon before strapping on your pack at the base of the trail.</li>
        <li><strong>Hourly Ridge Pacing:</strong> Eat 1 spoonful every 45 to 60 minutes alongside sips of fresh water to maintain consistent blood glucose without stomach heaviness.</li>
        <li><strong>Summit Reward:</strong> Celebrate reaching the peak with a generous serving to kickstart muscle recovery before tackling the descent.</li>
      </ol>

      <p>Respect the mountains, pack light, and fuel your next great outdoor adventure with pure Pakistani superfood nutrition from <a href="#/shop">MSR Foods</a>.</p>
    `
  },
  {
    slug: "natural-immunity-booster-honey-nuts-pakistan",
    title: "Natural Immunity Booster: How Honey Nut Mix Fortifies Your Defenses in Pakistan",
    category: "Immunity & Wellness",
    date: "November 2026",
    dateISO: "2026-11-10",
    readTime: "6 min read",
    excerpt: "From severe winter smog in Lahore to seasonal flu across Pakistan, learn how raw mountain honey, zinc, and antioxidant-rich nuts build an impenetrable natural immune shield.",
    body: `
      <p>Every year across Pakistan, the onset of autumn and winter brings a major public health emergency: hazardous toxic smog blanketing Lahore, Faisalabad, and the plains of Punjab, coupled with abrupt temperature drops, dry dust, and seasonal influenza epidemics in Karachi, Rawalpindi, and Peshawar.</p>

      <p>Airborne particulate matter (PM2.5) penetrates deep into the respiratory tract, generating intense oxidative stress, triggering chronic throat irritation, and compromising the immune system. While many turn to synthetic effervescent vitamin C tablets or over-the-counter cough syrups, clinical immunologists agree that true immune resilience requires whole-food, bioavailable micronutrients that reinforce the body's natural defense systems from within.</p>

      <h2>The Three Biological Immunity Pillars in Honey Nut Mix</h2>
      <p>Nature has provided an extraordinary defense formulation in the pairing of pure raw mountain honey with mineral-dense dry fruits and seeds. Here is how <a href="#/product/honey-nut-mix-500g">MSR Honey Nut Mix</a> actively strengthens your immune response:</p>

      <h3>Pillar 1: Raw Mountain Honey (Antimicrobial & Antiviral Barrier)</h3>
      <p>Unlike pasteurized supermarket honey that has been heated into simple sugar syrup, authentic raw mountain honey retains its live enzymes—notably <em>glucose oxidase</em>. When in contact with moisture, this enzyme produces microscopic, safe levels of natural hydrogen peroxide that inhibit bacterial pathogens.</p>

      <p>Furthermore, raw honey contains <strong>defensin-1</strong> (a natural antimicrobial peptide secreted by healthy bees) and abundant polyphenols like pinocembrin and chrysin. These compounds form a soothing antimicrobial shield across sensitive pharyngeal tissues, easing throat irritation and blocking pathogen entry.</p>

      <h3>Pillar 2: Bioavailable Zinc & Selenium (Immune Cell Multipliers)</h3>
      <p>Zinc is the primary mineral regulator of the human immune system. Without sufficient zinc, your body cannot produce or activate T-lymphocytes (white blood cells that identify and destroy virally infected cells). Pumpkin seeds, cashews, and almonds are nature’s richest plant-based zinc sources, accompanied by trace selenium from sunflower seeds to supercharge antioxidant enzyme systems like glutathione peroxidase.</p>

      <h3>Pillar 3: Vitamin E & Polyphenols (Smog & Free-Radical Defense)</h3>
      <p>Inhaling urban smog floods the bloodstream with reactive oxygen species (free radicals) that damage lung epithelial cells. California almonds are loaded with alpha-tocopherol (natural Vitamin E), the primary lipid-soluble antioxidant that protects cell membranes against environmental toxins and calms pulmonary inflammation.</p>

      <blockquote>Immunity is not built in a day through emergency pills; it is fortified daily through the wholesome foods you feed your cells.</blockquote>

      <h2>The Gut-Immune Connection: Nourishing Your Microbiome</h2>
      <p>Modern immunology has revealed that over <strong>70% of the entire human immune system</strong> resides along the gastrointestinal tract in the Gut-Associated Lymphoid Tissue (GALT). A healthy microbiome is your first line of defense against disease.</p>

      <p>Raw mountain honey is packed with natural prebiotic oligosaccharides that nourish beneficial gut bacteria such as <em>Bifidobacteria</em> and <em>Lactobacilli</em>. Together with the prebiotic dietary fiber from whole dry fruits and trio-seeds (pumpkin, sunflower, sesame), it fosters a flourishing microbial ecosystem that produces short-chain fatty acids (SCFAs), directly signaling immune cells to stay vigilant against infections.</p>

      <h2>The Golden Spoon Daily Routine for the Whole Family</h2>
      <p>Protecting your household against seasonal ailments and urban air pollution is simple, delicious, and consistent:</p>
      <ul>
        <li><strong>The Morning Immunity Ritual:</strong> Take 1 to 2 tablespoons of MSR Honey Nut Mix each morning on an empty stomach alongside a glass of lukewarm (not boiling) water. Lukewarm water protects the delicate live enzymes in the raw honey while gently waking your digestive tract.</li>
        <li><strong>Throat Soothing Buffer:</strong> If you feel a scratchy throat or dry cough after commuting through traffic or smog, a slow spoonful of honey and crunchy nuts coats irritated mucosal linings immediately.</li>
        <li><strong>All Ages Nourishment:</strong> Safe and beneficial for growing children (above 1 year of age), working professionals, and elderly family members whose immune systems need gentle, natural fortification.</li>
      </ul>

      <p>Shield your family naturally with Pakistan's gold standard of pure, unadulterated superfood nutrition. Order your double-sealed jars of <a href="#/shop">MSR Honey Nut Mix</a> today.</p>
    `
  },
  /*
  // HIDDEN FOR LATER (Talbina product launch):
  {
    slug: "what-is-talbina-talbeena-benefits-pakistan",
    title: "What is Talbina (Talbeena)? Benefits, Recipe and Where to Buy in Pakistan",
    category: "Prophetic Nutrition",
    date: "November 2026",
    dateISO: "2026-11-03",
    readTime: "5 min read",
    excerpt: "Explore the ancient healing wisdom of Talbina, its science-backed health benefits, simple home recipe, and why pure raw honey is the essential heart of the dish.",
    body: `...`
  },
  */
  {
    slug: "brain-food-students-pakistan-energy-focus",
    title: "Top Brain Foods for Students in Pakistan: Boost Energy and Focus Naturally",
    category: "Focus & Mind",
    date: "November 2026",
    dateISO: "2026-11-04",
    readTime: "5 min read",
    excerpt: "Discover the best natural brain-boosting foods for Pakistani students facing exam stress, fatigue, and memory challenges without harmful energy drinks.",
    body: `
      <p>Whether preparing for Matric, FSc, O/A Levels, MDCAT, CSS examinations, or demanding university semester finals, Pakistani students operate under intense cognitive demands. Long study hours, late-night revisions, and intense competition often push students toward sugary energy drinks, hyper-caffeinated sodas, and processed junk snacks.</p>

      <p>While these artificial fixes offer a fleeting burst of alertness, they inevitably lead to severe mental crashes, brain fog, erratic sleep cycles, and elevated anxiety. True cognitive stamina—sharp recall, prolonged focus, and calm mental clarity—requires genuine neuro-nutritional fuel.</p>

      <h2>The Hidden Dangers of Commercial Energy Drinks</h2>
      <p>Commercial energy beverages popular in local Pakistani convenience stores deliver excessive doses of synthetic caffeine, artificial taurine, and up to 35 grams of refined sugar per can. This creates an immediate spike in blood glucose followed by an insulin surge that leaves brain neurons starved of fuel within two hours.</p>

      <blockquote>Your brain consumes over twenty percent of your body's total metabolic energy. Feeding it artificial chemicals during exam preparation impairs long-term memory retention and synaptic speed.</blockquote>

      <p>Replacing synthetic stimulants with clean, nutrient-dense whole foods stabilizes cerebral blood flow and supports neurotransmitter synthesis when it matters most.</p>

      <h2>The Essential Brain Foods for Pakistani Students</h2>
      <h3>1. Kashmiri Walnuts (The Ultimate Brain Nut)</h3>
      <p>Shaped uncannily like the human cerebrum, walnuts are nature's premier neuro-nut. They are loaded with alpha-linolenic acid (ALA), a plant-based Omega-3 fatty acid vital for maintaining the fluidity of brain cell membranes. Clinical trials link regular walnut consumption with faster information processing speed, sharper memory retention, and heightened cognitive flexibility.</p>

      <h3>2. California Almonds (Vitamin E & Neuro-Protection)</h3>
      <p>A cherished tradition across Pakistan is eating almonds for memory. Modern neuroscience validates this ancestral wisdom: almonds are extraordinarily rich in alpha-tocopherol (Vitamin E), a potent fat-soluble antioxidant that protects brain cells from the oxidative stress caused by sleep deprivation and intellectual strain.</p>

      <h3>3. Raw Mountain Honey (Sustained Neural Glucose)</h3>
      <p>Unlike refined white sugar, <a href="#/about">raw mountain honey</a> contains a balanced natural ratio of glucose and fructose alongside trace minerals and active bioflavonoids. The liver releases glycogen from natural honey slowly into the bloodstream, supplying a steady stream of glucose to the brain over four to five hours without mental crashes.</p>

      <h3>4. Pumpkin and Sesame Seeds (Zinc & Magnesium for Focus)</h3>
      <p>Pumpkin seeds are packed with zinc, a crucial mineral for synaptic communication and memory consolidation. Sesame and sunflower seeds contribute magnesium and B-complex vitamins that regulate the central nervous system, helping calm exam jitters and prevent stress headaches.</p>

      <h2>The Smart Daily Routine for Students</h2>
      <p>For Pakistani students juggling demanding timetables, preparing elaborate snacks is rarely realistic. That is why having a jar of <a href="#/product/honey-nut-mix-250g">MSR Honey Nut Mix (250g Starter Jar)</a> on your study desk makes a tangible difference:</p>

      <ul>
        <li><strong>Morning Focus Booster:</strong> Take one tablespoon of MSR Honey Nut Mix alongside a glass of milk or warm green tea before heading to morning lectures or exam halls.</li>
        <li><strong>Late-Night Revision Fuel:</strong> When 11:00 PM hunger strikes during study sessions, skip fried chips and instant noodles. A single spoonful of crunchy honey-roasted nuts satisfies hunger cleanly while nourishing cognitive stamina.</li>
        <li><strong>Exam Day Pocket Snack:</strong> Keep a small portion handy for mid-exam breaks to keep mental fatigue at bay without needing carbonated energy drinks.</li>
      </ul>

      <p>Fuel your mind with clean, authentic superfoods crafted right here in Pakistan. Invest in your focus, conquer exam stress, and discover the difference natural nutrition makes with <a href="#/shop">MSR Foods</a>.</p>
    `
  },
  {
    slug: "benefits-dry-fruits-honey-pakistan",
    title: "7 Science-Backed Benefits of Dry Fruits with Honey for Pakistani Health",
    category: "Everyday Wellness",
    date: "November 2026",
    dateISO: "2026-11-05",
    readTime: "6 min read",
    excerpt: "Uncover the 7 powerful, science-backed health benefits of combining raw honey with premium dry fruits for long-lasting energy, immunity, and heart wellness.",
    body: `
      <p>For generations across Pakistan and South Asia, grandmotherly wisdom has celebrated the combination of pure honey and golden dry fruits as the ultimate restorative tonic. Today, modern clinical nutritional science confirms what our elders practiced: pairing raw, unpasteurized honey with mineral-rich nuts and seeds unlocks a remarkable biological synergy that magnifies their individual health benefits.</p>

      <p>When healthy unsaturated fatty acids, plant proteins, and dietary fiber meet the natural enzymes and antioxidants of cold-extracted honey, the body absorbs micronutrients with maximum efficiency. Here are seven evidence-backed benefits of incorporating this natural superfood into your daily life.</p>

      <h2>1. Robust Immune Defense & Cellular Protection</h2>
      <p>Raw mountain honey contains active glucose oxidase enzymes that produce natural, mild hydrogen peroxide, conferring potent antibacterial and antiviral properties. When combined with the high zinc, selenium, and copper content found in almonds, pumpkin seeds, and pistachios, your immune system receives the essential micronutrients required to synthesize white blood cells and fight seasonal Pakistani winter ailments.</p>

      <h2>2. Comprehensive Cardiovascular & Cholesterol Support</h2>
      <p>Contrary to common dietary fears about fats, the monounsaturated and polyunsaturated fatty acids in almonds, cashews, and walnuts actively protect the heart. Regular intake of these healthy fats lowers low-density lipoprotein (LDL or "bad") cholesterol while elevating beneficial HDL cholesterol. Furthermore, the pinocembrin antioxidants in raw honey protect vascular endothelial walls from oxidative arterial plaque buildup.</p>

      <h2>3. Sharpened Brain Function & Memory Preservation</h2>
      <p>Nuts—particularly Kashmiri walnuts and almonds—are rich in Omega-3 fatty acids and Vitamin E, which shield delicate neural tissues from age-related degradation. The steady release of natural fructose from honey supplies consistent energy to cerebral synapses, improving mental focus and reducing mid-day fatigue.</p>

      <h2>4. Hormonal Balance & Metabolic Regulation</h2>
      <p>For Pakistani women navigating hormonal conditions like PCOS, seed blends containing pumpkin, sunflower, and sesame seeds provide rich stores of lignans, magnesium, and essential fatty acids. These compounds help regulate estrogen-to-progesterone ratios, promote healthy ovulatory cycles, and calm systemic inflammation.</p>

      <blockquote>When nature's purest ingredients are preserved without industrial refining, every spoonful acts as functional medicine for the human body.</blockquote>

      <h2>5. Clean, Sustained All-Day Energy Without Crashes</h2>
      <p>Refined sweets, biscuits, and industrial snacks cause violent blood sugar spikes followed by lethargy and cravings. The natural carbohydrate structure of raw honey, slowed by the fiber and healthy fats of roasted nuts, provides a smooth, gradual release of energy that fuels workouts, office hours, and household tasks for hours.</p>

      <h2>6. Radiant Skin Glow & Anti-Aging Nutrition</h2>
      <p>Dry, polluted urban air in cities like Lahore, Karachi, and Peshawar takes a heavy toll on skin health. The abundant Vitamin E, zinc, and polyphenolic flavonoids in honey-coated nuts combat free-radical oxidative damage, locking in moisture and stimulating collagen production from within for a natural, healthy complexion.</p>

      <h2>7. Natural Weight Management & Craving Control</h2>
      <p>Because nuts are packed with protein and dietary fiber, they stimulate the release of satiety hormones like cholecystokinin (CCK) and peptide YY. Just one or two spoonfuls of honey-soaked dry fruits satisfy sweet cravings while keeping you full for hours, preventing mindless overeating.</p>

      <h2>The Gold Standard: MSR Honey Nut Mix</h2>
      <p>At <a href="#/about">MSR Foods</a>, we handcraft Pakistan's finest honey nut blend, bringing together raw mountain honey, California almonds, Kashmiri walnuts, cashews, Iranian pistachios, peanuts, and trio-seeds (pumpkin, sunflower, sesame) under strict hygienic standards.</p>

      <p>Every jar is double-sealed for freshness and delivered directly to your doorstep anywhere in Pakistan with Cash on Delivery. Discover our convenient 250g, 500g, and 1kg family sizes today at the <a href="#/shop">MSR Foods Online Store</a>.</p>
    `
  }
];

if (typeof window !== "undefined") {
  window.BLOG_POSTS = BLOG_POSTS;
}

views.blog = () => ({
  title: `Health & Nutrition Blog | MSR Foods Pakistan`,
  html: `
    <header class="page-head">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <span>Blog</span></nav>
        <span class="pill">Wellness & Nutrition</span>
        <h1 style="margin-top:14px">Health & Nutrition Blog</h1>
        <p>Evidence-based superfood guides, natural nutrition tips, and wellness insights from Pakistan's premium superfood brand.</p>
      </div>
    </header>
    <section class="page-dark sec" style="padding-top:40px">
      <div class="wrap">
        <div class="blog-grid">
          ${BLOG_POSTS.map(post => `
            <article class="blog-card reveal">
              <div class="blog-card-body">
                <div class="blog-meta">
                  <span class="pill">${post.category}</span>
                  <span>${post.date}</span>
                  <span>·</span>
                  <span>${post.readTime}</span>
                </div>
                <h3><a href="#/blog/${post.slug}" style="color:inherit;text-decoration:none">${post.title}</a></h3>
                <p>${post.excerpt}</p>
                <a class="btn btn-line btn-sm" href="#/blog/${post.slug}">Read Article ${ICON.arrow}</a>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
    ${secTrustStrip()}
    ${secCTA()}
  `
});

views.blogPost = (slug) => {
  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) return views.blog();
  return {
    title: `${post.title} | MSR Foods`,
    html: `
      <header class="page-head">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/blog">Blog</a> / <span>${post.title}</span></nav>
          <span class="pill" style="margin-top:14px">${post.category}</span>
          <h1 style="margin-top:14px">${post.title}</h1>
          <p style="color:var(--mute-dark);margin-top:8px">${post.date} · ${post.readTime}</p>
        </div>
      </header>
      <section class="page light">
        <div class="wrap">
          <div class="prose">${post.body}</div>
          <!-- Article JSON-LD schema -->
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "${post.title}",
            "datePublished": "${post.dateISO}",
            "author": {"@type":"Organization","name":"MSR Foods"},
            "publisher": {"@type":"Organization","name":"MSR Foods","url":"https://msrfoodsofficial.food"},
            "url": "https://msrfoodsofficial.food/#/blog/${post.slug}",
            "description": "${post.excerpt}"
          }
          <\/script>
          <!-- Related products CTA -->
          <div style="margin-top:48px;padding:32px;background:var(--bg-surface);border-radius:16px;border:1px solid rgba(214,167,54,0.2);text-align:center">
            <span class="pill">Featured Product</span>
            <h2 class="h2" style="margin-top:14px">MSR Honey Nut Mix</h2>
            <p class="lead">Experience the natural superfood we referenced in this article.</p>
            <div style="display:flex;gap:14px;justify-content:center;margin-top:24px;flex-wrap:wrap">
              <a class="btn btn-gold" href="#/shop">Shop Now</a>
              <a class="btn btn-line" href="#/blog">More Articles</a>
            </div>
          </div>
        </div>
      </section>
    `
  };
};

views.contact = () => {
  const C = window.BRAND_CONFIG.contact;
  const brand = window.BRAND_CONFIG.brand;
  return {
    title: `Contact | ${brand.name} — Pure Taste. Natural Goodness.`,
    html: `
      <header class="page-head" style="padding-top:calc(var(--hdr) + 24px);padding-bottom:clamp(36px, 5vw, 64px);text-align:center;background:radial-gradient(ellipse at center top, #1a140a 0%, #000000 80%);border-bottom:1px solid var(--hair)">
        <div class="wrap" style="max-width:880px;margin:0 auto">
          <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center;margin-bottom:14px"><a href="#/">Home</a> / <span>Contact</span></nav>
          <span class="pill" style="margin-bottom:12px">Support & Inquiries</span>
          <h1 style="font:600 clamp(2.2rem, 4.5vw, 3.4rem) var(--serif);color:var(--cream);margin:10px 0 14px">Get in Touch with MSR Foods</h1>
          <p style="font-size:clamp(15px, 1.6vw, 18px);line-height:1.7;color:var(--mute-dark);max-width:640px;margin:0 auto">
            Have questions about our artisanal honey nut mix, wholesale orders, or nationwide delivery? Our team is available 24/7.
          </p>
        </div>
      </header>

      <section class="page light" style="padding-block:clamp(36px, 5vw, 68px)">
        <div class="wrap contact-grid">
          
          <!-- Left: Direct Contact Channels -->
          <div class="cinfo">
            
            <!-- 1. Phone Support -->
            <a class="cinfo-card cinfo-card-phone" href="tel:${C.phoneIntl}" aria-label="Call MSR Foods Customer Support">
              <div class="cinfo-icon cinfo-icon-phone">${ICON.phone}</div>
              <div class="cinfo-body">
                <span class="cinfo-label">Customer Support Phone</span>
                <strong class="cinfo-val" style="white-space:nowrap">${C.phone}</strong>
                <small class="cinfo-sub">${C.supportHours}</small>
              </div>
            </a>

            <!-- 2. WhatsApp Direct -->
            ${C.whatsapp ? `
              <a class="cinfo-card cinfo-card-wa" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent('Hi MSR Foods team, I have an inquiry regarding your products.')}" target="_blank" rel="noopener" aria-label="WhatsApp MSR Foods">
                <div class="cinfo-icon cinfo-icon-wa">${ICON.whatsapp}</div>
                <div class="cinfo-body">
                  <span class="cinfo-label cinfo-label-wa">WhatsApp Direct</span>
                  <strong class="cinfo-val">Chat with Our Team Instantly</strong>
                  <small class="cinfo-sub">Fastest response for order updates & queries</small>
                </div>
              </a>
            ` : ""}

            <!-- 3. Official Email -->
            <a class="cinfo-card cinfo-card-mail" href="mailto:${C.email}" aria-label="Email MSR Foods">
              <div class="cinfo-icon cinfo-icon-mail">${ICON.mail}</div>
              <div class="cinfo-body">
                <span class="cinfo-label">Official Email</span>
                <strong class="cinfo-val">${C.email}</strong>
                <small class="cinfo-sub">Wholesale, retail distribution & corporate orders</small>
              </div>
            </a>

            <!-- 4. Location -->
            <a class="cinfo-card cinfo-card-pin" href="https://share.google/4qYt5oe9pBqKFpKce" target="_blank" rel="noopener" aria-label="View MSR Foods on Google Maps">
              <div class="cinfo-icon cinfo-icon-pin">${ICON.pin}</div>
              <div class="cinfo-body">
                <span class="cinfo-label">Location</span>
                <strong class="cinfo-val">${C.address.join(", ")}</strong>
                <span class="cinfo-badge">⭐ View on Google Maps ↗</span>
              </div>
            </a>

          </div>

          <!-- Right: Direct Message Form -->
          <form class="box contact-form-box" id="contactForm" novalidate>
            <h2 style="font-size:1.6rem;margin-bottom:6px;color:#14100a;font-weight:700">Send us a Direct Message</h2>
            <p style="color:#4a4034;font-size:14.5px;margin-bottom:24px;line-height:1.6">Fill out the form below and our team will get back to you promptly.</p>
            
            <div class="fgrid">
              <div class="f">
                <label for="c-name" style="color:#14100a;font-weight:600">Your Full Name <span style="color:#dc2626">*</span></label>
                <input id="c-name" autocomplete="name" placeholder="e.g. Ahmad Khan" required>
                <span class="err">Please enter your full name.</span>
              </div>
              <div class="f">
                <label for="c-email" style="color:#14100a;font-weight:600">Your Email Address <span style="color:#dc2626">*</span></label>
                <input id="c-email" type="email" autocomplete="email" placeholder="e.g. ahmad@gmail.com" required>
                <span class="err">Please enter a valid email address so we can reply.</span>
              </div>
              <div class="f full">
                <label for="c-phone" style="color:#14100a;font-weight:600">Mobile / WhatsApp Number <i style="color:#6b5d4b;font-weight:400">(optional)</i></label>
                <input id="c-phone" autocomplete="tel" inputmode="tel" placeholder="03XXXXXXXXX">
              </div>
              <div class="f full">
                <label for="c-msg" style="color:#14100a;font-weight:600">Your Message <span style="color:#dc2626">*</span></label>
                <textarea id="c-msg" rows="5" placeholder="How can we assist you today?" required></textarea>
                <span class="err">Please enter your message.</span>
              </div>
            </div>
            
            <button class="btn btn-gold btn-block" id="btn-contact-submit" style="margin-top:22px;font-weight:700" type="submit">
              Submit
            </button>

            ${C.whatsapp ? `
              <div style="display:flex;align-items:center;gap:12px;margin:16px 0 10px">
                <span style="flex:1;height:1px;background:rgba(27,21,12,0.12)"></span>
                <span style="font-size:12px;font-weight:700;color:#6b5d4b;text-transform:uppercase;letter-spacing:0.05em">or connect instantly</span>
                <span style="flex:1;height:1px;background:rgba(27,21,12,0.12)"></span>
              </div>
              <a class="btn btn-line btn-block btn-wa-chat" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent('Hi MSR Foods team, I am contacting you from the website.')}" target="_blank" rel="noopener" style="border:2px solid #25D366;color:#047857;background:#f0fdf4;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:10px">
                ${ICON.whatsapp} Chat on WhatsApp Direct
              </a>
            ` : ""}

            <small style="display:block;text-align:center;color:#6b5d4b;font-size:12.5px;margin-top:14px">
              🔒 Your contact information is never shared.
            </small>
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
      body: `<h2>Nationwide Coverage</h2><p>We deliver across all cities, towns, and sectors in Pakistan through reputable couriers.</p><h2>Delivery Timelines</h2><p>Orders typically arrive within <b>${D.eta}</b> of dispatch.</p><h2>Delivery Charges</h2><p>Standard flat shipping fee of <b>${money(D.fee)}</b> per order across Pakistan. <b>100% FREE doorstep delivery on all orders in Kohat!</b></p>`
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
    `Support Email: ${C.email || "msrfoods.official@gmail.com"} | WhatsApp: +92${(C.whatsapp || "3159935600").replace(/^92/, "")}`
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

  const imgSrc = (p.img && (p.img.front || p.img.pair)) || "assets/images/products/front.webp";

  modal.innerHTML = `
    <div class="dlg" style="width:min(440px,94vw);padding:24px 22px;border-radius:18px;background:var(--bg-card,#141414);color:var(--cream,#f5f5f0);border:1px solid var(--hair,rgba(255,255,255,0.12));position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
      <button class="ic dlg-x" onclick="document.getElementById('dlg-notify').close()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--sand,#aaa);font-size:20px;cursor:pointer">${ICON.x || "✕"}</button>
      
      <div style="text-align:center;margin-bottom:16px">
        <div style="width:48px;height:48px;border-radius:50%;background:rgba(212,175,55,0.15);color:var(--gold-hi,#d4af37);display:grid;place-items:center;font-size:22px;margin:0 auto 10px">
          🔔
        </div>
        <h3 style="font-size:20px;font-family:var(--font-head);color:var(--cream,#f5f5f0);margin:0 0 6px">Notify When Available</h3>
        <p style="font-size:13px;color:var(--sand,#c4baa9);margin:0;line-height:1.45">
          Enter your email or phone number to receive an alert when <b style="color:var(--gold-hi,#d4af37)">${p.title}</b> is back in stock.
        </p>
      </div>

      <!-- Product Preview Snippet -->
      <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:9px 12px;margin-bottom:16px">
        <img src="${imgSrc}" alt="${p.title}" width="42" height="42" loading="lazy" decoding="async" style="width:42px;height:42px;object-fit:cover;border-radius:8px">
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;color:var(--cream,#f5f5f0)">${p.title}</div>
          <div style="font-size:12px;color:var(--gold-lo,#b38f26)">${money(p.price)} · ${p.weight || p.netWeight}</div>
        </div>
        <span style="font-size:11px;color:#f87171;background:rgba(239,68,68,0.12);padding:3px 8px;border-radius:6px;font-weight:600;border:1px solid rgba(239,68,68,0.25)">Out of Stock</span>
      </div>

      <form id="stockNotifyForm" onsubmit="event.preventDefault(); submitStockNotification('${p.id}');">
        <div style="margin-bottom:12px">
          <label for="notifEmail" style="display:block;font-size:12px;color:var(--sand,#c4baa9);margin-bottom:5px;font-weight:500">
            Email Address <span style="font-size:11px;color:var(--mute,#888);font-weight:normal">(Optional)</span>
          </label>
          <input type="email" id="notifEmail" class="inp" placeholder="e.g. customer@example.com" style="width:100%;box-sizing:border-box">
        </div>

        <div style="margin-bottom:14px">
          <label for="notifPhone" style="display:block;font-size:12px;color:var(--sand,#c4baa9);margin-bottom:5px;font-weight:500">
            Phone Number <span style="font-size:11px;color:var(--mute,#888);font-weight:normal">(Optional)</span>
          </label>
          <input type="tel" id="notifPhone" class="inp" placeholder="e.g. 0315 9935600" style="width:100%;box-sizing:border-box">
        </div>

        <button type="submit" id="notifSubmitBtn" class="btn btn-gold btn-block" style="padding:13px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
          🔔 Notify Me When Available
        </button>
      </form>
    </div>
  `;

  modal.showModal();
}

async function submitStockNotification(pid) {
  const p = typeof getP === "function" ? getP(pid) : null;
  if (!p) return;

  const emailInput = document.getElementById("notifEmail");
  const phoneInput = document.getElementById("notifPhone");
  const submitBtn = document.getElementById("notifSubmitBtn");

  const email = emailInput ? emailInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (!email && !phone) {
    alert("Please provide at least an Email address or Phone number so we can notify you.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Saving...";
  }

  const payload = {
    productId: p.id,
    productTitle: p.title || p.name,
    weight: p.weight || p.netWeight || "",
    email,
    phone,
    name: "Customer",
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
  } else if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    endpoint = "https://msrfoodsofficial.food/api/notify";
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

  // 3. Close the modal immediately
  const modal = document.getElementById("dlg-notify");
  if (modal) {
    modal.close();
  }

  // 4. Show friendly toast confirmation to user
  if (typeof toast === "function") {
    toast(`✓ Thank you! We'll notify you as soon as ${p.title} is restocked.`);
  }
}

window.openNotifyModal = openNotifyModal;
window.submitStockNotification = submitStockNotification;
