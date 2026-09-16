import type { Halalas, Locale } from "./types.ts";

/**
 * Analytics.
 *
 * A typed event union plus a provider registry. Application code calls
 * `track(...)` and never touches a vendor SDK, so swapping GA4 for
 * Amplitude — or running both during a migration — is a change in one
 * file and no change to any component (brief §33).
 */

export interface AnalyticsItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price: Halalas;
  quantity: number;
}

export type AnalyticsEvent =
  | { name: "page_view"; path: string; locale: Locale }
  | { name: "search"; query: string; resultCount: number }
  | { name: "search_suggestion_click"; query: string; kind: string; targetId: string }
  | { name: "view_item"; item: AnalyticsItem }
  | { name: "view_item_list"; listId: string; itemCount: number }
  | { name: "add_to_cart"; item: AnalyticsItem; source: string }
  | { name: "remove_from_cart"; item: AnalyticsItem }
  | { name: "view_cart"; value: Halalas; itemCount: number }
  | { name: "begin_checkout"; value: Halalas; itemCount: number }
  | { name: "add_shipping_info"; method: "delivery" | "pickup" }
  | { name: "add_payment_info"; method: string }
  | { name: "purchase"; orderId: string; value: Halalas; items: AnalyticsItem[]; coupon?: string }
  | { name: "checkout_error"; step: string; reason: string }
  | { name: "coupon_applied"; code: string; discount: Halalas }
  | { name: "coupon_rejected"; code: string; reason: string }
  | { name: "prescription_started"; source: string }
  | { name: "prescription_submitted"; prescriptionId: string; fileCount: number }
  | { name: "prescription_failed"; reason: string }
  | { name: "pickup_branch_selected"; branchId: string }
  | { name: "reorder"; orderId: string; itemCount: number }
  | { name: "loyalty_viewed"; tier: string; points: number }
  | { name: "loyalty_redeemed"; points: number; value: Halalas }
  | { name: "telepharmacy_requested"; channel: string }
  | { name: "vitamin_plan_created"; productId: string }
  | { name: "vitamin_reorder_clicked"; planId: string };

export type AnalyticsEventName = AnalyticsEvent["name"];

export interface AnalyticsProvider {
  readonly id: string;
  /** Called once, client-side, before any event is delivered. */
  init?(): void | Promise<void>;
  track(event: AnalyticsEvent): void;
  identify?(userId: string | null): void;
}

const providers: AnalyticsProvider[] = [];
let queue: AnalyticsEvent[] = [];
let ready = false;

export function registerProvider(provider: AnalyticsProvider): void {
  if (providers.some((p) => p.id === provider.id)) return;
  providers.push(provider);
}

export async function initAnalytics(): Promise<void> {
  if (ready) return;
  await Promise.all(providers.map((p) => p.init?.()));
  ready = true;
  // Events fired during hydration are not lost; they are replayed once
  // the providers are up.
  const pending = queue;
  queue = [];
  for (const event of pending) dispatch(event);
}

function dispatch(event: AnalyticsEvent): void {
  for (const provider of providers) {
    try {
      provider.track(event);
    } catch {
      // Analytics must never break the storefront. A provider that throws
      // is dropped for this event and the others still receive it.
    }
  }
}

export function track(event: AnalyticsEvent): void {
  if (!ready) {
    // Bounded so a misconfigured provider cannot grow this without limit.
    if (queue.length < 100) queue.push(event);
    return;
  }
  dispatch(event);
}

export function identify(userId: string | null): void {
  for (const provider of providers) {
    try {
      provider.identify?.(userId);
    } catch {
      /* ignore */
    }
  }
}

/** Test/debug provider. Also the reference implementation. */
export const consoleProvider: AnalyticsProvider = {
  id: "console",
  track(event) {
    if (typeof console !== "undefined") console.debug("[analytics]", event.name, event);
  },
};

/**
 * GTM / GA4-compatible provider: pushes to `window.dataLayer` using GA4's
 * own event names where they exist, so a standard GA4 container works
 * without custom mapping.
 */
export function dataLayerProvider(): AnalyticsProvider {
  const GA4_NAMES: Partial<Record<AnalyticsEventName, string>> = {
    page_view: "page_view",
    search: "search",
    view_item: "view_item",
    view_item_list: "view_item_list",
    add_to_cart: "add_to_cart",
    remove_from_cart: "remove_from_cart",
    view_cart: "view_cart",
    begin_checkout: "begin_checkout",
    add_shipping_info: "add_shipping_info",
    add_payment_info: "add_payment_info",
    purchase: "purchase",
  };

  return {
    id: "datalayer",
    init() {
      const w = globalThis as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer ?? [];
    },
    track(event) {
      const w = globalThis as { dataLayer?: unknown[] };
      if (!w.dataLayer) return;
      const { name, ...params } = event;
      w.dataLayer.push({ event: GA4_NAMES[name] ?? name, ...params });
    },
  };
}

export function resetAnalyticsForTests(): void {
  providers.length = 0;
  queue = [];
  ready = false;
}
