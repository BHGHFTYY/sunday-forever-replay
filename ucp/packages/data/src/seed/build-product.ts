import { riyals } from "@ucp/core";
import type { Product, ProductImage, StockStatus } from "@ucp/core";
import { branches } from "./branches.ts";

/**
 * Compact product authoring.
 *
 * The seed describes each product once, in the terms a merchandiser thinks
 * in, and this expands it into the full `Product` shape. Keeping the
 * authored form terse is what makes a catalogue of this size reviewable.
 */

export interface ProductSpec {
  id: string;
  brandId: string;
  /** Primary category first — it drives breadcrumbs and the canonical URL. */
  cats: [string, ...string[]];
  ar: string;
  en: string;
  /** Riyals, VAT-inclusive. */
  price: number;
  /** Was-price in riyals. Only present where the product genuinely sold at it. */
  was?: number;
  shortAr: string;
  shortEn: string;
  descAr: string;
  descEn: string;
  size?: string;
  attrs?: Array<[string, string, string, string]>;
  keywords?: string[];
  tags?: string[];
  /** Total network stock. 0 renders as out-of-stock. */
  stock?: number;
  rx?: boolean;
  /** [unitsPerPack, labelDailyUnits, unitAr, unitEn] */
  supplement?: [number, number, string, string];
  howToUseAr?: string;
  howToUseEn?: string;
  ingredientsEn?: string;
  warningsAr?: string;
  warningsEn?: string;
  /** Days since an arbitrary epoch, so "newest" ordering is deterministic. */
  age?: number;
}

/**
 * Deterministic 32-bit hash. Stock distribution has to be stable across
 * processes — a server render and a client render that disagree about
 * availability is a hydration bug and a trust problem at once.
 */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Spreads network stock across branches, deterministically per product.
 *
 * Uses normalised weights with largest-remainder allocation rather than
 * subtracting greedily down a list. The greedy version exhausted the total
 * on the first few branches, so the branches at the end of the array held
 * almost nothing — which would have made pickup in Dammam look permanently
 * unavailable for reasons that were an artefact of the seed, not the data.
 */
function distribute(id: string, total: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (total <= 0 || branches.length === 0) return out;

  const seed = hash(id);
  // Weight 1..5 per branch, stable for a given product.
  const weights = branches.map((_, index) => ((seed >> (index * 3)) % 5) + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const exact = weights.map((w) => (total * w) / weightSum);
  const floors = exact.map(Math.floor);
  let allocated = floors.reduce((a, b) => a + b, 0);

  // Hand out the rounding remainder to the largest fractional parts.
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  let cursor = 0;
  while (allocated < total && order.length > 0) {
    const target = order[cursor % order.length] as { index: number };
    floors[target.index] = (floors[target.index] as number) + 1;
    allocated += 1;
    cursor += 1;
  }

  branches.forEach((branch, index) => {
    const units = floors[index] as number;
    if (units > 0) out[branch.id] = units;
  });
  return out;
}

function stockStatus(total: number): StockStatus {
  if (total <= 0) return "out_of_stock";
  if (total <= 5) return "low_stock";
  return "in_stock";
}

const EPOCH = Date.UTC(2026, 0, 1);

export function buildProduct(spec: ProductSpec): Product {
  const slug = `${slugify(spec.en)}`;
  const total = spec.stock ?? 12 + (hash(spec.id) % 40);

  const images: ProductImage[] = [1, 2, 3].map((view) => ({
    url: `/api/media/product/${spec.id}-${view}.svg`,
    alt: { ar: `${spec.ar} — صورة ${view}`, en: `${spec.en} — view ${view}` },
    width: 800,
    height: 800,
  }));

  const attributes = (spec.attrs ?? []).map(([keyAr, keyEn, valAr, valEn]) => ({
    key: slugify(keyEn),
    label: { ar: keyAr, en: keyEn },
    value: { ar: valAr, en: valEn },
  }));

  if (spec.size) {
    attributes.unshift({
      key: "size",
      label: { ar: "الحجم", en: "Size" },
      value: { ar: spec.size, en: spec.size },
    });
  }

  const product: Product = {
    id: spec.id,
    sku: spec.id.toUpperCase().replace(/-/g, ""),
    slug,
    name: { ar: spec.ar, en: spec.en },
    brandId: spec.brandId,
    categoryIds: spec.cats,
    price: riyals(spec.price),
    images,
    shortDescription: { ar: spec.shortAr, en: spec.shortEn },
    description: { ar: spec.descAr, en: spec.descEn },
    attributes,
    stock: {
      status: stockStatus(total),
      quantity: total,
      byBranch: distribute(spec.id, total),
    },
    requiresPrescription: spec.rx ?? false,
    tags: spec.tags ?? [],
    // Both scripts plus the product's own words go into the search index.
    keywords: [...(spec.keywords ?? []), spec.ar, spec.en, ...(spec.tags ?? [])],
    createdAt: new Date(EPOCH + (spec.age ?? 120) * 86_400_000).toISOString(),
  };

  if (spec.was !== undefined) product.compareAtPrice = riyals(spec.was);
  if (spec.howToUseAr && spec.howToUseEn) {
    product.howToUse = { ar: spec.howToUseAr, en: spec.howToUseEn };
  }
  if (spec.ingredientsEn) {
    product.ingredients = { ar: spec.ingredientsEn, en: spec.ingredientsEn };
  }
  if (spec.warningsAr && spec.warningsEn) {
    product.warnings = { ar: spec.warningsAr, en: spec.warningsEn };
  }
  if (spec.supplement) {
    const [unitsPerPack, labelDailyUnits, unitAr, unitEn] = spec.supplement;
    product.supplement = { unitsPerPack, labelDailyUnits, unitLabel: { ar: unitAr, en: unitEn } };
  }

  return product;
}
