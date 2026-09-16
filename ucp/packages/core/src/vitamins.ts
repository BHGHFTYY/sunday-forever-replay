import type { Locale, Localized, Product, VitaminPlan } from "./types.ts";

/**
 * Vitamin follow-up.
 *
 * Two things this module deliberately does NOT do:
 *
 *  1. It never recommends a dose. `dailyUnits` comes from the customer,
 *     seeded from the pack's own label (`labelDailyUnits`). UCP is a
 *     retailer here, not a prescriber.
 *  2. It makes no health claims anywhere in its output. Every string is
 *     about supply and timing — "your pack runs out on Thursday" — never
 *     about benefit, deficiency, or outcome.
 *
 * Both constraints come from brief §15 and they are the difference between
 * a useful reorder reminder and unlicensed medical advice.
 */

const DAY_MS = 86_400_000;

export interface SupplyForecast {
  /** Units left in the pack, floored at zero. */
  remainingUnits: number;
  daysRemaining: number;
  /** ISO date the supply is projected to run out. */
  runsOutOn: string;
  /** True once the customer should reorder to avoid a gap. */
  reorderDue: boolean;
  /** Already out. */
  depleted: boolean;
  /** How much of the pack has been used, 0..1 — drives the progress ring. */
  consumedFraction: number;
  /**
   * `tracked` when the customer has been marking doses taken, `assumed`
   * when we are projecting from the purchase date. The UI labels these
   * differently so a projection is never presented as a fact.
   */
  basis: "tracked" | "assumed";
}

/** Reorder prompt fires with a week of supply left — enough for delivery. */
export const REORDER_THRESHOLD_DAYS = 7;

export function forecastSupply(plan: VitaminPlan, now: Date = new Date()): SupplyForecast {
  const dailyUnits = Math.max(0.25, plan.dailyUnits);
  const start = new Date(plan.startedAt).getTime();
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - start) / DAY_MS));

  // If the customer is logging doses, trust the log. Otherwise project
  // from elapsed days, which is the pessimistic (earlier) estimate.
  const hasTracking = plan.takenDates.length > 0;
  const consumedDays = hasTracking ? plan.takenDates.length : elapsedDays;

  const consumedUnits = Math.min(plan.unitsPurchased, consumedDays * dailyUnits);
  const remainingUnits = Math.max(0, plan.unitsPurchased - consumedUnits);
  const daysRemaining = Math.floor(remainingUnits / dailyUnits);

  return {
    remainingUnits: Math.round(remainingUnits * 100) / 100,
    daysRemaining,
    runsOutOn: new Date(now.getTime() + daysRemaining * DAY_MS).toISOString(),
    reorderDue: daysRemaining <= REORDER_THRESHOLD_DAYS,
    depleted: remainingUnits <= 0,
    consumedFraction:
      plan.unitsPurchased > 0 ? Math.min(1, consumedUnits / plan.unitsPurchased) : 0,
    basis: hasTracking ? "tracked" : "assumed",
  };
}

/** Is a follow-up plan meaningful for this product at all? */
export function supportsFollowUp(product: Product): boolean {
  return Boolean(product.supplement && product.supplement.unitsPerPack > 0);
}

export function defaultPlanFor(
  product: Product,
  customerId: string,
  orderId: string | undefined,
  quantity = 1,
  now: Date = new Date(),
): Omit<VitaminPlan, "id"> | null {
  if (!product.supplement) return null;
  const plan: Omit<VitaminPlan, "id"> = {
    customerId,
    productId: product.id,
    startedAt: now.toISOString(),
    // Seeded from the pack's own label. The customer can change it, and
    // the UI asks them to confirm before the plan starts.
    dailyUnits: product.supplement.labelDailyUnits,
    unitsPurchased: product.supplement.unitsPerPack * quantity,
    reminderTimes: ["08:00"],
    remindersEnabled: false,
    takenDates: [],
    active: true,
  };
  if (orderId) plan.orderId = orderId;
  return plan;
}

export interface ReminderOccurrence {
  planId: string;
  productId: string;
  /** ISO timestamp of the next reminder. */
  at: string;
}

/**
 * Next reminder for a plan, given the customer's chosen times.
 * Times are wall-clock local ("08:00"); the caller supplies the offset so
 * this stays free of timezone libraries.
 */
export function nextReminder(
  plan: VitaminPlan,
  utcOffsetMinutes = 180,
  now: Date = new Date(),
): ReminderOccurrence | null {
  if (!plan.remindersEnabled || !plan.active || plan.reminderTimes.length === 0) return null;

  const localNow = new Date(now.getTime() + utcOffsetMinutes * 60_000);
  const minutesNow = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

  const parsed = plan.reminderTimes
    .map((time) => {
      const [h, m] = time.split(":").map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    })
    .sort((a, b) => a - b);

  const todayNext = parsed.find((minutes) => minutes > minutesNow);
  const target = todayNext ?? parsed[0];
  if (target === undefined) return null;

  const dayOffset = todayNext === undefined ? 1 : 0;
  const localMidnight = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate() + dayOffset,
  );

  return {
    planId: plan.id,
    productId: plan.productId,
    at: new Date(localMidnight + target * 60_000 - utcOffsetMinutes * 60_000).toISOString(),
  };
}

/** Plans due a reorder nudge — the input to the notification job. */
export function plansNeedingReorder(plans: VitaminPlan[], now: Date = new Date()): VitaminPlan[] {
  return plans.filter((plan) => plan.active && forecastSupply(plan, now).reorderDue);
}

export function isTakenToday(plan: VitaminPlan, now: Date = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  return plan.takenDates.includes(today);
}

/** Consecutive days logged, counting back from today. Presented as a
 *  streak of logging, never as an adherence or health score. */
export function loggingStreak(plan: VitaminPlan, now: Date = new Date()): number {
  const logged = new Set(plan.takenDates);
  let streak = 0;
  for (let i = 0; i < 400; i += 1) {
    const day = new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    if (logged.has(day)) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

/**
 * Supply copy. Strictly about the pack and the calendar — no claim about
 * what taking or missing a dose does.
 */
export function supplyMessage(forecast: SupplyForecast, locale: Locale): string {
  const messages: Record<string, Localized> = {
    depleted: { ar: "انتهت العبوة حسب جدولك", en: "Your pack is finished, based on your schedule" },
    due: {
      ar: `تكفي عبوتك ${forecast.daysRemaining} يومًا تقريبًا`,
      en: `About ${forecast.daysRemaining} days left in your pack`,
    },
    fine: {
      ar: `تكفي عبوتك حتى ${forecast.daysRemaining} يومًا`,
      en: `Your pack lasts about ${forecast.daysRemaining} more days`,
    },
  };
  const key = forecast.depleted ? "depleted" : forecast.reorderDue ? "due" : "fine";
  return (messages[key] as Localized)[locale];
}
