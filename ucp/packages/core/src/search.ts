import { expandSynonyms, fuzzyMatches, normalize, tokenize } from "./text.ts";
import type { Brand, Category, Locale, Product } from "./types.ts";

/**
 * Catalogue search.
 *
 * An inverted index built once per catalogue snapshot, queried with
 * normalised, synonym-expanded, typo-tolerant tokens. It is deliberately
 * in-process: at UCP's catalogue size this answers in well under a
 * millisecond, and it removes a network hop and a second system from the
 * critical path of the single most important interaction on the site.
 *
 * The scoring shape (field weights, exact > prefix > fuzzy) is the part
 * worth keeping if this is later swapped for OpenSearch or Algolia.
 */

export interface SearchableProduct {
  product: Product;
  brand?: Brand;
  categories: Category[];
}

interface IndexedDoc {
  id: string;
  /** Weighted, normalised field text. */
  fields: {
    name: string;
    brand: string;
    category: string;
    keywords: string;
    description: string;
  };
  tokens: Set<string>;
  product: Product;
}

const FIELD_WEIGHTS = {
  name: 10,
  brand: 6,
  category: 4,
  keywords: 5,
  description: 1,
} as const;

export class SearchIndex {
  private docs: IndexedDoc[] = [];
  private byToken = new Map<string, Set<number>>();
  private categories: Category[] = [];
  private brands: Brand[] = [];

  constructor(items: SearchableProduct[], categories: Category[] = [], brands: Brand[] = []) {
    this.categories = categories;
    this.brands = brands;

    items.forEach(({ product, brand, categories: cats }, position) => {
      const fields = {
        name: normalize(`${product.name.ar} ${product.name.en}`),
        brand: normalize(brand ? `${brand.name.ar} ${brand.name.en}` : ""),
        category: normalize(cats.map((c) => `${c.name.ar} ${c.name.en}`).join(" ")),
        keywords: normalize(product.keywords.join(" ")),
        description: normalize(`${product.shortDescription.ar} ${product.shortDescription.en} ${product.tags.join(" ")}`),
      };

      const tokens = new Set<string>();
      for (const value of Object.values(fields)) {
        for (const token of value.split(" ")) if (token) tokens.add(token);
      }

      this.docs.push({ id: product.id, fields, tokens, product });
      for (const token of tokens) {
        const bucket = this.byToken.get(token) ?? new Set<number>();
        bucket.add(position);
        this.byToken.set(token, bucket);
      }
    });
  }

