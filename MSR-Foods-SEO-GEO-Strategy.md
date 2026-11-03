# MSR Foods — SEO & GEO Strategy Roadmap

> [!IMPORTANT]
> All technical files are now **live on the correct site** (`msrfoodsofficial.food`). The previous deployment was on the admin panel by mistake — that's now fixed.

---

## ✅ What's Done & Deployed (commits `0f0647f` → `2995496`)

| File | Where | What it does |
|---|---|---|
| `index.html` | `2. Website` ✅ | 3× JSON-LD schemas + Twitter/OG cards + canonical + keywords |
| `robots.txt` | `2. Website` ✅ | Allows GPTBot, Gemini-Crawler, Anthropic-ai, PerplexityBot |
| `llms.txt` | `2. Website` ✅ | Premium brand brief for AI parsers — gym/PCOS/student/B2B |
| `catalog.json` | `2. Website` ✅ | Machine-readable product API for AI agents |
| `sitemap.xml` | `2. Website` ✅ | Full sitemap for Google + Bing |
| `favicon.ico` | `2. Website` ✅ | Proper ICO (was broken WebP renamed to .ico) |
| PNG favicons | `2. Website` ✅ | 32px, 192px, 512px from MSR logo SVG |

### 3 JSON-LD Schemas Now Embedded in `<head>`
1. **Organization** — tells Google/Gemini: MSR Foods = premium Pakistani superfood brand (not "local")
2. **ItemList** — all 3 products with price, stock, nutrition, shipping, reviews
3. **FAQPage** — 8 Q&As covering gym protein, PCOS, students, B2B — these appear as **rich snippets** in Google

---

## 🎯 Keyword Targeting — Who Finds You Now

| Search Intent | Keywords Targeted |
|---|---|
| 🏋️ Gym / Fitness | natural protein Pakistan, gym snacks Pakistan, pre-workout natural, energy booster natural |
| 🌸 PCOS / Women's Health | PCOS natural treatment seeds, seed cycling Pakistan, pumpkin seeds PCOS, hormonal balance nuts |
| 📚 Students | energy for students Pakistan, brain food Pakistan, focus snacks, exam energy food |
| 🍯 Product searches | honey nut mix Pakistan, dry fruits online, buy honey Pakistan, nuts and honey |
| 🏪 B2B / Wholesale | bulk dry fruits Pakistan, wholesale honey Pakistan, food distributor Pakistan |
| 🌿 General wellness | superfood Pakistan, immunity booster, talbeena talbina, natural health food |

---

## 🚀 Next Actions — Your Priority List

### 🔴 Do This Week (Critical)

