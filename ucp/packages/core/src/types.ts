/**
 * The UCP domain model.
 *
 * This package is deliberately dependency-free and platform-free: it is
 * imported unchanged by the Next.js app, the API route handlers and the
 * React Native app, so pricing, loyalty and eligibility rules cannot
 * diverge between surfaces.
 */

export type Locale = "ar" | "en";

/** Every customer-visible string carries both scripts. */
export interface Localized {
  ar: string;
  en: string;
}

/**
 * Money is always an integer count of halalas (1 SAR = 100 halalas).
 *
 * Floats are never used for money anywhere in the platform — 0.1 + 0.2
 * problems in a cart total are a trust failure, not a rounding detail.
 */
export type Halalas = number;

export const CURRENCY = "SAR" as const;

/** KSA standard-rate VAT. Shelf prices are VAT-inclusive, as required. */
export const VAT_RATE = 0.15;

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export interface Brand {
  id: string;
  slug: string;
  name: Localized;
  logoUrl: string;
  description?: Localized;
  /** Ordering hint for the homepage rail; lower sorts first. */
  position?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: Localized;
  /** null for a top-level category. */
  parentId: string | null;
  /** Key into the icon set — categories never ship ad-hoc artwork. */
  iconKey: string;
  description?: Localized;
  position: number;
  /** Surfaced in the homepage category grid. */
  featured?: boolean;
}

export interface ProductImage {
  url: string;
  alt: Localized;
  width: number;
  height: number;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductStock {
  status: StockStatus;
  /** Total sellable units across the fulfilment network. */
  quantity: number;
  /** Per-branch availability, drives pickup eligibility. */
  byBranch: Record<string, number>;
}

export interface ProductAttribute {
  key: string;
  label: Localized;
  value: Localized;
}

/**
 * Supplement metadata. Present only on products where a daily-dose model
 * is meaningful; it is what makes the vitamin follow-up service possible
 * without guessing.
 */
export interface SupplementFacts {
  /** Units (tablets, capsules, ml doses) in one pack. */
  unitsPerPack: number;
  /** Label's own recommended units per day. Never invented by UCP. */
  labelDailyUnits: number;
  unitLabel: Localized;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: Localized;
  brandId: string;
  /** Primary category first; used for breadcrumbs and canonical URLs. */
  categoryIds: string[];
  /** Current selling price, VAT-inclusive. */
  price: Halalas;
  /** Was-price. Only set when the product genuinely sold at this price. */
  compareAtPrice?: Halalas;
  images: ProductImage[];
  shortDescription: Localized;
  description: Localized;
  attributes: ProductAttribute[];
  howToUse?: Localized;
  ingredients?: Localized;
  warnings?: Localized;
  stock: ProductStock;
  /** Gated behind prescription upload and pharmacist review. */
  requiresPrescription: boolean;
  supplement?: SupplementFacts;
  /** Free-form merchandising tags, e.g. "sensitive-skin", "spf". */
  tags: string[];
  /** Search keywords in both scripts, including common misspellings. */
  keywords: string[];
  createdAt: string;
  /**
   * NOTE: there is deliberately no `rating` or `reviewCount` field.
   * UCP has no review corpus, and inventing one would be fabricating
   * social proof. Add these only when real reviews exist.
   */
}

/**
 * A curated multi-product package sold at a single price — the Oral Care
 * packages, and any other "complete routine" offer.
 */
export interface Bundle {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Component products and how many of each the package contains. */
  items: Array<{ productId: string; quantity: number }>;
  /** The package price. Must be <= sum of component prices. */
  price: Halalas;
  imageUrl: string;
  categoryId: string;
  position?: number;
}

// ---------------------------------------------------------------------------
// Fulfilment
// ---------------------------------------------------------------------------

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday. Minutes from midnight, branch-local. */
  [dayOfWeek: number]: { open: number; close: number } | null;
}

export interface Branch {
  id: string;
  code: string;
  name: Localized;
  city: Localized;
  district: Localized;
  address: Localized;
  lat: number;
  lng: number;
  phone: string;
  hours: OpeningHours;
  services: Array<"pickup" | "prescription" | "telepharmacy" | "delivery_hub">;
}

export type FulfilmentMethod = "delivery" | "pickup";

