import { buildSuggestions, isLocale, DEFAULT_LOCALE } from "@ucp/core";
import { getBrandMap, getSearchIndex } from "@/lib/data.ts";
import { apiError, apiOk } from "@/lib/api.ts";
import { clientKey, rateLimit } from "@/lib/rate-limit.ts";

/**
 * Search-as-you-type.
 *
 * Runs against the in-process index, so a suggestion costs no network hop
 * beyond this one and no second system is in the critical path of the most
 * used interaction on the site.
 */

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 64;

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "suggest"), 300, 60);
  if (!limit.allowed) {
    return apiError("rate_limited", undefined, { "retry-after": String(limit.retryAfterSeconds) });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH).trim();
  const rawLocale = url.searchParams.get("locale") ?? DEFAULT_LOCALE;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  if (query.length < 2) return apiOk({ suggestions: [] });

  const [index, brands] = await Promise.all([getSearchIndex(), getBrandMap()]);
  const suggestions = buildSuggestions(index, query, locale, brands);

  return apiOk(
    { suggestions },
    // Short shared cache: the same prefixes are typed constantly, and the
    // catalogue does not change between keystrokes.
    { "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  );
}
