/* ===========================================================================
   UCP NINJA — shared data, helpers and behaviour
   ---------------------------------------------------------------------------
   All four executions share this file. Each execution supplies only its own
   layout and a render() — so what differs between them is composition, never
   content, colour, type or interaction model. That is the point: it lets the
   four be compared as designs rather than as different prototypes.

   PLACEHOLDER CONTENT. Prices, stock, rankings, branches and point balances
   are design filler, not UCP's data. No licence, certification or claim in
   these pages is presented as fact.
   =========================================================================== */

const UCP = {
  placeholder: true,

  categories: [
    { id:"face",     ar:"الوجه",                 en:"Face",           icon:"face"     },
    { id:"hair",     ar:"الشعر",                 en:"Hair",           icon:"hair"     },
    { id:"body",     ar:"الجسم",                 en:"Body",           icon:"body"     },
    { id:"feminine", ar:"العناية الأنثوية",       en:"Feminine Care",  icon:"feminine" },
    { id:"lenses",   ar:"العدسات",               en:"Lenses",         icon:"lens"     },
    { id:"oral",     ar:"العناية بالفم",          en:"Oral Care",      icon:"oral"     },
    { id:"vitamins", ar:"الفيتامينات والمكملات",  en:"Vitamins",       icon:"vitamin"  },
    { id:"baby",     ar:"الأم والطفل",            en:"Mother & Baby",  icon:"baby"     },
    { id:"devices",  ar:"الأجهزة الطبية",         en:"Devices",        icon:"device"   },
    { id:"medicine", ar:"الأدوية",               en:"Medicines",      icon:"pill"     },
    { id:"makeup",   ar:"المكياج",               en:"Makeup",         icon:"makeup"   },
  ],

  brands: [
    { id:"cerave",   ar:"سيرافي",      en:"CeraVe" },
    { id:"laroche",  ar:"لاروش بوزيه", en:"La Roche-Posay" },
    { id:"vichy",    ar:"فيشي",        en:"Vichy" },
    { id:"bioderma", ar:"بيوديرما",    en:"Bioderma" },
    { id:"eucerin",  ar:"أوسرين",      en:"Eucerin" },
    { id:"avene",    ar:"أفين",        en:"Avène" },
    { id:"isdin",    ar:"إيسدين",      en:"ISDIN" },
    { id:"ordinary", ar:"ذا أوردينري", en:"The Ordinary" },
    { id:"sensodyne",ar:"سنسوداين",    en:"Sensodyne" },
    { id:"oralb",    ar:"أورال-بي",    en:"Oral-B" },
    { id:"centrum",  ar:"سنتروم",      en:"Centrum" },
    { id:"solgar",   ar:"سولجار",      en:"Solgar" },
    { id:"acuvue",   ar:"أكيوفيو",     en:"Acuvue" },
    { id:"omron",    ar:"أومرون",      en:"Omron" },
    { id:"nivea",    ar:"نيفيا",       en:"Nivea" },
    { id:"pampers",  ar:"بامبرز",      en:"Pampers" },
  ],

  products: [
    { id:"p1",  brand:"cerave",   cat:"face",     form:"pump",    ar:"سيرافي غسول رغوي للبشرة الدهنية", en:"CeraVe Foaming Facial Cleanser",  price:78,  was:95,  size:"473 ml",  rank:1,  tags:["offer","popular"] },
    { id:"p2",  brand:"isdin",    cat:"face",     form:"tube",    ar:"إيسدين فيوجن ووتر واقي شمس",      en:"ISDIN Fusion Water SPF 50",       price:149, was:175, size:"50 ml",   rank:2,  tags:["offer","popular"] },
    { id:"p3",  brand:"ordinary", cat:"face",     form:"dropper", ar:"ذا أوردينري نياسيناميد ١٠٪",       en:"The Ordinary Niacinamide 10%",    price:45,  was:null, size:"30 ml",  rank:3,  tags:["popular"] },
    { id:"p4",  brand:"laroche",  cat:"face",     form:"tube",    ar:"لاروش بوزيه توليريان مرطب",        en:"La Roche-Posay Toleriane Cream",  price:129, was:null, size:"40 ml",  rank:9,  tags:[] },
    { id:"p5",  brand:"bioderma", cat:"face",     form:"bottle",  ar:"بيوديرما سنسيبيو ماء ميسيلار",     en:"Bioderma Sensibio H2O",           price:89,  was:110, size:"500 ml",  rank:4,  tags:["offer","popular"] },
    { id:"p6",  brand:"vichy",    cat:"hair",     form:"bottle",  ar:"فيشي ديركوس شامبو مقوٍ",           en:"Vichy Dercos Energising Shampoo", price:115, was:139, size:"400 ml",  rank:10, tags:["offer"] },
    { id:"p7",  brand:"eucerin",  cat:"body",     form:"pump",    ar:"أوسرين لوشن اليوريا ١٠٪",          en:"Eucerin UreaRepair 10% Lotion",   price:119, was:142, size:"250 ml",  rank:11, tags:["offer"] },
    { id:"p8",  brand:"sensodyne",cat:"oral",     form:"carton",  ar:"سنسوداين معجون ريبير آند بروتكت",  en:"Sensodyne Repair & Protect",      price:32,  was:39,  size:"75 ml",   rank:5,  tags:["offer","popular"] },
    { id:"p9",  brand:"oralb",    cat:"oral",     form:"device",  ar:"أورال-بي فرشاة كهربائية",          en:"Oral-B Vitality Electric Brush",  price:149, was:189, size:"1 unit",  rank:12, tags:["offer"] },
    { id:"p10", brand:"centrum",  cat:"vitamins", form:"jar",     ar:"سنتروم فيتامينات متعددة",          en:"Centrum Adults Multivitamin",     price:95,  was:115, size:"60 tabs", rank:6,  tags:["offer","popular","reorder"] },
    { id:"p11", brand:"solgar",   cat:"vitamins", form:"jar",     ar:"سولجار فيتامين د٣ ١٠٠٠",           en:"Solgar Vitamin D3 1000 IU",       price:79,  was:null, size:"100 sg", rank:7,  tags:["popular","reorder"] },
    { id:"p12", brand:"acuvue",   cat:"lenses",   form:"lens",    ar:"أكيوفيو موست عدسات يومية",         en:"Acuvue Moist Daily Lenses",       price:149, was:179, size:"30 lens", rank:8,  tags:["offer","popular"] },
    { id:"p13", brand:"omron",    cat:"devices",  form:"device",  ar:"أومرون جهاز قياس الضغط",           en:"Omron M3 Blood Pressure Monitor", price:329, was:399, size:"1 unit",  rank:13, tags:["offer"] },
    { id:"p14", brand:"nivea",    cat:"body",     form:"tube",    ar:"نيفيا لوشن الجسم المغذي",          en:"Nivea Nourishing Body Lotion",    price:29,  was:null, size:"400 ml", rank:14, tags:["reorder"] },
    { id:"p15", brand:"pampers",  cat:"baby",     form:"carton",  ar:"بامبرز حفاضات بريميوم مقاس ٤",     en:"Pampers Premium Care Size 4",     price:89,  was:109, size:"52 pcs",  rank:15, tags:["offer","reorder"] },
    { id:"p16", brand:"avene",    cat:"face",     form:"tube",    ar:"أفين واقي شمس معدني",              en:"Avène Mineral Sunscreen SPF 50+", price:139, was:null, size:"40 ml",  rank:16, tags:["low"] },
    { id:"p17", brand:"laroche",  cat:"feminine", form:"bottle",  ar:"لاروش بوزيه غسول نسائي مهدئ",      en:"La Roche-Posay Intimate Wash",    price:79,  was:null, size:"200 ml", rank:17, tags:[] },
    { id:"p18", brand:"oralb",    cat:"oral",     form:"carton",  ar:"أورال-بي خيط أسنان",               en:"Oral-B Essential Dental Floss",   price:14,  was:null, size:"50 m",   rank:18, tags:[] },
    { id:"p19", brand:"cerave",   cat:"body",     form:"jar",     ar:"سيرافي كريم مرطب",                 en:"CeraVe Moisturising Cream",       price:96,  was:120, size:"454 g",   rank:19, tags:["offer","reorder"] },
    { id:"p20", brand:"vichy",    cat:"face",     form:"dropper", ar:"فيشي ليفت أكتيف سيروم فيتامين سي", en:"Vichy Liftactiv Vitamin C Serum", price:219, was:265, size:"20 ml",   rank:20, tags:["offer"] },
    { id:"p21", brand:"centrum",  cat:"medicine", form:"carton",  ar:"أقراص مسكّنة للألم",               en:"Pain Relief Tablets",             price:16,  was:null, size:"24 tabs",rank:21, tags:["reorder"] },
    { id:"p22", brand:"centrum",  cat:"medicine", form:"bottle",  ar:"شراب للسعال",                      en:"Cough Syrup",                     price:27,  was:34,  size:"120 ml",  rank:22, tags:["offer"] },
    { id:"p23", brand:"nivea",    cat:"makeup",   form:"tube",    ar:"مرطب شفاه ملوّن",                  en:"Tinted Lip Balm",                 price:19,  was:null, size:"4.8 g",  rank:23, tags:[] },
    { id:"p24", brand:"nivea",    cat:"makeup",   form:"dropper", ar:"كريم أساس خفيف",                   en:"Lightweight Foundation",          price:55,  was:69,  size:"30 ml",   rank:24, tags:["offer"] },
  ],

  bundles: [
    { id:"b1", cat:"oral",   ar:"باقة العناية بالفم الأساسية", en:"Oral Care Essentials", price:65,  parts:75,  items:4, noteAr:"فرشاة · معجون · غسول · خيط", noteEn:"Brush · Paste · Rinse · Floss" },
    { id:"b2", cat:"face",   ar:"باقة روتين الوجه اليومي",     en:"Daily Face Routine",   price:269, parts:296, items:3, noteAr:"غسول · مرطب · واقي شمس",     noteEn:"Cleanse · Moisturise · Protect" },
    { id:"b3", cat:"lenses", ar:"باقة العدسات للمبتدئين",      en:"Lens Starter Pack",    price:179, parts:200, items:3, noteAr:"عدسات · محلول · علبة",        noteEn:"Lenses · Solution · Case" },
  ],

  branches: [
    { id:"br1", ar:"فرع العليا",  en:"Olaya",   cityAr:"الرياض", cityEn:"Riyadh", open:true,  hours:"24h" },
    { id:"br2", ar:"فرع النرجس",  en:"Narjis",  cityAr:"الرياض", cityEn:"Riyadh", open:true,  hours:"08:00–02:00" },
    { id:"br3", ar:"فرع الحمراء", en:"Al Hamra",cityAr:"جدة",    cityEn:"Jeddah", open:false, hours:"08:00–00:00" },
  ],

  loyalty: { points:1340, tierAr:"مميّز", tierEn:"Select", nextAr:"نخبة", nextEn:"Elite", progress:.56, toNext:880 },

  copy: {
    ar: {
      brand:"صيدلية العناية العاجلة", short:"UCP", tag:"صيدليتك، أسرع",
      searchPh:"ابحث عن منتج أو علامة تجارية", search:"بحث",
      cart:"السلة", account:"حسابي", menu:"القائمة", close:"إغلاق", back:"رجوع",
      allCats:"عرض جميع الفئات", viewAll:"عرض الكل", shopNow:"تسوّق الآن", more:"المزيد",
      rx:"اطلب وصفتك", rxDesc:"ارفع صورة وصفتك ويراجعها صيدلي مرخّص",
      tele:"استشارة صيدلي", teleDesc:"محادثة أو مكالمة فيديو مع صيدلي",
      pickup:"استلام من الفرع", pickupDesc:"جهّز طلبك واستلمه من أقرب فرع",
      delivery:"توصيل", deliveryDesc:"يصلك إلى عنوانك",
      loyalty:"نادي UCP", loyaltyDesc:"اكسب نقاطًا واستبدلها كخصم",
      vitamins:"متابعة الفيتامينات", vitaminsDesc:"تذكير ومتابعة لمخزون عبوتك",
      cats:"تسوّق حسب الفئة", brands:"تسوّق عبر العلامة التجارية",
      popular:"الأكثر طلبًا", offers:"عروض اليوم", packages:"باقات مختارة",
      reorder:"أعد طلب مشترياتك", picked:"مختارات لك", services:"خدمات UCP",
      add:"أضف للسلة", added:"تمت الإضافة", outOfStock:"نفد المخزون", lowStock:"كمية محدودة",
      off:"خصم", save:"توفير", vat:"شامل الضريبة", riyal:"ر.س", items:"منتج",
      points:"نقطة", balance:"رصيدك", toNext:"نقطة للوصول إلى",
      free:"مجاني", total:"الإجمالي", checkout:"إتمام الطلب", emptyCart:"سلتك فارغة",
      etaTitle:"التوصيل خلال", etaValue:"٦٠ دقيقة", etaNote:"للطلبات داخل الرياض",
      openNow:"مفتوح الآن", closedNow:"مغلق", noResults:"لا توجد نتائج",
      proto:"نموذج تصميم · بيانات تجريبية",
      ftAbout:"عن UCP", ftService:"خدمة العملاء", ftShop:"التسوق",
      ftPharmacy:"خدمات صيدلية", ftLegal:"السياسات",
      rights:"جميع الحقوق محفوظة", phNote:"المحتوى والأسعار في هذا النموذج تجريبية",
    },
    en: {
      brand:"Urgent Care Pharmacy", short:"UCP", tag:"Your pharmacy, faster",
      searchPh:"Search for a product or brand", search:"Search",
      cart:"Cart", account:"Account", menu:"Menu", close:"Close", back:"Back",
      allCats:"View all categories", viewAll:"View all", shopNow:"Shop now", more:"More",
      rx:"Order a prescription", rxDesc:"Upload it and a licensed pharmacist reviews it",
      tele:"Talk to a pharmacist", teleDesc:"Chat or video call with a pharmacist",
      pickup:"Pick up from branch", pickupDesc:"We prepare it, you collect it",
      delivery:"Delivery", deliveryDesc:"Delivered to your address",
      loyalty:"UCP Club", loyaltyDesc:"Earn points, spend them as discount",
      vitamins:"Vitamin follow-up", vitaminsDesc:"Reminders and supply tracking",
      cats:"Shop by category", brands:"Shop by brand",
      popular:"Most ordered", offers:"Today's offers", packages:"Curated packages",
      reorder:"Buy it again", picked:"Picked for you", services:"UCP services",
      add:"Add to cart", added:"Added", outOfStock:"Out of stock", lowStock:"Only a few left",
      off:"off", save:"Save", vat:"VAT incl.", riyal:"SAR", items:"items",
      points:"points", balance:"Your balance", toNext:"points to reach",
      free:"Free", total:"Total", checkout:"Checkout", emptyCart:"Your cart is empty",
      etaTitle:"Delivery in", etaValue:"60 minutes", etaNote:"for orders inside Riyadh",
      openNow:"Open now", closedNow:"Closed", noResults:"No results",
      proto:"Design prototype · sample data",
      ftAbout:"About UCP", ftService:"Customer service", ftShop:"Shopping",
      ftPharmacy:"Pharmacy services", ftLegal:"Policies",
      rights:"All rights reserved", phNote:"Content and prices in this prototype are illustrative",
    },
  },
};

