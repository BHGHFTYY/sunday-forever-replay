"use client";

import { useEffect, useRef, useState } from "react";
import type { Halalas, Locale } from "@ucp/core";
import { Button } from "@/components/ui/Button.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { useCart } from "./CartProvider.tsx";

/**
 * Add to cart.
 *
 * Quick-add from a card and the main action on a product page are the same
 * component, because they are the same commitment and should feel
 * identical.
 *
 * The success state is a local, two-second acknowledgement — it does not
 * open a drawer, show a modal or navigate. Interrupting someone who is
 * still shopping to tell them their shopping worked is the single most
 * common way a storefront slows its own funnel down.
 */
export function AddToCartButton({
  id, kind = "product", locale, name, price, disabled, source,
  variant = "primary", size = "sm", fullWidth, quantity = 1, label,
}: {
  id: string;
  kind?: "product" | "bundle";
  locale: Locale;
  name: string;
  price: Halalas;
  disabled?: boolean;
  source: string;
  variant?: "primary" | "secondary" | "ink";
  size?: "chip" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  quantity?: number;
  label?: string;
}) {
  const t = getDictionary(locale);
  const { add, pending } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (disabled) {
    return (
      <Button variant="secondary" size={size} fullWidth={fullWidth} disabled>
        {t.product.outOfStock}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={justAdded ? "secondary" : variant}
        size={size}
        fullWidth={fullWidth}
        icon={justAdded ? "check" : "plus"}
        onClick={() => {
          add({ kind, id, quantity }, { source, name, price });
          setJustAdded(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setJustAdded(false), 2000);
        }}
        className={justAdded ? "ucp-pop" : ""}
      >
        {justAdded ? t.product.added : (label ?? t.product.addToCart)}
      </Button>

      {/* Announced to screen readers without stealing focus. */}
      <span aria-live="polite" className="ucp-sr-only">
        {justAdded ? `${name} — ${t.product.added}` : pending ? t.cart.updating : ""}
      </span>
    </>
  );
}
