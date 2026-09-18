/* ===========================================================================
   Build the prototype catalogue from UCP's own MasterSheet export.
   ---------------------------------------------------------------------------
   The export carries four columns — post_title, sku, images, product_page_url.
   It has no categories, no brands, no pack sizes and NO PRICES. Everything
   below is derived from the titles, and the derivation is kept here rather
   than baked into the data file so it can be corrected and re-run.

   PRICES ARE NOT IN THE EXPORT. They are generated as clearly-labelled
   placeholders so the layout can be judged; nothing here should be shown to a
   customer as a UCP price.

   Run:  node ucp/tools/build-catalogue.mjs
   =========================================================================== */
import { readFileSync, writeFileSync } from "node:fs";

const CSV = new URL("../data/mastersheet-8-13.csv", import.meta.url);
const OUT = new URL("../design/ninja/catalogue.js", import.meta.url);

/* --- RFC4180 ------------------------------------------------------------- */
function parseCsv(t) {
  const rows = []; let f = "", r = [], q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { r.push(f); f = ""; }
    else if (c === "\n") { r.push(f); rows.push(r); r = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f.length || r.length) { r.push(f); rows.push(r); }
  return rows;
}

/* --- brands --------------------------------------------------------------
   Multi-word brands are listed explicitly because a leading-token heuristic
   turns "La Roche-Posay" into "La" and "The Ordinary" into "The". */
const MULTI = [
  ["la roche", "La Roche-Posay"], ["the ordinary", "The Ordinary"], ["baby joy", "Baby Joy"],
  ["beauty of", "Beauty of Joseon"], ["some by", "Some By Mi"], ["oral b", "Oral-B"],
  ["oral-b", "Oral-B"], ["l'oreal paris", "L'Oréal Paris"], ["pert plus", "Pert Plus"],
  ["i'm sorry", "I'm Sorry For My Skin"], ["amara color", "Amara"], ["head &", "Head & Shoulders"],
  ["head and", "Head & Shoulders"], ["johnson's", "Johnson's"], ["secret key", "Secret Key"],
  ["accu chek", "Accu-Chek"], ["accu-chek", "Accu-Chek"], ["nature's bounty", "Nature's Bounty"],
];
const RENAME = {
  loreal: "L'Oréal", "l'oreal": "L'Oréal", johnson: "Johnson's", acm: "ACM", nyx: "NYX",
  qv: "QV", bigen: "Bigen", kerastase: "Kérastase", "kérastase": "Kérastase",
};
const TITLE = (s) => s.split(/\s+/).map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");

/* --- brand -> category, the highest-precision signal we have -------------- */
const BRAND_CAT = {
  flormar:"makeup", essence:"makeup", nyx:"makeup", loca:"makeup", bolver:"makeup",
  pixi:"makeup", divina:"makeup", blover:"makeup", maybelline:"makeup", catrice:"makeup",
  koleston:"hair", schwarzkopf:"hair", bigen:"hair", "kérastase":"hair", kerastase:"hair",
  "pert plus":"hair", wella:"hair", cantu:"hair", olia:"hair",
  jamieson:"vitamins", solgar:"vitamins", centrum:"vitamins", marnys:"vitamins", limitless:"vitamins",
  cerave:"face", "la roche-posay":"face", bioderma:"face", eucerin:"face", "avène":"face",
  avene:"face", cetaphil:"face", filorga:"face", medicube:"face", "beauty of joseon":"face",
  "some by mi":"face", "secret key":"face", "i'm sorry for my skin":"face", acm:"face",
  avent:"baby", pampers:"baby", "baby joy":"baby", cerelac:"baby", huggies:"baby", sanita:"baby",
  durex:"feminine", always:"feminine", kotex:"feminine", freshdays:"feminine", astroglide:"feminine",
  lensme:"lenses", acuvue:"lenses", freshlook:"lenses", bella:"lenses",
  sensodyne:"oral", colgate:"oral", listerine:"oral", signal:"oral", "oral-b":"oral",
  omron:"devices", "accu-chek":"devices", verona:"devices",
  gillette:"body", dove:"body", vaseline:"body", dettol:"body", beesline:"body", qv:"body",
  rexona:"body", axe:"body", feather:"body", glysolid:"body", "palmer's":"body", palmers:"body",
  sofy:"feminine", carefree:"feminine", fam:"feminine", private:"feminine", nana:"feminine",
  pigeon:"baby", blemil:"baby", aptamil:"baby", nan:"baby", bebelac:"baby",
  sunsilk:"hair", pantene:"hair", tresemme:"hair", sunsilk_:"hair", minoxil:"hair",
  strepsils:"medicine", panadol:"medicine", tresiba:"medicine", lantus:"medicine",
  marvis:"oral", uriage:"face", isispharma:"face", centella:"face", eyenlip:"face",
  "farm stay":"face", "nature report":"face", "glow recipe":"face", olivian:"face",
  mavala:"makeup", "now":"vitamins", "nature's bounty":"vitamins",
};

