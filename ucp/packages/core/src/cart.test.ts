import { describe, it, expect } from "vitest";
import { buildCart, evaluatePromotion, type CartCatalog } from "./cart.ts";
import { riyals, vatIncludedIn, discountPercent } from "./money.ts";
import { quoteRedemption, pointsForSpend, tierProgress } from "./loyalty.ts";
import type { Brand, Bundle, Product, Promotion } from "./types.ts";

const brand: Brand = { id: "b1", slug: "cerave", name: { ar: "سيرافي", en: "CeraVe" }, logoUrl: "/b.svg" };

function product(over: Partial<Product> & Pick<Product, "id">): Product {
  return {
    sku: `SKU-${over.id}`, slug: over.id, name: { ar: "منتج", en: "Product" },
    brandId: "b1", categoryIds: ["c1"], price: riyals(100),
    images: [{ url: "/p.jpg", alt: { ar: "", en: "" }, width: 600, height: 600 }],
    shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
    attributes: [], stock: { status: "in_stock", quantity: 10, byBranch: { br1: 5, br2: 0 } },
    requiresPrescription: false, tags: [], keywords: [], createdAt: "2026-01-01T00:00:00Z",
    ...over,
  } as Product;
}

const products: Record<string, Product> = {
  p1: product({ id: "p1", price: riyals(100), compareAtPrice: riyals(150) }),
  p2: product({ id: "p2", price: riyals(40) }),
  p3: product({ id: "p3", price: riyals(60), stock: { status: "low_stock", quantity: 2, byBranch: { br1: 1, br2: 0 } } }),
  p4: product({ id: "p4", price: riyals(80), stock: { status: "out_of_stock", quantity: 0, byBranch: {} } }),
  rx: product({ id: "rx", price: riyals(35), requiresPrescription: true }),
  other: product({ id: "other", price: riyals(200), brandId: "b2", categoryIds: ["c9"] }),
};

const bundles: Record<string, Bundle> = {
  oral: {
    id: "oral", slug: "oral-essentials",
    name: { ar: "باقة العناية بالفم", en: "Oral Care Essentials" },
    description: { ar: "", en: "" },
    items: [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 2 }],
    price: riyals(150), imageUrl: "/bundle.jpg", categoryId: "c1",
  },
};

const catalog: CartCatalog = {
  getProduct: (id) => products[id],
  getBundle: (id) => bundles[id],
  getBrand: (id) => (id === "b1" ? brand : undefined),
};

const base = { catalog, fulfilment: "delivery" as const, now: new Date("2026-09-16T12:00:00Z") };

describe("cart pricing", () => {
  it("prices lines from the catalogue, ignoring anything the client claims", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 2 }], base);
    expect(cart.lines[0]!.unitPrice).toBe(riyals(100));
    expect(cart.lines[0]!.lineTotal).toBe(riyals(200));
    expect(cart.totals.subtotal).toBe(riyals(200));
  });

  it("records the saving against the was-price", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 2 }], base);
    expect(cart.totals.productSavings).toBe(riyals(100));
    expect(discountPercent(riyals(100), riyals(150))).toBe(33);
  });

  it("charges delivery below the threshold and drops it above", () => {
    const small = buildCart([{ kind: "product", id: "p2", quantity: 1 }], base);
    expect(small.totals.deliveryFee).toBe(riyals(15));
    expect(small.totals.freeDeliveryRemaining).toBe(riyals(110));

    const big = buildCart([{ kind: "product", id: "p1", quantity: 2 }], base);
    expect(big.totals.deliveryFee).toBe(0);
    expect(big.totals.freeDeliveryRemaining).toBe(0);
  });

  it("never charges delivery on pickup", () => {
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], { ...base, fulfilment: "pickup" });
    expect(cart.totals.deliveryFee).toBe(0);
  });

  it("clamps quantity to available stock and says so", () => {
    const cart = buildCart([{ kind: "product", id: "p3", quantity: 5 }], base);
    expect(cart.lines[0]!.quantity).toBe(2);
    expect(cart.lines[0]!.quantityAdjustedTo).toBe(2);
    expect(cart.issues.map((i) => i.code)).toContain("quantity_reduced");
  });

  it("restricts stock to the chosen branch on pickup", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 8 }], {
      ...base, fulfilment: "pickup", branchId: "br1",
    });
    expect(cart.lines[0]!.quantity).toBe(5);
  });

  it("flags an out-of-stock line and blocks nothing else", () => {
    const cart = buildCart(
      [{ kind: "product", id: "p4", quantity: 1 }, { kind: "product", id: "p2", quantity: 1 }],
      base,
    );
    expect(cart.issues.some((i) => i.code === "out_of_stock")).toBe(true);
    expect(cart.totals.subtotal).toBe(riyals(40));
  });

  it("flags prescription items without removing them", () => {
    const cart = buildCart([{ kind: "product", id: "rx", quantity: 1 }], base);
    expect(cart.lines).toHaveLength(1);
    expect(cart.issues.some((i) => i.code === "prescription_required")).toBe(true);
  });

  it("drops unknown ids rather than throwing", () => {
    const cart = buildCart([{ kind: "product", id: "nope", quantity: 1 }], base);
    expect(cart.lines).toHaveLength(0);
    expect(cart.totals.total).toBe(0);
  });

  it("caps line quantity at the retail maximum", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 999 }], base);
    expect(cart.lines[0]!.quantity).toBeLessThanOrEqual(20);
  });

  it("rejects non-positive and fractional quantities", () => {
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 0 }, { kind: "product", id: "p1", quantity: 1.7 }], base);
    expect(cart.lines[0]!.quantity).toBe(1);
    expect(cart.lines[1]!.quantity).toBe(1);
  });
});

