import Link from "next/link";
import type { Category, Locale } from "@ucp/core";
import { t as tr } from "@ucp/core";
import { Icon, categoryIcon } from "@/components/ui/Icon.tsx";
import { routes } from "@/lib/routes.ts";

/**
 * Category tile.
 *
 * The brief's complaint about the old site was that category visuals mixed
 * lifestyle photography, product shots, badges and unrelated treatments.
 * The fix here is structural rather than editorial: a category has an
 * `iconKey`, not an image URL, so there is no field in which inconsistent
 * artwork can be stored. Every tile therefore shares one ring, one
 * background, one glyph weight and one type treatment, and cannot drift.
 */
export function CategoryCard({
  category, locale, size = "md",
}: {
  category: Category;
  locale: Locale;
  size?: "sm" | "md";
}) {
  const ring = size === "sm" ? "size-16" : "size-20 md:size-24";
  const icon = size === "sm" ? 24 : 30;

  return (
    <Link
      href={routes.category(locale, category.slug)}
      className="group flex w-full flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-neutral-50"
    >
      <span
        className={
          `${ring} flex items-center justify-center rounded-full border border-jade-100 ` +
          "bg-jade-50 text-primary-text transition-[transform,border-color,background-color] " +
          "duration-[180ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] " +
          "group-hover:-translate-y-0.5 group-hover:border-jade-300 group-hover:bg-jade-100"
        }
      >
        <Icon name={categoryIcon(category.iconKey)} size={icon} />
      </span>
      <span className="text-xs font-semibold leading-snug text-text ucp-clamp-2 md:text-sm">
        {tr(category.name, locale)}
      </span>
    </Link>
  );
}

/** Wide tile used on the all-categories page, where names need more room. */
export function CategoryTile({
  category, locale, count,
}: {
  category: Category;
  locale: Locale;
  count?: number;
}) {
  return (
    <Link
      href={routes.category(locale, category.slug)}
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-jade-50 text-primary-text transition-colors group-hover:bg-jade-100">
        <Icon name={categoryIcon(category.iconKey)} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text ucp-clamp-1">
          {tr(category.name, locale)}
        </span>
        {count !== undefined ? (
          <span className="numeric block text-xs text-text-muted">{count}</span>
        ) : null}
      </span>
      <Icon name="chevronEnd" size={18} className="shrink-0 text-text-muted" />
    </Link>
  );
}
