export * from "./adapter.ts";
export { memorySource } from "./memory-source.ts";

export { categories, topLevelCategories, childrenOf, categoryPath, categoryWithDescendants } from "./seed/categories.ts";
export { brands } from "./seed/brands.ts";
export { branches, deliveryZones, servedCities } from "./seed/branches.ts";
export { bundles } from "./seed/bundles.ts";
export { promotions } from "./seed/promotions.ts";
export { DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD, demoCustomer } from "./seed/accounts.ts";

import { memorySource } from "./memory-source.ts";
import type { UcpDataSource } from "./adapter.ts";

/**
 * Resolves the data source for this deployment.
 *
 * This single function is the swap point. Pointing UCP at its real
 * catalogue and order systems means returning a different implementation
 * of `UcpDataSource` here — no page, component or route handler changes,
 * because none of them import the seed.
 */
export function getDataSource(): UcpDataSource {
  return memorySource;
}