describe("bundles", () => {
  it("prices a package at its package price and shows the real saving", () => {
    const cart = buildCart([{ kind: "bundle", id: "oral", quantity: 1 }], base);
    const line = cart.lines[0]!;
    expect(line.unitPrice).toBe(riyals(150));
    // components: 100 + (40 x 2) = 180
    expect(line.compareAtUnitPrice).toBe(riyals(180));
    expect(line.lineSaving).toBe(riyals(30));
  });

  it("is limited by its scarcest component", () => {
    const limited: CartCatalog = {
      ...catalog,
      getProduct: (id) => (id === "p2" ? { ...products.p2!, stock: { status: "low_stock", quantity: 3, byBranch: {} } } : products[id]),
    };
    // p2 is needed 2 per package, only 3 in stock -> 1 package
    const cart = buildCart([{ kind: "bundle", id: "oral", quantity: 4 }], { ...base, catalog: limited });
    expect(cart.lines[0]!.quantity).toBe(1);
  });
});

describe("promotions", () => {
  const pct: Promotion = { code: "SAVE10", kind: "percentage", value: 10, description: { ar: "", en: "" } };

  it("applies a percentage discount", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 1 }], { ...base, promotion: pct });
    expect(cart.totals.promotionDiscount).toBe(riyals(10));
    expect(cart.totals.total).toBe(riyals(90) + riyals(15));
  });

  it("respects a maximum discount cap", () => {
    const capped: Promotion = { ...pct, value: 50, maxDiscount: riyals(20) };
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 2 }], { ...base, promotion: capped });
    expect(cart.totals.promotionDiscount).toBe(riyals(20));
  });

  it("refuses a code below its minimum spend and explains why", () => {
    const min: Promotion = { ...pct, minSpend: riyals(200) };
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], { ...base, promotion: min });
    expect(cart.totals.promotionDiscount).toBe(0);
    expect(cart.appliedPromotion).toBeUndefined();
    expect(cart.issues.some((i) => i.code === "promotion_min_spend")).toBe(true);
  });

  it("refuses an expired code", () => {
    const expired: Promotion = { ...pct, expiresAt: "2026-01-01T00:00:00Z" };
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 1 }], { ...base, promotion: expired });
    expect(cart.issues.some((i) => i.code === "promotion_expired")).toBe(true);
  });

  it("only discounts the products a scoped code covers", () => {
    const scoped: Promotion = { ...pct, value: 50, brandIds: ["b1"] };
    const cart = buildCart(
      [{ kind: "product", id: "p2", quantity: 1 }, { kind: "product", id: "other", quantity: 1 }],
      { ...base, promotion: scoped },
    );
    // 50% of the SAR 40 b1 item only, not the SAR 200 b2 item
    expect(cart.totals.promotionDiscount).toBe(riyals(20));
  });

  it("says so when a scoped code matches nothing in the basket", () => {
    const scoped: Promotion = { ...pct, brandIds: ["b-nope"] };
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 1 }], { ...base, promotion: scoped });
    expect(cart.issues.some((i) => i.code === "promotion_not_applicable")).toBe(true);
  });

  it("can waive delivery without discounting goods", () => {
    const freeShip: Promotion = { code: "SHIP", kind: "free_delivery", value: 0, description: { ar: "", en: "" } };
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], { ...base, promotion: freeShip });
    expect(cart.totals.deliveryFee).toBe(0);
    expect(cart.totals.promotionDiscount).toBe(0);
  });

  it("never produces a negative total", () => {
    const huge: Promotion = { code: "X", kind: "fixed", value: riyals(9999), description: { ar: "", en: "" } };
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], { ...base, promotion: huge });
    expect(cart.totals.total).toBeGreaterThanOrEqual(0);
    expect(cart.totals.promotionDiscount).toBeLessThanOrEqual(riyals(40));
  });
});

