/* ===========================================================================
   UCP — WARM BOUTIQUE: shared behaviour
   ---------------------------------------------------------------------------
   Data comes from ../ninja/catalogue.js (UCP's real MasterSheet export — 3,824
   products with real titles, SKUs and photographs) and the helpers from
   ../ninja/ucp.js. Only the presentation is new.

   The handoff renders every product as a flat placeholder block because no
   photography existed when it was made. It does now, so this implementation
   uses the real images in the same containers and aspect ratios the handoff
   specifies, exactly as its "Assets" section asks.
   =========================================================================== */

/* --- catalogue adapter ---------------------------------------------------- */
(function useRealCatalogue() {
  if (typeof CATALOGUE === "undefined") return;
  const form = (t, size) => {
    const s = (t + " " + (size || "")).toLowerCase();
    if (/lens/.test(s)) return "lens";
    if (/tab|cap|sg\b|softgel/.test(s)) return "jar";
    if (/tube|cream|gel|paste|ointment/.test(s)) return "tube";
    if (/serum|drops|ampoule|oil/.test(s)) return "dropper";
    if (/spray|deodorant|wash|shampoo|lotion/.test(s)) return "pump";
    if (/box|pack|pcs|pads|diaper|sachet/.test(s)) return "carton";
    if (/monitor|thermo|device|machine/.test(s)) return "device";
    return "bottle";
  };
  UCP.categories = CATALOGUE.categories.map((c) => ({ id:c.id, ar:c.ar, en:c.en, icon:c.icon, n:c.n }));
  UCP.brands = CATALOGUE.brands.map((b) => ({ id:b.id, ar:b.en, en:b.en, n:b.n }));
  const known = new Set(UCP.brands.map((b) => b.id));
  const brandName = new Map(UCP.brands.map((b) => [b.id, b.en]));
  const strip = (title, id) => {
    const en = brandName.get(id);
    if (!en) return title;
    const q = en.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
    const out = title.replace(new RegExp("^" + q + "[\\s,'’-]*", "i"), "").trim();
    return out.length >= 3 ? out : title;
  };
  UCP.products = CATALOGUE.products.map((p, i) => ({
    id: "s" + p.sku, sku: p.sku,
    brand: known.has(p.brand) ? p.brand : null,
    cat: p.cat, title: p.title,
    ar: strip(p.title, p.brand), en: strip(p.title, p.brand),
    price: p.price, was: p.was, size: p.size || "",
    form: form(p.title, p.size), rank: i + 1, tags: p.was ? ["offer"] : [],
    img: imgUrl(p), alt: (p.gallery || []).map((u) => CATALOGUE.IMG_BASE + u),
    href: pageUrl(p),
  }));
})();

const PROD = new Map(UCP.products.map((p) => [p.id, p]));
const BRAND = new Map(UCP.brands.map((b) => [b.id, b]));
const CATEG = new Map(UCP.categories.map((c) => [c.id, c]));
const prod = (id) => PROD.get(id);
const brand = (id) => (id ? BRAND.get(id) : null);

const $ = (s) => document.querySelector(s);
const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
const esc2 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const pdp = (p) => "product.html?sku=" + encodeURIComponent(p.sku);

/* --- wishlist: the handoff's heart icon, made real ------------------------ */
const wish = new Set();
window.TOGGLE_WISH = (btn, id) => {
  const on = wish.has(id);
  on ? wish.delete(id) : wish.add(id);
  btn.setAttribute("aria-pressed", String(!on));
  btn.textContent = on ? "♡" : "♥";
};

/* --- photography ----------------------------------------------------------
   The handoff's placeholder blocks become real photographs in the same
   containers. A dead URL falls back to a drawn packshot rather than a broken
   image, so the layout survives offline review. */
function shot(p) {
  if (!p.img) return art(p, { light: true });
  return '<img src="' + p.img + '" alt="' + esc2(p.title) + '" loading="lazy" decoding="async"'
    + ' onerror="IMGFAIL(this,\'' + p.id + '\')">';
}
window.IMGFAIL = (el, id) => {
  const parent = el.parentNode;
  el.remove();
  const p = prod(id);
  if (parent && p) parent.insertAdjacentHTML("afterbegin", art(p, { light: true }));
};

