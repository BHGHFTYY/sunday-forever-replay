import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "offer" | "service" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-text-muted",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  offer: "bg-offer-soft text-offer-text",
  service: "bg-service-soft text-service-text",
  ink: "bg-surface-ink text-text-on-ink",
};

export function Badge({
  tone = "neutral", icon, children, className = "",
}: {
  tone?: Tone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}

/**
 * Stock state.
 *
 * "Only a few left" appears only when the stock system actually says so —
 * it is never used as a pressure tactic on a well-stocked product, which
 * is the manufactured-scarcity pattern the brief rules out.
 */
export function StockBadge({
  status, labels,
}: {
  status: "in_stock" | "low_stock" | "out_of_stock";
  labels: { inStock: string; lowStock: string; outOfStock: string };
}) {
  if (status === "out_of_stock") {
    return <Badge tone="neutral" icon="info">{labels.outOfStock}</Badge>;
  }
  if (status === "low_stock") {
    return <Badge tone="warning" icon="info">{labels.lowStock}</Badge>;
  }
  return <Badge tone="success" icon="check">{labels.inStock}</Badge>;
}
