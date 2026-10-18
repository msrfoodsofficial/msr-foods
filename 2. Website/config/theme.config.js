/**
 * =======================================================================
 * THEME & UI KIT PRESETS
 * =======================================================================
 * Powers both the Front-end Storefront and Admin Portal design system.
 * Switch presets or edit CSS custom properties here.
 * =======================================================================
 */

const THEME_PRESETS = {
  "luxury-gold": {
    id: "luxury-gold",
    name: "Luxury Gold & Obsidian (Default)",
    category: "Gourmet / Luxury",
    colors: {
      "--black": "#000000",
      "--coal": "#0b0906",
      "--char": "#16120b",
      "--gold": "#d6a736",
      "--gold-hi": "#f4d77f",
      "--gold-lo": "#9a6f1c",
      "--amber": "#e9a21c",
      "--cream": "#f8f1e2",
      "--sand": "#ecdfc0",
      "--white": "#fffdf8",
      "--ink": "#1b150c",
      "--mute-dark": "#bdae8e",
      "--mute-light": "#6a5c42",
      "--hair": "rgba(214, 167, 54, 0.26)",
      "--gold-grad": "linear-gradient(135deg, #f7de8f 0%, #d6a736 48%, #a8761a 100%)",
      "--accent-glow": "rgba(214, 167, 54, 0.35)",
      "--bg-body": "#000000",
      "--bg-surface": "#0b0906",
      "--bg-card": "#16120b",
      "--bg-light": "#f8f1e2"
    },
    fonts: {
      "--serif": '"Fraunces", Georgia, "Times New Roman", serif',
      "--sans": '"Jost", "Segoe UI", system-ui, -apple-system, sans-serif'
    }
  },

  "emerald-forest": {
    id: "emerald-forest",
    name: "Emerald & Organic Forest",
    category: "Organic / Herbal / Wellness",
    colors: {
      "--black": "#05130b",
      "--coal": "#0a1f13",
      "--char": "#102d1c",
      "--gold": "#10b981",
      "--gold-hi": "#6ee7b7",
      "--gold-lo": "#047857",
      "--amber": "#34d399",
      "--cream": "#f0fdf4",
      "--sand": "#dcfce7",
      "--white": "#ffffff",
      "--ink": "#062817",
      "--mute-dark": "#86efac",
      "--mute-light": "#2e684a",
      "--hair": "rgba(16, 185, 129, 0.28)",
      "--gold-grad": "linear-gradient(135deg, #6ee7b7 0%, #10b981 48%, #047857 100%)",
      "--accent-glow": "rgba(16, 185, 129, 0.35)",
      "--bg-body": "#05130b",
      "--bg-surface": "#0a1f13",
      "--bg-card": "#102d1c",
      "--bg-light": "#f0fdf4"
    },
    fonts: {
      "--serif": '"Fraunces", Georgia, serif',
      "--sans": '"Jost", system-ui, sans-serif'
    }
  },

  "royal-sapphire": {
    id: "royal-sapphire",
    name: "Royal Sapphire & Platinum",
    category: "Modern / Tech / Premium",
    colors: {
      "--black": "#070c18",
      "--coal": "#0d1527",
      "--char": "#141f38",
      "--gold": "#3b82f6",
      "--gold-hi": "#93c5fd",
      "--gold-lo": "#1d4ed8",
      "--amber": "#60a5fa",
      "--cream": "#eff6ff",
      "--sand": "#dbeafe",
      "--white": "#ffffff",
      "--ink": "#0b192e",
      "--mute-dark": "#94a3b8",
      "--mute-light": "#475569",
      "--hair": "rgba(59, 130, 246, 0.28)",
      "--gold-grad": "linear-gradient(135deg, #93c5fd 0%, #3b82f6 48%, #1d4ed8 100%)",
      "--accent-glow": "rgba(59, 130, 246, 0.35)",
      "--bg-body": "#070c18",
      "--bg-surface": "#0d1527",
      "--bg-card": "#141f38",
      "--bg-light": "#eff6ff"
    },
    fonts: {
      "--serif": '"Fraunces", Georgia, serif',
      "--sans": '"Jost", system-ui, sans-serif'
    }
  },

  "crimson-velvet": {
    id: "crimson-velvet",
    name: "Crimson Velvet & Vanilla",
    category: "Artisanal / Bakery / Confectionery",
    colors: {
      "--black": "#120508",
      "--coal": "#1e0b10",
      "--char": "#2b1017",
      "--gold": "#e11d48",
      "--gold-hi": "#fda4af",
      "--gold-lo": "#9f1239",
      "--amber": "#fb7185",
      "--cream": "#fff1f2",
      "--sand": "#ffe4e6",
      "--white": "#ffffff",
      "--ink": "#20050c",
      "--mute-dark": "#f43f5e",
      "--mute-light": "#881337",
      "--hair": "rgba(225, 29, 72, 0.28)",
      "--gold-grad": "linear-gradient(135deg, #fda4af 0%, #e11d48 48%, #9f1239 100%)",
      "--accent-glow": "rgba(225, 29, 72, 0.35)",
      "--bg-body": "#120508",
      "--bg-surface": "#1e0b10",
      "--bg-card": "#2b1017",
      "--bg-light": "#fff1f2"
    },
    fonts: {
      "--serif": '"Fraunces", Georgia, serif',
      "--sans": '"Jost", system-ui, sans-serif'
    }
  },

  "nordic-minimal": {
    id: "nordic-minimal",
    name: "Nordic Minimalist Slate",
    category: "Clean / Contemporary",
    colors: {
      "--black": "#09090b",
      "--coal": "#18181b",
      "--char": "#27272a",
      "--gold": "#e4e4e7",
      "--gold-hi": "#ffffff",
      "--gold-lo": "#71717a",
      "--amber": "#d4d4d8",
      "--cream": "#fafafa",
      "--sand": "#f4f4f5",
      "--white": "#ffffff",
      "--ink": "#18181b",
      "--mute-dark": "#a1a1aa",
      "--mute-light": "#52525b",
      "--hair": "rgba(255, 255, 255, 0.2)",
      "--gold-grad": "linear-gradient(135deg, #ffffff 0%, #d4d4d8 50%, #71717a 100%)",
      "--accent-glow": "rgba(255, 255, 255, 0.3)",
      "--bg-body": "#09090b",
      "--bg-surface": "#18181b",
      "--bg-card": "#27272a",
      "--bg-light": "#fafafa"
    },
    fonts: {
      "--serif": 'system-ui, -apple-system, sans-serif',
      "--sans": '"Jost", system-ui, sans-serif'
    }
  }
};

