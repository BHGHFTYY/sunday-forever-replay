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
