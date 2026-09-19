/* ===========================================================================
   UCP — EDITORIAL: shared behaviour
   ---------------------------------------------------------------------------
   Catalogue adapter, lookups, the product tile, and the header/footer chrome.
   Loaded by every screen after catalogue.js and ucp.js.

   Data is UCP's real MasterSheet export: 3,824 products with their own titles,
   SKUs and photographs. Prices are placeholder — the export has none.
   =========================================================================== */

(function useRealCatalogue() {
  if (typeof CATALOGUE === "undefined") return;
  const form = (t, s) => {
    const x = (t + " " + (s || "")).toLowerCase();
    if (/lens/.test(x)) return "lens";
    if (/tab|cap|sg\b|softgel/.test(x)) return "jar";
    if (/tube|cream|gel|paste|ointment/.test(x)) return "tube";
    if (/serum|drops|ampoule|oil/.test(x)) return "dropper";
    if (/spray|deodorant|wash|shampoo|lotion/.test(x)) return "pump";
    if (/box|pack|pcs|pads|diaper|sachet/.test(x)) return "carton";
    if (/monitor|thermo|device|machine/.test(x)) return "device";
    return "bottle";
  };
  UCP.categories = CATALOGUE.categories.map((c) => ({ id:c.id, ar:c.ar, en:c.en, icon:c.icon, n:c.n }));
  UCP.brands = CATALOGUE.brands.map((b) => ({ id:b.id, ar:b.en, en:b.en, n:b.n }));
  const known = new Set(UCP.brands.map((b) => b.id));
  const bn = new Map(UCP.brands.map((b) => [b.id, b.en]));
  const strip = (t, id) => {
    const en = bn.get(id); if (!en) return t;
    const q = en.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
    const o = t.replace(new RegExp("^" + q + "[\\s,'’-]*", "i"), "").trim();
    return o.length >= 3 ? o : t;
  };
  UCP.products = CATALOGUE.products.map((p, i) => ({
    id:"s"+p.sku, sku:p.sku, brand: known.has(p.brand) ? p.brand : null,
    cat:p.cat, title:p.title, ar:strip(p.title,p.brand), en:strip(p.title,p.brand),
    price:p.price, was:p.was, size:p.size || "", form:form(p.title,p.size),
    rank:i+1, tags:p.was?["offer"]:[],
    img:imgUrl(p), alt:(p.gallery||[]).map((u)=>CATALOGUE.IMG_BASE+u),
  }));
})();

const PROD = new Map(UCP.products.map((p) => [p.id, p]));
const BRANDS = new Map(UCP.brands.map((b) => [b.id, b]));
const CATEG = new Map(UCP.categories.map((c) => [c.id, c]));
const prod = (id) => PROD.get(id);
const brand = (id) => (id ? BRANDS.get(id) : null);

const $ = (s) => document.querySelector(s);
const set = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
const esc2 = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const riyal = (n) => '<span class="num">' + n + '</span> ﷼';
const pdp = (p) => "product.html?sku=" + encodeURIComponent(p.sku);

function shot(p) {
  if (!p.img) return art(p, { light:true });
  return '<img src="' + p.img + '" alt="' + esc2(p.title) + '" loading="lazy" decoding="async"'
    + ' onerror="IMGFAIL(this,\'' + p.id + '\')">';
}
window.IMGFAIL = (el, id) => {
  const parent = el.parentNode; el.remove();
  const p = prod(id);
  if (parent && p) parent.insertAdjacentHTML("afterbegin", art(p, { light:true }));
};

/** The product tile. Its parts are <span>s inside an <a>, so editorial.css
    forces them block — without that the brand and name render on one run. */
function ptile(p) {
  const b = brand(p.brand);
  return '<a class="ptile" href="' + pdp(p) + '"><span class="im">' + shot(p) + '</span>'
    + (b ? '<span class="b">' + esc2(Shell.nm(b)) + '</span>' : '')
    + '<span class="t">' + esc2(Shell.nm(p)) + '</span>'
    + '<span class="p">' + (p.was ? '<span class="dot"></span>' : '') + riyal(p.price)
    + (p.was ? '<s>' + riyal(p.was) + '</s>' : '') + '</span></a>';
}

