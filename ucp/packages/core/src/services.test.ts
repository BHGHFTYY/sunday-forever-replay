import { describe, it, expect } from "vitest";
import {
  forecastSupply, defaultPlanFor, nextReminder, plansNeedingReorder,
  loggingStreak, supportsFollowUp, supplyMessage, REORDER_THRESHOLD_DAYS,
} from "./vitamins.ts";
import {
  similarProducts, frequentlyBoughtTogether, relatedCategories, pickedForYou,
  reorderCandidates, bestSellers, todaysOffers, buildCoPurchaseMatrix,
} from "./recommendations.ts";
import { track, registerProvider, initAnalytics, resetAnalyticsForTests, type AnalyticsEvent, type AnalyticsProvider } from "./analytics.ts";
import { riyals } from "./money.ts";
import type { Category, Product, VitaminPlan } from "./types.ts";

const DAY = 86_400_000;
const now = new Date("2026-09-16T12:00:00Z");

function plan(over: Partial<VitaminPlan> = {}): VitaminPlan {
  return {
    id: "vp1", customerId: "c1", productId: "p-vit", startedAt: new Date(now.getTime() - 20 * DAY).toISOString(),
    dailyUnits: 1, unitsPurchased: 60, reminderTimes: ["08:00"], remindersEnabled: true,
    takenDates: [], active: true, ...over,
  };
}

describe("vitamin supply forecasting", () => {
  it("projects remaining supply from the purchase date when nothing is logged", () => {
    const f = forecastSupply(plan(), now);
    expect(f.remainingUnits).toBe(40);
    expect(f.daysRemaining).toBe(40);
    expect(f.basis).toBe("assumed");
    expect(f.reorderDue).toBe(false);
  });

  it("uses the customer's own log when they have been tracking", () => {
    const taken = Array.from({ length: 5 }, (_, i) =>
      new Date(now.getTime() - i * DAY).toISOString().slice(0, 10),
    );
    const f = forecastSupply(plan({ takenDates: taken }), now);
    expect(f.remainingUnits).toBe(55);
    expect(f.basis).toBe("tracked");
  });

  it("scales with the dose the customer chose", () => {
    expect(forecastSupply(plan({ dailyUnits: 2 }), now).remainingUnits).toBe(20);
  });

  it("flags a reorder a week before the pack runs out", () => {
    const nearlyOut = plan({ startedAt: new Date(now.getTime() - 55 * DAY).toISOString() });
    const f = forecastSupply(nearlyOut, now);
    expect(f.daysRemaining).toBeLessThanOrEqual(REORDER_THRESHOLD_DAYS);
    expect(f.reorderDue).toBe(true);
    expect(f.depleted).toBe(false);
  });

  it("never reports negative supply", () => {
    const f = forecastSupply(plan({ startedAt: new Date(now.getTime() - 500 * DAY).toISOString() }), now);
    expect(f.remainingUnits).toBe(0);
    expect(f.daysRemaining).toBe(0);
    expect(f.depleted).toBe(true);
    expect(f.consumedFraction).toBe(1);
  });

  it("handles a plan that started today", () => {
    const f = forecastSupply(plan({ startedAt: now.toISOString() }), now);
    expect(f.remainingUnits).toBe(60);
    expect(f.consumedFraction).toBe(0);
  });

  it("keeps its copy about supply, never about health", () => {
    const message = supplyMessage(forecastSupply(plan(), now), "en");
    expect(message).toMatch(/pack/i);
    expect(message).not.toMatch(/deficien|health|benefit|cure|treat|immune/i);
  });
});

describe("vitamin plans", () => {
  const supplement: Product = {
    id: "p-vit", sku: "VIT", slug: "vit", name: { ar: "", en: "" }, brandId: "b", categoryIds: ["c"],
    price: riyals(90), images: [], shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
    attributes: [], stock: { status: "in_stock", quantity: 5, byBranch: {} }, requiresPrescription: false,
    supplement: { unitsPerPack: 60, labelDailyUnits: 1, unitLabel: { ar: "قرص", en: "tablet" } },
    tags: [], keywords: [], createdAt: "2026-01-01T00:00:00Z",
  };

  it("offers follow-up only for products with supplement facts", () => {
    expect(supportsFollowUp(supplement)).toBe(true);
    expect(supportsFollowUp({ ...supplement, supplement: undefined })).toBe(false);
  });

  it("seeds the dose from the pack label, not from UCP's opinion", () => {
    const created = defaultPlanFor(supplement, "c1", "o1", 1, now)!;
    expect(created.dailyUnits).toBe(supplement.supplement!.labelDailyUnits);
    expect(created.unitsPurchased).toBe(60);
  });

  it("multiplies the pack size by the quantity bought", () => {
    expect(defaultPlanFor(supplement, "c1", "o1", 3, now)!.unitsPurchased).toBe(180);
  });

  it("starts with reminders off, so nothing is opted in on the customer's behalf", () => {
    expect(defaultPlanFor(supplement, "c1", undefined, 1, now)!.remindersEnabled).toBe(false);
  });

  it("returns null for a product that is not a supplement", () => {
    expect(defaultPlanFor({ ...supplement, supplement: undefined }, "c1", undefined, 1, now)).toBeNull();
  });
});