/* --- icons ---------------------------------------------------------------- */
const ICONS = {
  face:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0',
  hair:'M5 20v-7a7 7 0 0 1 14 0v7M5 13c1.5-1 2.5-3 2.5-5M19 13c-1.5-1-2.5-3-2.5-5',
  body:'M12 5.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5M12 7v7M12 7 7.5 9M12 7l4.5 2M12 14l-2.5 8M12 14l2.5 8',
  feminine:'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 14v7M9 18h6',
  lens:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9',
  oral:'M4 7c0-2 2-3 4-3s3 1 4 1 2-1 4-1 4 1 4 3c0 4-1.5 5-2.5 8S16 20 15 20s-1.5-3-3-3-2 3-3 3-1.5-2-2.5-5S4 11 4 7',
  vitamin:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7.5v9M7.5 12h9',
  baby:'M9 9h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM10 9V6.5h4V9M11 6.5V4.5a1 1 0 0 1 2 0v2M9 13h6',
  device:'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1M9 8h6M9 11.5h6M10.5 15h3',
  pill:'M10.5 3.5 3.5 10.5a5 5 0 0 0 7 7l7-7a5 5 0 0 0-7-7M7 7l7 7',
  makeup:'M9 3h6v4H9zM8 7h8l-1 13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z',
  rx:'M7 20V5a1 1 0 0 1 1-1h5l4 4v3M7 9h6M7 13h3M14 20l6-6M20 20l-6-6',
  store:'M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M3 10l1.5-5a1 1 0 0 1 1-.8h13a1 1 0 0 1 1 .8L21 10a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0',
  chat:'M4 5h16v11H9l-5 4z',
  video:'M3 7h11v10H3zM14 11l7-4v10z',
  truck:'M3 7h11v9H3zM14 10h3.5l2.5 3v3h-6M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  bell:'M6 16V10a6 6 0 1 1 12 0v6l2 3H4zM10 21h4',
  gift:'M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 7h18v4H3zM12 7v14M12 7S10 3 7.5 3a2.5 2.5 0 0 0 0 5M12 7s2-4 4.5-4a2.5 2.5 0 0 1 0 5',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3.5 2',
  shield:'M12 3l7 3v5.5c0 4.2-2.9 8-7 9.5-4.1-1.5-7-5.3-7-9.5V6z',
  lock:'M6 11h12v9H6zM9 11V7.5a3 3 0 0 1 6 0V11',
  search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.35-4.35',
  cart:'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2m9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  user:'M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  menu:'M4 7h16M4 12h16M4 17h16',
  close:'M6 6l12 12M18 6L6 18',
  plus:'M12 5v14M5 12h14',
  minus:'M5 12h14',
  check:'M4 12.5 9 17.5 20 6.5',
  next:'M9 6l6 6-6 6',
  arrow:'M5 12h14M13 6l6 6-6 6',
  loc:'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  phone:'M5 3h3.5l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L15 12l4 1.5V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 5.2 2 2 0 0 1 5 3',
  mail:'M3 6h18v12H3zM3 7l9 6 9-6',
};
/** Directional glyphs mirror under RTL; object glyphs never do. */
const DIRECTIONAL = new Set(["next","arrow"]);
function ic(name, size) {
  const s = size || 20;
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
    + (DIRECTIONAL.has(name) ? ' style="transform:scaleX(var(--mir,1))"' : '')
    + '><path d="'+ICONS[name]+'"/></svg>';
}

