import { getDataSource } from "@ucp/data";
import {
  SearchIndex, buildCoPurchaseMatrix, type Brand, type Product,
} from "@ucp/core";

/**
 * Server-side data access.
 *
 * Pages and route handlers call these rather than the data source
 * directly, so the expensive derived structures (the search index, the
 * co-purchase matrix) are built once per process instead of once per
 * request.
 *
 * `cache()` from React would scope these per-request; these are
 * intentionally per-process because the catalogue changes on a deploy or
 * a webhook, not on a page view. A real deployment invalidates them from
 * the catalogue's change feed — `invalidateCatalogueCaches()` is the hook.
 */

export const data = getDataSource();

let searchIndexPromise: Promise<SearchIndex> | null = null;
let coPurchasePromise: Promise<Map<string, Map<string, number>>> | null = null;
let brandMapPromise: Promise<Map<string, Brand>> | null = null;

export function getSearchIndex(): Promise<SearchIndex> {
  searchIndexPromise ??= (async () => {
    const [products, categories, brands] = await Promise.all([
      data.catalog.allProducts(),
      data.catalog.listCategories(),
      data.catalog.listBrands(),
    ]);
    const brandsById = new Map(brands.map((b) => [b.id, b]));
    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    return new SearchIndex(
      products.map((product) => {
        const brand = brandsById.get(product.brandId);
        return {
          product,
          ...(brand ? { brand } : {}),
          categories: product.categoryIds
            .map((id) => categoriesById.get(id))
            .filter((c): c is NonNullable<typeof c> => !!c),
        };
      }),
      categories,
      brands,
    );
  })();
  return searchIndexPromise;
}

export function getCoPurchaseMatrix(): Promise<Map<string, Map<string, number>>> {
  coPurchasePromise ??= data.orders.basketsForAffinity().then(buildCoPurchaseMatrix);
  return coPurchasePromise;
}

export function getBrandMap(): Promise<Map<string, Brand>> {
  brandMapPromise ??= data.catalog.listBrands().then((brands) => new Map(brands.map((b) => [b.id, b])));
  return brandMapPromise;
}

export function invalidateCatalogueCaches(): void {
  searchIndexPromise = null;
  coPurchasePromise = null;
  brandMapPromise = null;
}

/** Product plus the brand it belongs to — what a product card needs. */
export interface ProductCardData {
  product: Product;
  brand?: Brand;
}

export async function withBrands(products: Product[]): Promise<ProductCardData[]> {
  const brands = await getBrandMap();
  return products.map((product) => {
    const brand = brands.get(product.brandId);
    return brand ? { product, brand } : { product };
  });
}
