import { type Halalas, type Locale, VAT_RATE } from "./types.ts";

/**
 * Integer money. Every amount in the platform is a whole number of
 * halalas, so there is no path by which a float rounding error can reach
 * a cart total or an invoice.
 */

export const HALALAS_PER_RIYAL = 100;

export function riyals(amount: number): Halalas {
  return Math.round(amount * HALALAS_PER_RIYAL);
}

export function toRiyals(amount: Halalas): number {
  return amount / HALALAS_PER_RIYAL;
}

/** Banker-free, predictable rounding: half away from zero. */
export function roundHalalas(value: number): Halalas {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function multiply(amount: Halalas, factor: number): Halalas {
  return roundHalalas(amount * factor);
}

export function percentOf(amount: Halalas, percent: number): Halalas {
  return roundHalalas((amount * percent) / 100);
}

export function sum(amounts: Halalas[]): Halalas {
  return amounts.reduce((total, a) => total + a, 0);
}

export function clampToZero(amount: Halalas): Halalas {
  return amount > 0 ? amount : 0;
}

/**
 * The VAT already contained inside a VAT-inclusive amount.
 * Shelf prices in KSA include VAT, so this extracts rather than adds.
 */
export function vatIncludedIn(grossAmount: Halalas): Halalas {
  return roundHalalas(grossAmount - grossAmount / (1 + VAT_RATE));
}

/**
 * Discount percentage shown on a badge. Rounded *down* so the badge never
 * overstates the saving — a "50% off" badge on a 49.6% discount is a small
 * lie, and trust is the product here.
 */
export function discountPercent(price: Halalas, compareAt: Halalas | undefined): number {
  if (!compareAt || compareAt <= price || compareAt <= 0) return 0;
  return Math.floor(((compareAt - price) / compareAt) * 100);
}

/**
 * Price formatting.
 *
 * Prices use Latin digits in both locales. Saudi retail overwhelmingly
 * prints Western digits, mixed Arabic/Latin product names are the norm,
 * and a price is scanned rather than read — switching numerals between
 * locales makes comparison harder, not more authentic. The currency name
 * and the ordering of symbol vs. number still follow the locale.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: Locale, fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}:${fractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(amount: Halalas, locale: Locale = "ar"): string {
  const whole = amount % HALALAS_PER_RIYAL === 0;
  return formatter(locale, whole ? 0 : 2).format(toRiyals(amount));
}

/** Plain number, no currency — for inputs and compact contexts. */
export function formatAmount(amount: Halalas, locale: Locale = "ar"): string {
  const whole = amount % HALALAS_PER_RIYAL === 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(toRiyals(amount));
}

export function formatNumber(value: number, locale: Locale = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA").format(value);
}
