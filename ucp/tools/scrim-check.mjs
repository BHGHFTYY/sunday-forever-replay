/* Sample the ACTUAL rendered pixels behind the hero text and compute the real
   worst-case contrast with white. The DOM auditor composites background-color
   up the ancestor chain, which cannot see an overlay scrim — so for text over
   imagery the only honest check is the rasterised page. */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { stubImages } from "/tmp/claude-0/-home-user-sunday-forever-replay/b93863fc-f926-556b-ad9c-5e5dd2cbffcd/scratchpad/stub.mjs";
import { readFileSync } from "node:fs";

const b = await chromium.launch();
const page = await (await b.newContext({ viewport:{width:1366,height:900}, deviceScaleFactor:1 })).newPage();
await stubImages(page);
await page.goto("process.argv[2] || "http://localhost:3200/editorial/index.html"", { waitUntil:"networkidle" });
await page.waitForTimeout(900);

const boxes = await page.evaluate(() =>
  [".hero h1", ".hero p", ".hero .acts .alt"].map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }).filter(Boolean));

// hide the text, screenshot, then read what sits behind it
await page.addStyleTag({ content: ".hero h1,.hero p,.hero .acts,.hero .chips{visibility:hidden!important}" });
await page.waitForTimeout(200);
await page.screenshot({ path: "hero-bg.png", clip: { x:0, y:0, width:1366, height:900 } });

const px = await page.evaluate(async ({ boxes, dataUri }) => {
  const img = new Image(); img.src = dataUri; await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0);
  const ctx = c.getContext("2d");
  const toLin = (v) => (v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  const lum = (r,g,bb) => 0.2126*toLin(r/255) + 0.7152*toLin(g/255) + 0.0722*toLin(bb/255);
  const out = [];
  for (const bx of boxes) {
    let worst = 99, worstPx = null;
    const d = ctx.getImageData(bx.x, bx.y, Math.max(1,bx.w), Math.max(1,bx.h)).data;
    for (let i = 0; i < d.length; i += 4) {
      const L = lum(d[i], d[i+1], d[i+2]);
      const cr = 1.05 / (L + 0.05);
      if (cr < worst) { worst = cr; worstPx = [d[i], d[i+1], d[i+2]]; }
    }
    out.push({ sel: bx.sel, worst: Number(worst.toFixed(2)), lightestPixel: worstPx });
  }
  return out;
}, { boxes, dataUri: "data:image/png;base64," + readFileSync("hero-bg.png").toString("base64") });

console.log("Worst-case contrast of WHITE text against the real rendered backdrop:\n");
for (const r of px) {
  /* Held to 4.5 across the board, including the 52px headline that WCAG would
     let pass at 3 — the margin is what survives a brighter photograph. */
  const need = 4.5;
  console.log(`  ${r.worst >= need ? "PASS" : "FAIL"}  ${String(r.worst).padStart(6)}:1`
    + `  (needs ${need})  ${r.sel}   lightest pixel rgb(${r.lightestPixel})`);
}
await b.close();
