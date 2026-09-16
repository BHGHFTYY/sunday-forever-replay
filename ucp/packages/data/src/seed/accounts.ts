import {
  riyals, vatIncludedIn, pointsForSpend, pointsToHalalas,
  commerce, TIER_FREE_DELIVERY,
} from "@ucp/core";
import type {
  CartLine, Customer, LoyaltyAccount, Order, Prescription, VitaminPlan,
} from "@ucp/core";

/**
 * Demo account data.
 *
 * One signed-in customer with real order history, which is what makes the
 * data-driven homepage rails ("أعد طلب مشترياتك", "مختارات لك") and the
 * co-purchase recommendations demonstrable. Without history those sections
 * correctly render as nothing, so this exists to show both states.
 *
 * The password hash is generated at startup from a known demo password —
 * see `packages/data/src/auth-store.ts`. No hash is committed to the repo.
 */

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

export const DEMO_CUSTOMER_EMAIL = "sara@example.com";
/** Published on the sign-in screen; this is demo data, not a secret. */
export const DEMO_CUSTOMER_PASSWORD = "ucp-demo-2026";

export const demoCustomer: Customer = {
  id: "cust-demo",
  name: "سارة العتيبي",
  email: DEMO_CUSTOMER_EMAIL,
  phone: "+966500000000",
  locale: "ar",
  createdAt: "2026-02-11T08:00:00.000Z",
  addresses: [
    {
      id: "addr-home",
      label: { ar: "المنزل", en: "Home" },
      recipientName: "سارة العتيبي",
      phone: "+966500000000",
      city: "Riyadh",
      district: "النرجس",
      street: "طريق أنس بن مالك",
      buildingNo: "3241",
      additionalNo: "7712",
      lat: 24.8247,
      lng: 46.6408,
      isDefault: true,
    },
    {
      id: "addr-work",
      label: { ar: "العمل", en: "Work" },
      recipientName: "سارة العتيبي",
      phone: "+966500000000",
      city: "Riyadh",
      district: "العليا",
      street: "طريق العليا العام",
      buildingNo: "1180",
      lat: 24.6949,
      lng: 46.6853,
    },
  ],
};

export const demoLoyalty: LoyaltyAccount = {
  customerId: demoCustomer.id,
  pointsBalance: 1340,
  lifetimePoints: 3120,
  tierId: "select",
};

/**
 * Order history. Deliberately varied — delivered, collected, in review and
 * cancelled — so every order state in the account area is reachable from
 * real data rather than being a design-only mock.
 */
/**
 * Order history. Deliberately varied — delivered, collected, in review and
 * cancelled — so every order state in the account area is reachable from
 * real data rather than being a design-only mock.
 *
 * Totals are DERIVED from the lines using the same commerce rules the live
 * cart applies, rather than typed in. Hand-written history drifts away from
 * the rules the moment a threshold changes, and a customer comparing an old
 * order against a new one would see the arithmetic disagree.
 */
export const demoOrders: Order[] = [
  order({
    id: "ord-1041", daysBack: 6, status: "delivered", fulfilment: "delivery",
    address: demoCustomer.addresses[0]!,
    paymentMethod: "mada", paymentSummary: { brand: "mada", last4: "4417" },
    promotionCode: "WELCOME10", promotionDiscount: riyals(22.7),
    lines: [
      line("p-cerave-foaming-cleanser", "cerave-foaming-facial-cleanser", "سيرافي غسول رغوي للبشرة الدهنية", "CeraVe Foaming Facial Cleanser", 78, 1, 95),
      line("p-isdin-fusion-water", "isdin-fusion-water-spf-50", "إيسدين فيوجن ووتر واقي شمس SPF50", "ISDIN Fusion Water SPF 50", 149, 1, 175),
    ],
  }),
  order({
    id: "ord-1038", daysBack: 24, status: "collected", fulfilment: "pickup",
    branchId: "br-narjis",
    paymentMethod: "card", paymentSummary: { brand: "visa", last4: "8823" },
    lines: [
      line("p-centrum-adults", "centrum-adults-multivitamin", "سنتروم فيتامينات متعددة للبالغين", "Centrum Adults Multivitamin", 95, 1, 115),
    ],
  }),
  order({
    id: "ord-1033", daysBack: 47, status: "delivered", fulfilment: "delivery",
    address: demoCustomer.addresses[0]!,
    paymentMethod: "apple_pay", pointsRedeemed: 200,
    lines: [
      line("p-sensodyne-repair", "sensodyne-repair-protect-toothpaste", "سنسوداين معجون ريبير آند بروتكت", "Sensodyne Repair & Protect Toothpaste", 32, 2, 39),
      line("p-oralb-floss", "oral-b-essential-dental-floss", "أورال-بي خيط أسنان", "Oral-B Essential Dental Floss", 14, 1, undefined),
      line("p-listerine-cool-mint", "listerine-cool-mint-mouthwash", "ليسترين غسول الفم كول مينت", "Listerine Cool Mint Mouthwash", 27, 1, 34),
    ],
  }),
  order({
    id: "ord-1029", daysBack: 2, status: "pharmacist_review", fulfilment: "delivery",
    address: demoCustomer.addresses[0]!,
    paymentMethod: "cash_on_delivery", prescriptionId: "rx-8841",
    // Points are only credited once an order completes, so a prescription
    // still under review has earned none.
    earnsPoints: false,
    lines: [
      line("p-rx-amoxicillin", "amoxicillin-500-mg", "أموكسيسيلين 500 ملجم", "Amoxicillin 500 mg", 28, 1, undefined),
    ],
  }),
  order({
    id: "ord-1018", daysBack: 96, status: "cancelled", fulfilment: "delivery",
    address: demoCustomer.addresses[1]!,
    paymentMethod: "card", earnsPoints: false,
    lines: [
      line("p-omron-thermometer", "omron-digital-thermometer", "أومرون ميزان حرارة رقمي", "Omron Digital Thermometer", 59, 1, 75),
    ],
  }),
];

