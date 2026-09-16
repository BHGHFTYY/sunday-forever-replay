import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  bestSellers, bundleComponentTotal, isLocale, pickedForYou,
  reorderCandidates, todaysOffers, type CartCatalog, type Locale,
} from "@ucp/core";
import { Hero, ServiceStrip } from "@/components/layout/Hero.tsx";
import { Section } from "@/components/ui/Section.tsx";
import { CategoryCard } from "@/components/product/CategoryCard.tsx";
import { BrandRailCard } from "@/components/product/BrandCard.tsx";
import { BundleCard } from "@/components/product/BundleCard.tsx";
import { ProductRail } from "@/components/product/ProductRail.tsx";
import { Icon } from "@/components/ui/Icon.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { data, getBrandMap } from "@/lib/data.ts";
import { getSession } from "@/lib/session.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Homepage.
 *
 * Structure, in order: compact hero → service shortcuts → categories →
 * merchandising rails → brands → packages.
 *
 * Every rail below the categories is DATA-DRIVEN and disappears when its
 * data is absent — `<Section>` renders nothing when it has no children.
 * That is what makes "Most ordered" honest (it comes from real order
 * counts) and "Picked for you" honest (it needs a real affinity signal, so
 * a first-time visitor never sees a section implying UCP knows them).
 *
 * What is deliberately NOT here: a banner carousel, a "Coming soon"
 * section, a countdown, and a generic "Best sellers" block that is really
 * just whatever the merchandiser pinned.
 */

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const t = getDictionary(locale);

  return {
    title: `${t.brand.name} — ${t.brand.tagline}`,
    description: t.home.heroSubtitle,
    alternates: { canonical: `/${locale}` },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [
    categories, products, brandList, brands, bundles, orderCounts, session,
  ] = await Promise.all([
    data.catalog.listCategories(),
    data.catalog.allProducts(),
    data.catalog.listBrands(),
    getBrandMap(),
    data.catalog.listBundles(),
    data.orders.orderCounts(),
    getSession(),
  ]);

  const featured = categories.filter((c) => c.parentId === null && c.featured !== false);

  // --- Data-driven rails. Each may legitimately come back empty.
  const popular = bestSellers(products, orderCounts, 10);
  const offers = todaysOffers(products, 10);

  const purchased = session ? await data.orders.purchaseHistory(session.customer.id) : [];
  const reorder = reorderCandidates(products, purchased, 10);

  // Affinity is derived from what the customer actually bought, so this
  // section cannot appear for someone with no history.
  const purchasedProducts = products.filter((p) => purchased.includes(p.id));
  const picks = pickedForYou(products, {
    affinityCategoryIds: [...new Set(purchasedProducts.flatMap((p) => p.categoryIds))],
    affinityBrandIds: [...new Set(purchasedProducts.map((p) => p.brandId))],
    purchasedProductIds: purchased,
  }, 10);

  const productsById = new Map(products.map((p) => [p.id, p]));
  const cartCatalog: CartCatalog = {
    getProduct: (id) => productsById.get(id),
    getBundle: (id) => bundles.find((b) => b.id === id),
    getBrand: (id) => brands.get(id),
  };

  const brandCounts = await data.catalog.brandProductCounts();

  return (
    <>
      <Hero locale={locale} />
      <ServiceStrip locale={locale} />

      {/* Categories sit immediately below the hero, above every rail —
          they are the fastest route to what someone came for. */}
      <Section
        id="categories"
        title={t.home.shopByCategory}
        viewAllHref={routes.categories(locale)}
        viewAllLabel={t.nav.allCategories}
      >
        <div className="ucp-container">
          <ul className="grid grid-cols-4 gap-1 sm:grid-cols-5 md:grid-cols-6">
            {featured.map((category) => (
              <li key={category.id}>
                <CategoryCard category={category} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Only shown to a returning customer with real history. */}
      {reorder.length > 0 ? (
        <Section id="reorder" title={t.home.reorder} viewAllHref={routes.orders(locale)} viewAllLabel={t.home.viewAll}>
          <ProductRail products={reorder} brands={brands} locale={locale} source="home_reorder" />
        </Section>
      ) : null}

      <Section
        id="best-sellers"
        title={t.home.bestSellers}
        viewAllHref={routes.categories(locale)}
        viewAllLabel={t.home.viewAll}
      >
        {popular.length > 0 ? (
          <ProductRail
            products={popular}
            brands={brands}
            locale={locale}
            source="home_best_sellers"
            priorityCount={2}
          />
        ) : null}
      </Section>

      <Section
        id="offers"
        title={t.home.todaysOffers}
        viewAllHref={routes.offers(locale)}
        viewAllLabel={t.home.viewAll}
      >
        {offers.length > 0 ? (
          <ProductRail products={offers} brands={brands} locale={locale} source="home_offers" />
        ) : null}
      </Section>

      {picks.length > 0 ? (
        <Section id="picked" title={t.home.pickedForYou}>
          <ProductRail products={picks} brands={brands} locale={locale} source="home_picked" />
        </Section>
      ) : null}

      <Section
        id="brands"
        title={t.home.shopByBrand}
        viewAllHref={routes.brands(locale)}
        viewAllLabel={t.nav.allBrands}
      >
        <div className="ucp-container">
          <ul className="ucp-rail -mx-1 px-1">
            {brandList.slice(0, 16).map((brand) => (
              <li key={brand.id} className="contents">
                <BrandRailCard
                  brand={brand}
                  locale={locale}
                  productCount={brandCounts.get(brand.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        id="packages"
        title={t.home.packages}
        subtitle={t.home.packagesSubtitle}
        viewAllHref={routes.bundles(locale)}
        viewAllLabel={t.home.viewAll}
      >
        <div className="ucp-container">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.slice(0, 3).map((bundle) => (
              <li key={bundle.id}>
                <BundleCard
                  bundle={bundle}
                  locale={locale}
                  componentTotal={bundleComponentTotal(bundle, cartCatalog)}
                  itemCount={bundle.items.reduce((sum, item) => sum + item.quantity, 0)}
                />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <PharmacyServicesPanel locale={locale} />
    </>
  );
}

/**
 * Closing services panel.
 *
 * Repeats the pharmacy services at the bottom of a long scroll, where
 * someone who browsed without finding what they wanted is most likely to
 * need a pharmacist rather than another product.
 */
function PharmacyServicesPanel({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  const cards = [
    {
      href: routes.prescriptions(locale), icon: "prescription" as const,
      title: t.services.prescriptionTitle, desc: t.services.prescriptionDesc,
    },
    {
      href: routes.telepharmacy(locale), icon: "stethoscope" as const,
      title: t.services.telepharmacyTitle, desc: t.services.telepharmacyDesc,
    },
    {
      href: routes.vitamins(locale), icon: "bell" as const,
      title: t.services.vitaminsTitle, desc: t.services.vitaminsDesc,
    },
  ];

  return (
    <section aria-labelledby="services-heading" className="ucp-container py-8 md:py-10">
      <div className="overflow-hidden rounded-xl bg-surface-ink p-5 text-text-on-ink md:p-8">
        <h2 id="services-heading" className="text-xl font-bold md:text-2xl">
          {t.home.services}
        </h2>

        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {cards.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group flex h-full flex-col gap-2 rounded-lg border border-border-ink bg-ink-800 p-4 transition-colors hover:border-jade-700"
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-ink-900 text-jade-300">
                  <Icon name={card.icon} size={21} />
                </span>
                <span className="text-base font-bold">{card.title}</span>
                <span className="text-sm text-text-on-ink-muted">{card.desc}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-jade-300">
                  {t.common.more}
                  <Icon name="chevronEnd" size={15} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
