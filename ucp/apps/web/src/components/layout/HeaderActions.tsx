"use client";

import Link from "next/link";
import type { Locale } from "@ucp/core";
import { Icon } from "@/components/ui/Icon.tsx";
import { useOptionalCart } from "@/components/cart/CartProvider.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Header actions: prescriptions, loyalty, account, cart.
 *
 * Client-side only because of the live cart badge. Everything else here is
 * a plain link and would have been a server component if it could be
 * separated cheaply.
 */
export function HeaderActions({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const cart = useOptionalCart();
  const count = cart?.itemCount ?? 0;

  return (
    <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
      {/* Prescriptions: a first-class action, styled as a service rather
          than as a nav link so it reads as something you *do*. */}
      <Link
        href={routes.prescriptions(locale)}
        className="hidden h-11 items-center gap-2 rounded-md bg-service-soft px-3.5 text-sm font-semibold text-service-text transition-colors hover:bg-lapis-100 lg:flex"
      >
        <Icon name="prescription" size={18} />
        {t.nav.prescription}
      </Link>

      <Link
        href={routes.loyalty(locale)}
        aria-label={t.nav.loyalty}
        title={t.nav.loyalty}
        className="hidden size-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-neutral-100 hover:text-text md:flex"
      >
        <Icon name="gift" size={21} />
      </Link>

      <Link
        href={routes.account(locale)}
        aria-label={t.nav.account}
        title={t.nav.account}
        className="flex size-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-neutral-100 hover:text-text"
      >
        <Icon name="user" size={21} />
      </Link>

      <Link
        href={routes.cart(locale)}
        aria-label={
          count > 0 ? `${t.nav.cart} — ${count} ${t.cart.items}` : t.nav.cart
        }
        className="relative flex size-11 items-center justify-center rounded-md text-text transition-colors hover:bg-neutral-100"
      >
        <Icon name="cart" size={21} />
        {count > 0 ? (
          <span
            // `key` restarts the pop animation on every change, so adding a
            // second item is as visible as adding the first.
            key={count}
            className="numeric ucp-pop absolute -top-0.5 inset-inline-end-0 end-0 flex min-w-5 items-center justify-center rounded-pill bg-primary px-1 text-[11px] font-bold leading-5 text-primary-on"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