describe("reminders", () => {
  it("picks the next time later today", () => {
    // 12:00 UTC = 15:00 Riyadh; next reminder is 20:00 local.
    const r = nextReminder(plan({ reminderTimes: ["08:00", "20:00"] }), 180, now);
    expect(r).not.toBeNull();
    expect(new Date(r!.at).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(r!.at).getTime() - now.getTime()).toBeLessThan(6 * 3600_000);
  });

  it("rolls to tomorrow once today's times have passed", () => {
    const r = nextReminder(plan({ reminderTimes: ["08:00"] }), 180, now);
    expect(new Date(r!.at).getTime() - now.getTime()).toBeGreaterThan(12 * 3600_000);
  });

  it("returns nothing when reminders are off", () => {
    expect(nextReminder(plan({ remindersEnabled: false }), 180, now)).toBeNull();
    expect(nextReminder(plan({ reminderTimes: [] }), 180, now)).toBeNull();
  });

  it("selects only the plans actually due a reorder nudge", () => {
    const due = plan({ id: "due", startedAt: new Date(now.getTime() - 56 * DAY).toISOString() });
    const fine = plan({ id: "fine" });
    const inactive = plan({ id: "inactive", active: false, startedAt: new Date(now.getTime() - 56 * DAY).toISOString() });
    expect(plansNeedingReorder([due, fine, inactive], now).map((p) => p.id)).toEqual(["due"]);
  });

  it("counts a logging streak back from today", () => {
    const dates = [0, 1, 2, 5].map((d) => new Date(now.getTime() - d * DAY).toISOString().slice(0, 10));
    expect(loggingStreak(plan({ takenDates: dates }), now)).toBe(3);
  });

  it("reports a zero streak when nothing is logged", () => {
    expect(loggingStreak(plan(), now)).toBe(0);
  });
});

// ---------------------------------------------------------------------------

const categories: Category[] = [
  { id: "cat-hair-shampoo", slug: "shampoo", name: { ar: "شامبو", en: "Shampoo" }, parentId: "cat-hair", iconKey: "h", position: 1 },
  { id: "cat-hair-conditioner", slug: "conditioner", name: { ar: "بلسم", en: "Conditioner" }, parentId: "cat-hair", iconKey: "h", position: 2 },
  { id: "cat-hair-mask", slug: "mask", name: { ar: "ماسك", en: "Mask" }, parentId: "cat-hair", iconKey: "h", position: 3 },
];

function p(id: string, over: Partial<Product> = {}): Product {
  return {
    id, sku: id, slug: id, name: { ar: id, en: id }, brandId: "b1", categoryIds: ["cat-hair-shampoo"],
    price: riyals(50), images: [], shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
    attributes: [], stock: { status: "in_stock", quantity: 5, byBranch: {} }, requiresPrescription: false,
    tags: [], keywords: [], createdAt: "2026-01-01T00:00:00Z", ...over,
  } as Product;
}

const shelf: Product[] = [
  p("sh1", { price: riyals(50) }),
  p("sh2", { price: riyals(55), tags: ["dandruff"] }),
  p("sh3", { price: riyals(200) }),
  p("cond1", { categoryIds: ["cat-hair-conditioner"], price: riyals(45) }),
  p("cond2", { categoryIds: ["cat-hair-conditioner"], price: riyals(60), compareAtPrice: riyals(80) }),
  p("mask1", { categoryIds: ["cat-hair-mask"], price: riyals(70) }),
  p("oos", { stock: { status: "out_of_stock", quantity: 0, byBranch: {} } }),
];

