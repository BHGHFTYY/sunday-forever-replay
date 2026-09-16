import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";

/**
 * A merchandising section.
 *
 * Renders NOTHING when it has no children — which is how the homepage
 * honours "do not create empty sections when there is insufficient data".
 * The decision lives here rather than at every call site so it cannot be
 * forgotten in one place.
 */
export function Section({
  title, subtitle, viewAllHref, viewAllLabel, children, id, className = "",
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const empty =
    children === null ||
    children === undefined ||
    children === false ||
    (Array.isArray(children) && children.filter(Boolean).length === 0);

  if (empty) return null;

  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`py-8 md:py-10 ${className}`}
    >
      <div className="ucp-container mb-4 flex items-end justify-between gap-4 md:mb-5">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="ucp-blade flex items-center gap-2.5 text-xl font-bold text-text md:text-2xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-text-muted ms-[calc(3px+0.625rem)]">{subtitle}</p>
          ) : null}
        </div>

        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-semibold text-primary-text hover:text-primary-active"
          >
            {viewAllLabel}
            <Icon name="chevronEnd" size={16} />
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}
