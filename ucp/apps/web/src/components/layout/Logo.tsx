import type { Locale } from "@ucp/core";
import { getDictionary } from "@/i18n/dictionary.ts";

/**
 * The UCP mark.
 *
 * A sharp, forward-leaning monogram — the "blade" motif that also appears
 * as the section-heading rule. Drawn as inline SVG so it inherits colour
 * from its context and costs no request on any page.
 */
export function Logo({
  locale, variant = "full", className = "",
}: {
  locale: Locale;
  variant?: "full" | "mark";
  className?: string;
}) {
  const t = getDictionary(locale);

  const mark = (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true" className="shrink-0">
      <rect width="34" height="34" rx="9" className="fill-primary" />
      {/* The blade: a sharp diagonal cut through the monogram. */}
      <path
        d="M11 9v9.5a6 6 0 0 0 12 0V9"
        stroke="currentColor"
        className="stroke-primary-on"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M23 24.5 27 20" stroke="currentColor" className="stroke-jade-300" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  if (variant === "mark") return <span className={className}>{mark}</span>;

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {mark}
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">{t.brand.short}</span>
        <span className="mt-0.5 hidden text-[11px] font-medium text-text-muted sm:block">
          {t.brand.tagline}
        </span>
      </span>
    </span>
  );
}
