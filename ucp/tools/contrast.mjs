/* Verify every colour pairing the Warm Boutique prototype renders.
   The palette is AA by construction (see ucp/tools/palette.mjs); this is the
   regression guard. Exits non-zero on any failure so it can gate a build.
   Run: node ucp/tools/contrast.mjs */
const lum = (hex) => {
  const v = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const T = {
  cream:"#FBF3EC", tan:"#F3E9DE", white:"#FFFFFF", tint:"#FDE7D3", line:"#EFE3D8",
  orange500:"#FF7A00", orange600:"#D66500", orange700:"#AB4F00",
  ink:"#2B2420", muted:"#75675B", lineStrong:"#988A7E",
};
const GROUNDS = [["cream", T.cream], ["white card", T.white], ["tint chip", T.tint], ["tan", T.tan]];

/* [label, fg, bg, required] — 4.5 small text, 3.0 large text and UI boundaries */
const checks = [
  ["CTA label (ink) on orange fill", T.ink, T.orange500, 4.5],
  ["white on ink surface",           T.white, T.ink,     4.5],
  ["body text on orange fill",       T.ink, T.orange500, 4.5],
];
for (const [name, bg] of GROUNDS) {
  checks.push([`body text on ${name}`,          T.ink,        bg, 4.5]);
  checks.push([`muted text on ${name}`,         T.muted,      bg, 4.5]);
  checks.push([`accent small text on ${name}`,  T.orange700,  bg, 4.5]);
  checks.push([`accent border/icon on ${name}`, T.orange600,  bg, 3.0]);
}
checks.push(["input border on white field", T.lineStrong, T.white, 3.0]);
checks.push(["input border on cream",       T.lineStrong, T.cream, 3.0]);

let bad = 0;
for (const [label, fg, bg, need] of checks) {
  const v = cr(fg, bg), ok = v >= need;
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${v.toFixed(2).padStart(6)}:1  (needs ${need})  ${label}`);
}
console.log(bad ? `\n${bad} failure(s)` : `\nAll ${checks.length} pairings pass WCAG 2.1 AA.`);
process.exit(bad ? 1 : 0);
