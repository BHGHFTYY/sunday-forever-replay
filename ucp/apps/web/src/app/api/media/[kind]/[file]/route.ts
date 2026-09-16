import { data } from "@/lib/data.ts";

/**
 * Generated product, brand and package artwork.
 *
 * UCP has no licensed product photography in this build. Rather than
 * scrape retailer images or ship stock photos that misrepresent what is in
 * the box, this route renders a deterministic, clearly-stylised SVG per
 * SKU. It is honest about being an illustration, it is tiny, it is
 * cacheable forever, and it keeps the catalogue visually consistent —
 * which is the actual requirement behind "unified image treatment".
 *
 * Swapping in real imagery means changing `images[].url` in the catalogue
 * adapter. Nothing else in the app knows where pictures come from.
 *
 * SECURITY: every string rendered into the SVG is looked up from the
 * catalogue by id — the URL segment is only ever used as a lookup key,
 * never interpolated. Combined with `default-src 'none'` and `nosniff` on
 * the response, an SVG served from our own origin cannot become an XSS
 * vector.
 */

export const dynamic = "force-static";
export const revalidate = 31536000;

/** Brand-adjacent hues only, so the grid never turns into a rainbow. */
const PALETTES = [
  { from: "#E9FBF4", to: "#C8F5E6", ink: "#00523A", accent: "#00A878" },
  { from: "#EAF1FE", to: "#D2E2FD", ink: "#1B4FBF", accent: "#2B6CF0" },
  { from: "#FAF8F5", to: "#E8E3DA", ink: "#3B4954", accent: "#9AA6B1" },
  { from: "#FFF0EC", to: "#FFDCD2", ink: "#B62F12", accent: "#FF7A5C" },
  { from: "#F7F8F9", to: "#E1E6EA", ink: "#283440", accent: "#51606D" },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Escapes text for XML content. Belt and braces — inputs are already trusted. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Silhouettes, picked deterministically so a SKU always looks the same. */
function silhouette(shape: number, accent: string, ink: string): string {
  const shapes = [
    // Pump bottle
    `<rect x="160" y="150" width="160" height="240" rx="24" fill="${ink}" opacity="0.12"/>
     <rect x="160" y="150" width="160" height="240" rx="24" fill="none" stroke="${ink}" stroke-width="7"/>
     <rect x="205" y="100" width="70" height="52" rx="10" fill="none" stroke="${ink}" stroke-width="7"/>
     <path d="M240 100V74h44" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
     <rect x="180" y="250" width="120" height="58" rx="8" fill="${accent}" opacity="0.5"/>`,
    // Tube
    `<path d="M175 160h130v210a20 20 0 0 1-20 20H195a20 20 0 0 1-20-20z" fill="${ink}" opacity="0.12"/>
     <path d="M175 160h130v210a20 20 0 0 1-20 20H195a20 20 0 0 1-20-20z" fill="none" stroke="${ink}" stroke-width="7"/>
     <path d="M175 160c22-14 108-14 130 0" fill="none" stroke="${ink}" stroke-width="7"/>
     <rect x="212" y="100" width="56" height="46" rx="8" fill="none" stroke="${ink}" stroke-width="7"/>
     <rect x="196" y="240" width="88" height="44" rx="6" fill="${accent}" opacity="0.5"/>`,
    // Carton
    `<path d="M150 170l90-46 90 46v180l-90 46-90-46z" fill="${ink}" opacity="0.1"/>
     <path d="M150 170l90-46 90 46v180l-90 46-90-46z" fill="none" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>
     <path d="M150 170l90 46 90-46M240 216v180" fill="none" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>
     <rect x="186" y="262" width="108" height="40" rx="6" fill="${accent}" opacity="0.45"/>`,
    // Jar
    `<rect x="152" y="196" width="176" height="180" rx="28" fill="${ink}" opacity="0.12"/>
     <rect x="152" y="196" width="176" height="180" rx="28" fill="none" stroke="${ink}" stroke-width="7"/>
     <rect x="170" y="140" width="140" height="58" rx="14" fill="none" stroke="${ink}" stroke-width="7"/>
     <circle cx="240" cy="286" r="38" fill="${accent}" opacity="0.45"/>`,
    // Blister pack
    `<rect x="146" y="164" width="188" height="206" rx="16" fill="${ink}" opacity="0.1"/>
     <rect x="146" y="164" width="188" height="206" rx="16" fill="none" stroke="${ink}" stroke-width="7"/>
     ${[0, 1, 2].flatMap((row) => [0, 1].map((col) =>
        `<circle cx="${196 + col * 88}" cy="${212 + row * 62}" r="22" fill="${accent}" opacity="0.5"/>`)).join("")}`,
    // Lens blister
    `<circle cx="240" cy="264" r="104" fill="${ink}" opacity="0.1"/>
     <circle cx="240" cy="264" r="104" fill="none" stroke="${ink}" stroke-width="7"/>
     <circle cx="240" cy="264" r="58" fill="none" stroke="${ink}" stroke-width="7"/>
     <circle cx="240" cy="264" r="26" fill="${accent}" opacity="0.6"/>`,
  ];
  return shapes[shape % shapes.length] as string;
}

function productSvg(label: string, sub: string, seed: string, view: number): string {
  const h = hash(seed);
  const palette = PALETTES[h % PALETTES.length]!;
  // Different views rotate the silhouette choice and nudge the framing, so
  // the gallery does not show the same picture three times.
  const shape = (h >> 3) + view;
  const scale = view === 2 ? 0.86 : view === 3 ? 1.06 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="${xml(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" fill="url(#bg)"/>
  <g transform="translate(240 264) scale(${scale}) translate(-240 -264)">
    ${silhouette(shape, palette.accent, palette.ink)}
  </g>
  <text x="240" y="424" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="21" font-weight="700" fill="${palette.ink}" opacity="0.85">${xml(sub)}</text>
  <text x="240" y="452" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="14" font-weight="500" fill="${palette.ink}" opacity="0.5">UCP</text>
</svg>`;
}

function brandSvg(label: string, seed: string): string {
  const palette = PALETTES[hash(seed) % PALETTES.length]!;
  // Long names step down in size so the wordmark always fits the frame.
  const size = label.length > 18 ? 22 : label.length > 12 ? 27 : 33;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160" role="img" aria-label="${xml(label)}">
  <rect width="320" height="160" fill="none"/>
  <text x="160" y="80" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${size}" font-weight="700" letter-spacing="-0.5" fill="${palette.ink}">${xml(label)}</text>
  <rect x="${160 - Math.min(110, label.length * 5)}" y="102" width="${Math.min(220, label.length * 10)}" height="3" rx="1.5" fill="${palette.accent}" opacity="0.7"/>
</svg>`;
}

function bundleSvg(label: string, seed: string, count: number): string {
  const h = hash(seed);
  const palette = PALETTES[h % PALETTES.length]!;
  const shown = Math.min(4, Math.max(2, count));
  const width = 480 / (shown + 0.5);

  const items = Array.from({ length: shown }, (_, i) => {
    const x = width * (i + 0.25);
    const height = 150 + ((h >> (i * 2)) % 4) * 22;
    return `<rect x="${x + 10}" y="${330 - height}" width="${width - 20}" height="${height}" rx="12" fill="${i % 2 ? palette.accent : palette.ink}" opacity="${i % 2 ? 0.35 : 0.16}"/>
      <rect x="${x + 10}" y="${330 - height}" width="${width - 20}" height="${height}" rx="12" fill="none" stroke="${palette.ink}" stroke-width="5"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="${xml(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" fill="url(#bg)"/>
  <g transform="translate(0 56)">${items}</g>
  <text x="240" y="440" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="19" font-weight="700" fill="${palette.ink}" opacity="0.8">${xml(label)}</text>
</svg>`;
}

function svgResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
      // An SVG on our own origin is a script execution context. These two
      // headers make sure it can never behave like one.
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; file: string }> },
) {
  const { kind, file } = await params;
  const name = file.replace(/\.svg$/i, "");

  if (kind === "brand") {
    const brand = await data.catalog.getBrand(name);
    // English name only: an SVG loaded through <img> cannot load a webfont,
    // and the system fallback renders Arabic unreliably across platforms.
    return svgResponse(brandSvg(brand?.name.en ?? "UCP", name));
  }

  if (kind === "bundle") {
    const bundle = await data.catalog.getBundle(name);
    return svgResponse(bundleSvg(bundle?.name.en ?? "UCP Package", name, bundle?.items.length ?? 3));
  }

  if (kind === "product") {
    // Trailing "-1" / "-2" / "-3" selects the gallery view.
    const match = /^(.*)-([123])$/.exec(name);
    const productId = match?.[1] ?? name;
    const view = Number(match?.[2] ?? 1);

    const product = await data.catalog.getProduct(productId);
    if (!product) return svgResponse(productSvg("UCP", "UCP", productId, view));

    const brand = await data.catalog.getBrand(product.brandId);
    return svgResponse(
      productSvg(product.name.en, brand?.name.en ?? "UCP", product.id, view),
    );
  }

  return new Response("Not found", { status: 404 });
}
