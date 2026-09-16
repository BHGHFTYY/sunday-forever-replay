"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@ucp/core";
import { getDictionary } from "@/i18n/dictionary.ts";
import { switchLocale } from "@/lib/routes.ts";

/**
 * Language switch.
 *
 * Swaps the locale segment while keeping the rest of the path and the
 * query string, so switching language on a filtered category listing keeps
 * you on that listing with those filters — rather than dumping you on the
 * homepage, which is the usual and infuriating behaviour.
 *
 * Rendered as a real link with `hrefLang` so it is crawlable and works
 * without JavaScript.
 */
export function LocaleSwitch({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = getDictionary(locale);

  const target: Locale = locale === "ar" ? "en" : "ar";
  const query = searchParams.toString();
  const href = `${switchLocale(pathname || `/${locale}`, target)}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={t.nav.languageLabel}
      className={`rounded-sm px-1 font-semibold hover:text-text ${className}`}
    >
      {t.nav.language}
    </Link>
  );
}
