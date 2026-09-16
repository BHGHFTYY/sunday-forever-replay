/**
 * Generates tokens.css from the TypeScript token source.
 *
 * The web app consumes CSS custom properties and the mobile app consumes
 * the plain object; generating one from the other means they cannot drift.
 * Run `npm run build:css --workspace @ucp/design` after editing src/.
 * `npm test` fails if the committed file is stale.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { theme } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "..", "tokens.css");

const lines = [];
const push = (s = "") => lines.push(s);

push("/*");
push(" * UCP design tokens — GENERATED FILE, DO NOT EDIT BY HAND.");
push(" * Source: packages/design/src/*.ts");
push(" * Regenerate: npm run build:css --workspace @ucp/design");
push(" *");
push(" * Emitted as a Tailwind v4 @theme block, so every token is available");
push(" * both as a utility class (bg-primary, rounded-lg, text-2xl) and as a");
push(" * raw custom property (var(--color-primary)) for hand-written CSS.");
push(" */");
push();
push("@theme {");

const section = (title) => {
  push();
  push(`  /* ${title} */`);
};

section("Colour ramps");
for (const [rampName, ramp] of Object.entries(theme.color)) {
  if (rampName === "semantic") continue;
  for (const [step, value] of Object.entries(ramp)) {
    push(`  --color-${rampName}-${step}: ${value};`);
  }
}

section("Semantic colours — components reference these, never the ramps");
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
for (const [name, value] of Object.entries(theme.color.semantic)) {
  push(`  --color-${kebab(name)}: ${value};`);
}

section("Typography");
push(`  --font-sans: ${theme.font.family.sans};`);
push(`  --font-numeric: ${theme.font.family.numeric};`);
for (const [name, value] of Object.entries(theme.font.size)) {
  push(`  --text-${name}: ${value};`);
}
for (const [name, value] of Object.entries(theme.font.weight)) {
  push(`  --font-weight-${name}: ${value};`);
}
for (const [name, value] of Object.entries(theme.font.leading)) {
  push(`  --leading-${kebab(name)}: ${value};`);
}
for (const [name, value] of Object.entries(theme.font.tracking)) {
  push(`  --tracking-${name}: ${value};`);
}

section("Spacing — 4px base grid drives every numeric spacing utility");
push(`  --spacing: ${theme.space[1]};`);

section("Radii");
for (const [name, value] of Object.entries(theme.radius)) {
  push(`  --radius-${name}: ${value};`);
}

section("Elevation");
for (const [name, value] of Object.entries(theme.shadow)) {
  if (name === "none") continue;
  push(`  --shadow-${name}: ${value};`);
}

section("Motion");
for (const [name, value] of Object.entries(theme.motion.duration)) {
  push(`  --duration-${name}: ${value};`);
}
for (const [name, value] of Object.entries(theme.motion.easing)) {
  push(`  --ease-${name}: ${value};`);
}

section("Breakpoints");
for (const [name, value] of Object.entries(theme.breakpoint)) {
  push(`  --breakpoint-${name}: ${value}px;`);
}

section("Layout");
push(`  --container-max: ${theme.layout.containerMax};`);
push(`  --tap-target: ${theme.layout.tapTarget};`);
push(`  --header-h-mobile: ${theme.layout.headerHeight.mobile};`);
push(`  --header-h-desktop: ${theme.layout.headerHeight.desktop};`);

section("Stacking order");
for (const [name, value] of Object.entries(theme.zIndex)) {
  push(`  --z-${name}: ${value};`);
}

push("}");
push();

const css = lines.join("\n");

if (process.argv.includes("--check")) {
  const current = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (current !== css) {
    console.error("tokens.css is stale. Run: npm run build:css --workspace @ucp/design");
    process.exit(1);
  }
  console.log("tokens.css is up to date.");
} else {
  writeFileSync(out, css);
  console.log(`Wrote ${out} (${css.split("\n").length} lines)`);
}
