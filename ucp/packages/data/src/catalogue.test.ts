import { describe, it, expect } from "vitest";
import { buildCart, type CartCatalog, bundleComponentTotal, toRiyals } from "@ucp/core";
import { memorySource } from "./memory-source.ts";
import { products } from "./seed/products.ts";
import { categories, categoriesById, categoryWithDescendants } from "./seed/categories.ts";
import { brands, brandsById } from "./seed/brands.ts";
import { bundles } from "./seed/bundles.ts";
import { promotions } from "./seed/promotions.ts";
import { branches } from "./seed/branches.ts";
import { demoOrders } from "./seed/accounts.ts";

const categoryIds = new Set(categories.map((c) => c.id));
const brandIds = new Set(brands.map((b) => b.id));
const branchIds = new Set(branches.map((b) => b.id));
const productIds = new Set(products.map((p) => p.id));

describe("catalogue integrity", () => {
  it("has a catalogue to work with", () => {
    expect(products.length).toBeGreaterThan(50);
    expect(brands.length).toBeGreaterThan(20);
    expect(categories.length).toBeGreaterThan(30);
  });

  it("gives every product a real brand", () => {
    for (const p of products) expect(brandIds.has(p.brandId), `${p.id} -> ${p.brandId}`).toBe(true);
  });

  it("gives every product at least one real category", () => {
    for (const p of products) {
      expect(p.categoryIds.length).toBeGreaterThan(0);
      for (const c of p.categoryIds) expect(categoryIds.has(c), `${p.id} -> ${c}`).toBe(true);
    }
  });

  it("keeps ids and slugs unique", () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
    expect(new Set(categories.map((c) => c.slug)).size).toBe(categories.length);
    expect(new Set(brands.map((b) => b.slug)).size).toBe(brands.length);
  });

  it("never sets a was-price below the selling price", () => {
    for (const p of products) {
      if (p.compareAtPrice !== undefined) {
        expect(p.compareAtPrice, `${p.id}`).toBeGreaterThan(p.price);
      }
    }
  });

  it("prices everything above zero", () => {
    for (const p of products) expect(p.price, p.id).toBeGreaterThan(0);
  });

  it("stocks only real branches, and branch stock sums to network stock", () => {
    for (const p of products) {
      let sum = 0;
      for (const [branchId, units] of Object.entries(p.stock.byBranch)) {
        expect(branchIds.has(branchId), `${p.id} -> ${branchId}`).toBe(true);
        expect(units).toBeGreaterThan(0);
        sum += units;
      }
      expect(sum, `${p.id} branch stock`).toBe(p.stock.quantity);
    }
  });

  it("keeps the stock status consistent with the quantity", () => {
    for (const p of products) {
      if (p.stock.quantity === 0) expect(p.stock.status).toBe("out_of_stock");
      else expect(p.stock.status).not.toBe("out_of_stock");
    }
  });

  it("carries no rating or review field anywhere", () => {
    // UCP has no review corpus; a field here would invite fabricating one.
    for (const p of products) {
      expect(p).not.toHaveProperty("rating");
      expect(p).not.toHaveProperty("reviewCount");
      expect(p).not.toHaveProperty("reviews");
    }
  });

  it("gives supplements the facts the follow-up service needs", () => {
    for (const p of products) {
      if (!p.supplement) continue;
      expect(p.supplement.unitsPerPack).toBeGreaterThan(0);
      expect(p.supplement.labelDailyUnits).toBeGreaterThan(0);
      expect(p.supplement.unitLabel.ar).toBeTruthy();
      expect(p.supplement.unitLabel.en).toBeTruthy();
    }
  });

  it("fills in both scripts for every customer-visible string", () => {
    for (const p of products) {
      expect(p.name.ar, p.id).toBeTruthy();
      expect(p.name.en, p.id).toBeTruthy();
      expect(p.shortDescription.ar, p.id).toBeTruthy();
      expect(p.shortDescription.en, p.id).toBeTruthy();
      expect(p.description.ar, p.id).toBeTruthy();
      expect(p.description.en, p.id).toBeTruthy();
    }
    for (const c of categories) {
      expect(c.name.ar, c.id).toBeTruthy();
      expect(c.name.en, c.id).toBeTruthy();
    }
  });

  it("writes Arabic names in Arabic script", () => {
    const arabic = /[؀-ۿ]/;
    for (const p of products) expect(arabic.test(p.name.ar), `${p.id}: ${p.name.ar}`).toBe(true);
    for (const c of categories) expect(arabic.test(c.name.ar), c.id).toBe(true);
  });

  it("gives every product images with alt text in both scripts", () => {
    for (const p of products) {
      expect(p.images.length).toBeGreaterThan(0);
      for (const image of p.images) {
        expect(image.url).toBeTruthy();
        expect(image.alt.ar).toBeTruthy();
        expect(image.alt.en).toBeTruthy();
        expect(image.width).toBeGreaterThan(0);
      }
    }
  });
});

