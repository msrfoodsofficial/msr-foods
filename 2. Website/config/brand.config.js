/**
 * =======================================================================
 * WHITE-LABEL BRAND & STORE CONFIGURATION
 * =======================================================================
 * To adapt this website and admin portal for any client or new brand:
 * 1. Update the 'brand' object (Name, Tagline, Logo URL or text)
 * 2. Update 'contact' and 'delivery' settings
 * 3. Choose or customize an active theme preset in 'theme.config.js'
 * 4. Add/update products in 'data/products.js'
 * =======================================================================
 */

const BRAND_CONFIG = {
  // Brand Identity
  brand: {
    name: "MSR",
    fullName: "MSR Foods",
    tagline: "Pure Taste. Natural Goodness.",
    slogan: "Quality Built For You",
    description: "A premium blend of honey, almonds, walnuts, cashews, pistachios and peanuts. Pakistan-wide delivery.",
    foundedYear: "2026",
    license: "All Rights Reserved",
    defaultTheme: "luxury-gold"
  },

  // Logo Configuration
  logo: {
    type: "image", // "image" or "text"
    src: "assets/images/logo.webp",
    alt: "MSR Brand - Quality Built For You",
    textFallback: "MSR FOODS",
    width: 105,
    height: 62
  },

  // Currency & Locale
  currency: {
    symbol: "PKR",
    code: "PKR",
    label: "Pakistani Rupee",
    format: (amount) => "PKR " + Number(amount || 0).toLocaleString("en-US")
  },

  // Shipping & Fulfillment Settings
  delivery: {
    fee: 200,
    freeShippingThreshold: 5000,
    eta: "3–5 working days",
    area: "Pakistan-wide delivery",
    couriers: ["TCS", "Leopard Courier", "Trax Logistics", "PostEx"]
  },

  // Store Contact Details
  contact: {
    phone: "03368835501",
    phoneIntl: "+923368835501",
    whatsapp: "923368835501", // Set to "" to hide the WhatsApp quick order button
    email: "msrfoods.official@gmail.com",
    supportHours: "Mon – Sat: 9:00 AM – 8:00 PM PKT",
    address: [
      "Kohat, Pakistan"
    ]
  },

  // Storefront & Admin Live URLs
  urls: {
    websiteUrl: "http://localhost:8080/",
    cloudflareWebsiteUrl: "https://msrfoods.pages.dev",
    adminUrl: "http://localhost:3000/",
    cloudflareAdminUrl: "https://msrfoods-admin.pages.dev",
    apiUrl: "" // Leave empty for relative /api/orders, or set to your live website domain
  },

  // Payment Options
  payments: [
    {
      id: "cod",
      name: "Cash on Delivery",
      short: "Pay in cash when your order arrives at your doorstep.",
      detail: "Please keep the exact amount ready for the delivery rider upon arrival.",
      badge: "Nationwide",
      icon: "truck"
    }
  ],

  // Social Links
  social: {
    facebook: "https://www.facebook.com/share/1ButraKks3/",
    instagram: "https://www.instagram.com/msrfoods.official",
    tiktok: "https://www.tiktok.com/@m.shahan666?_r=1&_t=ZN-9AqeE3M0NPi",
    youtube: ""
  },

  // Customer Reviews
  reviews: [
    {
      title: "Finest quality honey nut mix I have tasted",
      text: "The combination of raw golden honey with whole cashews and roasted almonds is phenomenal. Fresh crunch in every single spoonful!",
      name: "Zainab R.",
      city: "Lahore",
      rating: 5,
      date: "Oct 2026"
    },
    {
      title: "Delivered quickly to Islamabad",
      text: "Ordered on Monday and received on Wednesday in safe double-seal packaging. 100% natural without any artificial sweeteners.",
      name: "Bilal K.",
      city: "Islamabad",
      rating: 5,
      date: "Oct 2026"
    },
    {
      title: "Daily morning superfood",
      text: "I take one spoon every morning with warm milk before my workout. Natural sustained energy all day. Highly recommended!",
      name: "Farhan M.",
      city: "Peshawar",
      rating: 5,
      date: "Sep 2026"
    }
  ],

  // Trust Badges & Value Propositions
  features: [
    {
      icon: "leaf",
      title: "100% Pure & Natural",
      desc: "Raw mountain honey blended with premium roasted dry fruits, free of preservatives."
    },
    {
      icon: "shield",
      title: "Rigorous Quality Checks",
      desc: "Each jar is sealed with double hygiene protection to lock in peak freshness."
    },
    {
      icon: "truck",
      title: "Fast Pakistan Delivery",
      desc: "Swift dispatch to Karachi, Lahore, Islamabad, Peshawar and all surrounding cities."
    },
    {
      icon: "repeat",
      title: "Customer Satisfaction",
      desc: "Dedicated WhatsApp & phone support to help you before and after purchase."
    }
  ]
};

if (typeof window !== "undefined") {
  window.BRAND_CONFIG = BRAND_CONFIG;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = BRAND_CONFIG;
}
