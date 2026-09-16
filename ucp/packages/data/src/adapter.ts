import type {
  Branch, Brand, Bundle, Category, Customer, LoyaltyAccount, Order,
  Prescription, PrescriptionStatus, Product, Promotion, SortKey,
  ProductFilters, TelepharmacySession, VitaminPlan,
} from "@ucp/core";

/**
 * The data boundary.
 *
 * Everything above this line — pages, API routes, the mobile app — talks to
 * these interfaces and never to a concrete store. The seeded implementation
 * in `memory-source.ts` is one implementation; UCP's own ERP, an OMS, a
 * Postgres schema or a headless commerce API are others, and swapping them
 * in is a change to the factory in `index.ts` and nothing else.
 *
 * The interfaces are intentionally narrow and read-shaped. Anything that
 * changes money or stock goes through an explicit write method so it can be
 * audited, rate-limited and transacted in a real implementation.
 */

export interface ProductQuery {
  categoryId?: string;
  /** Include products in descendant categories too. */
  includeDescendants?: boolean;
  brandId?: string;
  filters?: ProductFilters;
  sort?: SortKey;
  offset?: number;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface CatalogRepository {
  getProduct(idOrSlug: string): Promise<Product | undefined>;
  getProducts(ids: string[]): Promise<Product[]>;
  listProducts(query: ProductQuery): Promise<Page<Product>>;
  /** Whole catalogue — used by the in-process search index and rails. */
  allProducts(): Promise<Product[]>;

  getCategory(idOrSlug: string): Promise<Category | undefined>;
  listCategories(): Promise<Category[]>;
  categoryChildren(categoryId: string): Promise<Category[]>;
  categoryPath(categoryId: string): Promise<Category[]>;

  getBrand(idOrSlug: string): Promise<Brand | undefined>;
  listBrands(): Promise<Brand[]>;
  brandProductCounts(): Promise<Map<string, number>>;

  getBundle(idOrSlug: string): Promise<Bundle | undefined>;
  listBundles(categoryId?: string): Promise<Bundle[]>;
}

export interface PromotionRepository {
  getPromotion(code: string): Promise<Promotion | undefined>;
  listPublicPromotions(): Promise<Promotion[]>;
}

export interface BranchRepository {
  listBranches(city?: string): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  listCities(): Promise<Array<{ value: string; ar: string; en: string }>>;
  /**
   * Live rider load, 0..1+. A real implementation reads this from the
   * dispatch system; returning a number the ETA engine can act on is the
   * whole point of the interface.
   */
  deliveryLoad(city: string): Promise<number>;
}

export interface OrderRepository {
  listOrders(customerId: string): Promise<Order[]>;
  getOrder(id: string, customerId: string): Promise<Order | undefined>;
  createOrder(order: Omit<Order, "id" | "reference">): Promise<Order>;
  /** Product ids the customer has bought, most recent first. */
  purchaseHistory(customerId: string): Promise<string[]>;
  /** Order counts per product, for the best-seller rail. Empty map is valid. */
  orderCounts(): Promise<Map<string, number>>;
  /** Baskets as product-id lists, for the co-purchase matrix. */
  basketsForAffinity(): Promise<Array<{ productIds: string[] }>>;
}

export interface CustomerRepository {
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: Omit<Customer, "id">): Promise<Customer>;
  updateCustomer(id: string, patch: Partial<Customer>): Promise<Customer | undefined>;
}

export interface LoyaltyRepository {
  getAccount(customerId: string): Promise<LoyaltyAccount | undefined>;
  adjustPoints(customerId: string, earned: number, redeemed: number): Promise<LoyaltyAccount | undefined>;
}

export interface PrescriptionRepository {
  listPrescriptions(customerId: string): Promise<Prescription[]>;
  getPrescription(id: string, customerId: string): Promise<Prescription | undefined>;
  createPrescription(input: Omit<Prescription, "id" | "reference">): Promise<Prescription>;
  updateStatus(id: string, status: PrescriptionStatus): Promise<Prescription | undefined>;
}

export interface VitaminRepository {
  listPlans(customerId: string): Promise<VitaminPlan[]>;
  getPlan(id: string, customerId: string): Promise<VitaminPlan | undefined>;
  createPlan(plan: Omit<VitaminPlan, "id">): Promise<VitaminPlan>;
  updatePlan(id: string, customerId: string, patch: Partial<VitaminPlan>): Promise<VitaminPlan | undefined>;
  deletePlan(id: string, customerId: string): Promise<boolean>;
}

export interface TelepharmacyRepository {
  listSessions(customerId: string): Promise<TelepharmacySession[]>;
  createSession(input: Omit<TelepharmacySession, "id" | "createdAt" | "status">): Promise<TelepharmacySession>;
  /** Whether a pharmacist can take a consultation right now. */
  availability(): Promise<{ chat: boolean; video: boolean; nextSlot?: string; onlineCount: number }>;
}

/** Everything the application needs, in one injectable object. */
export interface UcpDataSource {
  catalog: CatalogRepository;
  promotions: PromotionRepository;
  branches: BranchRepository;
  orders: OrderRepository;
  customers: CustomerRepository;
  loyalty: LoyaltyRepository;
  prescriptions: PrescriptionRepository;
  vitamins: VitaminRepository;
  telepharmacy: TelepharmacyRepository;
}
