import type { Locale, Localized } from "./types.ts";

export const LOCALES: readonly Locale[] = ["ar", "en"] as const;

/** Arabic is UCP's primary language, so it is the default and the root locale. */
export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(value: string | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export function direction(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

/** Reads the active script out of a bilingual value. */
export function t(value: Localized | string | undefined, locale: Locale): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.ar || value.en;
}

export function localized(ar: string, en: string): Localized {
  return { ar, en };
}

const DATE_LOCALE: Record<Locale, string> = {
  // Latin digits in Arabic for the same reason prices use them: dates are
  // scanned against delivery promises and order references, not read aloud.
  ar: "ar-SA-u-nu-latn-ca-gregory",
  en: "en-GB",
};

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWeekday(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: "long" }).format(new Date(iso));
}

/** "in 3 days" / "خلال ٣ أيام" — used by the vitamin supply forecast. */
export function formatRelativeDays(days: number, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    numeric: "auto",
  });
  return rtf.format(days, "day");
}

/**
 * Minutes-from-midnight to a wall clock string. Branch hours are stored as
 * minutes so they are trivially comparable without timezone gymnastics.
 */
export function formatClock(minutesFromMidnight: number, locale: Locale): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}
