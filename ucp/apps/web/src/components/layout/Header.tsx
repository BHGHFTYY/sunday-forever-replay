import Link from "next/link";
import type { Category, Locale } from "@ucp/core";
import { t as tr } from "@ucp/core";
import { SearchBar } from "@/components/search/SearchBar.tsx";
import { Logo } from "./Logo.tsx";
import { HeaderActions } from "./HeaderActions.tsx";
import { MobileMenu } from "./MobileMenu.tsx";
import { LocaleSwitch } from "./LocaleSwitch.tsx";
import { Icon } from "@/components/ui/Icon.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Site header.
 *
 * Layout follows the brief exactly, and the reasons are worth stating:
 *
 *  - **Logo on the leading edge** — the right in Arabic, the left in
 *    English. Handled with logical properties, so it is one layout rather
 *    than two mirrored ones.
 *  - **Search is the largest element.** On a pharmacy site most visits are
 *    a specific-product hunt, so search outranks browse. It gets a full
 *    row of its own rather than being squeezed between logo and icons.
 *  - **Navigation sits below search**, not above it.
 *  - **No "Call Now" button.** It was removed per the brief: it occupied
 *    prime header space to push people off the site and into a queue.
 *    Pharmacist contact lives in Telepharmacy, where it is actually
 *    staffed, and the phone number stays in the footer.
 *  - **"اطلب وصفتك" is a header action**, not a buried link — prescriptions
 *    are a first-class UCP feature.
 *
 * This is a server component; only the three genuinely interactive pieces
 * (search, cart badge, mobile menu) ship JavaScript.
 */
export function Header({
  locale, categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const t = getDictionary(locale);
  const primaryNav = categories.filter((c) => c.parentId === null).slice(0, 8);

  return (
    <header className="sticky top-0 z-[200] border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Utility strip: quiet, factual, no marketing. */}
      <div className="hidden border-b border-border bg-sand-50 lg:block">
        <div className="ucp-container flex h-9 items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Icon name="shield" size={14} />
              {t.trust.licensedPharmacy}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="truck" size={14} />
              {t.trust.easyReturns}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={routes.branches(locale)} className="flex items-center gap-1.5 hover:text-text">
              <Icon name="location" size={14} />
              {t.footer.branches}
            </Link>
            <Link href={routes.help(locale)} className="hover:text-text">{t.footer.help}</Link>
            <LocaleSwitch locale={locale} />
          </div>
        </div>
      </div>

      <div className="ucp-container">
        {/* Row 1 — identity and actions. */}
        <div className="flex h-14 items-center gap-3 md:h-16 md:gap-6">
          <MobileMenu locale={locale} categories={categories} />

          <Link
            href={routes.home(locale)}
            className="shrink-0 rounded-sm text-text"
            aria-label={t.brand.name}
          >
            <Logo locale={locale} />
          </Link>

          {/* Search takes every pixel left over on desktop. */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar locale={locale} />
          </div>

          <HeaderActions locale={locale} />
        </div>

        {/* Row 2 — search on mobile, where it needs the full width. */}
        <div className="pb-3 md:hidden">
          <SearchBar locale={locale} />
        </div>
      </div>

      {/* Row 3 — navigation, below search. */}
      <nav
        aria-label={t.nav.categories}
        className="hidden border-t border-border bg-surface md:block"
      >
        <div className="ucp-container">
          <ul className="ucp-hide-scrollbar flex items-center gap-1 overflow-x-auto">
            <li>
              <Link
                href={routes.categories(locale)}
                className="flex h-11 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-text hover:text-primary-text"
              >
                <Icon name="menu" size={16} />
                {t.nav.allCategories}
              </Link>
            </li>

            {primaryNav.map((category) => (
              <li key={category.id}>
                <Link
                  href={routes.category(locale, category.slug)}
                  className="flex h-11 items-center whitespace-nowrap rounded-sm px-3 text-sm font-medium text-text-muted transition-colors hover:text-text"
                >
                  {tr(category.name, locale)}
                </Link>
              </li>
            ))}

            <li className="ms-auto flex items-center gap-1">
              <Link
                href={routes.offers(locale)}
                className="flex h-11 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-offer-text"
              >
                <Icon name="tag" size={16} />
                {t.nav.offers}
              </Link>
              <Link
                href={routes.bundles(locale)}
                className="flex h-11 items-center whitespace-nowrap rounded-sm px-3 text-sm font-medium text-text-muted hover:text-text"
              >
                {t.nav.packages}
              </Link>
              <Link
                href={routes.telepharmacy(locale)}
                className="flex h-11 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-medium text-text-muted hover:text-text"
              >
                <Icon name="stethoscope" size={16} />
                {t.nav.telepharmacy}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
