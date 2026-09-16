import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { ButtonLink } from "./Button.tsx";

/**
 * Empty, error and loading states.
 *
 * Every one of these is a designed screen rather than a fallback, because
 * the states a customer hits when something goes wrong are the ones that
 * decide whether they come back (brief §34).
 */

export function EmptyState({
  icon = "search", title, description, action, children,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-xl bg-neutral-100 text-text-muted">
        <Icon name={icon} size={28} />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-text-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <ButtonLink href={action.href} size="md">{action.label}</ButtonLink>
      ) : null}
      {children}
    </div>
  );
}

export function ErrorState({
  title, description, onRetry, retryLabel,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-danger-100 bg-danger-soft px-6 py-12 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-xl bg-danger-100 text-danger-text">
        <Icon name="warning" size={26} />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-text">{title}</h2>
        {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      </div>
      {onRetry && retryLabel ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-surface px-5 text-sm font-semibold text-text border border-border hover:border-border-strong"
        >
          <Icon name="refresh" size={16} />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Skeletons.
 *
 * Sized to the real content so the layout does not jump when data arrives
 * — a skeleton that shifts on load costs more than no skeleton at all.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`ucp-skeleton ${className}`} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Skeleton className="mb-3 aspect-square w-full rounded-md" />
      <Skeleton className="mb-2 h-3 w-1/3" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-3 h-4 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="ucp-rail" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[168px] md:w-[200px]">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
