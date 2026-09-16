/* ===========================================================================
   UCP THEME PROTOTYPES — PLACEHOLDER CONTENT
   ===========================================================================

   EVERYTHING IN THIS FILE IS PLACEHOLDER DATA FOR DESIGN REVIEW ONLY.

   - Prices are illustrative SAR figures invented for layout purposes. They
     are NOT UCP prices and are not quoted from any retailer.
   - Product entries use widely-stocked pharmacy line names so the layout is
     judged against realistic text lengths in both scripts. Stock levels,
     discounts and "most ordered" rankings are fabricated for the prototype.
   - Branch names, delivery windows and point balances are invented.
   - No certification, licence or regulatory claim in these prototypes is a
     statement of fact. They are marked as placeholders in the UI.

   Replace this file with the catalogue adapter (packages/data) when the
   chosen theme is built for real. Every field below maps 1:1 onto the
   Product / Category / Brand / Bundle types already defined in
   packages/core/src/types.ts.
   =========================================================================== */

const UCP = {
  /** Marked placeholder so no prototype can be mistaken for a live store. */
  placeholder: true,

  categories: [
    { id: "face",     ar: "الوجه",                  en: "Face",            icon: "face",     tint: "#FFE3D1" },
    { id: "hair",     ar: "الشعر",                  en: "Hair",            icon: "hair",     tint: "#FFEAD6" },
    { id: "body",     ar: "الجسم",                  en: "Body",            icon: "body",     tint: "#E8EEF6" },
    { id: "feminine", ar: "العناية الأنثوية",        en: "Feminine Care",   icon: "feminine", tint: "#F7E2EE" },
    { id: "lenses",   ar: "العدسات",                en: "Lenses",          icon: "lens",     tint: "#DCEAF7" },
    { id: "oral",     ar: "العناية بالفم",           en: "Oral Care",       icon: "oral",     tint: "#E2F0EA" },
    { id: "vitamins", ar: "الفيتامينات والمكملات",   en: "Vitamins",        icon: "vitamin",  tint: "#FFF0CF" },
    { id: "baby",     ar: "الأم والطفل",             en: "Mother & Baby",   icon: "baby",     tint: "#E6F1F8" },
    { id: "devices",  ar: "الأجهزة الطبية",          en: "Devices",         icon: "device",   tint: "#ECEAF6" },
    { id: "medicine", ar: "الأدوية",                en: "Medicines",       icon: "pill",     tint: "#F0E9E3" },
    { id: "makeup",   ar: "المكياج",                en: "Makeup",          icon: "makeup",   tint: "#F8E4E0" },
  ],

  brands: [
    { id: "cerave",   ar: "سيرافي",        en: "CeraVe" },
    { id: "laroche",  ar: "لاروش بوزيه",   en: "La Roche-Posay" },
    { id: "vichy",    ar: "فيشي",          en: "Vichy" },
    { id: "bioderma", ar: "بيوديرما",      en: "Bioderma" },
    { id: "eucerin",  ar: "أوسرين",        en: "Eucerin" },
    { id: "avene",    ar: "أفين",          en: "Avène" },
    { id: "isdin",    ar: "إيسدين",        en: "ISDIN" },
    { id: "ordinary", ar: "ذا أوردينري",   en: "The Ordinary" },
    { id: "sensodyne",ar: "سنسوداين",      en: "Sensodyne" },
    { id: "oralb",    ar: "أورال-بي",      en: "Oral-B" },
    { id: "centrum",  ar: "سنتروم",        en: "Centrum" },
    { id: "solgar",   ar: "سولجار",        en: "Solgar" },
    { id: "acuvue",   ar: "أكيوفيو",       en: "Acuvue" },
    { id: "omron",    ar: "أومرون",        en: "Omron" },
    { id: "nivea",    ar: "نيفيا",         en: "Nivea" },
    { id: "pampers",  ar: "بامبرز",        en: "Pampers" },
  ],

  /* price / was are PLACEHOLDER SAR values invented for layout. */
  products: [
    { id: "p1",  brand: "cerave",   cat: "face",     form: "pump",    ar: "سيرافي غسول رغوي للبشرة الدهنية", en: "CeraVe Foaming Facial Cleanser",   price: 78,  was: 95,  size: "473 ml", rank: 1,  tags: ["offer","popular"] },
    { id: "p2",  brand: "isdin",    cat: "face",     form: "tube",    ar: "إيسدين فيوجن ووتر واقي شمس",      en: "ISDIN Fusion Water SPF 50",        price: 149, was: 175, size: "50 ml",  rank: 2,  tags: ["offer","popular"] },
    { id: "p3",  brand: "ordinary", cat: "face",     form: "dropper", ar: "ذا أوردينري نياسيناميد ١٠٪",       en: "The Ordinary Niacinamide 10%",     price: 45,  was: null, size: "30 ml",  rank: 3,  tags: ["popular"] },
    { id: "p4",  brand: "laroche",  cat: "face",     form: "tube",    ar: "لاروش بوزيه توليريان مرطب",        en: "La Roche-Posay Toleriane Cream",   price: 129, was: null, size: "40 ml",  rank: 9,  tags: [] },
    { id: "p5",  brand: "bioderma", cat: "face",     form: "bottle",  ar: "بيوديرما سنسيبيو ماء ميسيلار",     en: "Bioderma Sensibio H2O",            price: 89,  was: 110, size: "500 ml", rank: 4,  tags: ["offer","popular"] },
    { id: "p6",  brand: "vichy",    cat: "hair",     form: "bottle",  ar: "فيشي ديركوس شامبو مقوٍ",           en: "Vichy Dercos Energising Shampoo",  price: 115, was: 139, size: "400 ml", rank: 10, tags: ["offer"] },
    { id: "p7",  brand: "eucerin",  cat: "body",     form: "pump",    ar: "أوسرين لوشن اليوريا ١٠٪",          en: "Eucerin UreaRepair 10% Lotion",    price: 119, was: 142, size: "250 ml", rank: 11, tags: ["offer"] },
    { id: "p8",  brand: "sensodyne",cat: "oral",     form: "carton",  ar: "سنسوداين معجون ريبير آند بروتكت",  en: "Sensodyne Repair & Protect",       price: 32,  was: 39,  size: "75 ml",  rank: 5,  tags: ["offer","popular"] },
    { id: "p9",  brand: "oralb",    cat: "oral",     form: "device",  ar: "أورال-بي فرشاة كهربائية",          en: "Oral-B Vitality Electric Brush",   price: 149, was: 189, size: "1 unit", rank: 12, tags: ["offer"] },
    { id: "p10", brand: "centrum",  cat: "vitamins", form: "jar",     ar: "سنتروم فيتامينات متعددة",          en: "Centrum Adults Multivitamin",      price: 95,  was: 115, size: "60 tabs",rank: 6,  tags: ["offer","popular","reorder"] },
    { id: "p11", brand: "solgar",   cat: "vitamins", form: "jar",     ar: "سولجار فيتامين د٣ ١٠٠٠",           en: "Solgar Vitamin D3 1000 IU",        price: 79,  was: null, size: "100 sg", rank: 7,  tags: ["popular","reorder"] },
    { id: "p12", brand: "acuvue",   cat: "lenses",   form: "lens",    ar: "أكيوفيو موست عدسات يومية",         en: "Acuvue Moist Daily Lenses",        price: 149, was: 179, size: "30 lens",rank: 8,  tags: ["offer","popular"] },
    { id: "p13", brand: "omron",    cat: "devices",  form: "device",  ar: "أومرون جهاز قياس الضغط",           en: "Omron M3 Blood Pressure Monitor",  price: 329, was: 399, size: "1 unit", rank: 13, tags: ["offer"] },
    { id: "p14", brand: "nivea",    cat: "body",     form: "tube",    ar: "نيفيا لوشن الجسم المغذي",          en: "Nivea Nourishing Body Lotion",     price: 29,  was: null, size: "400 ml", rank: 14, tags: ["reorder"] },
    { id: "p15", brand: "pampers",  cat: "baby",     form: "carton",  ar: "بامبرز حفاضات بريميوم مقاس ٤",     en: "Pampers Premium Care Size 4",      price: 89,  was: 109, size: "52 pcs", rank: 15, tags: ["offer","reorder"] },
    { id: "p16", brand: "avene",    cat: "face",     form: "tube",    ar: "أفين واقي شمس معدني",              en: "Avène Mineral Sunscreen SPF 50+",  price: 139, was: null, size: "40 ml",  rank: 16, tags: ["low"] },
    { id: "p17", brand: "laroche",  cat: "feminine", form: "bottle",  ar: "لاروش بوزيه غسول نسائي مهدئ",      en: "La Roche-Posay Intimate Wash",     price: 79,  was: null, size: "200 ml", rank: 17, tags: [] },
    { id: "p18", brand: "oralb",    cat: "oral",     form: "carton",  ar: "أورال-بي خيط أسنان",               en: "Oral-B Essential Dental Floss",    price: 14,  was: null, size: "50 m",   rank: 18, tags: [] },
    { id: "p19", brand: "cerave",   cat: "body",     form: "jar",     ar: "سيرافي كريم مرطب",                 en: "CeraVe Moisturising Cream",        price: 96,  was: 120, size: "454 g",  rank: 19, tags: ["offer","reorder"] },
    { id: "p20", brand: "vichy",    cat: "face",     form: "dropper", ar: "فيشي ليفت أكتيف سيروم فيتامين سي", en: "Vichy Liftactiv Vitamin C Serum",  price: 219, was: 265, size: "20 ml",  rank: 20, tags: ["offer"] },
    { id: "p21", brand: "centrum",  cat: "medicine", form: "carton",  ar: "أقراص مسكّنة للألم",               en: "Pain Relief Tablets",              price: 16,  was: null, size: "24 tabs",rank: 21, tags: ["reorder"] },
    { id: "p22", brand: "centrum",  cat: "medicine", form: "bottle",  ar: "شراب للسعال",                      en: "Cough Syrup",                      price: 27,  was: 34,   size: "120 ml", rank: 22, tags: ["offer"] },
    { id: "p23", brand: "nivea",    cat: "makeup",   form: "tube",    ar: "مرطب شفاه ملوّن",                  en: "Tinted Lip Balm",                  price: 19,  was: null, size: "4.8 g",  rank: 23, tags: [] },
    { id: "p24", brand: "nivea",    cat: "makeup",   form: "dropper", ar: "كريم أساس خفيف",                   en: "Lightweight Foundation",           price: 55,  was: 69,   size: "30 ml",  rank: 24, tags: ["offer"] },
  ],

  bundles: [
    { id: "b1", cat: "oral",     ar: "باقة العناية بالفم الأساسية", en: "Oral Care Essentials",  price: 65,  parts: 75,  items: 4, note: { ar: "فرشاة · معجون · غسول · خيط", en: "Brush · Paste · Rinse · Floss" } },
    { id: "b2", cat: "face",     ar: "باقة روتين الوجه اليومي",     en: "Daily Face Routine",    price: 269, parts: 296, items: 3, note: { ar: "غسول · مرطب · واقي شمس", en: "Cleanse · Moisturise · Protect" } },
    { id: "b3", cat: "lenses",   ar: "باقة العدسات للمبتدئين",      en: "Lens Starter Pack",     price: 179, parts: 200, items: 3, note: { ar: "عدسات · محلول · علبة", en: "Lenses · Solution · Case" } },
  ],

  /* Placeholder branches — invented names and districts. */
  branches: [
    { id: "br1", ar: "فرع العليا",  en: "Olaya Branch",   city: { ar: "الرياض", en: "Riyadh" }, open: true,  hours: "24h" },
    { id: "br2", ar: "فرع النرجس",  en: "Narjis Branch",  city: { ar: "الرياض", en: "Riyadh" }, open: true,  hours: "08:00 – 02:00" },
    { id: "br3", ar: "فرع الحمراء", en: "Al Hamra Branch",city: { ar: "جدة",    en: "Jeddah" }, open: false, hours: "08:00 – 00:00" },
  ],

  /* Placeholder loyalty figures. */
  loyalty: { points: 1340, tierAr: "مميّز", tierEn: "Select", nextAr: "نخبة", nextEn: "Elite", progress: 0.56, toNext: 880 },

  copy: {
    ar: {
      brand: "صيدلية العناية العاجلة", short: "UCP", tag: "صيدليتك، أسرع",
      searchPh: "ابحث عن منتج أو علامة تجارية", search: "بحث",
      cart: "السلة", account: "حسابي", menu: "القائمة", close: "إغلاق",
      allCats: "عرض جميع الفئات", viewAll: "عرض الكل", shopNow: "تسوّق الآن",
      rx: "اطلب وصفتك", rxDesc: "ارفع صورة وصفتك ويراجعها صيدلي مرخّص",
      tele: "استشارة صيدلي", teleDesc: "محادثة أو مكالمة فيديو",
      pickup: "استلام من الفرع", pickupDesc: "جهّز طلبك واستلمه من أقرب فرع",
      delivery: "توصيل", deliveryDesc: "يصلك إلى عنوانك",
      loyalty: "نادي UCP", loyaltyDesc: "اكسب نقاطًا واستبدلها كخصم",
      vitamins: "متابعة الفيتامينات", vitaminsDesc: "تذكير ومتابعة لمخزون عبوتك",
      cats: "تسوّق حسب الفئة", brands: "تسوّق عبر العلامة التجارية",
      popular: "الأكثر طلبًا", offers: "عروض اليوم", packages: "باقات مختارة",
      reorder: "أعد طلب مشترياتك", picked: "مختارات لك",
      add: "أضف للسلة", added: "تمت الإضافة", outOfStock: "نفد المخزون", lowStock: "كمية محدودة",
      was: "كان", off: "خصم", save: "توفير", vat: "شامل الضريبة",
      points: "نقطة", balance: "رصيدك", toNext: "نقطة للوصول إلى",
      free: "مجاني", total: "الإجمالي", checkout: "إتمام الطلب", emptyCart: "سلتك فارغة",
      services: "خدمات UCP", more: "المزيد", riyal: "ر.س",
      etaTitle: "التوصيل خلال", etaValue: "٦٠ دقيقة", etaNote: "للطلبات داخل الرياض",
      openNow: "مفتوح الآن", closedNow: "مغلق", items: "منتج",
      noResults: "لا توجد نتائج", proto: "نموذج تصميم · بيانات تجريبية",
      footerAbout: "عن UCP", footerService: "خدمة العملاء", footerShop: "التسوق",
      footerPharmacy: "خدمات صيدلية", footerLegal: "السياسات",
      rights: "جميع الحقوق محفوظة", placeholderNote: "المحتوى والأسعار في هذا النموذج تجريبية",
    },
    en: {
      brand: "Urgent Care Pharmacy", short: "UCP", tag: "Your pharmacy, faster",
      searchPh: "Search for a product or brand", search: "Search",
      cart: "Cart", account: "Account", menu: "Menu", close: "Close",
      allCats: "View all categories", viewAll: "View all", shopNow: "Shop now",
      rx: "Order a prescription", rxDesc: "Upload it and a licensed pharmacist reviews it",
      tele: "Talk to a pharmacist", teleDesc: "Chat or video call",
      pickup: "Pick up from branch", pickupDesc: "We prepare it, you collect it",
      delivery: "Delivery", deliveryDesc: "Delivered to your address",
      loyalty: "UCP Club", loyaltyDesc: "Earn points, spend them as discount",
      vitamins: "Vitamin follow-up", vitaminsDesc: "Reminders and supply tracking",
      cats: "Shop by category", brands: "Shop by brand",
      popular: "Most ordered", offers: "Today's offers", packages: "Curated packages",
      reorder: "Buy it again", picked: "Picked for you",
      add: "Add to cart", added: "Added", outOfStock: "Out of stock", lowStock: "Only a few left",
      was: "Was", off: "off", save: "Save", vat: "VAT incl.",
      points: "points", balance: "Your balance", toNext: "points to reach",
      free: "Free", total: "Total", checkout: "Checkout", emptyCart: "Your cart is empty",
      services: "UCP services", more: "More", riyal: "SAR",
      etaTitle: "Delivery in", etaValue: "60 minutes", etaNote: "for orders inside Riyadh",
      openNow: "Open now", closedNow: "Closed", items: "items",
      noResults: "No results", proto: "Design prototype · sample data",
      footerAbout: "About UCP", footerService: "Customer service", footerShop: "Shopping",
      footerPharmacy: "Pharmacy services", footerLegal: "Policies",
      rights: "All rights reserved", placeholderNote: "Content and prices in this prototype are illustrative",
    },
  },
};

