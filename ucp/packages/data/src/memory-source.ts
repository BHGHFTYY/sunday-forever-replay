import { applyFilters, sortProducts } from "@ucp/core";
import type {
  Branch, Brand, Bundle, Category, Customer, LoyaltyAccount, Order,
  Prescription, PrescriptionStatus, Product, Promotion, TelepharmacySession,
  VitaminPlan,
} from "@ucp/core";

import type {
  BranchRepository, CatalogRepository, CustomerRepository, LoyaltyRepository,
  OrderRepository, Page, PrescriptionRepository, ProductQuery, PromotionRepository,
  TelepharmacyRepository, UcpDataSource, VitaminRepository,
} from "./adapter.ts";

import { products, productsById, productsBySlug } from "./seed/products.ts";
import {
  categories, categoriesById, categoriesBySlug, childrenOf, categoryPath as pathOf,
  categoryWithDescendants,
} from "./seed/categories.ts";
import { brands, brandsById, brandsBySlug } from "./seed/brands.ts";
import { bundles, bundlesById, bundlesBySlug } from "./seed/bundles.ts";
import { promotionsByCode, promotions } from "./seed/promotions.ts";
import { branches, branchesById, servedCities } from "./seed/branches.ts";
import {
  demoCustomer, demoLoyalty, demoOrders, demoPrescriptions, demoVitaminPlans,
} from "./seed/accounts.ts";

/**
 * In-memory implementation of the data boundary, backed by the seed.
 *
 * Writes mutate process-local state, which is correct for a single-node
 * demonstration and explicitly wrong for production — a real deployment
 * swaps this for a database-backed implementation of the same interfaces.
 * Every method that mutates is marked so that is not a surprise later.
 *
 * Reads are synchronous under the hood but the interface is async, so
 * moving to a real store is a change of implementation and not of every
 * call site.
 */

let sequence = 5000;
const nextId = (prefix: string) => `${prefix}-${(sequence += 1)}`;

// Mutable stores, seeded from the static data.
const customers = new Map<string, Customer>([[demoCustomer.id, { ...demoCustomer }]]);
const loyaltyAccounts = new Map<string, LoyaltyAccount>([[demoLoyalty.customerId, { ...demoLoyalty }]]);
const orders = new Map<string, Order>(demoOrders.map((o) => [o.id, o]));
const prescriptions = new Map<string, Prescription>(demoPrescriptions.map((p) => [p.id, p]));
const vitaminPlans = new Map<string, VitaminPlan>(demoVitaminPlans.map((p) => [p.id, p]));
const telepharmacySessions = new Map<string, TelepharmacySession>();

// ---------------------------------------------------------------------------

const catalog: CatalogRepository = {
  async getProduct(idOrSlug) {
    return productsById.get(idOrSlug) ?? productsBySlug.get(idOrSlug);
  },

  async getProducts(ids) {
    return ids.map((id) => productsById.get(id)).filter((p): p is Product => !!p);
  },

  async listProducts(query: ProductQuery): Promise<Page<Product>> {
    let scope = products;

    if (query.categoryId) {
      const ids = query.includeDescendants === false
        ? [query.categoryId]
        : categoryWithDescendants(query.categoryId);
      const idSet = new Set(ids);
      scope = scope.filter((p) => p.categoryIds.some((c) => idSet.has(c)));
    }
    if (query.brandId) scope = scope.filter((p) => p.brandId === query.brandId);
    if (query.filters) scope = applyFilters(scope, query.filters);

    const sorted = sortProducts(scope, query.sort ?? "relevance");
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.min(96, Math.max(1, query.limit ?? 24));

    return { items: sorted.slice(offset, offset + limit), total: sorted.length, offset, limit };
  },

  async allProducts() {
    return products;
  },

  async getCategory(idOrSlug) {
    return categoriesById.get(idOrSlug) ?? categoriesBySlug.get(idOrSlug);
  },

  async listCategories(): Promise<Category[]> {
    return categories;
  },

  async categoryChildren(categoryId) {
    return childrenOf(categoryId);
  },

  async categoryPath(categoryId) {
    return pathOf(categoryId);
  },

  async getBrand(idOrSlug) {
    return brandsById.get(idOrSlug) ?? brandsBySlug.get(idOrSlug);
  },

  async listBrands(): Promise<Brand[]> {
    return brands;
  },

  async brandProductCounts() {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.brandId, (counts.get(product.brandId) ?? 0) + 1);
    }
    return counts;
  },

  async getBundle(idOrSlug) {
    return bundlesById.get(idOrSlug) ?? bundlesBySlug.get(idOrSlug);
  },

  async listBundles(categoryId): Promise<Bundle[]> {
    const scoped = categoryId
      ? bundles.filter((b) => categoryWithDescendants(categoryId).includes(b.categoryId))
      : bundles;
    return [...scoped].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  },
};

