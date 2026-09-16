import { commerce, loyalty as loyaltyCfg, TIER_FREE_DELIVERY } from "./config.ts";
import { clampToZero, percentOf, sum, vatIncludedIn } from "./money.ts";
import { pointsForSpend, quoteRedemption, tierById } from "./loyalty.ts";
import type {
  Brand,
  Bundle,
  Cart,
  CartInputLine,
  CartIssue,
  CartLine,
  CartTotals,
  FulfilmentMethod,
  Halalas,
  LoyaltyTierId,
  Product,
  Promotion,
  StockStatus,
} from "./types.ts";

/**
 * The read side the cart needs. Kept as an interface so the same pricing
 * code runs against the seeded catalogue, a database, or UCP's existing
 * ERP — whatever implements it.
 */
export interface CartCatalog {
  getProduct(id: string): Product | undefined;
  getBundle(id: string): Bundle | undefined;
  getBrand(id: string): Brand | undefined;
}

export interface CartContext {
  catalog: CartCatalog;
  fulfilment: FulfilmentMethod;
  /** Applied promotion code, already looked up. */
  promotion?: Promotion;
  tierId?: LoyaltyTierId;
  loyalty?: { balance: number; requestedPoints: number };
  /** Branch chosen for pickup; restricts stock to that branch's shelf. */
  branchId?: string;
  now?: Date;
}

const issue = (code: CartIssue["code"], message: CartIssue["message"], lineId?: string): CartIssue =>
  lineId ? { code, message, lineId } : { code, message };

function sellableQuantity(product: Product, branchId?: string): number {
  if (branchId) return product.stock.byBranch[branchId] ?? 0;
  return product.stock.quantity;
}

function bundleStock(bundle: Bundle, catalog: CartCatalog, branchId?: string): { status: StockStatus; quantity: number } {
  // A package is only as available as its scarcest component.
  let quantity = Number.POSITIVE_INFINITY;
  for (const item of bundle.items) {
    const product = catalog.getProduct(item.productId);
    if (!product) return { status: "out_of_stock", quantity: 0 };
    quantity = Math.min(quantity, Math.floor(sellableQuantity(product, branchId) / item.quantity));
  }
  if (!Number.isFinite(quantity) || quantity <= 0) return { status: "out_of_stock", quantity: 0 };
  return { status: quantity <= 3 ? "low_stock" : "in_stock", quantity };
}

/** Sum of a package's components at their individual prices. */
export function bundleComponentTotal(bundle: Bundle, catalog: CartCatalog): Halalas {
  return sum(
    bundle.items.map((item) => {
      const product = catalog.getProduct(item.productId);
      return product ? product.price * item.quantity : 0;
    }),
  );
}

