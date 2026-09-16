import type { Branch, CartLine, Halalas, Localized, OpeningHours, Product } from "./types.ts";

/**
 * Delivery ETA and pickup readiness.
 *
 * The governing rule (brief §11) is that UCP must not show an ETA it
 * cannot stand behind. So this module never returns a bare time — it
 * returns a window plus a `confidence`, and the UI renders a firm promise
 * only for `promised`. Everything else is phrased as an estimate or is
 * withheld entirely, with a machine-readable reason the UI can explain.
 */

/** KSA does not observe DST, so a fixed offset is correct year-round. */
const RIYADH_UTC_OFFSET_MINUTES = 180;

export interface LocalTime {
  dayOfWeek: number;
  minutes: number;
}

export function branchLocalTime(now: Date): LocalTime {
  const shifted = new Date(now.getTime() + RIYADH_UTC_OFFSET_MINUTES * 60_000);
  return {
    dayOfWeek: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function isBranchOpen(hours: OpeningHours, now: Date): boolean {
  const { dayOfWeek, minutes } = branchLocalTime(now);
  const today = hours[dayOfWeek];
  if (!today) return false;
  // A window whose close is <= open runs past midnight.
  if (today.close <= today.open) return minutes >= today.open || minutes < today.close;
  return minutes >= today.open && minutes < today.close;
}

/** Minutes from `now` until the branch next opens. 0 when already open. */
export function minutesUntilOpen(hours: OpeningHours, now: Date): number | null {
  if (isBranchOpen(hours, now)) return 0;
  const { dayOfWeek, minutes } = branchLocalTime(now);
  for (let offset = 0; offset < 8; offset += 1) {
    const day = (dayOfWeek + offset) % 7;
    const window = hours[day];
    if (!window) continue;
    const openAt = offset * 1440 + window.open;
    const cursor = minutes;
    if (openAt > cursor) return openAt - cursor;
  }
  return null;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type EtaConfidence = "promised" | "estimated" | "unavailable";

export type EtaReason =
  | "same_day"
  | "next_opening"
  | "branch_closed"
  | "high_demand"
  | "no_stock_nearby"
  | "outside_coverage"
  | "prescription_review";

export interface EtaQuote {
  confidence: EtaConfidence;
  reason: EtaReason;
  /** Absolute window, only present when confidence is not "unavailable". */
  from?: string;
  to?: string;
  minMinutes?: number;
  maxMinutes?: number;
  branchId?: string;
  distanceKm?: number;
  /** Short, already-localised label for the UI. */
  label: Localized;
}

export interface DeliveryZone {
  city: string;
  /** Branches that serve this city, nearest-first is not assumed. */
  branchIds: string[];
  /** Typical drive time within the zone, before distance adjustment. */
  baseTravelMinutes: number;
  maxRadiusKm: number;
}

export interface EtaInput {
  destination?: { lat: number; lng: number; city?: string };
  branches: Branch[];
  zones: DeliveryZone[];
  /** Lines to be fulfilled; used to check the branch actually holds them. */
  lines?: Array<{ id: string; quantity: number; kind: "product" | "bundle" }>;
  getProduct?: (id: string) => Product | undefined;
  /**
   * Current rider load, 0..1+. Above 0.85 the window widens and the quote
   * degrades from a promise to an estimate; above 1 same-day is withheld.
   */
  capacityLoad?: number;
  requiresPrescription?: boolean;
  now?: Date;
}

/** Order assembly time inside the branch, before a rider picks it up. */
const PREP_MINUTES = 20;
const PRESCRIPTION_REVIEW_MINUTES = 45;
/** Orders placed within this long before closing roll to the next day. */
const CUTOFF_BEFORE_CLOSE_MINUTES = 45;
/** Backlog assumed once rider capacity is fully committed. */
const OVERLOAD_BACKLOG_MINUTES = 180;
/** Used only when the caller gave coordinates but no city. */
const DEFAULT_MAX_RADIUS_KM = 20;

function branchHasStock(
  branch: Branch,
  lines: EtaInput["lines"],
  getProduct: EtaInput["getProduct"],
): boolean {
  if (!lines?.length || !getProduct) return true;
  return lines.every((line) => {
    if (line.kind === "bundle") return true; // checked against components elsewhere
    const product = getProduct(line.id);
    if (!product) return false;
    return (product.stock.byBranch[branch.id] ?? 0) >= line.quantity;
  });
}

function windowLabel(minMinutes: number, maxMinutes: number, sameDay: boolean): Localized {
  if (sameDay) {
    if (maxMinutes <= 60) return { ar: "خلال ساعة", en: "Within the hour" };
    if (maxMinutes <= 180) {
      const h = Math.round(maxMinutes / 60);
      return { ar: `خلال ${h} ساعات`, en: `Within ${h} hours` };
    }
    return { ar: "اليوم", en: "Today" };
  }
  const hours = Math.round(maxMinutes / 60);
  if (hours <= 30) return { ar: "غدًا", en: "Tomorrow" };
  return { ar: `خلال ${Math.ceil(hours / 24)} أيام`, en: `Within ${Math.ceil(hours / 24)} days` };
}

/**
 * Quotes a delivery window, or declines to.
 *
 * Returning `unavailable` is a first-class outcome, not a failure: it is
 * what stops the storefront promising a slot the branch network cannot
 * actually serve.
 */
export function quoteDelivery(input: EtaInput): EtaQuote {
  const now = input.now ?? new Date();
  const load = input.capacityLoad ?? 0;

  if (!input.destination) {
    return {
      confidence: "unavailable",
      reason: "outside_coverage",
      label: { ar: "أدخل عنوانك لمعرفة وقت التوصيل", en: "Add your address for a delivery time" },
    };
  }

  const zone = input.zones.find((z) => z.city === input.destination?.city);

  // A named city with no zone is not covered. Falling back to "any branch"
  // here is how a storefront ends up promising same-day delivery to a city
  // it does not serve, so an unmatched city is an explicit decline.
  if (input.destination.city && !zone) {
    return {
      confidence: "unavailable",
      reason: "outside_coverage",
      label: { ar: "لا نوصل إلى هذه المدينة حاليًا", en: "We do not deliver to this city yet" },
    };
  }

  const candidates = (zone
    ? input.branches.filter((b) => zone.branchIds.includes(b.id))
    : input.branches
  ).filter((b) => b.services.includes("delivery_hub") || b.services.includes("pickup"));

  if (candidates.length === 0) {
    return {
      confidence: "unavailable",
      reason: "outside_coverage",
      label: { ar: "التوصيل غير متاح لهذا العنوان بعد", en: "Delivery is not available to this address yet" },
    };
  }

  const ranked = candidates
    .map((branch) => ({
      branch,
      distanceKm: haversineKm(input.destination!, branch),
      hasStock: branchHasStock(branch, input.lines, input.getProduct),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const maxRadiusKm = zone?.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const inRange = ranked.filter((c) => c.distanceKm <= maxRadiusKm);
  if (inRange.length === 0) {
    return {
      confidence: "unavailable",
      reason: "outside_coverage",
      label: { ar: "العنوان خارج نطاق التوصيل السريع", en: "Outside the express delivery area" },
    };
  }

  const stocked = inRange.find((c) => c.hasStock);
  if (!stocked) {
    // The goods exist, just not near enough for a same-day promise. Say
    // that plainly instead of inventing a window.
    return {
      confidence: "estimated",
      reason: "no_stock_nearby",
      minMinutes: 24 * 60,
      maxMinutes: 48 * 60,
      label: { ar: "يصل خلال يومين من مستودعنا", en: "Arrives within 2 days from our warehouse" },
    };
  }

  const { branch, distanceKm } = stocked;
  const travel = Math.round((zone?.baseTravelMinutes ?? 35) + distanceKm * 2.5);
  const prep = PREP_MINUTES + (input.requiresPrescription ? PRESCRIPTION_REVIEW_MINUTES : 0);
  const congestion = load > 0.85 ? Math.round(travel * (load - 0.85) * 2) : 0;

  const waitForOpen = minutesUntilOpen(branch.hours, now);
  const open = waitForOpen === 0;

  // Too close to closing to assemble and dispatch today.
  const local = branchLocalTime(now);
  const todayHours = branch.hours[local.dayOfWeek];
  const nearClosing =
    open && todayHours && todayHours.close > todayHours.open
      ? todayHours.close - local.minutes < CUTOFF_BEFORE_CLOSE_MINUTES + prep
      : false;

  if (!open || nearClosing || load > 1) {
    // Over-capacity means a real backlog. Without this the "no slots left"
    // branch would quote sooner than the merely-busy branch above it.
    const overloadDelay = load > 1 ? OVERLOAD_BACKLOG_MINUTES : 0;
    const wait = Math.max(
      waitForOpen === null ? 24 * 60 : Math.max(waitForOpen, nearClosing ? 12 * 60 : 0),
      overloadDelay,
    );
    const minMinutes = wait + prep + travel;
    const maxMinutes = minMinutes + 90;
    const quote: EtaQuote = {
      confidence: "estimated",
      reason: load > 1 ? "high_demand" : nearClosing ? "next_opening" : "branch_closed",
      minMinutes,
      maxMinutes,
      from: new Date(now.getTime() + minMinutes * 60_000).toISOString(),
      to: new Date(now.getTime() + maxMinutes * 60_000).toISOString(),
      branchId: branch.id,
      distanceKm: Math.round(distanceKm * 10) / 10,
      label: windowLabel(minMinutes, maxMinutes, false),
    };
    return quote;
  }

  const minMinutes = prep + travel + congestion;
  const maxMinutes = minMinutes + (load > 0.85 ? 60 : 30);

  return {
    confidence: load > 0.85 ? "estimated" : "promised",
    reason: load > 0.85 ? "high_demand" : input.requiresPrescription ? "prescription_review" : "same_day",
    minMinutes,
    maxMinutes,
    from: new Date(now.getTime() + minMinutes * 60_000).toISOString(),
    to: new Date(now.getTime() + maxMinutes * 60_000).toISOString(),
    branchId: branch.id,
    distanceKm: Math.round(distanceKm * 10) / 10,
    label: windowLabel(minMinutes, maxMinutes, true),
  };
}

export type PickupAvailability = "ready_soon" | "ready_later" | "partial" | "unavailable";

export interface PickupQuote {
  branchId: string;
  availability: PickupAvailability;
  readyInMinutes?: number;
  readyAt?: string;
  /** Lines the branch cannot currently supply. */
  missingLineIds: string[];
  isOpenNow: boolean;
  label: Localized;
}

/**
 * Pickup readiness for one branch. `partial` is reported honestly rather
 * than rounded up to "available" — a customer who drives to a branch for
 * three items and finds two is a customer UCP loses.
 */
export function quotePickup(
  branch: Branch,
  lines: CartLine[],
  getProduct: (id: string) => Product | undefined,
  now: Date = new Date(),
): PickupQuote {
  const isOpenNow = isBranchOpen(branch.hours, now);
  const missingLineIds: string[] = [];

  for (const line of lines) {
    if (line.kind === "bundle") continue;
    const product = getProduct(line.id);
    const onShelf = product ? (product.stock.byBranch[branch.id] ?? 0) : 0;
    if (onShelf < line.quantity) missingLineIds.push(line.id);
  }

  if (!branch.services.includes("pickup")) {
    return {
      branchId: branch.id, availability: "unavailable", missingLineIds, isOpenNow,
      label: { ar: "الاستلام غير متاح من هذا الفرع", en: "Pickup is not offered at this branch" },
    };
  }

  if (missingLineIds.length === lines.length && lines.length > 0) {
    return {
      branchId: branch.id, availability: "unavailable", missingLineIds, isOpenNow,
      label: { ar: "غير متوفر في هذا الفرع", en: "Not available at this branch" },
    };
  }

  const wait = minutesUntilOpen(branch.hours, now) ?? 24 * 60;
  const readyInMinutes = wait + PREP_MINUTES;

  if (missingLineIds.length > 0) {
    return {
      branchId: branch.id, availability: "partial", missingLineIds, isOpenNow, readyInMinutes,
      readyAt: new Date(now.getTime() + readyInMinutes * 60_000).toISOString(),
      label: { ar: "بعض المنتجات فقط متوفرة هنا", en: "Only some items are available here" },
    };
  }

  if (isOpenNow) {
    return {
      branchId: branch.id, availability: "ready_soon", missingLineIds, isOpenNow, readyInMinutes,
      readyAt: new Date(now.getTime() + readyInMinutes * 60_000).toISOString(),
      label: { ar: `جاهز خلال ${PREP_MINUTES} دقيقة`, en: `Ready in ${PREP_MINUTES} minutes` },
    };
  }

  return {
    branchId: branch.id, availability: "ready_later", missingLineIds, isOpenNow, readyInMinutes,
    readyAt: new Date(now.getTime() + readyInMinutes * 60_000).toISOString(),
    label: { ar: "جاهز بعد فتح الفرع", en: "Ready after the branch opens" },
  };
}

/** Cheapest-to-compute signal for a product card: can we get it today? */
export function sameDayPossible(product: Product, branches: Branch[]): boolean {
  return branches.some((b) => (product.stock.byBranch[b.id] ?? 0) > 0 && b.services.includes("delivery_hub"));
}

export const fulfilmentConstants = {
  PREP_MINUTES,
  PRESCRIPTION_REVIEW_MINUTES,
  CUTOFF_BEFORE_CLOSE_MINUTES,
  OVERLOAD_BACKLOG_MINUTES,
  DEFAULT_MAX_RADIUS_KM,
};

export type { Halalas };
