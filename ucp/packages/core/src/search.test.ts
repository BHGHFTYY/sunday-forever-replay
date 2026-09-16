import { describe, it, expect } from "vitest";
import { normalize, tokenize, editDistance, expandSynonyms, fuzzyMatches } from "./text.ts";
import { SearchIndex, applyFilters, sortProducts, brandFacets, priceRange } from "./search.ts";
import { riyals } from "./money.ts";
import type { Brand, Category, Product } from "./types.ts";

describe("Arabic normalisation", () => {
  it("strips diacritics so vocalised text matches plain text", () => {
    expect(normalize("شَامْبُو")).toBe(normalize("شامبو"));
  });

  it("folds the alef family to one form", () => {
    expect(normalize("أحمر")).toBe(normalize("احمر"));
    expect(normalize("إسعاف")).toBe(normalize("اسعاف"));
    expect(normalize("آمن")).toBe(normalize("امن"));
  });

  it("folds ta marbuta and alef maqsura", () => {
    expect(normalize("عدسة")).toBe(normalize("عدسه"));
    expect(normalize("مصطفى")).toBe(normalize("مصطفي"));
  });

  it("removes tatweel used for justification", () => {
    expect(normalize("شامـــبو")).toBe("شامبو");
  });

  it("converts Arabic-Indic digits to Latin", () => {
    expect(normalize("٥٠٠ مل")).toBe("500 مل");
    expect(normalize("۵۰۰")).toBe("500");
  });

  it("lowercases and de-accents Latin text", () => {
    expect(normalize("L'Oréal PARIS")).toBe("loreal paris");
  });

  it("keeps apostrophised brand names as one token so 'loreal' matches", () => {
    expect(normalize("L'Oréal")).toBe(normalize("loreal"));
    expect(normalize("Johnson's")).toBe(normalize("johnsons"));
  });

  it("still splits hyphenated words so a two-word query matches", () => {
    expect(normalize("anti-dandruff")).toBe("anti dandruff");
  });

  it("drops punctuation and collapses whitespace", () => {
    expect(normalize("  CeraVe —  Foaming!  ")).toBe("cerave foaming");
  });

  it("tokenises to non-empty tokens", () => {
    expect(tokenize("  vitamin   D3  ")).toEqual(["vitamin", "d3"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("edit distance", () => {
  it("is zero for identical strings", () => {
    expect(editDistance("shampoo", "shampoo")).toBe(0);
  });

  it("counts single-character mistakes", () => {
    expect(editDistance("shampo", "shampoo")).toBe(1);
    expect(editDistance("shanpoo", "shampoo")).toBe(1);
    expect(editDistance("shmpoo", "shampoo")).toBe(1);
  });

  it("bails out early past the bound instead of computing the real distance", () => {
    expect(editDistance("a", "abcdefghij", 2)).toBeGreaterThan(2);
  });
});

describe("synonyms", () => {
  it("bridges Arabic and English for the same concept", () => {
    expect(expandSynonyms("شامبو")).toContain("shampoo");
    expect(expandSynonyms("shampoo")).toContain("شامبو");
  });

  it("expands within a multi-word query", () => {
    expect(expandSynonyms("افضل شامبو")).toContain("shampoo");
  });

  it("returns the query itself when it has no synonyms", () => {
    expect(expandSynonyms("cerave")).toEqual(["cerave"]);
  });
});

describe("fuzzy matching", () => {
  it("gives short words no typo budget", () => {
    expect(fuzzyMatches("spf", "sfp")).toBe(false);
  });

  it("tolerates one mistake in a medium word", () => {
    expect(fuzzyMatches("serumm", "serum")).toBe(true);
  });

  it("tolerates two in a long word", () => {
    expect(fuzzyMatches("moisturizr", "moisturizer")).toBe(true);
  });
});

// ---------------------------------------------------------------------------

const brands: Brand[] = [
  { id: "b-cerave", slug: "cerave", name: { ar: "سيرافي", en: "CeraVe" }, logoUrl: "" },
  { id: "b-vichy", slug: "vichy", name: { ar: "فيشي", en: "Vichy" }, logoUrl: "" },
];

const categories: Category[] = [
  { id: "cat-hair-shampoo", slug: "shampoo", name: { ar: "شامبو", en: "Shampoo" }, parentId: "cat-hair", iconKey: "hair", position: 1 },
  { id: "cat-face-cleanser", slug: "cleanser", name: { ar: "غسول الوجه", en: "Face Cleanser" }, parentId: "cat-face", iconKey: "face", position: 1 },
  { id: "cat-lenses", slug: "lenses", name: { ar: "العدسات", en: "Lenses" }, parentId: null, iconKey: "lens", position: 5 },
];

function make(over: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    sku: over.id, slug: over.id, brandId: "b-cerave", categoryIds: ["cat-face-cleanser"],
    price: riyals(50), images: [], shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
    attributes: [], stock: { status: "in_stock", quantity: 5, byBranch: {} },
    requiresPrescription: false, tags: [], keywords: [], createdAt: "2026-01-01T00:00:00Z",
    ...over,
  } as Product;
}

const catalogue: Product[] = [
  make({ id: "p-cerave-foaming", name: { ar: "سيرافي غسول رغوي", en: "CeraVe Foaming Cleanser" }, keywords: ["cleanser", "غسول"], price: riyals(75), compareAtPrice: riyals(95) }),
  make({ id: "p-cerave-hydrating", name: { ar: "سيرافي غسول مرطب", en: "CeraVe Hydrating Cleanser" }, keywords: ["cleanser", "غسول"], price: riyals(80) }),
  make({ id: "p-vichy-shampoo", name: { ar: "فيشي شامبو ضد القشرة", en: "Vichy Anti-Dandruff Shampoo" }, brandId: "b-vichy", categoryIds: ["cat-hair-shampoo"], keywords: ["shampoo", "dandruff", "قشرة"], price: riyals(110) }),
  make({ id: "p-lens-daily", name: { ar: "عدسات يومية", en: "Daily Contact Lenses" }, categoryIds: ["cat-lenses"], keywords: ["lenses", "عدسات"], price: riyals(140) }),
  make({ id: "p-oos", name: { ar: "سيرافي كريم", en: "CeraVe Cream" }, price: riyals(60), stock: { status: "out_of_stock", quantity: 0, byBranch: {} } }),
];

const index = new SearchIndex(
  catalogue.map((product) => ({
    product,
    brand: brands.find((b) => b.id === product.brandId),
    categories: categories.filter((c) => product.categoryIds.includes(c.id)),
  })),
  categories,
  brands,
);

describe("search", () => {
  it("finds by English name", () => {
    const ids = index.search("foaming cleanser").map((r) => r.product.id);
    expect(ids[0]).toBe("p-cerave-foaming");
  });

  it("finds by Arabic name", () => {
    const ids = index.search("غسول مرطب").map((r) => r.product.id);
    expect(ids).toContain("p-cerave-hydrating");
  });

  it("finds an English-named product from an Arabic query via synonyms", () => {
    const ids = index.search("شامبو").map((r) => r.product.id);
    expect(ids).toContain("p-vichy-shampoo");
  });

  it("finds an Arabic-named product from an English query via synonyms", () => {
    const ids = index.search("lenses").map((r) => r.product.id);
    expect(ids).toContain("p-lens-daily");
  });

  it("survives a typo", () => {
    const ids = index.search("cerav").map((r) => r.product.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.some((id) => id.startsWith("p-cerave"))).toBe(true);
  });

  it("survives an Arabic spelling variant", () => {
    const ids = index.search("عدسه").map((r) => r.product.id);
    expect(ids).toContain("p-lens-daily");
  });

  it("finds everything by a brand name", () => {
    const ids = index.search("cerave").map((r) => r.product.id);
    expect(ids.filter((id) => id.startsWith("p-cerave")).length).toBeGreaterThanOrEqual(2);
  });

  it("pushes out-of-stock products down the ranking", () => {
    const results = index.search("cerave");
    const oosPosition = results.findIndex((r) => r.product.id === "p-oos");
    expect(oosPosition).toBeGreaterThan(0);
  });

  it("returns nothing for an empty query rather than everything", () => {
    expect(index.search("")).toEqual([]);
    expect(index.search("   ")).toEqual([]);
  });

  it("returns nothing for a query with no plausible match", () => {
    expect(index.search("زجزجزجزج")).toHaveLength(0);
  });

  it("matches categories for navigational queries", () => {
    expect(index.matchingCategories("شامبو").map((c) => c.id)).toContain("cat-hair-shampoo");
  });

  it("matches brands", () => {
    expect(index.matchingBrands("vichy").map((b) => b.id)).toContain("b-vichy");
    expect(index.matchingBrands("فيشي").map((b) => b.id)).toContain("b-vichy");
  });
});

describe("filters, sorting, facets", () => {
  it("filters by brand, price and stock", () => {
    expect(applyFilters(catalogue, { brandIds: ["b-vichy"] })).toHaveLength(1);
    expect(applyFilters(catalogue, { minPrice: riyals(100) })).toHaveLength(2);
    expect(applyFilters(catalogue, { inStockOnly: true })).toHaveLength(4);
    expect(applyFilters(catalogue, { onOfferOnly: true })).toHaveLength(1);
  });

  it("sorts by price in both directions", () => {
    expect(sortProducts(catalogue, "price_asc")[0]!.price).toBe(riyals(60));
    expect(sortProducts(catalogue, "price_desc")[0]!.price).toBe(riyals(140));
  });

  it("never leads a browse listing with an out-of-stock product", () => {
    expect(sortProducts(catalogue, "relevance")[0]!.stock.status).not.toBe("out_of_stock");
  });

  it("counts brand facets without zeroing out the unselected brands", () => {
    const facets = brandFacets(catalogue, { brandIds: ["b-vichy"] });
    expect(facets.find((f) => f.value === "b-cerave")?.count).toBe(4);
  });

  it("reports the price range", () => {
    expect(priceRange(catalogue)).toEqual({ min: riyals(50) + riyals(10), max: riyals(140) });
    expect(priceRange([])).toEqual({ min: 0, max: 0 });
  });
});
