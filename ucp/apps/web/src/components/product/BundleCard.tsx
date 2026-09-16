import Image from "next/image";
import Link from "next/link";
import { formatMoney, t as tr } from "@ucp/core";
import type { Bundle, Halalas, Locale } from "@ucp/core";
import { Icon } from "@/components/ui/Icon.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Package card.
 *
 * The saving is the whole proposition, so it is stated as an arithmetic
 * comparison a customer can check — package price against the sum of the
 * parts — rather than as a percentage badge. `componentTotal` is computed
 * from live component prices by the caller, so the claim cannot drift away
 * from what the items actually cost today.
 */
export function BundleCard({
  bundle, locale, componentTotal, itemCount,
}: {
  bundle: Bundle;
  locale: Locale;
  componentTotal: Halalas;
  itemCount: number;
}) {
  const t = getDictionary(locale);
  const saving = componentTotal - bundle.price;

  return (
    <Link
      href={routes.bundle(locale, bundle.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-50">
        <Image
          src={bundle.imageUrl}
          alt={tr(bundle.name, locale)}
          width={480}
          height={360}
          loading="lazy"
          sizes="(max-width: 768px) 80vw, 320px"
          className="size-full object-cover transition-transform duration-[280ms] group-hover:scale-[1.03]"
        />
        {saving > 0 ? (
          <span className="numeric absolute top-2 inset-inline-start-2 start-2 rounded-sm bg-offer px-2 py-0.5 text-xs font-bold text-offer-on">
            {t.product.save} {formatMoney(saving, locale)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="text-base font-bold text-text ucp-clamp-2">{tr(bundle.name, locale)}</h3>
        <p className="text-xs text-text-muted ucp-clamp-2">{tr(bundle.description, locale)}</p>

        <p className="numeric flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Icon name="gift" size={14} />
          {itemCount} {t.cart.items}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <span>
            <span className="block text-[11px] text-text-muted">{t.product.bundleTotal}</span>
            <span className="numeric text-xl font-bold text-text">
              {formatMoney(bundle.price, locale)}
            </span>
          </span>

          {saving > 0 ? (
            <span className="text-end">
              <span className="block text-[11px] text-text-muted">{t.product.separatelyTotal}</span>
              <s className="numeric text-sm text-text-muted">{formatMoney(componentTotal, locale)}</s>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
