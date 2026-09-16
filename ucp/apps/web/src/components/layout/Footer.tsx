import Link from "next/link";
import type { Locale } from "@ucp/core";
import { Icon, type IconName } from "@/components/ui/Icon.tsx";
import { Logo } from "./Logo.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Footer.
 *
 * Organised into the five groups the brief names, with a trust strip above
 * and a legal line below. Each column is short enough to scan; the old
 * approach of listing every page UCP has ever had is what made the
 * previous footer a wall of text nobody read.
 *
 * Claims here are limited to things UCP can actually stand behind — a
 * licence, a returns window, a payment method. No badges, no invented
 * certifications, no customer-count statistics.
 */
export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const year = new Date().getFullYear();

  const columns: Array<{
    title: string;
    icon: IconName;
    links: Array<{ href: string; label: string }>;
  }> = [
    {
      title: t.footer.aboutTitle,
      icon: "shield",
      links: [
        { href: routes.legal(locale, "about"), label: t.footer.about },
        { href: routes.branches(locale), label: t.footer.branches },
        { href: routes.legal(locale, "careers"), label: t.footer.careers },
        { href: routes.help(locale), label: t.footer.contact },
      ],
    },
    {
      title: t.footer.serviceTitle,
      icon: "chat",
      links: [
        { href: routes.help(locale), label: t.footer.help },
        { href: routes.legal(locale, "delivery"), label: t.footer.shipping },
        { href: routes.legal(locale, "returns"), label: t.footer.returns },
        { href: routes.legal(locale, "faq"), label: t.footer.faq },
      ],
    },
    {
      title: t.footer.shopTitle,
      icon: "cart",
      links: [
        { href: routes.categories(locale), label: t.footer.allCategories },
        { href: routes.brands(locale), label: t.footer.brands },
        { href: routes.offers(locale), label: t.footer.offers },
        { href: routes.bundles(locale), label: t.footer.packages },
      ],
    },
    {
      title: t.footer.pharmacyTitle,
      icon: "prescription",
      links: [
        { href: routes.prescriptions(locale), label: t.footer.prescriptions },
        { href: routes.telepharmacy(locale), label: t.footer.telepharmacy },
        { href: routes.vitamins(locale), label: t.footer.vitamins },
        { href: routes.branches(locale), label: t.footer.pickup },
      ],
    },
    {
      title: t.footer.legalTitle,
      icon: "lock",
      links: [
        { href: routes.legal(locale, "privacy"), label: t.footer.privacy },
        { href: routes.legal(locale, "terms"), label: t.footer.terms },
        { href: routes.legal(locale, "returns"), label: t.footer.returnPolicy },
        { href: routes.legal(locale, "cookies"), label: t.footer.cookies },
      ],
    },
  ];

  const trust: Array<{ icon: IconName; label: string }> = [
    { icon: "shield", label: t.trust.licensedPharmacy },
    { icon: "lock", label: t.trust.securePayment },
    { icon: "stethoscope", label: t.trust.licensedPharmacists },
    { icon: "refresh", label: t.trust.easyReturns },
  ];

  return (
    <footer className="mt-12 bg-surface-ink text-text-on-ink">
      {/* Trust strip. Four facts, each verifiable. */}
      <div className="border-b border-border-ink">
        <div className="ucp-container grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
          {trust.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ink-800 text-jade-300">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="text-xs font-semibold leading-snug md:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ucp-container py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))]">
          <div className="md:col-span-2 lg:col-span-1">
            <Logo locale={locale} className="text-text-on-ink" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-on-ink-muted">
              {t.brand.name}
            </p>

            <div className="mt-5 space-y-2.5 text-sm text-text-on-ink-muted">
              <a href="tel:+966112345601" className="flex items-center gap-2 hover:text-text-on-ink">
                <Icon name="phone" size={16} />
                <span className="numeric">+966 11 234 5601</span>
              </a>
              <a href="mailto:care@ucp.example.sa" className="flex items-center gap-2 hover:text-text-on-ink">
                <Icon name="mail" size={16} />
                care@ucp.example.sa
              </a>
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-on-ink">
                <Icon name={column.icon} size={15} className="text-jade-300" />
                {column.title}
              </h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-text-on-ink-muted transition-colors hover:text-text-on-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-border-ink">
        <div className="ucp-container flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-text-on-ink-muted">
            © <span className="numeric">{year}</span> {t.brand.name}. {t.footer.rights}.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-on-ink-muted">{t.footer.payments}</span>
            <PaymentMarks />
          </div>
        </div>

        <div className="ucp-container pb-6">
          <p className="flex items-center gap-1.5 text-[11px] text-text-on-ink-muted">
            <Icon name="shield" size={13} />
            {t.footer.licence}
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Wordmarks rather than logo files — no third-party brand assets shipped. */
function PaymentMarks() {
  return (
    <ul className="flex items-center gap-1.5">
      {["mada", "VISA", "Apple Pay"].map((mark) => (
        <li
          key={mark}
          className="rounded-sm border border-border-ink bg-ink-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-text-on-ink-muted"
        >
          {mark}
        </li>
      ))}
    </ul>
  );
}
