import { buildCart, type CartCatalog, type CartInputLine, type FulfilmentMethod } from "@ucp/core";
import { data } from "@/lib/data.ts";
import { getSession } from "@/lib/session.ts";
import { apiError, apiOk, readJson, toBoundedInt } from "@/lib/api.ts";
import { clientKey, rateLimit } from "@/lib/rate-limit.ts";

/**
 * Cart pricing.
 *
 * This route is the reason the browser can hold the cart safely: it takes
 * ids and quantities and returns a fully priced basket derived from the
 * catalogue. Nothing the client sends about money is read, because nothing
 * it sends about money exists in the request shape.
 *
 * It is idempotent and has no side effects, so it can be called freely on
 * every cart change.
 */

export const dynamic = "force-dynamic";

interface PriceRequest {
  lines?: unknown;
  fulfilment?: unknown;
  branchId?: unknown;
  promoCode?: unknown;
  points?: unknown;
}

/** Accepts only the shape we expect, discarding anything else. */
function parseLines(value: unknown): CartInputLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item): CartInputLine[] => {
    if (typeof item !== "object" || item === null) return [];
    const line = item as Record<string, unknown>;
    if (line.kind !== "product" && line.kind !== "bundle") return [];
    if (typeof line.id !== "string" || line.id.length === 0 || line.id.length > 128) return [];
    return [{ kind: line.kind, id: line.id, quantity: toBoundedInt(line.quantity, 1, 20, 1) }];
  });
}

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "cart"), 120, 60);
  if (!limit.allowed) {
    return apiError("rate_limited", undefined, { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson<PriceRequest>(request);
  if (!body) return apiError("bad_request");

  const lines = parseLines(body.lines);
  const fulfilment: FulfilmentMethod = body.fulfilment === "pickup" ? "pickup" : "delivery";
  const branchId = typeof body.branchId === "string" ? body.branchId : undefined;
  const promoCode = typeof body.promoCode === "string" ? body.promoCode : undefined;

  const [products, bundles, brands, session] = await Promise.all([
    data.catalog.allProducts(),
    data.catalog.listBundles(),
    data.catalog.listBrands(),
    getSession(),
  ]);

  const productsById = new Map(products.map((p) => [p.id, p]));
  const bundlesById = new Map(bundles.map((b) => [b.id, b]));
  const brandsById = new Map(brands.map((b) => [b.id, b]));

  const catalog: CartCatalog = {
    getProduct: (id) => productsById.get(id),
    getBundle: (id) => bundlesById.get(id),
    getBrand: (id) => brandsById.get(id),
  };

  const promotion = promoCode ? await data.promotions.getPromotion(promoCode) : undefined;

  // A code the customer typed that does not exist is a cart issue rather
  // than a request error — the basket still prices, and the UI explains.
  const promotionMissing = Boolean(promoCode) && !promotion;

  // Points come from the loyalty account, never from the request, so a
  // crafted payload cannot redeem points the customer does not hold.
  const loyaltyBalance = session?.loyalty?.pointsBalance ?? 0;
  const requestedPoints = session ? toBoundedInt(body.points, 0, loyaltyBalance, 0) : 0;

  const cart = buildCart(lines, {
    catalog,
    fulfilment,
    ...(promotion ? { promotion } : {}),
    ...(branchId ? { branchId } : {}),
    ...(session?.loyalty ? { tierId: session.loyalty.tierId } : {}),
    ...(session && requestedPoints > 0
      ? { loyalty: { balance: loyaltyBalance, requestedPoints } }
      : {}),
  });

  if (promotionMissing) {
    cart.issues.push({
      code: "promotion_invalid",
      message: { ar: "هذا الكود غير صحيح", en: "That code is not valid" },
    });
  }

  return apiOk(cart, { "cache-control": "no-store" });
}
