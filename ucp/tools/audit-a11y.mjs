/* ===========================================================================
   Walk a rendered page and check the contrast of every visible text node
   against the background it ACTUALLY sits on.
   ---------------------------------------------------------------------------
   Token math proves the palette is sound. This proves the pages use it — it
   catches an element that inherited the wrong colour, or sits on a surface
   nobody thought about. Thresholds follow WCAG 2.1: 4.5:1 normally, 3:1 for
   large text (>=24px, or >=18.66px bold).

   Run: node ucp/tools/audit-a11y.mjs <url> [url...]
   =========================================================================== */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const urls = process.argv.slice(2);
if (!urls.length) { console.error("usage: audit-a11y.mjs <url> [url...]"); process.exit(2); }

const browser = await chromium.launch();
let totalFail = 0;

for (const url of urls) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
  const page = await ctx.newPage();
  // product photography is blocked in this environment and is irrelevant here
  await page.route("**ucpksa.com/**", (r) => r.fulfill({ status: 200, contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ccc"/></svg>' }));
  await page.goto(url, { waitUntil: "networkidle" });
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(600);

  const findings = await page.evaluate(() => {
    const toLin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => 0.2126 * toLin(r / 255) + 0.7152 * toLin(g / 255) + 0.0722 * toLin(b / 255);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

    /** Composite up the ancestor chain until an opaque background is found. */
    function bgOf(el) {
      let n = el;
      while (n && n !== document.documentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] >= 0.95)) return c.slice(0, 3);
        n = n.parentElement;
      }
      return [255, 255, 255];
    }

    const out = [];
    const seen = new Set();
    for (const el of document.querySelectorAll("body *")) {
      if (seen.has(el)) continue;
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.nodeValue.trim()).join(" ").trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.1) continue;
      /* Text sitting over imagery behind a scrim cannot be judged from the DOM:
         compositing background-color up the ancestor chain cannot see an
         overlay. Such elements opt out here and are checked against the
         RASTERISED page instead (ucp/tools/scrim-check.mjs), which is the only
         honest measurement for them. */
      if (el.closest("[data-scrim-verified]")) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      const fg = parse(cs.color).slice(0, 3);
      const bg = bgOf(el);
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const v = ratio(fg, bg);
      if (v + 0.005 < need) {
        out.push({ text: text.slice(0, 46), cls: el.className?.toString().slice(0, 34) || el.tagName,
                   size, weight, ratio: Number(v.toFixed(2)), need });
      }
      seen.add(el);
    }
    return out;
  });

  const name = url.split("/").pop();
  if (!findings.length) console.log(`  PASS  ${name} — every visible text node meets AA`);
  else {
    totalFail += findings.length;
    console.log(`  FAIL  ${name} — ${findings.length} element(s) below threshold`);
    /* One broken rule usually hits dozens of nodes; collapse them so the
       report names distinct problems rather than repeating one 36 times. */
    const groups = new Map();
    for (const f of findings) {
      const k = `${f.ratio}|${f.need}|${f.size}|${f.weight}|${f.cls}`;
      if (!groups.has(k)) groups.set(k, { ...f, n: 0 });
      groups.get(k).n++;
    }
    for (const f of groups.values())
      console.log(`         ${String(f.ratio).padStart(5)}:1 (needs ${f.need})  ${f.size}px/${f.weight}`
        + `  .${f.cls}  "${f.text}"${f.n > 1 ? `  x${f.n}` : ""}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(totalFail ? 1 : 0);
