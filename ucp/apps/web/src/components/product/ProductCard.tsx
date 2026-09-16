import Image from "next/image";
import Link from "next/link";
import type { Brand, Locale, Product } from "@ucp/core";
import { t as tr } from "@ucp/core";
import { Price, DiscountBadge } from "@/components/ui/Price.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { AddToCartButton } from "@/components/cart/AddToCartButton.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * The product card.
 *
 * One card, used on the homepage rails, category listings, search results,
 * brand pages and recommendation strips. Having exactly one is what makes
 * the catalogue feel like a single shop rather than a set of pages built
 * at different times.
 *
 * Reading order is fixed and never varies: brand, name, price, state,
 * action. Brand first because it is the strongest recognition cue when
 * scanning a grid; the quick-add sits last so a decisive customer can go
 * brand → price → add without opening the product at all.
 *
 * The whole card is a link, with the add button lifted above it — so a tap
 * anywhere opens the product, and only the button adds. Nesting a button
 * inside an anchor would be invalid and would make the keyboard order
 * ambiguous, so the anchor is an overlay instead.
 */

export interface ProductCardProps {
  product: Product;
  brand?: Brand | undefined;
  locale: Locale;
  /** Analytics attribution for where this card was shown. */
  source: string;
  priority?: boolean;
  className?: string;
}

export function ProductCard({
  product, brand, locale, source, priority = false, className = "",
}: ProductCardProps) {
  const t = getDictionary(locale);
  const image = product.images[0];
  const outOfStock = product.stock.status === "out_of_stock";
  const href = routes.product(locale, product.slug);
  const name = tr(product.name, locale);

  return (
    <article
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border " +
        "bg-surface transition-[border-color,box-shadow,transform] duration-[180ms] " +
        "ease-[cubic-bezier(0.2,0.6,0.2,1)] hover:border-border-strong hover:shadow-md " +
        "focus-within:border-primary " + className
      }
    >
      <div className="relative aspect-square overflow-hidden bg-sand-50">
        {image ? (
          <Image
            src={image.url}
            alt={tr(image.alt, locale)}
            width={image.width}
            height={image.height}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 768px) 45vw, (max-width: 1280px) 25vw, 220px"
            className={
              "size-full object-contain p-3 transition-transform duration-[280ms] " +
              "ease-[cubic-bezier(0.2,0.6,0.2,1)] group-hover:scale-[1.04] " +
              (outOfStock ? "opacity-55 saturate-50" : "")
            }
          />
        ) : null}

        {/* Badges sit on the leading edge and flip with direction. */}
        <div className="absolute inset-block-start-2 start-2 top-2 flex flex-col items-start gap-1">
          <DiscountBadge
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            locale={locale}
          />
          {product.requiresPrescription ? (
            <Badge tone="service" icon="prescription">{t.product.prescriptionRequired}</Badge>
          ) : null}
        </div>

        {outOfStock ? (
          <div className="absolute inset-x-0 bottom-0 bg-ink-900/85 py-1.5 text-center text-xs font-semibold text-text-on-ink">
            {t.product.outOfStock}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {brand ? (
          <span className="text-xs font-semibold uppercase text-text-muted ucp-clamp-1">
            {tr(brand.name, locale)}
          </span>
        ) : null}

        <h3 className="text-sm font-semibold leading-snug text-text ucp-clamp-2">
          {/* The overlay link. Sits under the action button in stacking
              order, so the button always wins the tap. */}
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {name}
          </Link>
        </h3>

        <div className="mt-auto pt-1.5">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            locale={locale}
            size="sm"
            showPercent={false}
          />

          {product.stock.status === "low_stock" ? (
            <p className="mt-1 text-xs font-semibold text-warning-text">{t.product.lowStock}</p>
          ) : null}
        </div>

        {/* Raised above the overlay link so it receives the click. */}
        <div className="relative z-10 mt-2">
          <AddToCartButton
            id={product.id}
            locale={locale}
            name={name}
            price={product.price}
            disabled={outOfStock}
            source={source}
            size="sm"
            fullWidth
          />
        </div>
      </div>
    </article>
  );
}

/** Rail variant — fixed width so cards line up while scrolling. */
export function ProductRailCard(props: ProductCardProps) {
  return (
    <div className="w-[168px] shrink-0 md:w-[204px]">
      <ProductCard {...props} />
    </div>
  );
}
