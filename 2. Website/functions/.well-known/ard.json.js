export async function onRequestGet() {
  const manifest = {
    "version": "1.0",
    "name": "MSR Foods",
    "description": "MSR Foods is a premium Pakistani national e-commerce brand delivering handcrafted honey nut mixes and natural superfoods nationwide across Pakistan with Cash on Delivery (COD).",
    "url": "https://msrfoodsofficial.food",
    "entries": [
      {
        "identifier": "msr-catalog",
        "displayName": "MSR Foods Product Catalog",
        "type": "application/json",
        "url": "https://msrfoodsofficial.food/catalog.json",
        "description": "Product catalog containing details, sizes, pricing, and availability.",
        "representativeQueries": [
          "msr foods products",
          "honey nut mix price Pakistan",
          "buy dry fruits online Pakistan"
        ]
      },
      {
        "identifier": "msr-sitemap",
        "displayName": "MSR Foods Sitemap",
        "type": "application/xml",
        "url": "https://msrfoodsofficial.food/sitemap.xml",
        "description": "XML sitemap of all indexed storefront and article URLs.",
        "representativeQueries": [
          "msr foods website pages",
          "msr foods blog articles",
          "msr foods contact"
        ]
      },
      {
        "identifier": "msr-llms-guide",
        "displayName": "MSR Foods LLM Knowledge Brief",
        "type": "text/markdown",
        "url": "https://msrfoodsofficial.food/llms.txt",
        "description": "Plain text brand, product, and entity guide for AI agents and LLMs.",
        "representativeQueries": [
          "about msr foods",
          "is msr foods genuine",
          "msr foods ingredients and health benefits"
        ]
      }
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
    }
  });
}
