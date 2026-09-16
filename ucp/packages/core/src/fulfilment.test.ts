import { describe, it, expect } from "vitest";
import {
  isBranchOpen, minutesUntilOpen, branchLocalTime, haversineKm,
  quoteDelivery, quotePickup, type DeliveryZone,
} from "./fulfilment.ts";
import { riyals } from "./money.ts";
import type { Branch, CartLine, OpeningHours, Product } from "./types.ts";

// 09:00 - 23:00 every day, in branch-local (UTC+3) time.
const dayHours: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, d) => [d, { open: 9 * 60, close: 23 * 60 }]),
);
const overnightHours: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, d) => [d, { open: 16 * 60, close: 2 * 60 }]),
);

function branch(over: Partial<Branch> & Pick<Branch, "id">): Branch {
  return {
    code: over.id, name: { ar: "فرع", en: "Branch" }, city: { ar: "الرياض", en: "Riyadh" },
    district: { ar: "", en: "" }, address: { ar: "", en: "" },
    lat: 24.7136, lng: 46.6753, phone: "+966500000000", hours: dayHours,
    services: ["pickup", "delivery_hub", "prescription"],
    ...over,
  } as Branch;
}

const olaya = branch({ id: "br-olaya", lat: 24.6949, lng: 46.6853 });
const malaz = branch({ id: "br-malaz", lat: 24.6600, lng: 46.7400 });

const zones: DeliveryZone[] = [
  { city: "Riyadh", branchIds: ["br-olaya", "br-malaz"], baseTravelMinutes: 30, maxRadiusKm: 25 },
];

function product(id: string, byBranch: Record<string, number>): Product {
  return {
    id, sku: id, slug: id, name: { ar: "", en: "" }, brandId: "b", categoryIds: ["c"],
    price: riyals(50), images: [], shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
    attributes: [], stock: { status: "in_stock", quantity: 10, byBranch },
    requiresPrescription: false, tags: [], keywords: [], createdAt: "2026-01-01T00:00:00Z",
  } as Product;
}

const products: Record<string, Product> = {
  stocked: product("stocked", { "br-olaya": 10, "br-malaz": 10 }),
  olayaOnly: product("olayaOnly", { "br-olaya": 3 }),
  nowhere: product("nowhere", {}),
};
const getProduct = (id: string) => products[id];

// 2026-09-16 is a Wednesday. 09:00 UTC = 12:00 Riyadh (open).
const midday = new Date("2026-09-16T09:00:00Z");
// 01:00 UTC = 04:00 Riyadh (closed).
const preDawn = new Date("2026-09-16T01:00:00Z");
// 19:30 UTC = 22:30 Riyadh (30 min before close — inside the cutoff).
const nearClose = new Date("2026-09-16T19:30:00Z");

describe("branch clock", () => {
  it("reads local time at UTC+3", () => {
    expect(branchLocalTime(midday)).toEqual({ dayOfWeek: 3, minutes: 12 * 60 });
  });

  it("knows when a branch is open", () => {
    expect(isBranchOpen(dayHours, midday)).toBe(true);
    expect(isBranchOpen(dayHours, preDawn)).toBe(false);
  });

  it("handles a window that runs past midnight", () => {
    expect(isBranchOpen(overnightHours, new Date("2026-09-16T22:00:00Z"))).toBe(true); // 01:00 local
    expect(isBranchOpen(overnightHours, new Date("2026-09-16T09:00:00Z"))).toBe(false); // 12:00 local
  });

  it("reports zero wait when already open", () => {
    expect(minutesUntilOpen(dayHours, midday)).toBe(0);
  });

  it("counts the minutes until opening", () => {
    // 04:00 local -> opens 09:00 local = 300 minutes
    expect(minutesUntilOpen(dayHours, preDawn)).toBe(300);
  });

  it("returns null when a branch never opens", () => {
    expect(minutesUntilOpen({}, midday)).toBeNull();
  });
});

describe("distance", () => {
  it("measures a plausible intra-city distance", () => {
    const km = haversineKm(olaya, malaz);
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(12);
  });

  it("is zero for the same point", () => {
    expect(haversineKm(olaya, olaya)).toBeCloseTo(0);
  });
});