const promotionRepo: PromotionRepository = {
  async getPromotion(code) {
    return promotionsByCode.get(code.trim().toUpperCase());
  },
  async listPublicPromotions(): Promise<Promotion[]> {
    const now = Date.now();
    return promotions.filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);
  },
};

const branchRepo: BranchRepository = {
  async listBranches(city): Promise<Branch[]> {
    return city ? branches.filter((b) => b.city.en === city) : branches;
  },
  async getBranch(id) {
    return branchesById.get(id);
  },
  async listCities() {
    return servedCities;
  },
  async deliveryLoad(city) {
    // A real implementation reads current rider utilisation from dispatch.
    // The seed returns a stable, deliberately un-random figure per city so
    // the ETA a customer sees does not jump between page loads.
    const byCity: Record<string, number> = { Riyadh: 0.62, Jeddah: 0.71, Dammam: 0.44 };
    return byCity[city] ?? 0.5;
  },
};

const orderRepo: OrderRepository = {
  async listOrders(customerId) {
    return [...orders.values()]
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getOrder(id, customerId) {
    const order = orders.get(id);
    // Ownership is checked here, not by the caller — an order lookup that
    // trusts the caller to filter is how order data leaks between accounts.
    return order && order.customerId === customerId ? order : undefined;
  },

  /** MUTATES process state. */
  async createOrder(input) {
    const id = nextId("ord");
    const order: Order = { ...input, id, reference: `UCP-${id.split("-")[1]}` };
    orders.set(id, order);
    return order;
  },

  async purchaseHistory(customerId) {
    return [...orders.values()]
      .filter((o) => o.customerId === customerId && o.status !== "cancelled")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((o) => o.lines.filter((l) => l.kind === "product").map((l) => l.id));
  },

  async orderCounts() {
    const counts = new Map<string, number>();
    for (const order of orders.values()) {
      if (order.status === "cancelled") continue;
      for (const line of order.lines) {
        if (line.kind !== "product") continue;
        counts.set(line.id, (counts.get(line.id) ?? 0) + line.quantity);
      }
    }
    return counts;
  },

  async basketsForAffinity() {
    return [...orders.values()]
      .filter((o) => o.status !== "cancelled")
      .map((o) => ({ productIds: o.lines.filter((l) => l.kind === "product").map((l) => l.id) }));
  },
};

const customerRepo: CustomerRepository = {
  async getCustomerByEmail(email) {
    const normalised = email.trim().toLowerCase();
    return [...customers.values()].find((c) => c.email.toLowerCase() === normalised);
  },
  async getCustomer(id) {
    return customers.get(id);
  },
  /** MUTATES process state. */
  async createCustomer(input) {
    const customer: Customer = { ...input, id: nextId("cust") };
    customers.set(customer.id, customer);
    loyaltyAccounts.set(customer.id, {
      customerId: customer.id, pointsBalance: 0, lifetimePoints: 0, tierId: "member",
    });
    return customer;
  },
  /** MUTATES process state. */
  async updateCustomer(id, patch) {
    const existing = customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id };
    customers.set(id, updated);
    return updated;
  },
};

