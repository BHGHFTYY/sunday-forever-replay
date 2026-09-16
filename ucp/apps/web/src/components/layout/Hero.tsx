import Link from "next/link";
import type { Locale } from "@ucp/core";
import { Icon } from "@/components/ui/Icon.tsx";
import { ButtonLink } from "@/components/ui/Button.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Homepage hero.
 *
 * Compact on purpose (brief §4). It occupies roughly a third of a phone
 * viewport, so the category grid is visible without scrolling — on a
 * pharmacy site the fastest route to a purchase is almost always "show me
 * where things are", not "read our positioning statement".
 *
 * It carries exactly two actions: shop, and order a prescription. It is
 * not a carousel. Rotating banners measure badly, push the real content
 * down, and move the thing a customer was about to tap.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <section className="relative overflow-hidden bg-surface-ink text-text-on-ink">
      {/* The blade motif, scaled up as a background element. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -inset-inline-end-24 -end-24 top-1/2 size-[420px] -translate-y-1/2 rounded-full bg-jade-700/25 blur-3xl" />
        <div className="absolute inset-inline-end-12 end-12 top-0 h-full w-px origin-top skew-x-[-14deg] bg-gradient-to-b from-transparent via-jade-400/50 to-transparent" />
        <div className="absolute inset-inline-end-24 end-24 top-0 h-full w-px origin-top skew-x-[-14deg] bg-gradient-to-b from-transparent via-jade-400/25 to-transparent" />
      </div>

      <div className="ucp-container relative py-8 md:py-12">
        <div className="max-w-xl">
          <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-pill bg-ink-800 px-3 py-1 text-xs font-semibold text-jade-300">
            <Icon name="shield" size={13} />
            {t.trust.licensedPharmacy}
          </p>

          <h1 className="text-2xl font-bold leading-tight md:text-4xl">{t.home.heroTitle}</h1>

          <p className="mt-2.5 text-sm text-text-on-ink-muted md:text-base">
            {t.home.heroSubtitle}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <ButtonLink href={routes.categories(locale)} size="md" iconEnd="arrowEnd">
              {t.home.heroCta}
            </ButtonLink>

            <Link
              href={routes.prescriptions(locale)}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border-ink bg-ink-800 px-5 text-base font-semibold text-text-on-ink transition-colors hover:bg-ink-700"
            >
              <Icon name="prescription" size={18} />
              {t.home.heroPrescription}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Service shortcuts.
 *
 * Sits directly under the hero as a compact strip rather than as a second
 * full-width banner — these are wayfinding, not marketing.
 */
export function ServiceStrip({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  const services = [
    { href: routes.prescriptions(locale), icon: "prescription" as const, title: t.services.prescriptionTitle, desc: t.services.prescriptionDesc },
    { href: routes.branches(locale), icon: "store" as const, title: t.services.pickupTitle, desc: t.services.pickupDesc },
    { href: routes.telepharmacy(locale), icon: "stethoscope" as const, title: t.services.telepharmacyTitle, desc: t.services.telepharmacyDesc },
    { href: routes.loyalty(locale), icon: "gift" as const, title: t.services.loyaltyTitle, desc: t.services.loyaltyDesc },
  ];

  return (
    <div className="border-b border-border bg-surface">
      <div className="ucp-container">
        <ul className="ucp-hide-scrollbar -mx-1 flex gap-2 overflow-x-auto py-3 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:py-4">
          {services.map((service) => (
            <li key={service.href} className="w-[230px] shrink-0 md:w-auto">
              <Link
                href={service.href}
                className="group flex h-full items-center gap-3 rounded-lg border border-border p-3 transition-[border-color,background-color] hover:border-jade-300 hover:bg-jade-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-service-soft text-service-text transition-colors group-hover:bg-lapis-100">
                  <Icon name={service.icon} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text ucp-clamp-1">{service.title}</span>
                  <span className="block text-xs text-text-muted ucp-clamp-1">{service.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
