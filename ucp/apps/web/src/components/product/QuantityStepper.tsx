"use client";

import type { Locale } from "@ucp/core";
import { Icon } from "@/components/ui/Icon.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";

/**
 * Quantity control.
 *
 * A labelled number input flanked by two buttons rather than a bare
 * spinner: the buttons are a 44px target for touch, and the input still
 * accepts a typed value for someone buying twelve of something.
 *
 * The live region announces the new quantity, because a screen reader user
 * pressing "+" otherwise gets no confirmation that anything happened.
 */
export function QuantityStepper({
  value, onChange, locale, max = 20, min = 1, size = "md", label,
}: {
  value: number;
  onChange: (next: number) => void;
  locale: Locale;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const t = getDictionary(locale);
  const box = size === "sm" ? "h-10" : "h-12";
  const button = size === "sm" ? "size-10" : "size-12";

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(n)));

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex ${box} items-center overflow-hidden rounded-md border border-border bg-surface`}
      >
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={t.product.decrease}
          className={`${button} flex items-center justify-center text-text transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <Icon name="minus" size={17} />
        </button>

        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          aria-label={label ?? t.product.quantity}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (Number.isFinite(parsed)) onChange(clamp(parsed));
          }}
          className="numeric w-12 border-x border-border bg-transparent text-center text-base font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={t.product.increase}
          className={`${button} flex items-center justify-center text-text transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <Icon name="plus" size={17} />
        </button>
      </div>

      <span aria-live="polite" className="ucp-sr-only">
        {t.product.quantity}: {value}
      </span>
    </div>
  );
}
