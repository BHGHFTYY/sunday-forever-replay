import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, direction, isLocale } from "@ucp/core";
import type { Locale } from "@ucp/core";
import { Header } from "@/components/layout/Header.tsx";
import { Footer } from "@/components/layout/Footer.tsx";
import { CartProvider } from "@/components/cart/CartProvider.tsx";
import { AnalyticsBoot } from "@/components/AnalyticsBoot.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { data } from "@/lib/data.ts";
import { SITE_URL } from "@/lib/routes.ts";
import "@/styles/globals.css";

/**
 * Locale layout.
 *
 * Typeface: IBM Plex Sans Arabic carries both scripts. It is one
 * superfamily with a purpose-drawn Arabic rather than a Latin face with
 * Arabic bolted on, so the two scripts share a skeleton and the page does
 * not look like two different brands depending on the language.
 *
 * Three weights only. Arabic has no italic and no small caps to lean on,
 * so hierarchy is carried by size, colour and space — stacking more
 * weights would only add payload.
 *
 * `next/font` self-hosts and subsets the files and emits them with a
 * stable class, so there is no render-blocking request to Google and no
 * layout shift when the font swaps in.
 */
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-plex",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never block zoom. Pinch-zoom is how a large share of customers read
  // dosage text and delivery details on a phone.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0D141A" },
  ],
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t.brand.name} — ${t.brand.tagline}`,
      template: `%s | ${t.brand.short}`,
    },
    description: t.home.heroSubtitle,
    applicationName: t.brand.name,
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en", "x-default": "/ar" },
    },
    openGraph: {
      type: "website",
      siteName: t.brand.name,
      locale: locale === "ar" ? "ar_SA" : "en_SA",
      alternateLocale: locale === "ar" ? "en_SA" : "ar_SA",
      title: `${t.brand.name} — ${t.brand.tagline}`,
      description: t.home.heroSubtitle,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children, params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const t = getDictionary(locale);
  const categories = await data.catalog.listCategories();

  return (
    <html lang={locale} dir={direction(locale)} className={plex.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {/* First tab stop on every page. */}
        <a href="#main" className="ucp-skip-link">
          {t.nav.skipToContent}
        </a>

        <CartProvider>
          <div className="flex min-h-dvh flex-col">
            <Header locale={locale} categories={categories} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer locale={locale} />
          </div>
        </CartProvider>

        <AnalyticsBoot locale={locale} />
      </body>
    </html>
  );
}