/**
 * Applies a theme preset or custom color tokens to the DOM
 */
function applyTheme(themeId = "luxury-gold", customTokens = {}) {
  const root = document.documentElement;
  const preset = THEME_PRESETS[themeId] || THEME_PRESETS["luxury-gold"];
  
  // Apply preset colors
  Object.entries(preset.colors).forEach(([token, val]) => {
    root.style.setProperty(token, val);
  });
  
  // Apply preset fonts
  Object.entries(preset.fonts).forEach(([token, val]) => {
    root.style.setProperty(token, val);
  });
  
  // Apply any custom overrides
  Object.entries(customTokens).forEach(([token, val]) => {
    root.style.setProperty(token, val);
  });

  // Store in localStorage for seamless consistency across pages and admin
  try {
    localStorage.setItem("app_active_theme", themeId);
    if (Object.keys(customTokens).length > 0) {
      localStorage.setItem("app_custom_theme_tokens", JSON.stringify(customTokens));
    }
  } catch (e) {}

  return preset;
}

/**
 * Initializes theme from storage or default config
 */
function initTheme() {
  try {
    const savedTheme = localStorage.getItem("app_active_theme");
    const savedCustom = JSON.parse(localStorage.getItem("app_custom_theme_tokens") || "{}");
    const defaultTheme = (window.BRAND_CONFIG && window.BRAND_CONFIG.brand && window.BRAND_CONFIG.brand.defaultTheme) || "luxury-gold";
    applyTheme(savedTheme || defaultTheme, savedCustom);
  } catch (e) {
    applyTheme("luxury-gold");
  }
}

if (typeof window !== "undefined") {
  window.THEME_PRESETS = THEME_PRESETS;
  window.applyTheme = applyTheme;
  window.initTheme = initTheme;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { THEME_PRESETS, applyTheme, initTheme };
}
