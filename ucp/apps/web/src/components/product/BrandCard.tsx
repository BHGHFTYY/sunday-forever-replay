import Image from "next/image";
import Link from "next/link";
import type { Brand, Locale } from "@ucp/core";
import { t as tr } from "@ucp/core";
import { routes } from "@/lib/routes.ts";

/**
 * Brand card.
 *
 * Fixed aspect ratio, fixed padding, fixed background, logo contained
 * rather than cropped. Brand assets arrive at wildly different aspect
 * ratios and with different amounts of built-in whitespace, so the frame
 * has to be the constant — otherwise the rail reads as a ransom note,
 * which was the complaint about the old brand strip.
 */
export function BrandCard({
  brand, locale, productCount,
}: {
  brand: Brand;
  locale: Locale;
  productCount?: number;
}) {
  const name = tr(brand.name, locale);

  return (
    <Link
      href={routes.brand(locale, brand.slug)}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm"
    >
      <span className="flex aspect-[5/3] items-center justify-center bg-sand-50 p-4">
        <Image
          src={brand.logoUrl}
          alt={name}
          width={160}
          height={80}
          loading="lazy"
          sizes="180px"
          className="max-h-full w-auto object-contain"
        />
      </span>
      <span className="border-t border-border px-3 py-2 text-center">
        <span className="block text-xs font-semibold text-text ucp-clamp-1">{name}</span>
        {productCount !== undefined ? (
          <span className="numeric block text-[11px] text-text-muted">{productCount}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function BrandRailCard(props: Parameters<typeof BrandCard>[0]) {
  return (
    <div className="w-[140px] shrink-0 md:w-[168px]">
      <BrandCard {...props} />
    </div>
  );
}
