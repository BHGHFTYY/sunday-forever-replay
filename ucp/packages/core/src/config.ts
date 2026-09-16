import { riyals } from "./money.ts";
import type { Halalas, LoyaltyTier } from "./types.ts";

/**
 * Commercial rules in one place.
 *
 * These are the numbers a merchandiser changes, so they live apart from
 * the logic that applies them. In production these load from the
 * promotions service; the shape is what matters.
 */

export const commerce = {
  /** Spend at or above this and delivery is free. */
  freeDeliveryThreshold: riyals(150) as Halalas,
  standardDeliveryFee: riyals(15) as Halalas,
  expressDeliveryFee: riyals(25) as Halalas,
  /** Pickup is always free — it saves UCP the drop. */
  pickupFee: 0 as Halalas,
  /** Hard cap per line, to keep retail orders retail. */
  maxLineQuantity: 20,
  /** Cash on delivery is unavailable above this, to limit driver float. */
  codLimit: riyals(1000) as Halalas,
} as const;

export const loyalty = {
  programName: { ar: "نادي UCP", en: "UCP Club" },
  /** 100 points converts to 5 SAR, i.e. one point is worth 5 halalas. */
  halalasPerPoint: 5,
  /** Redemption happens in blocks so the maths stays legible to customers. */
  redemptionBlock: 100,
  minRedeemablePoints: 100,
  /** Points cannot wipe out more than this share of a basket. */
  maxRedemptionShare: 0.5,
  pointsExpireAfterDays: 365,
} as const;

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "member",
    name: { ar: "عضو", en: "Member" },
    threshold: 0,
    earnRate: 1,
    benefits: [
      { ar: "نقطة واحدة لكل ريال", en: "1 point per riyal" },
      { ar: "عروض الأعضاء", en: "Member-only offers" },
    ],
  },
  {
    id: "select",
    name: { ar: "مميّز", en: "Select" },
    threshold: 2000,
    earnRate: 1.25,
    benefits: [
      { ar: "1.25 نقطة لكل ريال", en: "1.25 points per riyal" },
      { ar: "توصيل مجاني من 100 ر.س", en: "Free delivery from SAR 100" },
      { ar: "أولوية في استشارة الصيدلي", en: "Priority pharmacist consultations" },
    ],
  },
  {
    id: "elite",
    name: { ar: "نخبة", en: "Elite" },
    threshold: 6000,
    earnRate: 1.5,
    benefits: [
      { ar: "1.5 نقطة لكل ريال", en: "1.5 points per riyal" },
      { ar: "توصيل مجاني دائمًا", en: "Free delivery on every order" },
      { ar: "استشارة صيدلي على مدار الساعة", en: "Round-the-clock pharmacist access" },
      { ar: "وصول مبكر للعروض", en: "Early access to offers" },
    ],
  },
];

/** Tier-specific free-delivery thresholds; falls back to the global one. */
export const TIER_FREE_DELIVERY: Partial<Record<string, Halalas>> = {
  select: riyals(100),
  elite: 0,
};
