"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category, Locale } from "@ucp/core";
import { t as tr } from "@ucp/core";
import { Icon, categoryIcon } from "@/components/ui/Icon.tsx";
import { LocaleSwitch } from "./LocaleSwitch.tsx";
import { Logo } from "./Logo.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Mobile navigation drawer.
 *
 * Deliberately not "a white list of links" (brief §19). Services lead,
 * because prescriptions and pharmacist access are the things people open a
 * pharmacy app to do; categories follow as icon rows in the same visual
 * family as the homepage tiles.
 *
 * Accessibility: the drawer is a modal dialog. It traps Tab, closes on
 * Escape, restores focus to the trigger on close, and locks body scroll —
 * all four, because a drawer that does three of them is still a trap for
 * someone using a keyboard.
 */
export function MobileMenu({
  locale, categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const t = getDictionary(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const topLevel = categories.filter((c) => c.parentId === null);

  // Close whenever the route changes, so tapping a link does not leave the
  // drawer hanging over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the panel so the next Tab lands inside it.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      (previouslyFocused ?? triggerRef.current)?.focus();
    };
  }, [open]);

  const services = [
    { href: routes.prescriptions(locale), icon: "prescription" as const, label: t.services.prescriptionTitle, desc: t.services.prescriptionDesc },
    { href: routes.telepharmacy(locale), icon: "stethoscope" as const, label: t.services.telepharmacyTitle, desc: t.services.telepharmacyDesc },
    { href: routes.loyalty(locale), icon: "gift" as const, label: t.services.loyaltyTitle, desc: t.services.loyaltyDesc },
    { href: routes.branches(locale), icon: "store" as const, label: t.services.pickupTitle, desc: t.services.pickupDesc },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.openMenu}
        aria-expanded={open}
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-text hover:bg-neutral-100 md:hidden"
      >
        <Icon name="menu" size={22} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[300] md:hidden">
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            className="absolute inset-block-0 inset-inline-start-0 start-0 top-0 bottom-0 flex w-[86%] max-w-sm flex-col bg-surface-sunken shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <Logo locale={locale} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.nav.close}
                className="flex size-11 items-center justify-center rounded-md text-text-muted hover:bg-neutral-100"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Services first — the reason people open a pharmacy app. */}
              <section className="p-4">
                <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-text-muted">
                  {t.home.services}
                </h2>
                <ul className="space-y-2">
                  {services.map((service) => (
                    <li key={service.href}>
                      <Link
                        href={service.href}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-service-soft text-service-text">
                          <Icon name={service.icon} size={21} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-text">{service.label}</span>
                          <span className="block text-xs text-text-muted ucp-clamp-1">{service.desc}</span>
                        </span>
                        <Icon name="chevronEnd" size={18} className="shrink-0 text-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="px-4 pb-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    {t.nav.categories}
                  </h2>
                  <Link href={routes.categories(locale)} className="text-xs font-semibold text-primary-text">
                    {t.nav.allCategories}
                  </Link>
                </div>

                <ul className="overflow-hidden rounded-lg border border-border bg-surface">
                  {topLevel.map((category) => (
                    <li key={category.id} className="border-b border-border last:border-0">
                      <Link
                        href={routes.category(locale, category.slug)}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-neutral-50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-jade-50 text-primary-text">
                          <Icon name={categoryIcon(category.iconKey)} size={18} />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-text">
                          {tr(category.name, locale)}
                        </span>
                        <Icon name="chevronEnd" size={16} className="shrink-0 text-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="px-4 pb-6">
                <ul className="overflow-hidden rounded-lg border border-border bg-surface">
                  {[
                    { href: routes.offers(locale), label: t.nav.offers, icon: "tag" as const },
                    { href: routes.bundles(locale), label: t.nav.packages, icon: "gift" as const },
                    { href: routes.orders(locale), label: t.account.orders, icon: "truck" as const },
                    { href: routes.help(locale), label: t.footer.help, icon: "info" as const },
                  ].map((item) => (
                    <li key={item.href} className="border-b border-border last:border-0">
                      <Link href={item.href} className="flex items-center gap-3 px-3 py-3 hover:bg-neutral-50">
                        <Icon name={item.icon} size={18} className="text-text-muted" />
                        <span className="flex-1 text-sm font-medium text-text">{item.label}</span>
                        <Icon name="chevronEnd" size={16} className="text-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="border-t border-border bg-surface px-4 py-3">
              <LocaleSwitch locale={locale} className="text-sm text-text-muted" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
