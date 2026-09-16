import { riyals } from "@ucp/core";
import type { Promotion } from "@ucp/core";

/**
 * Promotion codes.
 *
 * Every code here is a plain, checkable offer. There are no codes that
 * expire in minutes, no "last chance" framing and no countdown — brief §25
 * rules out manufactured urgency, and the cart surfaces the exact reason
 * whenever a code does not apply rather than failing silently.
 */
export const promotions: Promotion[] = [
  {
    code: "WELCOME10",
    kind: "percentage",
    value: 10,
    maxDiscount: riyals(50),
    description: { ar: "خصم 10% على طلبك الأول، بحد أقصى 50 ر.س", en: "10% off your first order, up to SAR 50" },
  },
  {
    code: "SKIN20",
    kind: "percentage",
    value: 20,
    minSpend: riyals(200),
    categoryIds: [
      "cat-face-cleanser", "cat-face-moisturiser", "cat-face-serum",
      "cat-face-sunscreen", "cat-face-mask", "cat-face-eye",
    ],
    description: { ar: "خصم 20% على العناية بالوجه عند الشراء بـ200 ر.س", en: "20% off face care when you spend SAR 200" },
  },
  {
    code: "FREESHIP",
    kind: "free_delivery",
    value: 0,
    minSpend: riyals(75),
    description: { ar: "توصيل مجاني للطلبات فوق 75 ر.س", en: "Free delivery on orders over SAR 75" },
  },
  {
    code: "VITAMIN15",
    kind: "fixed",
    value: riyals(15),
    minSpend: riyals(100),
    categoryIds: [
      "cat-vitamins-multivitamin", "cat-vitamins-vitamin-d", "cat-vitamins-vitamin-c",
      "cat-vitamins-iron", "cat-vitamins-omega", "cat-vitamins-beauty",
    ],
    description: { ar: "خصم 15 ر.س على الفيتامينات عند الشراء بـ100 ر.س", en: "SAR 15 off vitamins when you spend SAR 100" },
  },
  {
    code: "EXPIRED2025",
    kind: "percentage",
    value: 25,
    expiresAt: "2025-12-31T20:59:59.000Z",
    description: { ar: "عرض منتهٍ", en: "Expired offer" },
  },
];

export const promotionsByCode = new Map(promotions.map((p) => [p.code.toUpperCase(), p]));
