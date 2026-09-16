import type { Brand, Locale, Product } from "@ucp/core";
import { ProductCard, ProductRailCard } from "./ProductCard.tsx";

/**
 * A horizontally scrolling strip of products.
 *
 * Native scroll with snap points rather than a JavaScript carousel: it is
 * how touch already works, it needs no hydration, it keeps keyboard and
 * screen-reader order intact, and there is no "slide 3 of 7" state to get
 * out of sync. Desktop users get scroll affordance from the partially
 * visible next card.
 */
export function ProductRail({
  products, brands, locale, source, priorityCount = 0,
}: {
  products: Product[];
  brands: Map<string, Brand>;
  locale: Locale;
  source: string;
  /** Eagerly load the first N images. Above-the-fold rails only. */
  priorityCount?: number;
}) {
  if (products.length === 0) return null;

  return (
    <div className="ucp-container">
      <ul className="ucp-rail -mx-1 px-1">
        {products.map((product, index) => (
          <li key={product.id} className="contents">
            <ProductRailCard
              product={product}
              brand={brands.get(product.brandId)}
              locale={locale}
              source={source}
              priority={index < priorityCount}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Responsive grid, used on listings where everything should be visible. */
export function ProductGrid({
  products, brands, locale, source, priorityCount = 0,
}: {
  products: Product[];
  brands: Map<string, Brand>;
  locale: Locale;
  source: string;
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            brand={brands.get(product.brandId)}
            locale={locale}
            source={source}
            priority={index < priorityCount}
          />
        </li>
      ))}
    </ul>
  );
}
