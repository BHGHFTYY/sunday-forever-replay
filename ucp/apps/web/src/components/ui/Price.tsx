import { discountPercent, formatMoney } from "@ucp/core";
import type { Halalas, Locale } from "@ucp/core";
import { getDictionary } from "@/i18n/dictionary.ts";

/**
 * Price display.
 *
 * Three rules, all of them about not misleading:
 *  - The was-price is struck through and marked up as `<s>`, so assistive
 *    tech announces it as superseded rather than reading two prices.
 *  - The discount badge rounds DOWN (see `discountPercent`), so it can
 *    never claim more than the real saving.
 *  - Prices are rendered with tabular figures and forced LTR, so a price
 *    inside Arabic text reads correctly and does not reflow as it updates.
 */

export interface PriceProps {
  price: Halalas;
  compareAtPrice?: Halalas | undefined;
  locale: Locale;
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the "VAT included" note in dense contexts like cards. */
  showVatNote?: boolean;
  /**
   * Show the inline "−17%". Off on product cards, which already carry a
   * corner badge — the same number twice on one card is noise, and it
   * makes the price line harder to scan rather than more persuasive.
   */
  showPercent?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { now: "text-base", was: "text-xs" },
  md: { now: "text-lg", was: "text-sm" },
  lg: { now: "text-2xl", was: "text-base" },
  xl: { now: "text-3xl", was: "text-lg" },
} as const;

export function Price({
  price, compareAtPrice, locale, size = "md", showVatNote = false,
  showPercent = true, className = "",
}: PriceProps) {
  const t = getDictionary(locale);
  const percent = discountPercent(price, compareAtPrice);
  const styles = sizeClasses[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`numeric font-bold text-text ${styles.now}`}>
        {formatMoney(price, locale)}
      </span>

      {percent > 0 && compareAtPrice ? (
        <>
          <s className={`numeric text-text-muted font-normal ${styles.was}`}>
            <span className="ucp-sr-only">{t.product.was} </span>
            {formatMoney(compareAtPrice, locale)}
          </s>
          {showPercent ? (
            <span className="numeric text-xs font-bold text-offer-text">−{percent}%</span>
          ) : null}
        </>
      ) : null}

      {showVatNote ? (
        <span className="w-full text-xs text-text-muted font-normal">{t.product.vatIncluded}</span>
      ) : null}
    </div>
  );
}

/** The corner badge on a product card. Ink on ember — see the palette notes. */
export function DiscountBadge({
  price, compareAtPrice, locale,
}: {
  price: Halalas;
  compareAtPrice?: Halalas | undefined;
  locale: Locale;
}) {
  const percent = discountPercent(price, compareAtPrice);
  if (percent <= 0) return null;
  const t = getDictionary(locale);

  return (
    <span
      className="numeric inline-flex items-center rounded-sm bg-offer px-1.5 py-0.5 text-xs font-bold text-offer-on"
      aria-label={`${percent}% ${t.product.off}`}
    >
      −{percent}%
    </span>
  );
}
