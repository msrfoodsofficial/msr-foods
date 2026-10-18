/**
 * =======================================================================
 * PRODUCT CATALOG & INVENTORY DATA
 * =======================================================================
 * To add, modify, or remove products:
 * - Update the PRODUCTS array below.
 * - Each item automatically generates a shop card, product details page,
 *   cart line item, and checkout line.
 * =======================================================================
 */

const PRODUCTS = [
  {
    id: "msr-500",
    slug: "honey-nut-mix-500g",
    group: "honey-nut-mix",
    name: "MSR Honey Nut Mix",
    title: "HONEY NUT MIX (500g)",
    subtitle: "Artisanal Roasted Dry Fruits Drenched in Raw Mountain Honey",
    weight: "500g",
    netWeight: "500g",
    price: 1599,
    comparePrice: 1850,
    stock: 45,
    featured: true,
    badge: "Most Popular",
    maxQty: 20,
    img: {
      front: "assets/images/products/front.webp",
      back: "assets/images/products/back.webp",
      pair: "assets/images/products/pair.webp"
    },
    shortDesc: "A nourishing artisanal blend of almonds, walnuts, cashews, pistachios and peanuts drenched in 100% pure mountain honey.",
    fullDesc: "MSR Honey Nut Mix brings together hand-selected roasted almonds, crunchy walnuts, buttery cashews, pistachios, and peanuts with rich golden honey in one premium blend. It is an energizing, convenient snack for busy mornings, active gym lifestyles, or any moment you crave pure wholesome sweetness.",
    packaging: "Airtight clear jar with double freshness hygiene seal",
    shelfLife: "12 months from packing date",
    note: ""
  },
  {
    id: "msr-1kg",
    slug: "honey-nut-mix-1kg",
    group: "honey-nut-mix",
    name: "MSR Honey Nut Mix",
    title: "HONEY NUT MIX (1kg Family Pack)",
    subtitle: "Value Family Jar for Daily Immunity & Natural Energy",
    weight: "1kg",
    netWeight: "1kg (1000g)",
    price: 2999,
    comparePrice: 3499,
    stock: 25,
    featured: true,
    badge: "Best Value",
    maxQty: 20,
    img: {
      front: "assets/images/products/front.webp",
      back: "assets/images/products/back.webp",
      pair: "assets/images/products/pair.webp"
    },
    shortDesc: "Double the nutritious goodness for the whole household with our 1kg value family pack.",
    fullDesc: "Double the goodness for the entire household. Packed with essential micronutrients, healthy unsaturated fats, minerals, and natural slow-burning energy. Ideal for sharing with family or stocking your pantry for the month.",
    packaging: "Heavyweight pantry jar with double seal protection",
    shelfLife: "12 months from packing date",
    note: "Photo shows signature jar style. 1kg jar packed in the same luxury double-seal packaging."
  },
  {
    id: "msr-250",
    slug: "honey-nut-mix-250g",
    group: "honey-nut-mix",
    name: "MSR Honey Nut Mix",
    title: "HONEY NUT MIX (250g Starter Jar)",
    subtitle: "Compact Snacking Jar · Perfect Daily Portion & Trial Size",
    weight: "250g",
    netWeight: "250g",
    price: 899,
    comparePrice: 1099,
    stock: 60,
    featured: true,
    prominent: true,
    badge: "✨ New Starter Size",
    maxQty: 20,
    img: {
      front: "assets/images/products/front.webp",
      back: "assets/images/products/back.webp",
      pair: "assets/images/products/pair.webp"
    },
    shortDesc: "The perfect introduction to pure honey-roasted nuts. Convenient compact jar for desk snacking or travel.",
    fullDesc: "The brand new 250g edition gives you the exact same gold-standard recipe of whole California almonds, Kashmiri walnuts, roasted cashews, Iranian pistachios, and peanuts drenched in raw mountain honey in an ultra-portable, convenient personal jar.",
    packaging: "Compact airtight jar with tamper-proof seal",
    shelfLife: "12 months from packing date",
    note: "✨ New arrival: perfect personal trial size for healthy desk or gym snacking."
  }
];

const INGREDIENTS = [
  { name: "Honey", key: "honey", img: "assets/images/ingredients/honey.webp", desc: "100% raw unprocessed mountain honey rich in natural enzymes." },
  { name: "Almonds", key: "almonds", img: "assets/images/ingredients/almonds.webp", desc: "Crisp California-grade almonds rich in Vitamin E & antioxidants." },
  { name: "Walnuts", key: "walnuts", img: "assets/images/ingredients/walnuts.webp", desc: "High in Omega-3 fatty acids for cognitive performance & brain health." },
  { name: "Cashews", key: "cashews", img: "assets/images/ingredients/cashews.webp", desc: "Delicately roasted cashews delivering creamy texture & essential zinc." },
  { name: "Pistachios", key: "pistachios", img: "assets/images/ingredients/pistachios.webp", desc: "Premium Iranian pistachios packed with lutein, protein & fiber." },
  { name: "Peanuts", key: "peanuts", img: "assets/images/ingredients/peanuts.webp", desc: "Golden roasted peanuts providing heart-healthy fats & crunch." }
];

const NUTRITION_FACTS = [
  ["Energy", "510 kcal / 2,130 kJ"],
  ["Protein", "15.4 g"],
  ["Total Fat", "32.8 g"],
  ["- Saturated Fat", "4.2 g"],
  ["Carbohydrates", "41.6 g"],
  ["- Natural Sugars (from Honey)", "34.0 g"],
  ["Dietary Fiber", "6.2 g"],
  ["Sodium", "18 mg"]
];

const FAQS = [
  ["Is the honey 100% pure?", "Yes. We source unadulterated, pure natural honey with zero added refined sugars, corn syrups, or artificial preservatives."],
  ["How should I store the jar once opened?", "Keep in a cool, dry pantry away from direct sunlight. You may refrigerate it after opening for an extra-crisp nut texture."],
  ["How long does delivery take in Pakistan?", "Orders across major cities (Lahore, Karachi, Islamabad, Rawalpindi, Peshawar) arrive in 3–5 working days."],
  ["What payment options do you support?", "We support Cash on Delivery (COD), Direct Bank Transfer, Easypaisa, and JazzCash mobile wallets."]
];

if (typeof window !== "undefined") {
  window.PRODUCTS = PRODUCTS;
  window.INGREDIENTS = INGREDIENTS;
  window.NUTRITION_FACTS = NUTRITION_FACTS;
  window.FAQS = FAQS;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS, INGREDIENTS, NUTRITION_FACTS, FAQS };
}