/* --- keyword fallback, ordered most-specific first ------------------------ */
const CATS = {
  lenses:["contact lens","lens solution"," lenses","soft lens","colored lens"],
  baby:["baby","diaper","infant","soother","teat","nipple","wipes","formula milk","cereal","culotte","pacifier","stroller"],
  oral:["toothpaste","tooth paste","toothbrush","mouthwash","mouth wash","floss","denture","whitening strips"],
  makeup:["lipstick","mascara","foundation","concealer","eyeliner","eye liner","eyeshadow","eye shadow","blush","compact powder","nail polish","lip gloss","lip balm","primer","bb cream","cc cream","brush","highlighter","setting spray","kohl","brow"],
  feminine:["feminine","sanitary","pantyliner","panty liner","tampon","intimate","pregnancy test","lubricant","condom","maxi pads","napkins"],
  devices:["thermometer","blood pressure","nebul","glucose","oximeter","syringe","bandage","gauze","gloves","crutch","wheelchair","adhesive pad","eye pad","first aid","cold pack","support belt"],
  vitamins:["vitamin","omega","calcium","iron ","zinc","magnesium","collagen","probiotic","multivit","folic","biotin","supplement","softgel","cod liver","melatonin","sg\\b","effervescent","eff.salt","sweetner","sweetener"],
  hair:["shampoo","conditioner","hair","dye","keratin","scalp","dandruff","blond","brunette","hena","henna","masque","beard color"],
  face:["facial","cleanser","moisturis","moisturiz","serum","spf","sunscreen","sun block","toner","micellar","acne","eye contour","eye cream","face wash","cleansing foam","peeling","mask sheet","whitening cream"],
  body:["body","lotion","shower","soap","deodorant","antiperspirant","roll on","roll-on","hand cream","foot","scrub","bath","razor","blade","shaving","hair removal","depilat","talc","powder ","perfume","cologne","edp","edt"],
  medicine:["tablet","tab\\b","capsule","cap\\b","syrup","suspension","injection","ampoule","sachet","mg\\b","suppositor","drops","inhaler","ointment","antibiotic","cream 15","gel 30","spray nasal","nasal"],
};
const ORDER = ["lenses","baby","oral","makeup","feminine","devices","vitamins","hair","face","body","medicine"];

/* Weak signals: a form word alone ("cream", "gel") says little, so these are
   consulted last and only to keep a real product out of the "other" bin. */