/* --------------------------------------------------------------------------
   Product artwork.

   No licensed product photography exists for this exercise, and stock
   photos of the wrong bottle are worse than an honest illustration. Each
   theme renders the SAME product data through its OWN art style, so the
   four directions can be judged on how they present product, not on who
   got the better picture.
   -------------------------------------------------------------------------- */

const FORMS = {
  pump:    'M34 30h32v50a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z M43 18h14v12H43z M50 18V10h10',
  tube:    'M36 28h28v52a6 6 0 0 1-6 6H42a6 6 0 0 1-6-6z M36 28c5-4 23-4 28 0 M44 14h12v14H44z',
  bottle:  'M34 34h32v46a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z M42 16h16v18H42z',
  dropper: 'M38 36h24v44a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6z M45 14h10v22H45z M50 14V8',
  jar:     'M30 40h40v40a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6z M36 24h28v16H36z',
  carton:  'M30 26 50 16l20 10v54L50 90 30 80z M30 26l20 10 20-10 M50 36v54',
  device:  'M34 14h32a4 4 0 0 1 4 4v64a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z M40 26h20 M40 38h20 M44 52h12',
  lens:    'M50 86a36 36 0 1 0 0-72 36 36 0 0 0 0 72z M50 70a20 20 0 1 0 0-40 20 20 0 0 0 0 40z',
};

