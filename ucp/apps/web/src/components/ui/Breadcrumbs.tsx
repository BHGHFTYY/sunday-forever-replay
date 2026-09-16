import Link from "next/link";
import type { Locale } from "@ucp/core";
import { Icon } from "./Icon.tsx";
import { absolute } from "@/lib/routes.ts";

export interface Crumb {
  href: string;
  label: string;
}

/**
 * Breadcrumbs.
 *
 * Emits BreadcrumbList JSON-LD alongside the visual trail, because Google
 * renders the breadcrumb path in place of the raw URL in results — which
 * matters more for a deep category tree than almost any other structured
 * data (brief §27).
 *
 * The final crumb is the current page and is not a link, marked with
 * `aria-current="page"`.
 */
export function Breadcrumbs({
  crumbs, locale, className = "",
}: {
  crumbs: Crumb[];
  locale: Locale;
  className?: string;
}) {
  if (crumbs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: absolute(crumb.href),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={className} lang={locale}>
      <ol className="ucp-hide-scrollbar flex items-center gap-1 overflow-x-auto py-3 text-xs text-text-muted">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex shrink-0 items-center gap-1">
              {index > 0 ? (
                <Icon name="chevronEnd" size={13} className="text-neutral-300" />
              ) : null}
              {last ? (
                <span aria-current="page" className="font-semibold text-text">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="rounded-sm hover:text-text">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <script
        type="application/ld+json"
        // Serialised from our own data; no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}