describe("recommendations", () => {
  it("suggests alternatives close in price, never the product itself", () => {
    const similar = similarProducts(shelf[0]!, shelf, 3);
    expect(similar.map((x) => x.id)).not.toContain("sh1");
    expect(similar[0]!.id).toBe("sh2");
  });

  it("never recommends an out-of-stock product", () => {
    expect(similarProducts(shelf[0]!, shelf, 10).map((x) => x.id)).not.toContain("oos");
  });

  it("prefers real co-purchase data when it exists", () => {
    const matrix = buildCoPurchaseMatrix([
      { productIds: ["sh1", "mask1"] },
      { productIds: ["sh1", "mask1"] },
      { productIds: ["sh1", "cond1"] },
    ]);
    const fbt = frequentlyBoughtTogether(shelf[0]!, shelf, { coPurchase: matrix }, categories, 2);
    expect(fbt[0]!.id).toBe("mask1");
  });

  it("falls back to curated complements, not to popular products", () => {
    const fbt = frequentlyBoughtTogether(shelf[0]!, shelf, {}, categories, 3);
    const ids = fbt.map((x) => x.id);
    expect(ids).toContain("cond2"); // discounted conditioner leads its category
    expect(ids).not.toContain("sh3");
  });

  it("returns nothing rather than filler when a category has no complements", () => {
    const orphan = p("orphan", { categoryIds: ["cat-unknown"] });
    expect(frequentlyBoughtTogether(orphan, shelf, {}, categories)).toEqual([]);
  });

  it("relates a product to its complements and siblings", () => {
    const related = relatedCategories(shelf[0]!, categories);
    expect(related.map((c) => c.id)).toContain("cat-hair-conditioner");
    expect(related.map((c) => c.id)).not.toContain("cat-hair-shampoo");
  });

  it("shows nothing personalised to a customer with no history", () => {
    expect(pickedForYou(shelf, {})).toEqual([]);
  });

  it("personalises from real affinities and skips what was already bought", () => {
    const picks = pickedForYou(shelf, {
      affinityCategoryIds: ["cat-hair-conditioner"],
      purchasedProductIds: ["cond1"],
    });
    expect(picks.map((x) => x.id)).toContain("cond2");
    expect(picks.map((x) => x.id)).not.toContain("cond1");
  });

  it("reorders only genuine past purchases, de-duplicated", () => {
    expect(reorderCandidates(shelf, ["sh1", "sh1", "mask1"]).map((x) => x.id)).toEqual(["sh1", "mask1"]);
  });

  it("skips a past purchase that is now out of stock", () => {
    expect(reorderCandidates(shelf, ["oos", "sh1"]).map((x) => x.id)).toEqual(["sh1"]);
  });

  it("shows no best sellers at all without order data", () => {
    expect(bestSellers(shelf, new Map())).toEqual([]);
  });

  it("ranks best sellers by real order counts", () => {
    const counts = new Map([["sh3", 40], ["sh1", 90]]);
    expect(bestSellers(shelf, counts).map((x) => x.id)).toEqual(["sh1", "sh3"]);
  });

  it("lists only genuinely discounted products as offers", () => {
    expect(todaysOffers(shelf).map((x) => x.id)).toEqual(["cond2"]);
  });
});

describe("analytics bus", () => {
  it("queues events fired before init and replays them once ready", async () => {
    resetAnalyticsForTests();
    const seen: AnalyticsEvent[] = [];
    const provider: AnalyticsProvider = { id: "test", track: (e) => seen.push(e) };
    registerProvider(provider);

    track({ name: "search", query: "شامبو", resultCount: 3 });
    expect(seen).toHaveLength(0);

    await initAnalytics();
    expect(seen).toHaveLength(1);

    track({ name: "view_cart", value: riyals(100), itemCount: 2 });
    expect(seen).toHaveLength(2);
  });

  it("keeps delivering to healthy providers when one throws", async () => {
    resetAnalyticsForTests();
    const seen: AnalyticsEvent[] = [];
    registerProvider({ id: "bad", track: () => { throw new Error("vendor down"); } });
    registerProvider({ id: "good", track: (e) => seen.push(e) });
    await initAnalytics();

    expect(() => track({ name: "add_to_cart", source: "plp", item: { id: "x", name: "x", price: 1, quantity: 1 } })).not.toThrow();
    expect(seen).toHaveLength(1);
  });

  it("registers a provider only once", async () => {
    resetAnalyticsForTests();
    const seen: AnalyticsEvent[] = [];
    const provider: AnalyticsProvider = { id: "dup", track: (e) => seen.push(e) };
    registerProvider(provider);
    registerProvider(provider);
    await initAnalytics();
    track({ name: "view_cart", value: 0, itemCount: 0 });
    expect(seen).toHaveLength(1);
  });
});