function hashCode(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/**
 * Renders one product as an inline SVG, in the calling theme's art style.
 * style: "ninja" | "premium" | "modern" | "friendly"
 */
function productArt(p, style, opts) {
  const path = FORMS[p.form] || FORMS.bottle;
  const h = hashCode(p.id);
  const id = `g${style}${p.id}${(opts && opts.transparent) ? "t" : ""}`;
  // Tiles that sit on their own coloured ground need the artwork without
  // its backdrop, or the backdrop reads as a stray pale rectangle.
  const bare = !!(opts && opts.transparent);

  if (style === "ninja") {
    // Hard-lit object on dark ground, orange rim light, sharp shadow.
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2A2A31"/><stop offset="100%" stop-color="#121216"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#${id})"/>
      <ellipse cx="50" cy="90" rx="26" ry="4" fill="#000" opacity=".55"/>
      <g transform="translate(0 2)">
        <path d="${path}" fill="#23232A" stroke="#6E6E7C" stroke-width="2.6" stroke-linejoin="round"/>
        <rect x="34" y="${52 + (h % 8)}" width="32" height="13" fill="#FF6A00"/>
        <path d="${path}" fill="none" stroke="#FF6A00" stroke-width="2.6" stroke-linejoin="round"
              clip-path="inset(0 0 0 62%)" opacity=".9"/>
      </g>
    </svg>`;
  }

  if (style === "premium") {
    // Studio light on stone, long soft shadow, muted and spacious.
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="38%" cy="26%" r="80%">
          <stop offset="0%" stop-color="#FFFDFA"/><stop offset="100%" stop-color="#EDE5DA"/>
        </radialGradient>
        <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="55%" stop-color="#F3EDE5"/><stop offset="100%" stop-color="#DCD2C5"/>
        </linearGradient>
      </defs>
      ${bare ? "" : `<rect width="100" height="100" fill="url(#${id})"/>`}
      <ellipse cx="54" cy="88" rx="31" ry="3.6" fill="#6E5B45" opacity=".30"/>
      <g transform="translate(0 1)">
        <path d="${path}" fill="url(#${id}b)" stroke="#9C8B77" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- printed label band: gives each silhouette a readable "front"
             so a shelf of pale bottles does not read as one repeated shape -->
        <rect x="36" y="${50 + (h % 10)}" width="28" height="17" fill="#B83D06" opacity=".13"/>
        <rect x="36" y="${50 + (h % 10)}" width="28" height="17" fill="none" stroke="#B83D06" stroke-width=".8" opacity=".45"/>
        <path d="${path}" fill="none" stroke="#FFFFFF" stroke-width="1.6" clip-path="inset(0 64% 0 0)" opacity=".85"/>
      </g>
    </svg>`;
  }

  if (style === "friendly") {
    // Chunky outline on a soft tint blob — approachable, illustrative.
    const tint = (UCP.categories.find((c) => c.id === p.cat) || {}).tint || "#FFE3D1";
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" fill="#FFFFFF"/>
      <circle cx="${46 + (h % 8)}" cy="${48 + (h % 6)}" r="33" fill="${tint}"/>
      <circle cx="74" cy="26" r="6" fill="${tint}"/>
      <g stroke="#2A1E16" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
        <path d="${path}"/>
      </g>
      <path d="${path}" fill="#FF8A3D" opacity=".18"/>
    </svg>`;
  }

  // modern — flat, clean, neutral, maximum clarity at small sizes
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="#FFFFFF"/>
    <path d="${path}" fill="#F1F4F7" stroke="#C6CFD9" stroke-width="2" stroke-linejoin="round"/>
    <rect x="40" y="46" width="20" height="16" rx="2" fill="#C9450A" opacity=".18"/>
  </svg>`;
}

/**
 * Package artwork — a composed group, not one product repeated.
 *
 * A package is defined by containing several things, so showing a single
 * silhouette three times undersells the one idea the card has to convey.
 */
function bundleArt(b, style) {
  const h = hashCode(b.id);
  const forms = ["carton", "tube", "bottle", "jar", "pump"];
  const picks = [0, 1, 2].map((i) => forms[(h + i * 3) % forms.length]);
  const tint = (UCP.categories.find((c) => c.id === b.cat) || {}).tint || "#FFE3D1";

  const grounds = {
    ninja:    { bg: "#16161A", stroke: "#6E6E7C", fill: "#23232A", accent: "#FF6A00", shadow: "#000" },
    premium:  { bg: "#F3EDE5", stroke: "#9C8B77", fill: "#FFFFFF", accent: "#B83D06", shadow: "#6E5B45" },
    friendly: { bg: tint,      stroke: "#2A1E16", fill: "#FFFFFF", accent: "#FF8A3D", shadow: "#2A1E16" },
    modern:   { bg: "#FFFFFF", stroke: "#C6CFD9", fill: "#F1F4F7", accent: "#C9450A", shadow: "#94A3B8" },
  };
  const g = grounds[style] || grounds.modern;
  const sw = style === "friendly" ? 3 : style === "ninja" ? 2.4 : 1.4;

  const items = picks.map((form, i) => {
    const x = 18 + i * 32;
    const scale = i === 1 ? 0.92 : 0.74;
    return `<g transform="translate(${x} ${i === 1 ? 6 : 14}) scale(${scale}) translate(-50 0)">
      <path d="${FORMS[form]}" fill="${g.fill}" stroke="${g.stroke}" stroke-width="${sw / scale}" stroke-linejoin="round"/>
      <rect x="36" y="54" width="28" height="14" fill="${g.accent}" opacity="${style === "premium" ? ".16" : ".30"}"/>
    </g>`;
  }).join("");

  return `<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="160" height="100" fill="${g.bg}"/>
    <ellipse cx="80" cy="94" rx="58" ry="4" fill="${g.shadow}" opacity=".18"/>
    ${items}
  </svg>`;
}

/** Brand wordmark, drawn rather than shipped as a logo file. */
function brandMark(b, lang, color) {
  const label = b.en;
  const size = label.length > 15 ? 13 : label.length > 10 ? 15 : 18;
  return `<svg viewBox="0 0 160 60" aria-hidden="true">
    <text x="80" y="34" text-anchor="middle" font-family="system-ui,sans-serif"
          font-size="${size}" font-weight="700" letter-spacing="-.3" fill="${color}">${label}</text>
  </svg>`;
}

const money = (n, lang) => (lang === "ar" ? `${n} ر.س` : `SAR ${n}`);

/**
 * Price markup.
 *
 * The digits and the currency word have to be separate elements. Wrapping
 * the whole string in a `direction: ltr` span (which tabular figures need)
 * drags the Arabic "ر.س" into the LTR run, and the bidi algorithm then
 * splits it into "ر . س" with the period stranded. Isolating just the
 * numerals fixes it in both scripts.
 */
function priceHTML(n, lang, numClass) {
  const num = `<span class="${numClass || "num"}">${n}</span>`;
  const cur = `<span class="cur">${lang === "ar" ? "ر.س" : "SAR"}</span>`;
  return lang === "ar" ? `${num}\u00A0${cur}` : `${cur}\u00A0${num}`;
}

/** Struck was-price, same isolation rules. */
function wasHTML(n, lang, numClass) {
  return `<s class="was">${priceHTML(n, lang, numClass)}</s>`;
}
const pct = (price, was) => (was ? Math.floor(((was - price) / was) * 100) : 0);
const byId = (arr, id) => arr.find((x) => x.id === id);