#### 1. Submit Sitemap to Google Search Console
- Go to: [search.google.com/search-console](https://search.google.com/search-console)
- Add property: `msrfoodsofficial.food`
- Sitemaps → Submit: `https://msrfoodsofficial.food/sitemap.xml`
- URL Inspection → Request Indexing on your homepage

#### 2. Submit to Bing Webmaster Tools
- Bing powers **ChatGPT's web search** — this is critical for GEO
- Go to: [bing.com/webmasters](https://www.bing.com/webmasters)
- Submit sitemap: `https://msrfoodsofficial.food/sitemap.xml`

#### 3. Verify Schema on Google's Rich Results Test
- Go to: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- Enter: `https://msrfoodsofficial.food`
- Should show: ✅ Product, ✅ FAQ, ✅ Organization

---

### 🟡 Do This Month (High Impact)

#### 4. Add Blog / Articles Section to Website
This is the **single biggest SEO lever** you have. Each article targets a specific search query.

**Recommended articles to write (in order of priority):**

| Article Title | Target Keyword | Why |
|---|---|---|
| "Best Natural Foods for PCOS in Pakistan" | PCOS natural treatment Pakistan | High intent, women's health |
| "Natural Protein Sources for Gym in Pakistan" | natural protein gym Pakistan | Gym audience |
| "What is Talbina (Talbeena) and Its Benefits" | talbina Pakistan, talbeena | High search volume |
| "Benefits of Honey and Dry Fruits for Students" | energy food for students Pakistan | Student audience |
| "Pumpkin Seeds Benefits for Women in Pakistan" | pumpkin seeds benefits women | PCOS seed cycling |
| "Best Energy Boosting Foods in Pakistan" | energy booster Pakistan natural | General wellness |
| "Walnuts for Brain Health — Omega-3 Benefits" | walnuts brain Pakistan | SEO + trust |
| "How to Order Dry Fruits Online in Pakistan" | buy dry fruits online Pakistan | Purchase intent |

#### 5. Get on Google Business Profile
- Go to: [business.google.com](https://business.google.com)
- Create a listing for "MSR Foods"
- Add: category = "Health food store", address = Kohat, website, photos, products
- This makes you appear on **Google Maps + local search** and helps Gemini cite you

#### 6. Build Social Proof (Reviews)
- Ask every customer to leave a Google review
- More real reviews = stronger AI citation confidence
- Target: **20+ reviews within 3 months**

---

### 🟢 Coming Soon (Next 1-3 Months)

#### 7. AI Chatbot on Website
Plan: Add a floating WhatsApp-style chat widget powered by a simple FAQ bot.
- **Option A (Free/Easy):** Embed a Tidio or Crisp chat widget — takes 10 minutes
- **Option B (AI-powered):** Build a custom chatbot using Gemini API or OpenAI that reads your `catalog.json` and answers product questions
- Chatbot should handle: product questions, order status, PCOS/gym recommendations, bulk order inquiries

#### 8. Expand Product Catalog in Schema
When you add new products (desi ghee, talbina, seed mixes), update:
- `data/products.js` — adds to website
- `catalog.json` — updates AI agent endpoint
- `index.html` JSON-LD — updates search engine product cards

#### 9. Wikipedia / Wikidata Entry
- Create a Wikidata entity for "MSR Foods" brand
- Add it to the `sameAs` array in your schema — this is **the biggest trust signal** for AI models
- Requires: brand to have some online mentions first (blogs, news, social)

#### 10. Press & Mentions
Getting mentioned in these makes AI models cite you:
- Pakistani food blogs (e.g., Desi food bloggers on Instagram)
- Health/wellness websites in Pakistan
- Dawn.com / ARY News food sections
- YouTube food reviewers

---

## 📊 Why Gemini Said "Local Brand" — Root Cause Explained

```
Before fix:
  msrfoodsofficial.food → no schema, no robots.txt, no llms.txt
  Gemini-Crawler reads: just HTML with JS → sees empty shell
  Gemini infers from limited data → "local food brand"

After fix:
  msrfoodsofficial.food → Organization JSON-LD + FAQPage + Product schemas
  llms.txt → explicitly states "professional premium brand, not home-based"
  catalog.json → machine-readable structured data
  Gemini-Crawler reads all of this → builds accurate knowledge graph
```

> [!NOTE]
> It takes **2–6 weeks** for Gemini and ChatGPT to re-crawl and update their knowledge. The files are deployed — the crawlers will pick them up on their next crawl cycle automatically.

---

## 🤖 How AI Assistants Will Now Find MSR Foods

```
User: "best honey nut mix Pakistan"
  → GPTBot / Gemini-Crawler hits msrfoodsofficial.food
  → Reads: llms.txt (brand story, products, pricing)
  → Reads: JSON-LD (Organization + Products + FAQ)
  → Reads: catalog.json (structured product data)
  → AI answer: "MSR Foods offers premium Honey Nut Mix in Pakistan
     starting at PKR 899, available in 3 sizes, COD nationwide."
     Source: msrfoodsofficial.food ✅

User: "natural food for PCOS Pakistan"
  → Gemini reads FAQPage JSON-LD Q&A about PCOS + pumpkin seeds
  → AI answer: "MSR Foods Honey Nut Mix contains pumpkin seeds,
     sunflower seeds, sesame seeds which support PCOS seed cycling..."
     Source: msrfoodsofficial.food ✅
```
