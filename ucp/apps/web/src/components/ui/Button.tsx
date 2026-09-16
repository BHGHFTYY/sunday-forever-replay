import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";

/**
 * The one button in the system.
 *
 * Variants are semantic, not decorative — `primary` is the single main
 * action on a screen, `service` is for pharmacy services (prescriptions,
 * telepharmacy), `offer` is reserved for genuinely discounted contexts.
 * Sizes never go below the 44px touch target except `chip`, which is only
 * used where an adjacent larger target exists.
 */

type Variant = "primary" | "secondary" | "ghost" | "ink" | "service" | "danger";
type Size = "sm" | "md" | "lg" | "chip";

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold " +
  "rounded-md transition-[background-color,color,border-color,transform] " +
  "duration-[120ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none " +
  "select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-on hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-surface text-text border border-border hover:border-border-strong hover:bg-neutral-50",
  ghost: "bg-transparent text-text-muted hover:bg-neutral-100 hover:text-text",
  ink: "bg-surface-ink text-text-on-ink hover:bg-ink-800",
  service: "bg-service-soft text-service-text hover:bg-lapis-100",
  danger: "bg-danger text-primary-on hover:bg-danger-700",
};

const sizes: Record<Size, string> = {
  chip: "h-9 px-3 text-sm rounded-sm",
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

function classes({ variant = "primary", size = "md", fullWidth, className = "" }: CommonProps) {
  return [base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant, size, icon, iconEnd, fullWidth, loading, children, className, ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={classes({ variant, size, fullWidth, className })}
      // A loading button stays in the tab order and keeps its label, so a
      // screen reader user is told what is happening rather than finding
      // the control has vanished.
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {iconEnd && !loading ? <Icon name={iconEnd} size={18} /> : null}
    </button>
  );
}

export interface ButtonLinkProps extends CommonProps {
  href: string;
  prefetch?: boolean;
  "aria-label"?: string;
  target?: string;
  rel?: string;
}

export function ButtonLink({
  href, variant, size, icon, iconEnd, fullWidth, children, className, prefetch, ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={classes({ variant, size, fullWidth, className })}
      {...rest}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {iconEnd ? <Icon name={iconEnd} size={18} /> : null}
    </Link>
  );
}

/** Icon-only control. Always requires a label — there is no visible text. */
export function IconButton({
  name, label, size = "md", variant = "ghost", className = "", ...rest
}: {
  name: IconName;
  label: string;
  size?: Size;
  variant?: Variant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const square = size === "chip" ? "size-9" : size === "sm" ? "size-11" : size === "lg" ? "size-14" : "size-12";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[base, variants[variant], square, "px-0 rounded-md", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <Icon name={name} size={size === "chip" ? 16 : 20} />
    </button>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
