import type { Category, Product } from "./types.ts";

/**
 * Product recommendations.
 *
 * The rule that shapes this module (brief §7) is that recommendations must
 * be *relevant rather than random*. Every function here can return an
 * empty array, and the UI is built to omit a rail entirely rather than pad
 * it — an empty "Frequently bought together" is better than a fabricated
 * one, because a customer who follows a bad recommendation once stops
 * trusting all of them.
 */

export interface RecommendationSignals {
  /** productId -> productId -> times bought in the same order. */
  coPurchase?: Map<string, Map<string, number>>;
  /** Categories the customer has actually bought from or viewed. */
  affinityCategoryIds?: string[];
  affinityBrandIds?: string[];
  /** Products already bought — used for reorder, excluded from discovery. */
  purchasedProductIds?: string[];
  recentlyViewedIds?: string[];
}

const sellable = (p: Product) => p.stock.status !== "out_of_stock";

/**
 * Alternatives to the product being viewed: same category, comparable
 * price, ranked by how close the price is so the rail reads as "instead of
 * this" rather than "also on the site".
 */
export function similarProducts(
  product: Product,
  catalogue: Product[],
  limit = 8,
): Product[] {
  const primaryCategory = product.categoryIds[0];
  if (!primaryCategory) return [];

  return catalogue
    .filter((p) => p.id !== product.id && sellable(p) && p.categoryIds.includes(primaryCategory))
    .map((p) => {
      const priceDelta = Math.abs(p.price - product.price) / Math.max(product.price, 1);
      const sharedTags = p.tags.filter((t) => product.tags.includes(t)).length;
      const sameBrand = p.brandId === product.brandId ? 1 : 0;
      // Closeness in price dominates; tags and brand break ties. Same-brand
      // gets only a small nudge so the rail shows genuine alternatives
      // rather than turning into a single-brand upsell.
      const score = 100 - priceDelta * 60 + sharedTags * 8 + sameBrand * 4;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * Complementary products, from real co-purchase counts when they exist.
 *
 * Falls back to curated category affinities (shampoo -> conditioner) so a
 * new catalogue still gives useful pairings, but never to "popular
 * products", which is the failure mode that makes this section noise.
 */
export function frequentlyBoughtTogether(
  product: Product,
  catalogue: Product[],
  signals: RecommendationSignals,
  categories: Category[],
  limit = 3,
): Product[] {
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const fromData = signals.coPurchase?.get(product.id);

  if (fromData && fromData.size > 0) {
    const ranked = [...fromData.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => byId.get(id))
      .filter((p): p is Product => !!p && sellable(p) && p.id !== product.id);
    if (ranked.length > 0) return ranked.slice(0, limit);
  }

  const primary = product.categoryIds[0];
  if (!primary) return [];
  const complements = COMPLEMENTARY_CATEGORIES[primary] ?? [];
  if (complements.length === 0) return [];

  const known = new Set(categories.map((c) => c.id));
  const targets = complements.filter((c) => known.has(c));

  return targets
    .flatMap((categoryId) =>
      catalogue
        .filter((p) => sellable(p) && p.categoryIds.includes(categoryId) && p.id !== product.id)
        // Within a complement category, lead with the item most people can
        // justify adding: in stock, well priced, currently discounted.
        .sort((a, b) => {
          const da = a.compareAtPrice ? 1 : 0;
          const db = b.compareAtPrice ? 1 : 0;
          if (da !== db) return db - da;
          return a.price - b.price;
        })
        .slice(0, 1),
    )
    .slice(0, limit);
}

/**
 * Curated complement map, keyed by category id.
 *
 * This is merchandising knowledge, not an algorithm — it belongs in the
 * promotions service long-term. It is small and explicit on purpose so a
 * pharmacist can read and correct it.
 */
export const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  "cat-hair-shampoo": ["cat-hair-conditioner", "cat-hair-mask"],
  "cat-hair-conditioner": ["cat-hair-shampoo", "cat-hair-serum"],
  "cat-hair-mask": ["cat-hair-shampoo"],
  "cat-hair-serum": ["cat-hair-shampoo"],
  "cat-face-cleanser": ["cat-face-moisturiser", "cat-face-sunscreen"],
  "cat-face-moisturiser": ["cat-face-cleanser", "cat-face-sunscreen"],
  "cat-face-serum": ["cat-face-moisturiser", "cat-face-sunscreen"],
  "cat-face-sunscreen": ["cat-face-moisturiser"],
  "cat-oral-toothpaste": ["cat-oral-toothbrush", "cat-oral-mouthwash", "cat-oral-floss"],
  "cat-oral-toothbrush": ["cat-oral-toothpaste", "cat-oral-floss"],
  "cat-oral-mouthwash": ["cat-oral-toothpaste"],
  "cat-oral-floss": ["cat-oral-toothpaste"],
  "cat-lenses": ["cat-lens-care"],
  "cat-lens-care": ["cat-lenses"],
  "cat-body-wash": ["cat-body-lotion"],
  "cat-body-lotion": ["cat-body-wash"],
  "cat-vitamins-multivitamin": ["cat-vitamins-vitamin-d"],
  "cat-feminine-care": ["cat-body-wash"],
};

/** Sibling categories plus the categories of complementary products. */
export function relatedCategories(product: Product, categories: Category[], limit = 6): Category[] {
  const primaryId = product.categoryIds[0];
  const primary = categories.find((c) => c.id === primaryId);
  if (!primary) return [];

  const siblings = categories.filter(
    (c) => c.parentId === primary.parentId && c.id !== primary.id && c.parentId !== null,
  );
  const complements = (COMPLEMENTARY_CATEGORIES[primary.id] ?? [])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => !!c);

  const seen = new Set<string>();
  return [...complements, ...siblings]
    .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
    .slice(0, limit);
}

/**
 * "مختارات لك" — personalised picks.
 *
 * Returns nothing at all when there is no signal, which is what keeps the
 * homepage honest for a first-time visitor: a section called "Picked for
 * you" that is really "random products" trains people to ignore it.
 */
export function pickedForYou(catalogue: Product[], signals: RecommendationSignals, limit = 8): Product[] {
  const categoryAffinity = new Set(signals.affinityCategoryIds ?? []);
  const brandAffinity = new Set(signals.affinityBrandIds ?? []);
  if (categoryAffinity.size === 0 && brandAffinity.size === 0) return [];

  const owned = new Set(signals.purchasedProductIds ?? []);

  return catalogue
    .filter((p) => sellable(p) && !owned.has(p.id))
    .map((p) => {
      let score = 0;
      for (const c of p.categoryIds) if (categoryAffinity.has(c)) score += 10;
      if (brandAffinity.has(p.brandId)) score += 6;
      if (p.compareAtPrice) score += 2;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/** "أعد طلب مشترياتك" — only ever real past purchases, newest first. */
export function reorderCandidates(
  catalogue: Product[],
  purchasedProductIds: string[],
  limit = 8,
): Product[] {
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const id of purchasedProductIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const product = byId.get(id);
    if (product && sellable(product)) out.push(product);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * "الأكثر طلبًا" — best sellers from real order counts.
 *
 * Takes the counts as an argument rather than inventing a popularity
 * field, so if the orders table is empty the homepage simply does not show
 * the section.
 */
export function bestSellers(
  catalogue: Product[],
  orderCounts: Map<string, number>,
  limit = 8,
): Product[] {
  if (orderCounts.size === 0) return [];
  return catalogue
    .filter(sellable)
    .map((p) => ({ p, count: orderCounts.get(p.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => x.p);
}

/** "عروض اليوم" — genuinely discounted lines, deepest discount first. */
export function todaysOffers(catalogue: Product[], limit = 8): Product[] {
  return catalogue
    .filter((p) => sellable(p) && p.compareAtPrice && p.compareAtPrice > p.price)
    .sort((a, b) => {
      const da = (a.compareAtPrice! - a.price) / a.compareAtPrice!;
      const db = (b.compareAtPrice! - b.price) / b.compareAtPrice!;
      return db - da;
    })
    .slice(0, limit);
}

/** Builds the co-purchase matrix from order history. */
export function buildCoPurchaseMatrix(orders: Array<{ productIds: string[] }>): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  for (const order of orders) {
    const unique = [...new Set(order.productIds)];
    for (const a of unique) {
      for (const b of unique) {
        if (a === b) continue;
        const row = matrix.get(a) ?? new Map<string, number>();
        row.set(b, (row.get(b) ?? 0) + 1);
        matrix.set(a, row);
      }
    }
  }
  return matrix;
}