/* --- money ---------------------------------------------------------------- */
/**
 * Digits and the currency word are separate elements on purpose. Wrapping the
 * whole string in the `direction: ltr` that tabular figures need drags the
 * Arabic "ر.س" into the LTR run, and bidi then splits it into "ر . س".
 */
function priceHTML(n, lang) {
  const num = '<span class="num">' + n + '</span>';
  const cur = '<span class="cur">' + (lang === "ar" ? "ر.س" : "SAR") + '</span>';
  return lang === "ar" ? num + " " + cur : cur + " " + num;
}
function wasHTML(n, lang) { return '<s>' + priceHTML(n, lang) + '</s>'; }
function money(n, lang) { return lang === "ar" ? n + " ر.س" : "SAR " + n; }
function pct(price, was) { return was ? Math.floor(((was - price) / was) * 100) : 0; }
/**
 * Discount label. Written as "17%-" by bidi if the minus is left loose in an
 * RTL run, so the whole token is isolated LTR and the word carries the sense.
 */
function offLabel(p, lang) {
  const v = pct(p.price, p.was);
  return v ? '<span class="num">−' + v + '%</span>' : "";
}
const byId = (arr, id) => arr.find((x) => x.id === id);

/* --- product artwork ------------------------------------------------------
   No licensed product photography exists for this exercise. Rather than use
   stock photos of the wrong bottle, each SKU gets a deterministic, clearly
   illustrative render: a lit silhouette on ink with an amber label band and
   a rim light. Swapping in real imagery is a change to this function alone. */