  private scoreDoc(doc: IndexedDoc, queryTokens: string[], fullQuery: string): number {
    let score = 0;

    // Whole-phrase hit in the name is the strongest possible signal.
    if (fullQuery && doc.fields.name.includes(fullQuery)) {
      score += 60;
      if (doc.fields.name.startsWith(fullQuery)) score += 25;
      if (doc.fields.name === fullQuery) score += 60;
    }
    if (fullQuery && doc.fields.brand.includes(fullQuery)) score += 30;

    for (const token of queryTokens) {
      let best = 0;
      for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as Array<
        [keyof IndexedDoc["fields"], number]
      >) {
        const text = doc.fields[field];
        if (!text) continue;
        if (text.includes(token)) {
          // Word-boundary hits beat substring hits.
          const boundary = new RegExp(`(^| )${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text);
          best = Math.max(best, weight * (boundary ? 1 : 0.6));
        } else if (fuzzyMatches(token, text)) {
          // A typo still counts, at a discount, so it can never outrank a
          // clean match on a less important field.
          best = Math.max(best, weight * 0.35);
        }
      }
      score += best;
    }

    // Commercial tie-breakers, applied last and kept small so they adjust
    // ordering between comparable matches rather than overriding relevance.
    if (doc.product.stock.status === "out_of_stock") score *= 0.35;
    else if (doc.product.stock.status === "low_stock") score *= 0.95;
    if (doc.product.compareAtPrice && doc.product.compareAtPrice > doc.product.price) score += 2;

    return score;
  }

  search(query: string, limit = 48): Array<{ product: Product; score: number }> {
    const variants = expandSynonyms(query);
    const fullQuery = normalize(query);
    if (!fullQuery) return [];

    const queryTokens = [...new Set(variants.flatMap((v) => tokenize(v)))];

    // Gather candidates from the inverted index, falling back to a full
    // scan only when nothing matched exactly (i.e. the query is a typo).
    const candidates = new Set<number>();
    for (const token of queryTokens) {
      const exact = this.byToken.get(token);
      if (exact) for (const idx of exact) candidates.add(idx);
    }
    if (candidates.size === 0) {
      this.docs.forEach((_, idx) => candidates.add(idx));
    } else {
      // Also consider prefix matches, which the token map misses.
      this.byToken.forEach((bucket, token) => {
        if (queryTokens.some((q) => token.startsWith(q) || q.startsWith(token))) {
          for (const idx of bucket) candidates.add(idx);
        }
      });
    }

    const scored: Array<{ product: Product; score: number }> = [];
    for (const idx of candidates) {
      const doc = this.docs[idx];
      if (!doc) continue;
      const score = this.scoreDoc(doc, queryTokens, fullQuery);
      if (score > 2) scored.push({ product: doc.product, score });
    }

    return scored.sort((a, b) => b.score - a.score || a.product.price - b.product.price).slice(0, limit);
  }

  /** Categories and brands whose name matches — shown above product hits. */
  matchingCategories(query: string, limit = 4): Category[] {
    const q = normalize(query);
    if (!q) return [];
    const variants = expandSynonyms(query).map(normalize);
    return this.categories
      .filter((c) => {
        const text = normalize(`${c.name.ar} ${c.name.en}`);
        return variants.some((v) => text.includes(v) || fuzzyMatches(v, text));
      })
      .slice(0, limit);
  }

  matchingBrands(query: string, limit = 4): Brand[] {
    const q = normalize(query);
    if (!q) return [];
    return this.brands
      .filter((b) => {
        const text = normalize(`${b.name.ar} ${b.name.en}`);
        return text.includes(q) || fuzzyMatches(q, text);
      })
      .slice(0, limit);
  }

  get size(): number {
    return this.docs.length;
  }
}

export interface Suggestion {
  kind: "product" | "category" | "brand" | "term";
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  imageUrl?: string;
  price?: number;
  compareAtPrice?: number;
}

/**
 * The search-as-you-type payload.
 *
 * Deliberately mixed: categories and brands first (they are navigational
 * and usually what a broad query like "شعر" really means), then the
 * products. A pure product list makes a customer scroll to discover that a
 * whole section exists.
 */
export function buildSuggestions(
  index: SearchIndex,
  query: string,
  locale: Locale,
  brandsById: Map<string, Brand>,
): Suggestion[] {
  const out: Suggestion[] = [];
  const prefix = locale === "ar" ? "/ar" : "/en";

  for (const category of index.matchingCategories(query, 3)) {
    out.push({
      kind: "category",
      id: category.id,
      label: category.name[locale],
      href: `${prefix}/c/${category.slug}`,
    });
  }

  for (const brand of index.matchingBrands(query, 2)) {
    out.push({
      kind: "brand",
      id: brand.id,
      label: brand.name[locale],
      href: `${prefix}/b/${brand.slug}`,
      imageUrl: brand.logoUrl,
    });
  }

  for (const { product } of index.search(query, 6)) {
    const brand = brandsById.get(product.brandId);
    const suggestion: Suggestion = {
      kind: "product",
      id: product.id,
      label: product.name[locale],
      href: `${prefix}/p/${product.slug}`,
      imageUrl: product.images[0]?.url,
      price: product.price,
    };
    if (brand) suggestion.sublabel = brand.name[locale];
    if (product.compareAtPrice) suggestion.compareAtPrice = product.compareAtPrice;
    out.push(suggestion);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Faceting & sorting for listing pages
// ---------------------------------------------------------------------------

export type SortKey = "relevance" | "newest" | "price_asc" | "price_desc" | "discount";

export interface ProductFilters {
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onOfferOnly?: boolean;
  tags?: string[];
  excludePrescription?: boolean;
}

export function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((p) => {
    if (filters.brandIds?.length && !filters.brandIds.includes(p.brandId)) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.inStockOnly && p.stock.status === "out_of_stock") return false;
    if (filters.onOfferOnly && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    if (filters.excludePrescription && p.requiresPrescription) return false;
    if (filters.tags?.length && !filters.tags.some((tag) => p.tags.includes(tag))) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "discount":
      return copy.sort((a, b) => {
        const da = a.compareAtPrice ? (a.compareAtPrice - a.price) / a.compareAtPrice : 0;
        const db = b.compareAtPrice ? (b.compareAtPrice - b.price) / b.compareAtPrice : 0;
        return db - da;
      });
    default:
      // "Relevance" on a browse page means: sellable first, then offers,
      // then newest. Out-of-stock never leads a listing.
      return copy.sort((a, b) => {
        const sa = a.stock.status === "out_of_stock" ? 1 : 0;
        const sb = b.stock.status === "out_of_stock" ? 1 : 0;
        if (sa !== sb) return sa - sb;
        const oa = a.compareAtPrice ? 1 : 0;
        const ob = b.compareAtPrice ? 1 : 0;
        if (oa !== ob) return ob - oa;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }
}

export interface FacetBucket {
  value: string;
  count: number;
}

/** Facet counts computed against the *unfiltered* set for that facet, so
 *  selecting one brand does not make every other brand read "0". */
export function brandFacets(products: Product[], filters: ProductFilters): FacetBucket[] {
  const withoutBrand = applyFilters(products, { ...filters, brandIds: undefined as never });
  const counts = new Map<string, number>();
  for (const p of withoutBrand) counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function priceRange(products: Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 0 };
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const p of products) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  return { min, max };
}