function buildLine(input: CartInputLine, ctx: CartContext, issues: CartIssue[]): CartLine | null {
  const { catalog, branchId } = ctx;
  const requested = Math.min(Math.max(1, Math.floor(input.quantity)), commerce.maxLineQuantity);

  if (input.kind === "bundle") {
    const bundle = catalog.getBundle(input.id);
    if (!bundle) return null;
    const stock = bundleStock(bundle, catalog, branchId);
    const componentTotal = bundleComponentTotal(bundle, catalog);
    const quantity = Math.min(requested, stock.quantity);

    if (stock.quantity === 0) {
      issues.push(issue("out_of_stock", { ar: "الباقة غير متوفرة حاليًا", en: "This package is currently unavailable" }, bundle.id));
      return {
        kind: "bundle", id: bundle.id, slug: bundle.slug, name: bundle.name,
        imageUrl: bundle.imageUrl, unitPrice: bundle.price, compareAtUnitPrice: componentTotal,
        quantity: 0, lineTotal: 0, lineSaving: 0, requiresPrescription: false, stockStatus: "out_of_stock",
      };
    }
    if (quantity < requested) {
      issues.push(issue("quantity_reduced", { ar: "قلّلنا الكمية إلى المتوفر", en: "Quantity reduced to what is in stock" }, bundle.id));
    }

    const line: CartLine = {
      kind: "bundle", id: bundle.id, slug: bundle.slug, name: bundle.name,
      imageUrl: bundle.imageUrl, unitPrice: bundle.price,
      quantity, lineTotal: bundle.price * quantity,
      lineSaving: clampToZero(componentTotal - bundle.price) * quantity,
      requiresPrescription: false, stockStatus: stock.status,
    };
    if (componentTotal > bundle.price) line.compareAtUnitPrice = componentTotal;
    if (quantity < requested) line.quantityAdjustedTo = quantity;
    return line;
  }

  const product = catalog.getProduct(input.id);
  if (!product) return null;

  const available = sellableQuantity(product, branchId);
  const quantity = Math.min(requested, available);
  const brand = catalog.getBrand(product.brandId);
  const image = product.images[0];

  if (available === 0) {
    issues.push(issue("out_of_stock", { ar: "نفد المخزون من هذا المنتج", en: "This product is out of stock" }, product.id));
  } else if (quantity < requested) {
    issues.push(issue("quantity_reduced", { ar: "قلّلنا الكمية إلى المتوفر", en: "Quantity reduced to what is in stock" }, product.id));
  }
  if (product.requiresPrescription) {
    issues.push(issue("prescription_required", { ar: "يتطلب هذا المنتج وصفة طبية", en: "This product requires a prescription" }, product.id));
  }

  const line: CartLine = {
    kind: "product", id: product.id, slug: product.slug, name: product.name,
    imageUrl: image?.url ?? "", unitPrice: product.price,
    quantity, lineTotal: product.price * quantity,
    lineSaving: product.compareAtPrice ? clampToZero(product.compareAtPrice - product.price) * quantity : 0,
    requiresPrescription: product.requiresPrescription,
    stockStatus: available === 0 ? "out_of_stock" : product.stock.status,
  };
  if (brand) line.brandName = brand.name;
  if (product.compareAtPrice) line.compareAtUnitPrice = product.compareAtPrice;
  if (quantity < requested) line.quantityAdjustedTo = quantity;
  return line;
}

/** The part of a basket a promotion is allowed to discount. */
function promotionEligibleSubtotal(lines: CartLine[], promotion: Promotion, catalog: CartCatalog): Halalas {
  const scoped = promotion.categoryIds?.length || promotion.brandIds?.length;
  if (!scoped) return sum(lines.map((l) => l.lineTotal));

  return sum(
    lines.map((line) => {
      if (line.kind !== "product") return 0;
      const product = catalog.getProduct(line.id);
      if (!product) return 0;
      if (promotion.brandIds?.length && !promotion.brandIds.includes(product.brandId)) return 0;
      if (promotion.categoryIds?.length && !product.categoryIds.some((c) => promotion.categoryIds?.includes(c))) return 0;
      return line.lineTotal;
    }),
  );
}

export interface PromotionEvaluation {
  discount: Halalas;
  freeDelivery: boolean;
  issue?: CartIssue;
}

export function evaluatePromotion(
  promotion: Promotion,
  lines: CartLine[],
  catalog: CartCatalog,
  now: Date,
): PromotionEvaluation {
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now.getTime()) {
    return {
      discount: 0, freeDelivery: false,
      issue: issue("promotion_expired", { ar: "انتهت صلاحية هذا الكود", en: "This code has expired" }),
    };
  }

  const subtotal = sum(lines.map((l) => l.lineTotal));
  if (promotion.minSpend && subtotal < promotion.minSpend) {
    return {
      discount: 0, freeDelivery: false,
      issue: issue("promotion_min_spend", {
        ar: "لم تصل قيمة السلة للحد الأدنى لهذا الكود",
        en: "Your basket is below this code's minimum",
      }),
    };
  }

  const eligible = promotionEligibleSubtotal(lines, promotion, catalog);
  if (eligible <= 0 && promotion.kind !== "free_delivery") {
    return {
      discount: 0, freeDelivery: false,
      issue: issue("promotion_not_applicable", {
        ar: "لا ينطبق هذا الكود على منتجات سلتك",
        en: "This code does not apply to the items in your basket",
      }),
    };
  }

  if (promotion.kind === "free_delivery") return { discount: 0, freeDelivery: true };

  let discount =
    promotion.kind === "percentage" ? percentOf(eligible, promotion.value) : Math.min(promotion.value, eligible);
  if (promotion.maxDiscount) discount = Math.min(discount, promotion.maxDiscount);

  return { discount: clampToZero(discount), freeDelivery: false };
}

