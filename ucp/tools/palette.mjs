/* ===========================================================================
   Derive UCP's accessible orange scale.
   ---------------------------------------------------------------------------
   Darkening a colour by multiplying its channels toward black also drains its
   chroma, which is why "make it pass contrast" usually produces something
   muddy. This searches OKLCH instead: it holds the brand HUE fixed, and for
   every lightness finds the MOST SATURATED in-gamut colour at that lightness.
   The answer is the punchiest orange that still clears the ratio.

   WCAG thresholds are role-dependent, and that is the whole trick:
     4.5:1  normal text (<24px, or <18.66px bold)
     3.0:1  large text (>=24px, or >=18.66px bold) AND non-text UI boundaries
     none   a fill, as long as whatever sits ON it passes

   So the brand's vivid orange stays exactly as it is wherever it is a FILL or
   a large shape. Only the steps that must carry small text get darker.

   Run: node ucp/tools/palette.mjs
   =========================================================================== */

/* --- sRGB <-> OKLab (Björn Ottosson) -------------------------------------- */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
}
const rgbToHex = (rgb) =>
  "#" + rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("");

function rgbToOklch([r, g, b]) {
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return [L, Math.hypot(A, Bb), (Math.atan2(Bb, A) * 180) / Math.PI];
}

function oklchToRgb([L, C, h]) {
  const hr = (h * Math.PI) / 180;
  const A = C * Math.cos(hr), B = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.2914855480 * B;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    toSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}
const inGamut = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

/* --- contrast -------------------------------------------------------------- */
const lumRgb = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
const lumHex = (hex) => lumRgb(hexToRgb(hex));
const contrast = (a, b) => { const [x, y] = [a, b].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Highest chroma that is still in gamut at this lightness and hue. */
function maxChroma(L, h) {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgb([L, mid, h]))) lo = mid; else hi = mid;
  }
  return lo;
}

/**
 * The most saturated colour on the brand hue that reaches `ratio` against
 * `bg`, searched from the light end so we darken as little as possible.
 */
function mostVivid(hue, bgHex, ratio) {
  const bg = lumHex(bgHex);
  let best = null;
  for (let L = 0.95; L >= 0.05; L -= 0.001) {
    const C = maxChroma(L, hue);
    const rgb = oklchToRgb([L, C, hue]);
    if (contrast(lumRgb(rgb), bg) >= ratio) { best = { L, C, hex: rgbToHex(rgb) }; break; }
  }
  return best;
}

const BRAND = "#FF7A00";
const [, , HUE] = rgbToOklch(hexToRgb(BRAND));
const CREAM = "#FBF3EC", TINT = "#FDE7D3", WHITE = "#FFFFFF", TAN = "#F3E9DE", INK = "#2B2420";
const cr = (a, b) => contrast(lumHex(a), lumHex(b));

console.log(`UCP orange ${BRAND} -> OKLCH hue ${HUE.toFixed(1)}°\n`);

console.log("THE FILL — unchanged. A background carries no ratio of its own.");
console.log(`  ${BRAND}   ink label  ${cr(INK, BRAND).toFixed(2)}:1  PASS`);
console.log(`  ${BRAND}   white label ${cr(WHITE, BRAND).toFixed(2)}:1  fail\n`);

console.log("IF WHITE MUST STAY ON THE CTA — the brightest orange that allows it:");
const whiteCta = mostVivid(HUE, WHITE, 4.5);
console.log(`  ${whiteCta.hex}  (L ${whiteCta.L.toFixed(3)}, C ${whiteCta.C.toFixed(3)})  ${cr(WHITE, whiteCta.hex).toFixed(2)}:1\n`);