/* --- shared copy ----------------------------------------------------------- */
const CTX = {
  ar: { proto:"الأسماء والصور من كتالوج UCP الفعلي · الأسعار تجريبية",
        nav:[["تسوّق","category.html"],["الأدوية","category.html?cat=medicine"],
             ["العناية","category.html?cat=face"],["خدماتنا","prescription.html"]],
        search:"بحث", cart:"السلة", account:"حسابي",
        ftShop:"التسوق", ftCare:"خدمات صيدلية", ftAbout:"عن UCP",
        branches:"فروعنا", contact:"تواصل معنا",
        rights:"جميع الحقوق محفوظة", vat:"الأسعار شاملة الضريبة",
        results:"نتيجة", all:"كل المنتجات", clear:"مسح الكل", empty:"لا توجد نتائج",
        subtotal:"المجموع", delivery:"التوصيل", total:"الإجمالي", free:"مجاني",
        qty:"الكمية", back:"رجوع", slotTag:"غير متوفر في هذا النموذج" },
  en: { proto:"Names and photographs are UCP's real catalogue · prices are placeholder",
        nav:[["Shop","category.html"],["Medicines","category.html?cat=medicine"],
             ["Care","category.html?cat=face"],["Services","prescription.html"]],
        search:"Search", cart:"Cart", account:"Account",
        ftShop:"Shop", ftCare:"Pharmacy services", ftAbout:"About UCP",
        branches:"Our branches", contact:"Contact",
        rights:"All rights reserved", vat:"Prices include VAT",
        results:"results", all:"All products", clear:"Clear all", empty:"Nothing found",
        subtotal:"Subtotal", delivery:"Delivery", total:"Total", free:"Free",
        qty:"Quantity", back:"Back", slotTag:"Not in this prototype" },
};
const ctx = () => CTX[Shell.lang];

function mountChrome() {
  const c = ctx();
  document.body.insertAdjacentHTML("afterbegin",
    '<div class="proto"><span><b>UCP — EDITORIAL</b> · <span id="protoTx"></span></span>'
    + '<button id="langBtn" data-lang>EN</button></div>'
    + '<header class="hd"><div class="wrap hd-in">'
    + '<a href="index.html" class="logo"><img src="ucp-logo-mark.png" alt="UCP"></a>'
    + '<nav id="topnav"></nav><div class="right">'
    + '<a href="search.html" class="sbtn" id="sbtn"></a>'
    + '<a href="cart.html" id="cartLink"></a><a href="#" id="accLink"></a>'
    + '</div></div></header>');
  document.body.insertAdjacentHTML("beforeend",
    '<footer class="ft"><div class="wrap"><div class="ft-cols" id="ftCols"></div>'
    + '<div class="bot"><span id="ftR"></span><span id="ftN"></span></div></div></footer>');
}

function renderChrome() {
  const T = Shell.T(), C = ctx(), n = Shell.nm, ar = Shell.lang === "ar";
  set("protoTx", C.proto);
  const lb = document.getElementById("langBtn");
  if (lb) lb.textContent = ar ? "EN" : "ع";
  set("topnav", C.nav.map(([l, h]) => '<a href="' + h + '">' + l + '</a>').join(''));
  set("sbtn", ic("search", 15) + ' <span>' + C.search + '</span>');
  set("cartLink", C.cart + ' (<span class="num">' + Shell.count() + '</span>)');
  set("accLink", C.account);

  const cols = [
    [C.ftShop, UCP.categories.slice(0, 5).map((c) => [n(c), "category.html?cat=" + c.id])],
    [C.ftCare, [[T.rx, "prescription.html"], [T.tele, "#"], [T.pickup, "#"], [T.loyalty, "loyalty.html"]]],
    [C.ftAbout, [[T.brand, "#"], [C.branches, "#"], [C.contact, "#"]]],
  ];
  set("ftCols",
    '<div class="lead"><img src="ucp-logo-mark.png" alt="UCP">'
    + '<p style="font-size:13px;color:var(--muted);max-width:34ch">' + T.phNote + '</p></div>'
    + cols.map((c) => '<div><h4>' + c[0] + '</h4><ul>'
      + c[1].map(([l, h]) => '<li><a href="' + h + '">' + l + '</a></li>').join('') + '</ul></div>').join(''));
  set("ftR", "© " + new Date().getFullYear() + " " + T.brand + " — " + C.rights);
  set("ftN", C.vat);
}

/* --- cart persistence ------------------------------------------------------
   Each screen is a real page load, so an in-memory basket silently resets
   between cart and checkout. sessionStorage, not local: a demo basket should
   not outlive the tab. try/catch throughout — a private window must still run,
   it simply forgets. */
const CART_KEY = "ucp.ed.cart.v1";
function saveCart() { try { sessionStorage.setItem(CART_KEY, JSON.stringify(Shell.cart)); } catch {} }
function initCart(demo) {
  let raw = [];
  try { raw = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]"); } catch {}
  if (Array.isArray(raw) && raw.length) {
    for (const l of raw) {
      if (!l || !prod(l.id)) continue;
      Shell.cart.push({ id: l.id, q: Math.max(1, Math.min(99, Number(l.q) || 1)) });
    }
  } else if (Array.isArray(demo)) {
    for (const id of demo) if (prod(id)) Shell.cart.push({ id, q: 1 });
  }
  Shell.onRender(saveCart);
}