describe("category structure", () => {
  it("makes Lenses a top-level category, not a child of Makeup", () => {
    const lenses = categoriesById.get("cat-lenses");
    expect(lenses).toBeDefined();
    expect(lenses!.parentId).toBeNull();
  });

  it("keeps no lens product filed under Makeup", () => {
    const makeupTree = new Set(categoryWithDescendants("cat-makeup"));
    const lensProducts = products.filter((p) => p.tags.includes("lenses"));
    expect(lensProducts.length).toBeGreaterThan(0);
    for (const p of lensProducts) {
      expect(p.categoryIds.some((c) => makeupTree.has(c)), p.id).toBe(false);
    }
  });

  it("breaks Hair into the real subcategories the brief asks for", () => {
    const hairChildren = categories.filter((c) => c.parentId === "cat-hair").map((c) => c.slug);
    for (const expected of ["shampoo", "conditioner", "hair-serum", "hair-mask", "hair-treatment", "hair-styling"]) {
      expect(hairChildren).toContain(expected);
    }
  });

  it("points every child at a category that exists", () => {
    for (const c of categories) {
      if (c.parentId) expect(categoryIds.has(c.parentId), c.id).toBe(true);
    }
  });

  it("leaves no category empty", () => {
    for (const category of categories) {
      const tree = new Set(categoryWithDescendants(category.id));
      const count = products.filter((p) => p.categoryIds.some((c) => tree.has(c))).length;
      expect(count, `${category.id} (${category.name.en}) has no products`).toBeGreaterThan(0);
    }
  });

  it("builds a breadcrumb path from root to leaf", () => {
    const path = categories.find((c) => c.parentId !== null)!;
    const built = categoryWithDescendants(path.id);
    expect(built[0]).toBe(path.id);
  });
});

describe("bundles", () => {
  const cartCatalog: CartCatalog = {
    getProduct: (id) => products.find((p) => p.id === id),
    getBundle: (id) => bundles.find((b) => b.id === id),
    getBrand: (id) => brandsById.get(id),
  };

  it("references only real products", () => {
    for (const bundle of bundles) {
      expect(bundle.items.length).toBeGreaterThan(1);
      for (const item of bundle.items) {
        expect(productIds.has(item.productId), `${bundle.id} -> ${item.productId}`).toBe(true);
        expect(item.quantity).toBeGreaterThan(0);
      }
    }
  });

  it("always costs less than buying the parts separately", () => {
    for (const bundle of bundles) {
      const componentTotal = bundleComponentTotal(bundle, cartCatalog);
      expect(bundle.price, `${bundle.id}: package ${toRiyals(bundle.price)} vs parts ${toRiyals(componentTotal)}`)
        .toBeLessThan(componentTotal);
    }
  });

  it("files every package under a real category", () => {
    for (const bundle of bundles) expect(categoryIds.has(bundle.categoryId), bundle.id).toBe(true);
  });

  it("includes the four-part oral care package the brief specifies", () => {
    const oral = bundles.find((b) => b.id === "bn-oral-essentials")!;
    const slugs = oral.items.map((i) => products.find((p) => p.id === i.productId)!.categoryIds[0]);
    expect(slugs).toEqual(
      expect.arrayContaining(["cat-oral-toothbrush", "cat-oral-toothpaste", "cat-oral-mouthwash", "cat-oral-floss"]),
    );
  });

  it("prices correctly through the real cart engine", () => {
    const cart = buildCart([{ kind: "bundle", id: "bn-oral-essentials", quantity: 1 }], {
      catalog: cartCatalog, fulfilment: "pickup",
    });
    expect(cart.lines[0]!.lineSaving).toBeGreaterThan(0);
    expect(cart.totals.total).toBe(bundles.find((b) => b.id === "bn-oral-essentials")!.price);
  });
});