console.log("TEXT STEPS — most saturated orange that is legible as small text:");
for (const [name, bg] of [["on cream", CREAM], ["on white card", WHITE], ["on tint chip", TINT], ["on tan", TAN]]) {
  const v = mostVivid(HUE, bg, 4.5);
  console.log(`  ${name.padEnd(14)} ${v.hex}  ${cr(v.hex, bg).toFixed(2)}:1`);
}
const textAll = ["#FBF3EC", "#FFFFFF", "#FDE7D3", "#F3E9DE"]
  .map((bg) => mostVivid(HUE, bg, 4.5)).sort((a, b) => a.L - b.L)[0];
console.log(`  one step for all four grounds: ${textAll.hex}\n`);

console.log("LARGE DISPLAY TEXT (>=24px) and UI BOUNDARIES need only 3:1:");
for (const [name, bg] of [["on cream", CREAM], ["on white", WHITE]]) {
  const v = mostVivid(HUE, bg, 3.0);
  console.log(`  ${name.padEnd(14)} ${v.hex}  ${cr(v.hex, bg).toFixed(2)}:1`);
}
const uiAll = [CREAM, WHITE, TINT, TAN].map((bg) => mostVivid(HUE, bg, 3.0)).sort((a, b) => a.L - b.L)[0];
console.log(`  one step for all four grounds: ${uiAll.hex}`);

/* --- the warm neutral ------------------------------------------------------
   #8A7C70 is the handoff's muted text and fails on all three light grounds.
   Darkened in OKLCH so it keeps its warmth instead of drifting grey. */
console.log("\nMUTED TEXT — must clear 4.5:1 on its worst ground (tan):");
const [, mC, mH] = rgbToOklch(hexToRgb("#8A7C70"));
for (let L = 0.70; L >= 0.2; L -= 0.001) {
  const rgb = oklchToRgb([L, mC, mH]);
  if (!inGamut(rgb)) continue;
  const hex = rgbToHex(rgb);
  if (cr(hex, TAN) >= 4.55) {
    console.log(`  #8A7C70 -> ${hex}   cream ${cr(hex, CREAM).toFixed(2)}  white ${cr(hex, WHITE).toFixed(2)}  tan ${cr(hex, TAN).toFixed(2)}`);
    break;
  }
}
/* Re-run the orange text step with a safety margin so hex rounding never
   lands a hair under 4.5. */
console.log("\nWITH A ROUNDING MARGIN (target 4.55):");
const safeText = [CREAM, WHITE, TINT, TAN].map((bg) => mostVivid(HUE, bg, 4.55)).sort((a, b) => a.L - b.L)[0];
const safeUi   = [CREAM, WHITE, TINT, TAN].map((bg) => mostVivid(HUE, bg, 3.05)).sort((a, b) => a.L - b.L)[0];
console.log(`  text step ${safeText.hex}   ui step ${safeUi.hex}`);
for (const bg of [CREAM, WHITE, TINT, TAN])
  console.log(`    ${safeText.hex} on ${bg}: ${cr(safeText.hex, bg).toFixed(2)}   ${safeUi.hex} on ${bg}: ${cr(safeUi.hex, bg).toFixed(2)}`);

/* --- form control borders --------------------------------------------------
   WCAG 1.4.11: the boundary of an input a user must find needs 3:1. The
   handoff's #EFE3D8 hairline is decorative and fine on a card, but not as the
   edge of a text field. */
console.log("\nINPUT BORDER — 3:1 against the field's own fill:");
const [, nC, nH] = rgbToOklch(hexToRgb("#8A7C70"));
for (const [name, bg] of [["on white field", WHITE], ["on cream", CREAM]]) {
  for (let L = 0.85; L >= 0.2; L -= 0.001) {
    const rgb = oklchToRgb([L, nC, nH]);
    if (!inGamut(rgb)) continue;
    const hex = rgbToHex(rgb);
    if (cr(hex, bg) >= 3.05) { console.log(`  ${name.padEnd(16)} ${hex}  ${cr(hex, bg).toFixed(2)}:1`); break; }
  }
}
console.log(`\n  decorative hairline #EFE3D8 on cream: ${cr("#EFE3D8", CREAM).toFixed(2)}:1 — fine for a card edge, not for a field.`);
