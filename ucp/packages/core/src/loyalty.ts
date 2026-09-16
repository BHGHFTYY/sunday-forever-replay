import { LOYALTY_TIERS, loyalty as cfg } from "./config.ts";
import { toRiyals } from "./money.ts";
import type { Halalas, LoyaltyAccount, LoyaltyTier, LoyaltyTierId } from "./types.ts";

export function tierById(id: LoyaltyTierId): LoyaltyTier {
  return LOYALTY_TIERS.find((tier) => tier.id === id) ?? (LOYALTY_TIERS[0] as LoyaltyTier);
}

/** The tier a lifetime-points total qualifies for. */
export function tierForPoints(lifetimePoints: number): LoyaltyTier {
  let current = LOYALTY_TIERS[0] as LoyaltyTier;
  for (const tier of LOYALTY_TIERS) {
    if (lifetimePoints >= tier.threshold) current = tier;
  }
  return current;
}

export function nextTier(tierId: LoyaltyTierId): LoyaltyTier | undefined {
  const index = LOYALTY_TIERS.findIndex((tier) => tier.id === tierId);
  return index >= 0 ? LOYALTY_TIERS[index + 1] : undefined;
}

export interface TierProgress {
  current: LoyaltyTier;
  next?: LoyaltyTier;
  pointsToNext: number;
  /** 0..1 through the current tier band. 1 when already at the top tier. */
  fraction: number;
}

export function tierProgress(account: LoyaltyAccount): TierProgress {
  const current = tierForPoints(account.lifetimePoints);
  const next = nextTier(current.id);
  if (!next) return { current, pointsToNext: 0, fraction: 1 };
  const span = next.threshold - current.threshold;
  const earned = account.lifetimePoints - current.threshold;
  return {
    current,
    next,
    pointsToNext: Math.max(0, next.threshold - account.lifetimePoints),
    fraction: span > 0 ? Math.min(1, Math.max(0, earned / span)) : 0,
  };
}

/**
 * Points earned on an order. Calculated on what the customer actually paid
 * for goods — delivery is excluded, and so is any part of the basket paid
 * for with points, so points cannot compound into themselves.
 */
export function pointsForSpend(eligibleSpend: Halalas, tierId: LoyaltyTierId): number {
  const tier = tierById(tierId);
  return Math.floor(toRiyals(Math.max(0, eligibleSpend)) * tier.earnRate);
}

export function pointsToHalalas(points: number): Halalas {
  return Math.max(0, Math.floor(points)) * cfg.halalasPerPoint;
}

export function halalasToPoints(amount: Halalas): number {
  return Math.floor(amount / cfg.halalasPerPoint);
}

export interface RedemptionQuote {
  /** Points that will actually be spent. */
  points: number;
  value: Halalas;
  /** Why the request was trimmed, if it was. */
  cappedBy?: "balance" | "basket_share" | "block_size" | "minimum";
}

/**
 * Works out how many points can really be applied to a basket.
 *
 * Deliberately conservative and explicit: the UI shows the customer the
 * adjusted figure rather than silently taking a different number of points
 * than they asked for.
 */
export function quoteRedemption(
  requestedPoints: number,
  balance: number,
  eligibleAmount: Halalas,
): RedemptionQuote {
  let cappedBy: RedemptionQuote["cappedBy"];
  let points = Math.max(0, Math.floor(requestedPoints));

  if (points < cfg.minRedeemablePoints) {
    return { points: 0, value: 0, cappedBy: points > 0 ? "minimum" : undefined };
  }
  if (points > balance) {
    points = balance;
    cappedBy = "balance";
  }

  const maxValue = Math.floor(eligibleAmount * cfg.maxRedemptionShare);
  if (pointsToHalalas(points) > maxValue) {
    points = halalasToPoints(maxValue);
    cappedBy = "basket_share";
  }

  const blocked = Math.floor(points / cfg.redemptionBlock) * cfg.redemptionBlock;
  if (blocked !== points) {
    points = blocked;
    cappedBy = cappedBy ?? "block_size";
  }

  if (points < cfg.minRedeemablePoints) return { points: 0, value: 0, cappedBy: cappedBy ?? "minimum" };

  return { points, value: pointsToHalalas(points), cappedBy };
}
