/* ===========================================================================
   UCP RETAIL — shared behaviour
   ---------------------------------------------------------------------------
   The catalogue adapter, the lookup indexes, the product card, and the header
   and footer renderers. Loaded by every page of the RETAIL execution after
   catalogue.js and ucp.js.

   REAL DATA. UCP's own MasterSheet export replaces the placeholder seed:
   3,824 products with their real titles, SKUs and photographs served from
   ucpksa.com's media library.

   Two honest gaps, both left visible in the UI rather than papered over:
     · The export is English-only, so product titles stay English in Arabic
       mode. Only the chrome translates. Arabic titles need a second export
       column — machine-translating 3,824 pharmaceutical names would produce
       confident nonsense on dosages and actives.
     · The export carries NO PRICES. Every figure is a seeded placeholder and
       the ribbon says so.

   Brand, category and pack size are parsed from the title by
   ucp/tools/build-catalogue.mjs — heuristics, not UCP's own taxonomy.
   =========================================================================== */

/* --- catalogue adapter ---------------------------------------------------- */
(function useRealCatalogue() {
  if (typeof CATALOGUE === "undefined") return;

  /** Only used to choose a fallback drawing when a photograph fails to load. */
  const form = (t, size) => {
    const s = (t + " " + (size || "")).toLowerCase();
    if (/lens|lenses/.test(s)) return "lens";
    if (/tab|cap|sg\b|softgel/.test(s)) return "jar";
    if (/tube|cream|gel|paste|ointment/.test(s)) return "tube";
    if (/serum|drops|ampoule|oil/.test(s)) return "dropper";
    if (/spray|deodorant|wash|shampoo|lotion/.test(s)) return "pump";
    if (/box|pack|pcs|pads|diaper|sachet/.test(s)) return "carton";
    if (/monitor|thermo|device|machine/.test(s)) return "device";
    return "bottle";
  };

  UCP.categories = CATALOGUE.categories.map((c) => ({ id:c.id, ar:c.ar, en:c.en, icon:c.icon, n:c.n }));
  /* All brands, so every product resolves to its own. Showing only the largest
     few is a display choice; cutting them from the DATA silently relabels every
     product below the cutoff as whichever brand sorted first. */
  UCP.brands = CATALOGUE.brands.map((b) => ({ id:b.id, ar:b.en, en:b.en, n:b.n }));
  const known = new Set(UCP.brands.map((b) => b.id));

  /* The card prints the brand on its own line, so repeating it at the head of
     the title ("Avent — Avent Scf810/61 Classic Bottle") is noise. The full
     title stays on the record for search and for the image's alt text. */
  const brandName = new Map(UCP.brands.map((b) => [b.id, b.en]));
  const strip = (title, brandId) => {
    const en = brandName.get(brandId);
    if (!en) return title;
    const quoted = en.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
    const out = title.replace(new RegExp("^" + quoted + "[\\s,'’-]*", "i"), "").trim();
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

/* --- indexes --------------------------------------------------------------
   byId() in ucp.js is a linear scan. That is fine for a 24-product seed and
   not fine for 3,824 products filtered on every keystroke, so the two lookups
   the UI performs per card get a Map. */
const PROD = new Map(UCP.products.map((p) => [p.id, p]));
const BRAND = new Map(UCP.brands.map((b) => [b.id, b]));
const CATEG = new Map(UCP.categories.map((c) => [c.id, c]));
const prod = (id) => PROD.get(id);
const brand = (id) => (id ? BRAND.get(id) : null);

/* --- render helpers ------------------------------------------------------- */
const $ = (s) => document.querySelector(s);
const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
const esc2 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/**
 * A real photograph when there is one. The drawn packshot stays as the onerror
 * fallback so a dead URL degrades to a shape rather than to a broken-image
 * glyph — and so the layout can still be reviewed where ucpksa.com is blocked.
 */
function shot(p, opt) {
  if (!p.img) return art(p, { light: true });
  const alt = esc2(p.title || p.en);
  const img = (src, cls) => '<img class="' + cls + '" src="' + src + '" alt="' + alt + '"'
    + ' loading="lazy" decoding="async" onerror="IMGFAIL(this,\'' + p.id + '\')">';
  // 1,241 products carry more than one photograph. Showing the second on hover
  // is what the extra shots are for; without it they are weight in the file.
  const second = (opt && opt.swap === false) ? null : (p.alt && p.alt[0]);
  return img(p.img, "ph") + (second ? img(second, "ph ph2") : "");
}

/** Exposed for the onerror attribute, which cannot close over p. The parent is
    read BEFORE the broken node is removed, or it is null when we need it. */
window.IMGFAIL = (el, id) => {
  const parent = el.parentNode;
  const wasHover = el.classList.contains("ph2");
  el.remove();
  if (wasHover) return;               // a dead hover layer just disappears
  const p = prod(id);
  if (parent && p) parent.insertAdjacentHTML("afterbegin", art(p, { light: true }));
};

function priceBlock(p, L) {
  const cut = !!p.was;
  return '<div class="pr"><span class="now' + (cut ? ' cut' : '') + '">' + priceHTML(p.price, L) + '</span>'
    + (cut ? wasHTML(p.was, L) : '') + '</div>';
}

/** The one component a customer sees a thousand times. It lives here so the
    homepage's card and the listing page's card cannot drift apart. */
function card(p) {
  const L = Shell.lang, T = Shell.T(), b = brand(p.brand);
  const q = Shell.qtyOf(p.id);
  return '<article class="pc">'
    + '<a href="' + (p.href || '#') + '" class="tile">' + shot(p)
      + (p.was ? '<span class="sale">' + T.sale + '</span>' : '')
      + (p.size ? '<span class="sz num">' + esc2(p.size) + '</span>' : '') + '</a>'
    + (b ? '<div class="br">' + Shell.nm(b) + '</div>' : '')
    + '<a href="' + (p.href || '#') + '" class="nm">' + esc2(Shell.nm(p)) + '</a>'
    + priceBlock(p, L)
    + '<button class="add' + (q ? ' ok' : '') + '" data-add="' + p.id + '">'
      + ic(q ? 'check' : 'plus', 15) + '<span>' + (q ? T.added : T.add) + '</span></button>'
    + '</article>';
}

/* --- chrome ---------------------------------------------------------------
   Header, category nav and footer, identical on every page. `activeCat` marks
   the current category in the nav; pass null on pages that have none. */
function renderChrome(activeCat) {
  const L = Shell.lang, T = Shell.T(), n = Shell.nm, ar = L === "ar";

  set('protoTx', ar
    ? 'الأسماء والصور وأرقام الأصناف من كتالوج UCP الفعلي · الأسعار والعروض تجريبية بالكامل'
    : "Names, photographs and SKUs are UCP's real catalogue · every price and offer is placeholder");
  set('annB', ar ? 'توصيل خلال ٦٠ دقيقة داخل الرياض' : 'Delivery in 60 minutes inside Riyadh');
  set('annS', ar ? 'من فروعنا المفتوحة الآن · بيانات النموذج تجريبية' : 'From branches open right now · prototype data');
  set('lgB', T.short); set('lgS', T.tag);
  set('si1', ic('search', 19)); set('si2', ic('search', 19));
  const q1 = $('#q1'), q2 = $('#q2');
  if (q1) q1.placeholder = T.searchPh;
  if (q2) q2.placeholder = T.searchPh;
  const lang = document.querySelector('.lang');
  if (lang) lang.textContent = ar ? 'EN' : 'ع';
  set('acc', ic('user', 21) + '<span>' + T.account + '</span>');
  const c = Shell.count();
  set('crt', ic('cart', 21) + '<span>' + T.cart + '</span>' + (c ? '<i class="cnt num">' + c + '</i>' : ''));

  set('cnav', UCP.categories.map((x) =>
    '<li><a href="e-list.html?cat=' + x.id + '"' + (x.id === activeCat ? ' aria-current="page"' : '')
    + '>' + n(x) + '</a></li>').join(''));

  const cols = [
    [T.ftShop, UCP.categories.slice(0, 5).map(n)],
    [T.ftPharmacy, [T.rx, T.tele, T.pickup, T.vitamins, T.loyalty]],
    [T.ftAbout, [T.brand, ar ? 'فروعنا' : 'Our branches', ar ? 'وظائف' : 'Careers', ar ? 'تواصل معنا' : 'Contact']],
    [T.ftLegal, [ar ? 'الشروط' : 'Terms', ar ? 'الخصوصية' : 'Privacy', ar ? 'الاستبدال' : 'Returns']],
  ];
  set('ftCols',
    '<div class="lead"><img src="../brand/ucp-lockup.png" alt="UCP"><p>' + T.phNote + '</p></div>'
    + cols.map((col) => '<div><h4>' + col[0] + '</h4><ul>'
        + col[1].map((x) => '<li><a href="#">' + x + '</a></li>').join('') + '</ul></div>').join(''));
  set('ftR', '© ' + new Date().getFullYear() + ' ' + T.brand + ' — ' + T.rights);
  set('ftN', T.vat);
}