describe("loyalty in the basket", () => {
  it("redeems points in blocks and caps them at half the basket", () => {
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], {
      ...base, loyalty: { balance: 5000, requestedPoints: 5000 },
    });
    // basket SAR 40 -> at most SAR 20 -> 400 points
    expect(cart.totals.loyaltyDiscount).toBe(riyals(20));
  });

  it("ignores a redemption below the minimum", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 1 }], {
      ...base, loyalty: { balance: 50, requestedPoints: 50 },
    });
    expect(cart.totals.loyaltyDiscount).toBe(0);
  });

  it("does not earn points on the part paid for with points", () => {
    const withPoints = buildCart([{ kind: "product", id: "p1", quantity: 2 }], {
      ...base, loyalty: { balance: 2000, requestedPoints: 2000 },
    });
    // SAR 200 basket, SAR 100 covered by points -> earns on SAR 100
    expect(withPoints.totals.loyaltyDiscount).toBe(riyals(100));
    expect(withPoints.totals.pointsEarned).toBe(100);
  });

  it("earns at the customer's tier rate", () => {
    const elite = buildCart([{ kind: "product", id: "p1", quantity: 1 }], { ...base, tierId: "elite" });
    expect(elite.totals.pointsEarned).toBe(150);
  });

  it("gives Elite free delivery at any basket size", () => {
    const cart = buildCart([{ kind: "product", id: "p2", quantity: 1 }], { ...base, tierId: "elite" });
    expect(cart.totals.deliveryFee).toBe(0);
  });
});

describe("VAT", () => {
  it("extracts VAT from the inclusive total rather than adding it", () => {
    const cart = buildCart([{ kind: "product", id: "p1", quantity: 1 }], { ...base, fulfilment: "pickup" });
    expect(cart.totals.total).toBe(riyals(100));
    // 100 inclusive of 15% = 86.96 net + 13.04 VAT
    expect(cart.totals.vatIncluded).toBe(vatIncludedIn(riyals(100)));
    expect(cart.totals.vatIncluded).toBe(1304);
  });

  it("keeps every total an integer number of halalas", () => {
    const cart = buildCart(
      [{ kind: "product", id: "p1", quantity: 3 }, { kind: "product", id: "p3", quantity: 1 }],
      { ...base, promotion: { code: "T", kind: "percentage", value: 33, description: { ar: "", en: "" } } },
    );
    for (const value of Object.values(cart.totals)) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("loyalty maths", () => {
  it("quotes redemption honestly when the request is trimmed", () => {
    expect(quoteRedemption(250, 1000, riyals(100))).toEqual({ points: 200, value: riyals(10), cappedBy: "block_size" });
    expect(quoteRedemption(1000, 300, riyals(100))).toEqual({ points: 300, value: riyals(15), cappedBy: "balance" });
    expect(quoteRedemption(50, 1000, riyals(100)).points).toBe(0);
  });

  it("earns whole points only", () => {
    expect(pointsForSpend(riyals(99.5), "member")).toBe(99);
    expect(pointsForSpend(riyals(100), "select")).toBe(125);
  });

  it("reports progress toward the next tier", () => {
    const p = tierProgress({ customerId: "c", pointsBalance: 100, lifetimePoints: 1000, tierId: "member" });
    expect(p.current.id).toBe("member");
    expect(p.next?.id).toBe("select");
    expect(p.pointsToNext).toBe(1000);
    expect(p.fraction).toBeCloseTo(0.5);
  });

  it("tops out cleanly at the highest tier", () => {
    const p = tierProgress({ customerId: "c", pointsBalance: 0, lifetimePoints: 99999, tierId: "elite" });
    expect(p.next).toBeUndefined();
    expect(p.fraction).toBe(1);
  });
});

describe("promotion evaluation in isolation", () => {
  it("returns a structured reason rather than throwing", () => {
    const result = evaluatePromotion(
      { code: "E", kind: "percentage", value: 10, expiresAt: "2020-01-01T00:00:00Z", description: { ar: "", en: "" } },
      [], catalog, new Date("2026-09-16T00:00:00Z"),
    );
    expect(result.issue?.code).toBe("promotion_expired");
  });
});

describe("empty and degenerate baskets", () => {
  it("charges nothing at all for an empty basket", () => {
    const cart = buildCart([], base);
    expect(cart.totals.total).toBe(0);
    expect(cart.totals.deliveryFee).toBe(0);
    expect(cart.totals.pointsEarned).toBe(0);
    expect(cart.totals.freeDeliveryRemaining).toBe(0);
  });

  it("charges no delivery when every line turned out to be unavailable", () => {
    const cart = buildCart([{ kind: "product", id: "p4", quantity: 2 }], base);
    expect(cart.totals.total).toBe(0);
    expect(cart.totals.deliveryFee).toBe(0);
  });
});
