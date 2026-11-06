/**
 * =======================================================================
 * PAKISTAN PROVINCES & COMPREHENSIVE CITIES DIRECTORY
 * =======================================================================
 * Used for dynamic searchable dropdowns and shipping rate calculation.
 * =======================================================================
 */

const PAKISTAN_PROVINCES = [
  "Khyber Pakhtunkhwa",
  "Punjab",
  "Sindh",
  "Islamabad Capital Territory",
  "Balochistan",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan"
];

const PAKISTAN_CITIES = [
  // ── Khyber Pakhtunkhwa (Headquarters & Free Delivery Hub) ──
  { city: "Kohat", prov: "Khyber Pakhtunkhwa", isFree: true, badge: "FREE Local Delivery 🎉" },
  { city: "Peshawar", prov: "Khyber Pakhtunkhwa" },
  { city: "Abbottabad", prov: "Khyber Pakhtunkhwa" },
  { city: "Mardan", prov: "Khyber Pakhtunkhwa" },
  { city: "Swat (Mingora)", prov: "Khyber Pakhtunkhwa" },
  { city: "Bannu", prov: "Khyber Pakhtunkhwa" },
  { city: "Dera Ismail Khan", prov: "Khyber Pakhtunkhwa" },
  { city: "Nowshera", prov: "Khyber Pakhtunkhwa" },
  { city: "Charsadda", prov: "Khyber Pakhtunkhwa" },
  { city: "Mansehra", prov: "Khyber Pakhtunkhwa" },
  { city: "Haripur", prov: "Khyber Pakhtunkhwa" },
  { city: "Swabi", prov: "Khyber Pakhtunkhwa" },
  { city: "Karak", prov: "Khyber Pakhtunkhwa" },
  { city: "Hangu", prov: "Khyber Pakhtunkhwa" },
  { city: "Timergara (Dir)", prov: "Khyber Pakhtunkhwa" },
  { city: "Chitral", prov: "Khyber Pakhtunkhwa" },
  { city: "Batkhela", prov: "Khyber Pakhtunkhwa" },
  { city: "Lakki Marwat", prov: "Khyber Pakhtunkhwa" },
  { city: "Tank", prov: "Khyber Pakhtunkhwa" },

  // ── Islamabad Capital Territory ──
  { city: "Islamabad", prov: "Islamabad Capital Territory" },

  // ── Punjab ──
  { city: "Lahore", prov: "Punjab" },
  { city: "Rawalpindi", prov: "Punjab" },
  { city: "Faisalabad", prov: "Punjab" },
  { city: "Multan", prov: "Punjab" },
  { city: "Gujranwala", prov: "Punjab" },
  { city: "Sialkot", prov: "Punjab" },
  { city: "Bahawalpur", prov: "Punjab" },
  { city: "Sargodha", prov: "Punjab" },
  { city: "Sahiwal", prov: "Punjab" },
  { city: "Sheikhupura", prov: "Punjab" },
  { city: "Jhang", prov: "Punjab" },
  { city: "Rahim Yar Khan", prov: "Punjab" },
  { city: "Gujrat", prov: "Punjab" },
  { city: "Kasur", prov: "Punjab" },
  { city: "Okara", prov: "Punjab" },
  { city: "Wah Cantt", prov: "Punjab" },
  { city: "Taxila", prov: "Punjab" },
  { city: "Attock", prov: "Punjab" },
  { city: "Chakwal", prov: "Punjab" },
  { city: "Jhelum", prov: "Punjab" },
  { city: "Dera Ghazi Khan", prov: "Punjab" },
  { city: "Muzaffargarh", prov: "Punjab" },
  { city: "Mandi Bahauddin", prov: "Punjab" },
  { city: "Hafizabad", prov: "Punjab" },
  { city: "Khanewal", prov: "Punjab" },
  { city: "Burewala", prov: "Punjab" },
  { city: "Bahawalnagar", prov: "Punjab" },
  { city: "Pakpattan", prov: "Punjab" },
  { city: "Vehari", prov: "Punjab" },
  { city: "Kamoke", prov: "Punjab" },
  { city: "Muridke", prov: "Punjab" },
  { city: "Chiniot", prov: "Punjab" },
  { city: "Mianwali", prov: "Punjab" },
  { city: "Bhakkar", prov: "Punjab" },
  { city: "Layyah", prov: "Punjab" },
  { city: "Gojra", prov: "Punjab" },
  { city: "Kot Radha Kishan", prov: "Punjab" },
  { city: "Pattoki", prov: "Punjab" },

  // ── Sindh ──
  { city: "Karachi", prov: "Sindh" },
  { city: "Hyderabad", prov: "Sindh" },
  { city: "Sukkur", prov: "Sindh" },
  { city: "Larkana", prov: "Sindh" },
  { city: "Nawabshah (Shaheed Benazirabad)", prov: "Sindh" },
  { city: "Mirpur Khas", prov: "Sindh" },
  { city: "Jacobabad", prov: "Sindh" },
  { city: "Shikarpur", prov: "Sindh" },
  { city: "Khairpur", prov: "Sindh" },
  { city: "Dadu", prov: "Sindh" },
  { city: "Thatta", prov: "Sindh" },
  { city: "Badin", prov: "Sindh" },
  { city: "Tando Adam", prov: "Sindh" },
  { city: "Tando Allahyar", prov: "Sindh" },
  { city: "Ghotki", prov: "Sindh" },
  { city: "Kashmore", prov: "Sindh" },
  { city: "Umerkot", prov: "Sindh" },
  { city: "Kandiaro", prov: "Sindh" },
  { city: "Moro", prov: "Sindh" },

  // ── Balochistan ──
  { city: "Quetta", prov: "Balochistan" },
  { city: "Gwadar", prov: "Balochistan" },
  { city: "Turbat", prov: "Balochistan" },
  { city: "Khuzdar", prov: "Balochistan" },
  { city: "Hub", prov: "Balochistan" },
  { city: "Chaman", prov: "Balochistan" },
  { city: "Sibi", prov: "Balochistan" },
  { city: "Loralai", prov: "Balochistan" },
  { city: "Zhob", prov: "Balochistan" },
  { city: "Pishin", prov: "Balochistan" },
  { city: "Jafarabad", prov: "Balochistan" },
  { city: "Nushki", prov: "Balochistan" },
  { city: "Kalat", prov: "Balochistan" },

  // ── Azad Jammu & Kashmir ──
  { city: "Muzaffarabad", prov: "Azad Jammu & Kashmir" },
  { city: "Mirpur", prov: "Azad Jammu & Kashmir" },
  { city: "Rawalakot", prov: "Azad Jammu & Kashmir" },
  { city: "Kotli", prov: "Azad Jammu & Kashmir" },
  { city: "Bhimber", prov: "Azad Jammu & Kashmir" },
  { city: "Bagh", prov: "Azad Jammu & Kashmir" },
  { city: "Pallandri", prov: "Azad Jammu & Kashmir" },

  // ── Gilgit-Baltistan ──
  { city: "Gilgit", prov: "Gilgit-Baltistan" },
  { city: "Skardu", prov: "Gilgit-Baltistan" },
  { city: "Hunza", prov: "Gilgit-Baltistan" },
  { city: "Chilas", prov: "Gilgit-Baltistan" },
  { city: "Ghanche", prov: "Gilgit-Baltistan" },
  { city: "Astore", prov: "Gilgit-Baltistan" }
];

window.PAKISTAN_PROVINCES = PAKISTAN_PROVINCES;
window.PAKISTAN_CITIES = PAKISTAN_CITIES;