const WEAK = {
  medicine:[/\d+\s*mg\b/i, /\b\d+\s*tabs?\b/i, /\boad\b/i, /sterile/i, /ophthalmi/i,
            /insulin/i, /flextouch/i, /\bsupp\b/i, /\biu\b/i],
  feminine:[/\bpads?\b/i, /\bliners?\b/i, /napkin/i],
  devices:[/support\b/i, /compress/i, /clipper/i, /tweezer/i, /scissor/i, /\bbelt\b/i],
  baby:[/\bformula\b/i, /\bmilk powder\b/i],
  hair:[/minoxi/i, /\bwax\b/i],
  face:[/\bmask\b/i, /essence/i, /\bpatch(es)?\b/i, /toning/i, /rose water/i, /\bampoule\b/i,
        /\bserum\b/i, /hydrogel/i, /\bglow\b/i, /\bcream\b/i, /\bgel\b/i],
  body:[/\boil\b/i, /\bbalm\b/i, /\bbutter\b/i, /\bspray\b/i],
};
const WEAK_ORDER = ["medicine","feminine","devices","baby","hair","face","body"];

const CAT_META = {
  face:    { ar:"الوجه",                en:"Face" },
  hair:    { ar:"الشعر",                en:"Hair" },
  body:    { ar:"الجسم والعناية",        en:"Body & Care" },
  feminine:{ ar:"العناية الأنثوية",      en:"Feminine Care" },
  lenses:  { ar:"العدسات",              en:"Lenses" },
  oral:    { ar:"العناية بالفم",         en:"Oral Care" },
  vitamins:{ ar:"الفيتامينات والمكملات", en:"Vitamins & Supplements" },
  baby:    { ar:"الأم والطفل",           en:"Mother & Baby" },
  devices: { ar:"الأجهزة والمستلزمات",   en:"Devices & Supplies" },
  medicine:{ ar:"الأدوية",              en:"Medicines" },
  makeup:  { ar:"المكياج",              en:"Makeup" },
  other:   { ar:"منتجات أخرى",          en:"Other" },
};
const CAT_ICON = { face:"face",hair:"hair",body:"body",feminine:"feminine",lenses:"lens",oral:"oral",
  vitamins:"vitamin",baby:"baby",devices:"device",medicine:"pill",makeup:"makeup",other:"store" };

const SIZE = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|gm|kg|mg|tabs?|tablets?|caps?|capsules?|pcs?|pieces?|sachets?|lens(?:es)?|diapers?|sg|softgels?|odf|sticks?)\b/i;