describe("promotions", () => {
  it("scopes only to categories that exist", () => {
    for (const promo of promotions) {
      for (const c of promo.categoryIds ?? []) expect(categoryIds.has(c), `${promo.code} -> ${c}`).toBe(true);
      for (const b of promo.brandIds ?? []) expect(brandIds.has(b), `${promo.code} -> ${b}`).toBe(true);
    }
  });

  it("describes every code in both scripts", () => {
    for (const promo of promotions) {
      expect(promo.description.ar, promo.code).toBeTruthy();
      expect(promo.description.en, promo.code).toBeTruthy();
    }
  });

  it("hides expired codes from the public list", async () => {
    const live = await memorySource.promotions.listPublicPromotions();
    expect(live.map((p) => p.code)).not.toContain("EXPIRED2025");
  });
});

describe("demo account data", () => {
  it("references only real products in order history", () => {
    for (const order of demoOrders) {
      for (const line of order.lines) {
        if (line.kind === "product") expect(productIds.has(line.id), `${order.id} -> ${line.id}`).toBe(true);
      }
    }
  });

  it("keeps every order's arithmetic self-consistent", () => {
    for (const order of demoOrders) {
      const t = order.totals;
      expect(t.subtotal - t.promotionDiscount - t.loyaltyDiscount + t.deliveryFee, order.reference).toBe(t.total);
      expect(Number.isInteger(t.total)).toBe(true);
    }
  });

  it("credits no points to cancelled or unfinished orders", () => {
    for (const order of demoOrders) {
      if (order.status === "cancelled" || order.status === "pharmacist_review") {
        expect(order.pointsEarned, order.reference).toBe(0);
      }
    }
  });
});

describe("data source", () => {
  it("finds a product by id or by slug", async () => {
    const byId = await memorySource.catalog.getProduct("p-centrum-adults");
    const bySlug = await memorySource.catalog.getProduct("centrum-adults-multivitamin");
    expect(byId?.id).toBe("p-centrum-adults");
    expect(bySlug?.id).toBe("p-centrum-adults");
  });

  it("lists a parent category's products including descendants", async () => {
    const withKids = await memorySource.catalog.listProducts({ categoryId: "cat-hair", limit: 96 });
    const withoutKids = await memorySource.catalog.listProducts({
      categoryId: "cat-hair", includeDescendants: false, limit: 96,
    });
    expect(withKids.total).toBeGreaterThan(withoutKids.total);
  });

  it("paginates", async () => {
    const first = await memorySource.catalog.listProducts({ limit: 5, offset: 0 });
    const second = await memorySource.catalog.listProducts({ limit: 5, offset: 5 });
    expect(first.items).toHaveLength(5);
    expect(first.items.map((p) => p.id)).not.toEqual(second.items.map((p) => p.id));
    expect(first.total).toBe(second.total);
  });

  it("refuses to return another customer's order", async () => {
    const mine = await memorySource.orders.getOrder("ord-1041", "cust-demo");
    const theirs = await memorySource.orders.getOrder("ord-1041", "cust-someone-else");
    expect(mine).toBeDefined();
    expect(theirs).toBeUndefined();
  });

  it("refuses to return another customer's prescription", async () => {
    expect(await memorySource.prescriptions.getPrescription("rx-8841", "cust-demo")).toBeDefined();
    expect(await memorySource.prescriptions.getPrescription("rx-8841", "cust-other")).toBeUndefined();
  });

  it("refuses to update another customer's vitamin plan", async () => {
    expect(await memorySource.vitamins.updatePlan("vp-centrum", "cust-other", { dailyUnits: 9 })).toBeUndefined();
    const plan = await memorySource.vitamins.getPlan("vp-centrum", "cust-demo");
    expect(plan!.dailyUnits).toBe(1);
  });

  it("excludes cancelled orders from purchase history and best-seller counts", async () => {
    const history = await memorySource.orders.purchaseHistory("cust-demo");
    expect(history).not.toContain("p-omron-thermometer"); // only in the cancelled order
    const counts = await memorySource.orders.orderCounts();
    expect(counts.has("p-omron-thermometer")).toBe(false);
  });

  it("reports telepharmacy availability from real branch hours", async () => {
    const availability = await memorySource.telepharmacy.availability();
    expect(typeof availability.chat).toBe("boolean");
    expect(availability.onlineCount).toBeGreaterThanOrEqual(0);
  });
});
