/* Verify every colour pairing the Warm Boutique prototype actually renders,
   in both the handoff default and the AA variant. Run: node ucp/tools/contrast.mjs
   Exits non-zero if the AA variant fails, so it can gate a build. */
const lum = (hex) => {
  const v = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const BASE = { cream:"#FBF3EC", tan:"#F3E9DE", white:"#FFFFFF", ink:"#2B2420",
               muted:"#8A7C70", orange:"#FF7A00", tint:"#FDE7D3" };
const MODES = {
  "handoff (default)": { onOrange:"#FFFFFF", accentTx:"#FF7A00", mutedTx:"#8A7C70", accentOnTint:"#FF7A00", accentLine:"#FF7A00" },
  "AA variant":        { onOrange:"#2B2420", accentTx:"#B35500", mutedTx:"#74685E", accentOnTint:"#A85100", accentLine:"#E06B00" },
};
/* 4.5 for body text; 3.0 where the handoff uses the colour only at >=24px bold. */
const pairs = (m) => [
  ["CTA label on orange",        m.onOrange,  BASE.orange, 4.5],
  ["accent text on cream",       m.accentTx,  BASE.cream,  4.5],
  ["accent text on white card",  m.accentTx,  BASE.white,  4.5],
  ["accent text on tint chip",   m.accentOnTint, BASE.tint, 4.5],
  ["muted text on cream",        m.mutedTx,   BASE.cream,  4.5],
  ["muted text on white card",   m.mutedTx,   BASE.white,  4.5],
  ["muted text on tan",          m.mutedTx,   BASE.tan,    4.5],
  ["body text on cream",         BASE.ink,    BASE.cream,  4.5],
  ["body text on white card",    BASE.ink,    BASE.white,  4.5],
  ["body text on tan",           BASE.ink,    BASE.tan,    4.5],
  ["white on ink surface",       BASE.white,  BASE.ink,    4.5],
  ["orange 1.5px border on cream", m.accentLine, BASE.cream, 3.0],
];
let failed = 0;
for (const [name, m] of Object.entries(MODES)) {
  console.log("\n" + name);
  for (const [label, fg, bg, need] of pairs(m)) {
    const v = cr(fg, bg), ok = v >= need;
    if (!ok && name === "AA variant") failed++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${v.toFixed(2).padStart(6)}:1  (needs ${need})  ${label}`);
  }
}
console.log(failed ? `\n${failed} AA-variant failure(s)` : "\nAA variant: all pairings pass.");
process.exit(failed ? 1 : 0);