function brandOf(title) {
  const low = " " + title.toLowerCase().replace(/\s+/g, " ") + " ";
  for (const [k, v] of MULTI) if (low.startsWith(" " + k)) return v;
  const w = title.trim().split(/\s+/)[0].replace(/[^A-Za-z'&.\-é]/g, "");
  if (!w || w.length < 2) return null;
  const k = w.toLowerCase();
  return RENAME[k] || TITLE(w);
}
function catOf(title, brand) {
  const b = (brand || "").toLowerCase();
  if (BRAND_CAT[b]) return BRAND_CAT[b];
  const t = " " + title.toLowerCase() + " ";
  for (const c of ORDER) for (const k of CATS[c]) {
    if (k.endsWith("\\b") ? new RegExp("\\b" + k).test(t) : t.includes(k)) return c;
  }
  for (const c of WEAK_ORDER) for (const re of WEAK[c]) if (re.test(t)) return c;
  return "other";
}
function sizeOf(title) {
  const m = SIZE.exec(title);
  if (!m) return null;
  const n = m[1].replace(",", ".");
  const u = m[2].toLowerCase().replace(/^tablets?$/, "tab").replace(/^capsules?$/, "cap")
    .replace(/^pieces?$/, "pcs").replace(/^gm$/, "g").replace(/^softgels?$/, "sg");
  return n + " " + u;
}
const ENT = { amp:"&", quot:'"', apos:"'", lt:"<", gt:">", nbsp:" ", "#039":"'", "#8211":"–", "#8217":"'" };
function decodeEntities(s) {
  return s.replace(/&([a-z]+|#\d+);/gi, (m, k) => ENT[k.toLowerCase()] ?? ENT[k] ?? m);
}

/* The images column is a gallery, not one link: entries separated by "|",
   each "URL ! alt : … ! title : … ! desc : … ! caption :".
   1,242 of 3,828 rows carry more than one. */
function gallery(cell) {
  return cell.split("|").map((entry) => {
    const parts = entry.split(" ! ");
    const url = (parts[0] || "").trim();
    if (!/^https?:\/\//.test(url)) return null;
    const meta = {};
    for (const p of parts.slice(1)) {
      const i = p.indexOf(":");
      if (i > 0) meta[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim();
    }
    return { url, alt: meta.alt || "" };
  }).filter(Boolean);
}

const GENERIC = [/^test/i, /^image[-_]?\d*\./i, /^download/i, /^shopping/i, /^untitled/i,
                 /^unnamed/i, /^default/i, /^placeholder/i, /^photo[-_]?\d*\./i, /^img[-_]?\d*\./i];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Pick the primary shot rather than trusting position. Position 0 is wrong
 * often enough to matter: "PREMIUM PACKAGE HAJJ" leads with an image whose own
 * alt text says "PROTECTIVE PACKAGE HAJJ" — a different product entirely.
 *
 * The alt text is the strongest signal because WordPress writes it from the
 * product the image was attached to, so a mismatch is a genuine mis-attachment.
 */
function pickPrimary(imgs, title) {
  if (imgs.length <= 1) return 0;
  const want = new Set(slug(title).split(" ").filter((w) => w.length > 2));
  let best = 0, bestScore = -Infinity;
  imgs.forEach((im, i) => {
    const file = im.url.split("/").pop();
    let score = -i * 0.5;                                   // position breaks ties only
    const altWords = new Set(slug(im.alt).split(" ").filter((w) => w.length > 2));
    let overlap = 0;
    for (const w of want) if (altWords.has(w)) overlap++;
    if (want.size) score += (overlap / want.size) * 6;      // alt agrees with the title
    if (GENERIC.some((re) => re.test(file))) score -= 5;    // auto-named upload
    const fileWords = new Set(slug(file).split(" "));
    for (const w of want) if (fileWords.has(w)) { score += 1.5; break; }
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

/* Deterministic PLACEHOLDER price. Not UCP's pricing — the export has none.
   Seeded from the SKU so a product keeps the same figure between runs. */
function seeded(sku) { let h = 2166136261; const s = String(sku);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h); }
function placeholderPrice(sku, cat) {
  const band = { medicine:[12,90], vitamins:[35,190], face:[45,320], hair:[25,180], body:[15,120],
    makeup:[20,150], baby:[18,160], oral:[15,110], lenses:[45,260], feminine:[12,90],
    devices:[35,480], other:[15,140] }[cat] || [15,140];
  const h = seeded(sku);
  const v = band[0] + (h % (band[1] - band[0]));
  return Math.max(5, Math.round(v));
}

/* --- build ---------------------------------------------------------------- */
const IMG_BASE = "https://ucpksa.com/wp-content/uploads/";
const URL_BASE = "https://ucpksa.com/shop/";
let MOVED = 0;
const rows = parseCsv(readFileSync(CSV, "utf8")).slice(1).filter((r) => r.length >= 4 && r[0].trim());
const products = [];
const brandCount = new Map();

for (const r of rows) {
  const title = decodeEntities(r[0]).replace(/\s+/g, " ").trim();
  const sku = r[1].trim();
  const imgs = gallery(r[2] || "");
  const primary = imgs.length ? pickPrimary(imgs, title) : -1;
  if (primary > 0) MOVED++;
  const img = primary >= 0 ? imgs[primary].url : null;
  const url = (r[3] || "").trim();
  if (!img) continue;                    // 4 rows carry no image; they cannot be shown
  const brand = brandOf(title);
  const cat = catOf(title, brand);
  const rel = (u) => (u.startsWith(IMG_BASE) ? u.slice(IMG_BASE.length) : u);
  const rest = imgs.filter((_, i) => i !== primary).map((im) => rel(im.url));
  products.push({ sku, title, brand, cat, size: sizeOf(title),
                  gallery: rest.length ? rest : undefined,
                  img: rel(img),
                  url: url.startsWith(URL_BASE) ? url.slice(URL_BASE.length) : url,
                  price: placeholderPrice(sku, cat) });
  if (brand) brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
}

/* A promotion applies to about a fifth of the catalogue — a believable rate,
   and deterministic so it does not churn between runs. */
for (const p of products) {
  const h = seeded(p.sku + "x");
  p.was = (h % 100) < 21 ? Math.round(p.price * (1.12 + (h % 23) / 100)) : null;
}

/* EVERY brand is kept, not just the frequent ones: a product whose brand is
   missing from this list has nowhere to resolve to and gets mislabelled as
   whichever brand happens to sort first. `n` carries the count so the UI can
   show the largest few without the data lying about the rest. */
const brands = [...brandCount.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([en, n]) => ({ id: en.toLowerCase().replace(/[^a-z0-9]+/g, "-"), en, n }));
const brandIds = new Map(brands.map((b) => [b.en, b.id]));
for (const p of products) p.brand = brandIds.get(p.brand) || null;

const catCount = {};
for (const p of products) catCount[p.cat] = (catCount[p.cat] || 0) + 1;
const categories = Object.keys(CAT_META).filter((c) => catCount[c])
  .map((c) => ({ id: c, ...CAT_META[c], icon: CAT_ICON[c], n: catCount[c] }))
  .sort((a, b) => b.n - a.n);

const out = `/* GENERATED by ucp/tools/build-catalogue.mjs — do not edit by hand.
   Source: UCP MasterSheet 8-13 export (ucp/data/mastersheet-8-13.csv).

   REAL:        product titles, SKUs, image URLs and product page URLs.
   DERIVED:     brand, category and pack size, parsed from the title.
   PLACEHOLDER: every price and every discount. The export contains no
                pricing whatsoever. These figures are seeded from the SKU so
                they are stable between runs, and they are not UCP's prices.
   ${products.length} products · ${brands.length} brands · ${categories.length} categories
*/
const CAT = ${JSON.stringify(categories)};
const BRD = ${JSON.stringify(brands)};
const PRD = ${JSON.stringify(products)};
const IMG_BASE = "https://ucpksa.com/wp-content/uploads/";
const URL_BASE = "https://ucpksa.com/shop/";
const CATALOGUE = { categories: CAT, brands: BRD, products: PRD, IMG_BASE, URL_BASE,
  meta: { source: "MasterSheet 8-13", pricesArePlaceholder: true } };
/** Product photograph, served from UCP's own media library. */
function imgUrl(p) { return /^https?:/.test(p.img) ? p.img : IMG_BASE + p.img; }
function pageUrl(p) { return /^https?:/.test(p.url) ? p.url : URL_BASE + p.url; }
`;
writeFileSync(OUT, out);

console.log(`products      ${products.length}`);
console.log(`brands        ${brands.length}   top: ${brands.slice(0,12).map(b=>b.en+"("+b.n+")").join(", ")}`);
console.log(`categories    ${categories.map(c=>c.id+":"+c.n).join("  ")}`);
console.log(`unclassified  ${catCount.other||0} (${Math.round((catCount.other||0)/products.length*100)}%)`);
const repicked = products.filter(p => p.gallery).length;
console.log(`primary moved ${MOVED} time(s) off position 0 by the alt-text check`);
const shots = products.reduce((n, p) => n + 1 + (p.gallery ? p.gallery.length : 0), 0);
console.log(`photographs   ${shots} across ${products.length} products; ${repicked} have a gallery`);
console.log(`sizes parsed  ${products.filter(p=>p.size).length} (${Math.round(products.filter(p=>p.size).length/products.length*100)}%)`);
console.log(`on promotion  ${products.filter(p=>p.was).length} (${Math.round(products.filter(p=>p.was).length/products.length*100)}%)`);
console.log(`output        ${(out.length/1024).toFixed(0)} KB`);