export interface Address {
  id: string;
  label: Localized | string;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  buildingNo?: string;
  additionalNo?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

// ---------------------------------------------------------------------------
// Cart & orders
// ---------------------------------------------------------------------------

/** What the client is allowed to send. Never prices — those are re-derived. */
export interface CartInputLine {
  kind: "product" | "bundle";
  id: string;
  quantity: number;
}

export interface CartLine {
  kind: "product" | "bundle";
  id: string;
  slug: string;
  name: Localized;
  brandName?: Localized;
  imageUrl: string;
  unitPrice: Halalas;
  compareAtUnitPrice?: Halalas;
  quantity: number;
  lineTotal: Halalas;
  /** Saving against the was-price, if any. */
  lineSaving: Halalas;
  requiresPrescription: boolean;
  stockStatus: StockStatus;
  /** Set when the requested quantity exceeds what is sellable. */
  quantityAdjustedTo?: number;
}

export type PromotionKind = "percentage" | "fixed" | "free_delivery";

export interface Promotion {
  code: string;
  kind: PromotionKind;
  /** Percent (0-100) for `percentage`, halalas for `fixed`. */
  value: number;
  minSpend?: Halalas;
  /** Restricts the promotion to these categories, if set. */
  categoryIds?: string[];
  /** Restricts the promotion to these brands, if set. */
  brandIds?: string[];
  maxDiscount?: Halalas;
  description: Localized;
  expiresAt?: string;
}

export interface CartTotals {
  itemCount: number;
  /** Sum of line totals at current prices. */
  subtotal: Halalas;
  /** Total already saved versus was-prices, before promo/loyalty. */
  productSavings: Halalas;
  promotionDiscount: Halalas;
  loyaltyDiscount: Halalas;
  deliveryFee: Halalas;
  /** How much more to spend to earn free delivery; 0 when already free. */
  freeDeliveryRemaining: Halalas;
  /** VAT contained within the total (prices are VAT-inclusive). */
  vatIncluded: Halalas;
  total: Halalas;
  pointsEarned: number;
}

export interface Cart {
  lines: CartLine[];
  totals: CartTotals;
  appliedPromotion?: Promotion;
  /** Machine-readable problems the UI must surface before checkout. */
  issues: CartIssue[];
}

export type CartIssueCode =
  | "out_of_stock"
  | "quantity_reduced"
  | "prescription_required"
  | "promotion_invalid"
  | "promotion_min_spend"
  | "promotion_expired"
  | "promotion_not_applicable";

export interface CartIssue {
  code: CartIssueCode;
  lineId?: string;
  message: Localized;
}

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "pharmacist_review"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "collected"
  | "cancelled";

export type PaymentMethod = "card" | "apple_pay" | "mada" | "cash_on_delivery" | "tabby";

export interface Order {
  id: string;
  reference: string;
  customerId: string;
  createdAt: string;
  status: OrderStatus;
  lines: CartLine[];
  totals: CartTotals;
  fulfilment: FulfilmentMethod;
  address?: Address;
  branchId?: string;
  /** The window quoted at checkout, kept for accountability. */
  promisedWindow?: { from: string; to: string };
  paymentMethod: PaymentMethod;
  /** Never the PAN — only what is needed to identify the card to a human. */
  paymentSummary?: { brand: string; last4: string };
  promotionCode?: string;
  prescriptionId?: string;
  pointsEarned: number;
  pointsRedeemed: number;
}

// ---------------------------------------------------------------------------
// Customer & services
// ---------------------------------------------------------------------------

export type LoyaltyTierId = "member" | "select" | "elite";

export interface LoyaltyTier {
  id: LoyaltyTierId;
  name: Localized;
  /** Lifetime points required to hold the tier. */
  threshold: number;
  /** Points earned per whole riyal spent. */
  earnRate: number;
  benefits: Localized[];
}

export interface LoyaltyAccount {
  customerId: string;
  pointsBalance: number;
  lifetimePoints: number;
  tierId: LoyaltyTierId;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** scrypt-derived; never leaves the server. */
  passwordHash?: string;
  addresses: Address[];
  createdAt: string;
  locale: Locale;
}

export type PrescriptionStatus =
  | "submitted"
  | "in_review"
  | "clarification_needed"
  | "approved"
  | "rejected"
  | "fulfilled";

export interface Prescription {
  id: string;
  reference: string;
  customerId: string;
  createdAt: string;
  status: PrescriptionStatus;
  /** Object-storage keys, not public URLs. Served through an authorised route. */
  fileKeys: string[];
  patientName: string;
  patientNationalIdLast4?: string;
  notes?: string;
  fulfilment: FulfilmentMethod;
  branchId?: string;
  addressId?: string;
  pharmacistNote?: Localized;
  orderId?: string;
}

export type TelepharmacyChannel = "chat" | "video";

export type TelepharmacyStatus = "requested" | "scheduled" | "in_progress" | "completed" | "cancelled";

export interface TelepharmacySession {
  id: string;
  customerId: string;
  channel: TelepharmacyChannel;
  status: TelepharmacyStatus;
  topic: string;
  createdAt: string;
  scheduledFor?: string;
  pharmacistName?: Localized;
}

/**
 * A customer's follow-up plan for a supplement they bought. Reminder times
 * and dose are chosen by the customer — UCP never sets a dose.
 */
export interface VitaminPlan {
  id: string;
  customerId: string;
  productId: string;
  orderId?: string;
  startedAt: string;
  /** Units the customer chose to take per day. */
  dailyUnits: number;
  unitsPurchased: number;
  /** Local times ("08:00") the customer asked to be reminded at. */
  reminderTimes: string[];
  remindersEnabled: boolean;
  /** Days the customer marked as taken, ISO dates. */
  takenDates: string[];
  active: boolean;
}