const riyal = (n) => '<span class="num">' + n + '</span> ﷼';

/** The handoff's 200px card: square image, wishlist heart, brand, name,
    price + discount pill, full-width pill CTA. */
function pcard(p) {
  const T = Shell.T(), b = brand(p.brand);
  const q = Shell.qtyOf(p.id);
  const off = pct(p.price, p.was);
  return '<article class="pcard">'
    + '<a href="' + pdp(p) + '" class="shot">' + shot(p) + '</a>'
    + '<button class="wish" aria-pressed="false" aria-label="wishlist"'
      + ' onclick="TOGGLE_WISH(this,\'' + p.id + '\')">♡</button>'
    + '<div class="body">'
      + (b ? '<div class="brand">' + esc2(Shell.nm(b)) + '</div>' : '')
      + '<a href="' + pdp(p) + '" class="name">' + esc2(Shell.nm(p)) + '</a>'
      + '<div class="price"><b>' + riyal(p.price) + '</b>'
        + (p.was ? '<s>' + riyal(p.was) + '</s><span class="disc tintchip">'
            + T.off + ' ' + '<span class="num">' + off + '%</span></span>' : '')
      + '</div>'
      + '<button class="add' + (q ? ' ok' : '') + '" data-add="' + p.id + '">'
        + (q ? T.added : T.add) + '</button>'
    + '</div></article>';
}

/* --- shared copy ----------------------------------------------------------
   Strings used by more than one screen. Page-specific copy stays in its page. */
const CHROME_TX = {
  ar: { home:"الرئيسية", search:"البحث", loyalty:"الولاء", cart:"السلة", account:"حسابي",
        proto:"الأسماء والصور من كتالوج UCP الفعلي · الأسعار تجريبية",
        ftShop:"التسوق", ftCare:"خدمات صيدلية", ftAbout:"عن UCP",
        branches:"فروعنا", careers:"وظائف", rights:"جميع الحقوق محفوظة",
        results:"نتيجة", filters:"التصفية", sort:"الترتيب", clear:"مسح الكل",
        qty:"الكمية", subtotal:"المجموع", deliveryFee:"التوصيل", total:"الإجمالي",
        free:"مجاني", empty:"لا توجد نتائج", back:"رجوع" },
  en: { home:"Home", search:"Search", loyalty:"Loyalty", cart:"Cart", account:"Account",
        proto:"Names and photographs are UCP's real catalogue · prices are placeholder",
        ftShop:"Shop", ftCare:"Pharmacy services", ftAbout:"About UCP",
        branches:"Our branches", careers:"Careers", rights:"All rights reserved",
        results:"results", filters:"Filters", sort:"Sort", clear:"Clear all",
        qty:"Quantity", subtotal:"Subtotal", deliveryFee:"Delivery", total:"Total",
        free:"Free", empty:"Nothing found", back:"Back" },
};
const ctx = () => CHROME_TX[Shell.lang];

/**
 * Header, footer and bottom nav — identical on every screen. `active` names
 * the current bottom-nav tab so the orange pill lands on the right one.
 */