function deliveryFeeFor(
  fulfilment: FulfilmentMethod,
  subtotalAfterDiscount: Halalas,
  tierId: LoyaltyTierId,
  freeDeliveryPromo: boolean,
  hasSellableItems: boolean,
): { fee: Halalas; threshold: Halalas } {
  // An empty basket — or one whose every line turned out to be unavailable
  // — is never charged for a delivery that would carry nothing.
  if (!hasSellableItems) return { fee: 0, threshold: commerce.freeDeliveryThreshold };
  if (fulfilment === "pickup") return { fee: commerce.pickupFee, threshold: 0 };
  const threshold = TIER_FREE_DELIVERY[tierId] ?? commerce.freeDeliveryThreshold;
  if (freeDeliveryPromo || subtotalAfterDiscount >= threshold) return { fee: 0, threshold };
  return { fee: commerce.standardDeliveryFee, threshold };
}

/**
 * Turns the client's (id, quantity) list into a fully priced basket.
 *
 * The client never sends a price. Everything here is re-derived from the
 * catalogue on each call, which is what makes it safe to keep the cart in
 * the browser: tampering with local state changes what you asked for,
 * never what you are charged.
 */
export function buildCart(input: CartInputLine[], ctx: CartContext): Cart {
  const now = ctx.now ?? new Date();
  const tierId = ctx.tierId ?? "member";
  const issues: CartIssue[] = [];

  const lines = input
    .map((line) => buildLine(line, ctx, issues))
    .filter((line): line is CartLine => line !== null);

  const subtotal = sum(lines.map((l) => l.lineTotal));
  const productSavings = sum(lines.map((l) => l.lineSaving));

  let promotionDiscount = 0;
  let freeDeliveryPromo = false;
  let appliedPromotion: Promotion | undefined;

  if (ctx.promotion) {
    const evaluation = evaluatePromotion(ctx.promotion, lines, ctx.catalog, now);
    if (evaluation.issue) {
      issues.push(evaluation.issue);
    } else {
      promotionDiscount = evaluation.discount;
      freeDeliveryPromo = evaluation.freeDelivery;
      appliedPromotion = ctx.promotion;
    }
  }

  const afterPromotion = clampToZero(subtotal - promotionDiscount);

  const redemption = ctx.loyalty
    ? quoteRedemption(ctx.loyalty.requestedPoints, ctx.loyalty.balance, afterPromotion)
    : { points: 0, value: 0 };
  const loyaltyDiscount = redemption.value;

  const goodsTotal = clampToZero(afterPromotion - loyaltyDiscount);
  const hasSellableItems = lines.some((line) => line.quantity > 0);
  const { fee: deliveryFee, threshold } = deliveryFeeFor(
    ctx.fulfilment,
    afterPromotion,
    tierId,
    freeDeliveryPromo,
    hasSellableItems,
  );

  const total = goodsTotal + deliveryFee;

  const totals: CartTotals = {
    itemCount: sum(lines.map((l) => l.quantity)),
    subtotal,
    productSavings,
    promotionDiscount,
    loyaltyDiscount,
    deliveryFee,
    freeDeliveryRemaining:
      ctx.fulfilment === "delivery" && deliveryFee > 0 ? clampToZero(threshold - afterPromotion) : 0,
    vatIncluded: vatIncludedIn(total),
    total,
    // Points are earned on money actually paid for goods, so redeeming
    // points never earns points back on the redeemed portion.
    pointsEarned: pointsForSpend(goodsTotal, tierId),
  };

  const cart: Cart = { lines, totals, issues };
  if (appliedPromotion) cart.appliedPromotion = appliedPromotion;
  return cart;
}

/** Blocks checkout. Prescription items are allowed through — they route to review. */
export function blockingIssues(cart: Cart): CartIssue[] {
  return cart.issues.filter((i) => i.code === "out_of_stock");
}

export function cartRequiresPrescription(cart: Cart): boolean {
  return cart.lines.some((line) => line.requiresPrescription);
}

export const cartConstants = { ...commerce, loyalty: loyaltyCfg, tierById };