const loyaltyRepo: LoyaltyRepository = {
  async getAccount(customerId) {
    return loyaltyAccounts.get(customerId);
  },
  /** MUTATES process state. */
  async adjustPoints(customerId, earned, redeemed) {
    const account = loyaltyAccounts.get(customerId);
    if (!account) return undefined;
    const updated: LoyaltyAccount = {
      ...account,
      pointsBalance: Math.max(0, account.pointsBalance + earned - redeemed),
      lifetimePoints: account.lifetimePoints + Math.max(0, earned),
    };
    loyaltyAccounts.set(customerId, updated);
    return updated;
  },
};

const prescriptionRepo: PrescriptionRepository = {
  async listPrescriptions(customerId) {
    return [...prescriptions.values()]
      .filter((p) => p.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getPrescription(id, customerId) {
    const found = prescriptions.get(id);
    return found && found.customerId === customerId ? found : undefined;
  },
  /** MUTATES process state. */
  async createPrescription(input) {
    const id = nextId("rx");
    const created: Prescription = { ...input, id, reference: `RX-${id.split("-")[1]}` };
    prescriptions.set(id, created);
    return created;
  },
  /** MUTATES process state. */
  async updateStatus(id, status: PrescriptionStatus) {
    const existing = prescriptions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    prescriptions.set(id, updated);
    return updated;
  },
};

const vitaminRepo: VitaminRepository = {
  async listPlans(customerId) {
    return [...vitaminPlans.values()].filter((p) => p.customerId === customerId);
  },
  async getPlan(id, customerId) {
    const plan = vitaminPlans.get(id);
    return plan && plan.customerId === customerId ? plan : undefined;
  },
  /** MUTATES process state. */
  async createPlan(input) {
    const plan: VitaminPlan = { ...input, id: nextId("vp") };
    vitaminPlans.set(plan.id, plan);
    return plan;
  },
  /** MUTATES process state. */
  async updatePlan(id, customerId, patch) {
    const plan = vitaminPlans.get(id);
    if (!plan || plan.customerId !== customerId) return undefined;
    const updated = { ...plan, ...patch, id, customerId };
    vitaminPlans.set(id, updated);
    return updated;
  },
  /** MUTATES process state. */
  async deletePlan(id, customerId) {
    const plan = vitaminPlans.get(id);
    if (!plan || plan.customerId !== customerId) return false;
    return vitaminPlans.delete(id);
  },
};

const telepharmacyRepo: TelepharmacyRepository = {
  async listSessions(customerId) {
    return [...telepharmacySessions.values()].filter((s) => s.customerId === customerId);
  },
  /** MUTATES process state. */
  async createSession(input) {
    const session: TelepharmacySession = {
      ...input,
      id: nextId("tp"),
      createdAt: new Date().toISOString(),
      status: input.scheduledFor ? "scheduled" : "requested",
    };
    telepharmacySessions.set(session.id, session);
    return session;
  },
  async availability() {
    // Derived from branches that actually offer telepharmacy and their
    // opening hours, rather than a hardcoded "we are online".
    const { isBranchOpen } = await import("@ucp/core");
    const now = new Date();
    const staffed = branches.filter(
      (b) => b.services.includes("telepharmacy") && isBranchOpen(b.hours, now),
    );
    const onlineCount = staffed.length;
    if (onlineCount > 0) return { chat: true, video: true, onlineCount };

    // Next opening across telepharmacy branches.
    const { minutesUntilOpen } = await import("@ucp/core");
    const waits = branches
      .filter((b) => b.services.includes("telepharmacy"))
      .map((b) => minutesUntilOpen(b.hours, now))
      .filter((m): m is number => m !== null);
    const soonest = waits.length ? Math.min(...waits) : undefined;

    return {
      chat: false,
      video: false,
      onlineCount: 0,
      ...(soonest !== undefined
        ? { nextSlot: new Date(now.getTime() + soonest * 60_000).toISOString() }
        : {}),
    };
  },
};

export const memorySource: UcpDataSource = {
  catalog,
  promotions: promotionRepo,
  branches: branchRepo,
  orders: orderRepo,
  customers: customerRepo,
  loyalty: loyaltyRepo,
  prescriptions: prescriptionRepo,
  vitamins: vitaminRepo,
  telepharmacy: telepharmacyRepo,
};