function renderChrome(active) {
  const T = Shell.T(), C = ctx(), n = Shell.nm, ar = Shell.lang === "ar";

  set("protoTx", C.proto);
  const lb = document.getElementById("langBtn");
  if (lb) lb.textContent = ar ? "EN" : "ع";
  set("si", ic("search", 17));
  const q = $("#q"); if (q) q.placeholder = T.searchPh;

  set("utility", [[C.account, "#"], [C.loyalty, "loyalty.html"],
                  [T.cart + " (" + Shell.count() + ")", "cart.html"]]
      .map(([l, h]) => '<a href="' + h + '">' + l + '</a>').join('')
    + '<a class="rx" href="prescription.html">' + T.rx + '</a>');

  const cols = [
    [C.ftShop, UCP.categories.slice(0, 5).map((c) => [n(c), "category.html?cat=" + c.id])],
    [C.ftCare, [[T.rx, "prescription.html"], [T.tele, "#"], [T.pickup, "#"],
                [T.vitamins, "#"], [T.loyalty, "loyalty.html"]]],
    [C.ftAbout, [[T.brand, "#"], [C.branches, "#"], [C.careers, "#"]]],
  ];
  set("ftCols", cols.map((c) => '<div><h4>' + c[0] + '</h4><ul>'
      + c[1].map(([l, h]) => '<li><a href="' + h + '">' + l + '</a></li>').join('') + '</ul></div>').join('')
    + '<div class="mark"><img src="ucp-logo-mark.png" alt="UCP"></div>');
  set("ftR", "© " + new Date().getFullYear() + " " + T.brand + " — " + C.rights);
  set("ftN", T.vat);

  set("bnav", [["search", C.search, "search.html"], ["store", C.home, "home.html"],
               ["gift", C.loyalty, "loyalty.html"], ["cart", T.cart, "cart.html"],
               ["user", C.account, "#"]]
    .map(([i, l, h]) => '<a href="' + h + '"' + (l === active ? ' aria-current="page"' : '') + '>'
      + ic(i, 20) + '<span>' + l + '</span></a>').join(''));
}

/** The markup every screen shares, injected so eight pages cannot drift. */
function chromeHTML() {
  return {
    head: '<div class="proto"><span><b>UCP — Warm Boutique</b> · <span id="protoTx"></span></span>'
      + '<button id="langBtn" data-lang>EN</button></div>'
      + '<header class="hd"><div class="wrap hd-in">'
      + '<a href="home.html" class="logo"><img src="ucp-logo-mark.png" alt="UCP"></a>'
      + '<div class="searchbar"><span id="si"></span><input id="q" type="search" autocomplete="off"></div>'
      + '<nav class="utility" id="utility"></nav></div></header>',
    foot: '<footer class="ft"><div class="wrap"><div class="ft-cols" id="ftCols"></div>'
      + '<div class="bot"><span id="ftR"></span><span id="ftN"></span></div></div></footer>'
      + '<nav class="bnav" id="bnav" aria-label="primary"></nav>',
  };
}
function mountChrome() {
  const c = chromeHTML();
  document.body.insertAdjacentHTML("afterbegin", c.head);
  document.body.insertAdjacentHTML("beforeend", c.foot);
}

/* --- cart persistence ------------------------------------------------------
   Shell keeps the basket in memory, which is fine for a one-page prototype and
   wrong for this one: every navigation is a fresh page load, so the basket was
   silently resetting between cart and checkout. sessionStorage (not local)
   because a demo basket should not outlive the tab.

   Wrapped in try/catch throughout: in a private window or with site data
   blocked these throw, and the prototype must still run — it simply forgets
   the basket, which is the pre-existing behaviour. */
const CART_KEY = "ucp.cart.v1";

function saveCart() {
  try { sessionStorage.setItem(CART_KEY, JSON.stringify(Shell.cart)); } catch {}
}
function restoreCart() {
  let raw = [];
  try { raw = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]"); } catch { return false; }
  if (!Array.isArray(raw) || !raw.length) return false;
  /* Push straight into the array rather than calling add() per unit: add()
     raises a toast, and restoring a basket is not an event worth announcing. */
  for (const l of raw) {
    if (!l || !prod(l.id)) continue;
    const q = Math.max(1, Math.min(99, Number(l.q) || 1));
    Shell.cart.push({ id: l.id, q });
  }
  return Shell.cart.length > 0;
}

/** Call once, before setLang(), on every page that shows or changes a basket. */
function initCart(demoIds) {
  const had = restoreCart();
  if (!had && Array.isArray(demoIds)) {
    for (const id of demoIds) if (prod(id)) Shell.cart.push({ id, q: 1 });
  }
  Shell.onRender(saveCart);   // registered first, so it runs on every change
}
