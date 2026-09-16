import type { Locale } from "@ucp/core";

/**
 * URL construction.
 *
 * Every internal link goes through here, which is what keeps the locale
 * prefix and the short, stable path shapes (`/p/`, `/c/`, `/b/`)
 * consistent across the app — and makes changing a URL scheme a one-file
 * edit rather than a grep.
 *
 * The paths are deliberately short and human-readable for SEO: a product
 * lives at `/ar/p/cerave-foaming-facial-cleanser`, not at a nested
 * category path that breaks whenever merchandising moves it.
 */

export const routes = {
  home: (l: Locale) => `/${l}`,

  product: (l: Locale, slug: string) => `/${l}/p/${slug}`,
  category: (l: Locale, slug: string) => `/${l}/c/${slug}`,
  categories: (l: Locale) => `/${l}/categories`,
  brand: (l: Locale, slug: string) => `/${l}/b/${slug}`,
  brands: (l: Locale) => `/${l}/brands`,
  bundle: (l: Locale, slug: string) => `/${l}/packages/${slug}`,
  bundles: (l: Locale) => `/${l}/packages`,
  offers: (l: Locale) => `/${l}/offers`,

  search: (l: Locale, query?: string) =>
    query ? `/${l}/search?q=${encodeURIComponent(query)}` : `/${l}/search`,

  cart: (l: Locale) => `/${l}/cart`,
  checkout: (l: Locale) => `/${l}/checkout`,
  orderConfirmation: (l: Locale, id: string) => `/${l}/checkout/confirmation/${id}`,

  account: (l: Locale) => `/${l}/account`,
  orders: (l: Locale) => `/${l}/account/orders`,
  order: (l: Locale, id: string) => `/${l}/account/orders/${id}`,
  addresses: (l: Locale) => `/${l}/account/addresses`,
  signIn: (l: Locale, next?: string) =>
    next ? `/${l}/account/sign-in?next=${encodeURIComponent(next)}` : `/${l}/account/sign-in`,
  signUp: (l: Locale) => `/${l}/account/sign-up`,

  loyalty: (l: Locale) => `/${l}/loyalty`,
  prescriptions: (l: Locale) => `/${l}/prescriptions`,
  prescription: (l: Locale, id: string) => `/${l}/prescriptions/${id}`,
  telepharmacy: (l: Locale) => `/${l}/telepharmacy`,
  vitamins: (l: Locale) => `/${l}/account/vitamins`,
  branches: (l: Locale) => `/${l}/branches`,

  legal: (l: Locale, slug: string) => `/${l}/legal/${slug}`,
  help: (l: Locale) => `/${l}/help`,
} as const;

/** Swaps the locale on the current path, preserving everything after it. */
export function switchLocale(pathname: string, to: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${to}`;
  segments[0] = to;
  return `/${segments.join("/")}`;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ucp.example.sa";

export function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}