describe("delivery quoting", () => {
  const dest = { lat: 24.70, lng: 46.68, city: "Riyadh" };

  it("promises a same-day window when open, stocked and not busy", () => {
    const quote = quoteDelivery({
      destination: dest, branches: [olaya, malaz], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      capacityLoad: 0.3, now: midday,
    });
    expect(quote.confidence).toBe("promised");
    expect(quote.reason).toBe("same_day");
    expect(quote.minMinutes).toBeGreaterThan(0);
    expect(quote.to).toBeTruthy();
  });

  it("refuses to quote at all without an address", () => {
    const quote = quoteDelivery({ branches: [olaya], zones, now: midday });
    expect(quote.confidence).toBe("unavailable");
    expect(quote.from).toBeUndefined();
  });

  it("refuses to quote outside the coverage area", () => {
    const quote = quoteDelivery({
      destination: { lat: 21.4858, lng: 39.1925, city: "Jeddah" },
      branches: [olaya], zones, now: midday,
    });
    expect(quote.confidence).toBe("unavailable");
    expect(quote.reason).toBe("outside_coverage");
  });

  it("downgrades to an estimate when the branch is closed", () => {
    const quote = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      now: preDawn,
    });
    expect(quote.confidence).toBe("estimated");
    expect(quote.reason).toBe("branch_closed");
    expect(quote.minMinutes).toBeGreaterThanOrEqual(300);
  });

  it("rolls past the cutoff into the next day", () => {
    const quote = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      now: nearClose,
    });
    expect(quote.confidence).toBe("estimated");
    expect(quote.reason).toBe("next_opening");
  });

  it("widens the window and drops the promise under heavy load", () => {
    const busy = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      capacityLoad: 0.95, now: midday,
    });
    expect(busy.confidence).toBe("estimated");
    expect(busy.reason).toBe("high_demand");
  });

  it("withholds same-day entirely when capacity is gone", () => {
    const full = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      capacityLoad: 1.4, now: midday,
    });
    expect(full.confidence).toBe("estimated");
    expect(full.minMinutes!).toBeGreaterThan(120);
  });

  it("falls back to a warehouse estimate when no nearby branch holds the goods", () => {
    const quote = quoteDelivery({
      destination: dest, branches: [olaya, malaz], zones,
      lines: [{ id: "nowhere", quantity: 1, kind: "product" }], getProduct,
      now: midday,
    });
    expect(quote.confidence).toBe("estimated");
    expect(quote.reason).toBe("no_stock_nearby");
  });

  it("routes to the branch that actually holds the stock", () => {
    const quote = quoteDelivery({
      destination: { lat: 24.66, lng: 46.74, city: "Riyadh" }, // nearest is malaz
      branches: [olaya, malaz], zones,
      lines: [{ id: "olayaOnly", quantity: 1, kind: "product" }], getProduct,
      now: midday,
    });
    expect(quote.branchId).toBe("br-olaya");
  });

  it("adds pharmacist review time for prescription orders", () => {
    const plain = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct, now: midday,
    });
    const rx = quoteDelivery({
      destination: dest, branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" }], getProduct,
      requiresPrescription: true, now: midday,
    });
    expect(rx.minMinutes!).toBeGreaterThan(plain.minMinutes!);
  });
});

describe("pickup quoting", () => {
  const line = (id: string, quantity: number): CartLine => ({
    kind: "product", id, slug: id, name: { ar: "", en: "" }, imageUrl: "",
    unitPrice: riyals(50), quantity, lineTotal: riyals(50) * quantity, lineSaving: 0,
    requiresPrescription: false, stockStatus: "in_stock",
  });

  it("is ready shortly when open and fully stocked", () => {
    const quote = quotePickup(olaya, [line("stocked", 2)], getProduct, midday);
    expect(quote.availability).toBe("ready_soon");
    expect(quote.missingLineIds).toHaveLength(0);
    expect(quote.readyAt).toBeTruthy();
  });

  it("waits for opening when closed", () => {
    const quote = quotePickup(olaya, [line("stocked", 1)], getProduct, preDawn);
    expect(quote.availability).toBe("ready_later");
    expect(quote.isOpenNow).toBe(false);
    expect(quote.readyInMinutes!).toBeGreaterThanOrEqual(300);
  });

  it("reports a partial basket honestly instead of rounding up", () => {
    const quote = quotePickup(olaya, [line("stocked", 1), line("nowhere", 1)], getProduct, midday);
    expect(quote.availability).toBe("partial");
    expect(quote.missingLineIds).toEqual(["nowhere"]);
  });

  it("says unavailable when the branch holds none of it", () => {
    const quote = quotePickup(olaya, [line("nowhere", 1)], getProduct, midday);
    expect(quote.availability).toBe("unavailable");
  });

  it("says unavailable at a branch that does not offer pickup", () => {
    const noPickup = branch({ id: "br-x", services: ["delivery_hub"] });
    expect(quotePickup(noPickup, [line("stocked", 1)], getProduct, midday).availability).toBe("unavailable");
  });

  it("respects per-branch stock rather than network stock", () => {
    const quote = quotePickup(malaz, [line("olayaOnly", 1)], getProduct, midday);
    expect(quote.availability).toBe("unavailable");
  });
});

describe("coverage safety", () => {
  it("declines a city that has no zone rather than quoting from any branch", () => {
    const quote = quoteDelivery({
      destination: { lat: 26.4207, lng: 50.0888, city: "Dammam" },
      branches: [olaya, malaz], zones, now: midday,
    });
    expect(quote.confidence).toBe("unavailable");
    expect(quote.reason).toBe("outside_coverage");
  });

  it("still bounds by distance when coordinates arrive without a city", () => {
    const quote = quoteDelivery({
      destination: { lat: 21.4858, lng: 39.1925 },
      branches: [olaya], zones, now: midday,
    });
    expect(quote.confidence).toBe("unavailable");
  });

  it("quotes an over-capacity network later than a merely busy one", () => {
    const common = {
      destination: { lat: 24.7, lng: 46.68, city: "Riyadh" },
      branches: [olaya], zones,
      lines: [{ id: "stocked", quantity: 1, kind: "product" as const }],
      getProduct, now: midday,
    };
    const busy = quoteDelivery({ ...common, capacityLoad: 0.95 });
    const full = quoteDelivery({ ...common, capacityLoad: 1.4 });
    expect(full.minMinutes!).toBeGreaterThan(busy.minMinutes!);
  });
});