export const demoPrescriptions: Prescription[] = [
  {
    id: "rx-8841", reference: "RX-8841", customerId: demoCustomer.id,
    createdAt: daysAgo(2), status: "in_review",
    fileKeys: ["rx/cust-demo/8841/page-1.jpg"],
    patientName: "سارة العتيبي", patientNationalIdLast4: "4471",
    fulfilment: "delivery", addressId: "addr-home",
    orderId: "ord-1029",
  },
  {
    id: "rx-8702", reference: "RX-8702", customerId: demoCustomer.id,
    createdAt: daysAgo(63), status: "fulfilled",
    fileKeys: ["rx/cust-demo/8702/page-1.jpg"],
    patientName: "سارة العتيبي",
    fulfilment: "pickup", branchId: "br-narjis",
    pharmacistNote: { ar: "تم الصرف. راجع الصيدلي عند الحاجة.", en: "Dispensed. Speak to the pharmacist if needed." },
  },
];

export const demoVitaminPlans: VitaminPlan[] = [
  {
    id: "vp-centrum", customerId: demoCustomer.id, productId: "p-centrum-adults",
    orderId: "ord-1038", startedAt: daysAgo(24),
    dailyUnits: 1, unitsPurchased: 60,
    reminderTimes: ["08:00"], remindersEnabled: true,
    takenDates: Array.from({ length: 21 }, (_, i) =>
      new Date(Date.now() - (i + 1) * DAY).toISOString().slice(0, 10),
    ),
    active: true,
  },
  {
    id: "vp-vitd", customerId: demoCustomer.id, productId: "p-solgar-vitamin-d3",
    startedAt: daysAgo(88), dailyUnits: 1, unitsPurchased: 100,
    reminderTimes: ["21:00"], remindersEnabled: false,
    takenDates: [], active: true,
  },
];

// ---------------------------------------------------------------------------

function line(
  id: string, slug: string, ar: string, en: string,
  priceRiyals: number, quantity: number, wasRiyals: number | undefined,
): CartLine {
  const unitPrice = riyals(priceRiyals);
  const compareAt = wasRiyals === undefined ? undefined : riyals(wasRiyals);
  const built: CartLine = {
    kind: "product", id, slug,
    name: { ar, en },
    imageUrl: `/api/media/product/${id}-1.svg`,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    lineSaving: compareAt ? (compareAt - unitPrice) * quantity : 0,
    requiresPrescription: id.startsWith("p-rx-"),
    stockStatus: "in_stock",
  };
  if (compareAt) built.compareAtUnitPrice = compareAt;
  return built;
}

interface OrderSpec {
  id: string;
  daysBack: number;
  status: Order["status"];
  fulfilment: Order["fulfilment"];
  lines: CartLine[];
  address?: Order["address"];
  branchId?: string;
  paymentMethod: Order["paymentMethod"];
  paymentSummary?: Order["paymentSummary"];
  promotionCode?: string;
  promotionDiscount?: number;
  pointsRedeemed?: number;
  prescriptionId?: string;
  /** Cancelled and in-review orders have not credited points. */
  earnsPoints?: boolean;
}

/** Applies the live commerce rules so history and checkout always agree. */
function order(spec: OrderSpec): Order {
  const subtotal = spec.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const productSavings = spec.lines.reduce((sum, l) => sum + l.lineSaving, 0);
  const promotionDiscount = spec.promotionDiscount ?? 0;
  const loyaltyDiscount = pointsToHalalas(spec.pointsRedeemed ?? 0);

  const afterPromotion = Math.max(0, subtotal - promotionDiscount);
  const threshold = TIER_FREE_DELIVERY[demoLoyalty.tierId] ?? commerce.freeDeliveryThreshold;
  const deliveryFee =
    spec.fulfilment === "pickup" || afterPromotion >= threshold ? 0 : commerce.standardDeliveryFee;

  const goodsTotal = Math.max(0, afterPromotion - loyaltyDiscount);
  const total = goodsTotal + deliveryFee;
  const pointsEarned = spec.earnsPoints === false ? 0 : pointsForSpend(goodsTotal, demoLoyalty.tierId);

  const built: Order = {
    id: spec.id,
    reference: `UCP-${spec.id.replace("ord-", "")}`,
    customerId: demoCustomer.id,
    createdAt: daysAgo(spec.daysBack),
    status: spec.status,
    fulfilment: spec.fulfilment,
    lines: spec.lines,
    paymentMethod: spec.paymentMethod,
    pointsEarned,
    pointsRedeemed: spec.pointsRedeemed ?? 0,
    totals: {
      itemCount: spec.lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      productSavings,
      promotionDiscount,
      loyaltyDiscount,
      deliveryFee,
      freeDeliveryRemaining: 0,
      vatIncluded: vatIncludedIn(total),
      total,
      pointsEarned,
    },
  };
  if (spec.address) built.address = spec.address;
  if (spec.branchId) built.branchId = spec.branchId;
  if (spec.paymentSummary) built.paymentSummary = spec.paymentSummary;
  if (spec.promotionCode) built.promotionCode = spec.promotionCode;
  if (spec.prescriptionId) built.prescriptionId = spec.prescriptionId;
  return built;
}