const FORMS = {
  pump:   'M34 30h32v50a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z M43 18h14v12H43z M50 18V10h10',
  tube:   'M36 28h28v52a6 6 0 0 1-6 6H42a6 6 0 0 1-6-6z M36 28c5-4 23-4 28 0 M44 14h12v14H44z',
  bottle: 'M34 34h32v46a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z M42 16h16v18H42z',
  dropper:'M38 36h24v44a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6z M45 14h10v22H45z M50 14V8',
  jar:    'M30 40h40v40a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6z M36 24h28v16H36z',
  carton: 'M30 26 50 16l20 10v54L50 90 30 80z M30 26l20 10 20-10 M50 36v54',
  device: 'M34 14h32a4 4 0 0 1 4 4v64a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z M40 26h20 M40 38h20 M44 52h12',
  lens:   'M50 86a36 36 0 1 0 0-72 36 36 0 0 0 0 72z M50 70a20 20 0 1 0 0-40 20 20 0 0 0 0 40z',
};
function hashCode(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function art(p, opt) {
  const o = opt || {};
  const path = FORMS[p.form] || FORMS.bottle;
  const h = hashCode(p.id);
  const id = "g" + p.id + (o.light ? "l" : "");
  const bg1 = o.light ? "#F2EEE7" : "#241F18";
  const bg2 = o.light ? "#E4DED3" : "#0E0C09";
  const body = o.light ? "#FFFFFF" : "#2C261E";
  const edge = o.light ? "#BFB6A6" : "#6E6558";
  return '<svg viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet">'
    + '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="'+bg1+'"/><stop offset="100%" stop-color="'+bg2+'"/></linearGradient></defs>'
    + '<rect width="100" height="100" fill="url(#'+id+')"/>'
    + '<ellipse cx="50" cy="90" rx="26" ry="3.6" fill="#000" opacity="'+(o.light?".14":".5")+'"/>'
    + '<g transform="translate(0 2)">'
    + '<path d="'+path+'" fill="'+body+'" stroke="'+edge+'" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<rect x="34" y="'+(52+(h%8))+'" width="32" height="13" fill="#FFA300"/>'
    + '<path d="'+path+'" fill="none" stroke="#FFA300" stroke-width="2.4" stroke-linejoin="round"'
    + ' clip-path="inset(0 0 0 64%)" opacity=".9"/>'
    + '</g></svg>';
}
function bundleArt(b, opt) {
  const o = opt || {};
  const h = hashCode(b.id);
  const forms = ["carton","tube","bottle","jar","pump"];
  const picks = [0,1,2].map((i) => forms[(h + i*3) % forms.length]);
  const bg = o.light ? "#F2EEE7" : "#1A1712";
  const body = o.light ? "#FFFFFF" : "#2C261E";
  const edge = o.light ? "#BFB6A6" : "#6E6558";
  const items = picks.map((f, i) => {
    const sc = i === 1 ? .92 : .74;
    return '<g transform="translate('+(18+i*32)+' '+(i===1?6:14)+') scale('+sc+') translate(-50 0)">'
      + '<path d="'+FORMS[f]+'" fill="'+body+'" stroke="'+edge+'" stroke-width="'+(2.4/sc)+'" stroke-linejoin="round"/>'
      + '<rect x="36" y="54" width="28" height="14" fill="#FFA300" opacity=".85"/></g>';
  }).join("");
  return '<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
    + '<rect width="160" height="100" fill="'+bg+'"/>'
    + '<ellipse cx="80" cy="94" rx="58" ry="4" fill="#000" opacity="'+(o.light?".12":".4")+'"/>'
    + items + '</svg>';
}
function brandMark(b, color) {
  const label = b.en;
  const size = label.length > 15 ? 13 : label.length > 10 ? 15 : 18;
  return '<svg viewBox="0 0 160 60" aria-hidden="true"><text x="80" y="34" text-anchor="middle"'
    + ' font-family="Zain, system-ui, sans-serif" font-size="'+size+'" font-weight="700"'
    + ' fill="'+color+'">'+label+'</text></svg>';
}

/* --- shell: state and behaviour shared by all four executions ------------- */
const Shell = (() => {
  let lang = "ar";
  let cart = [];
  const listeners = [];
  const $ = (s) => document.querySelector(s);

  const T = () => UCP.copy[lang];
  const nm = (o) => o[lang];
  const count = () => cart.reduce((s, l) => s + l.q, 0);
  const subtotal = () => cart.reduce((s, l) => s + byId(UCP.products, l.id).price * l.q, 0);
  const qtyOf = (id) => (cart.find((l) => l.id === id) || { q: 0 }).q;

  function setLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.style.setProperty("--mir", lang === "ar" ? "-1" : "1");
    emit();
  }
  function toggleLang() { setLang(lang === "ar" ? "en" : "ar"); }

  function add(id) {
    const l = cart.find((x) => x.id === id);
    if (l) l.q++; else cart.push({ id, q: 1 });
    toast(nm(byId(UCP.products, id)) + " — " + T().added);
    emit();
  }
  function setQty(id, delta) {
    const l = cart.find((x) => x.id === id);
    if (!l) return;
    l.q += delta;
    if (l.q <= 0) cart = cart.filter((x) => x !== l);
    emit();
  }

  let toastTimer;
  function toast(msg) {
    let el = $("#ucp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ucp-toast";
      el.className = "ucp-toast";
      el.innerHTML = '<span class="i">' + ic("check", 17) + '</span><span class="t"></span>';
      document.body.appendChild(el);
    }
    el.querySelector(".t").textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 2100);
  }

  function search(q) {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return { cats: [], brands: [], products: [] };
    return {
      cats: UCP.categories.filter((c) => (c.ar + c.en).toLowerCase().includes(s)).slice(0, 3),
      brands: UCP.brands.filter((b) => (b.ar + b.en).toLowerCase().includes(s)).slice(0, 2),
      products: UCP.products.filter((p) =>
        (p.ar + p.en + byId(UCP.brands, p.brand).en).toLowerCase().includes(s)).slice(0, 6),
    };
  }

  function list(kind) {
    if (kind === "offers")  return UCP.products.filter((p) => p.was);
    if (kind === "reorder") return UCP.products.filter((p) => p.tags.includes("reorder"));
    if (kind === "picked")  return UCP.products.filter((p) => ["face","vitamins","oral"].includes(p.cat));
    return [...UCP.products].sort((a, b) => a.rank - b.rank);
  }

  const onRender = (fn) => listeners.push(fn);
  function emit() { listeners.forEach((fn) => fn()); }

  /** Delegated handlers every execution gets for free. */
  function wire() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-add]");
      if (a) { add(a.dataset.add); return; }
      const q = e.target.closest("[data-q]");
      if (q) { setQty(q.dataset.id, Number(q.dataset.q)); return; }
      const l = e.target.closest("[data-lang]");
      if (l) { toggleLang(); return; }
    });
  }

  return {
    get lang() { return lang; }, get cart() { return cart; },
    T, nm, count, subtotal, qtyOf, add, setQty, setLang, toggleLang,
    toast, search, list, onRender, emit, wire, $,
  };
})();
