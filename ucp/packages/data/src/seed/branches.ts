import type { Branch, OpeningHours } from "@ucp/core";

/** 08:00–00:00 daily, the usual Saudi pharmacy pattern. */
const standard: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, day) => [day, { open: 8 * 60, close: 24 * 60 }]),
);

/** Branches that run past midnight. `close <= open` means overnight. */
const extended: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, day) => [day, { open: 8 * 60, close: 2 * 60 }]),
);

const twentyFourSeven: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, day) => [day, { open: 0, close: 24 * 60 }]),
);

export const branches: Branch[] = [
  {
    id: "br-olaya", code: "RUH-01",
    name: { ar: "فرع العليا", en: "Olaya Branch" },
    city: { ar: "الرياض", en: "Riyadh" },
    district: { ar: "العليا", en: "Olaya" },
    address: { ar: "طريق العليا العام، الرياض", en: "Olaya Main Road, Riyadh" },
    lat: 24.6949, lng: 46.6853, phone: "+966112345601",
    hours: twentyFourSeven,
    services: ["pickup", "prescription", "telepharmacy", "delivery_hub"],
  },
  {
    id: "br-malaz", code: "RUH-02",
    name: { ar: "فرع الملز", en: "Malaz Branch" },
    city: { ar: "الرياض", en: "Riyadh" },
    district: { ar: "الملز", en: "Malaz" },
    address: { ar: "شارع الأمير عبدالله، الرياض", en: "Prince Abdullah Street, Riyadh" },
    lat: 24.66, lng: 46.74, phone: "+966112345602",
    hours: standard,
    services: ["pickup", "prescription", "delivery_hub"],
  },
  {
    id: "br-narjis", code: "RUH-03",
    name: { ar: "فرع النرجس", en: "Narjis Branch" },
    city: { ar: "الرياض", en: "Riyadh" },
    district: { ar: "النرجس", en: "Narjis" },
    address: { ar: "طريق أنس بن مالك، الرياض", en: "Anas Ibn Malik Road, Riyadh" },
    lat: 24.8247, lng: 46.6408, phone: "+966112345603",
    hours: extended,
    services: ["pickup", "prescription", "delivery_hub"],
  },
  {
    id: "br-jed-hamra", code: "JED-01",
    name: { ar: "فرع الحمراء", en: "Al Hamra Branch" },
    city: { ar: "جدة", en: "Jeddah" },
    district: { ar: "الحمراء", en: "Al Hamra" },
    address: { ar: "شارع الأندلس، جدة", en: "Al Andalus Street, Jeddah" },
    lat: 21.5433, lng: 39.1728, phone: "+966122345604",
    hours: twentyFourSeven,
    services: ["pickup", "prescription", "telepharmacy", "delivery_hub"],
  },
  {
    id: "br-jed-salamah", code: "JED-02",
    name: { ar: "فرع السلامة", en: "Al Salamah Branch" },
    city: { ar: "جدة", en: "Jeddah" },
    district: { ar: "السلامة", en: "Al Salamah" },
    address: { ar: "شارع صاري، جدة", en: "Sari Street, Jeddah" },
    lat: 21.6, lng: 39.14, phone: "+966122345605",
    hours: standard,
    services: ["pickup", "prescription"],
  },
  {
    id: "br-dmm-shati", code: "DMM-01",
    name: { ar: "فرع الشاطئ", en: "Al Shati Branch" },
    city: { ar: "الدمام", en: "Dammam" },
    district: { ar: "الشاطئ", en: "Al Shati" },
    address: { ar: "طريق الملك سعود، الدمام", en: "King Saud Road, Dammam" },
    lat: 26.4207, lng: 50.0888, phone: "+966132345606",
    hours: standard,
    services: ["pickup", "prescription", "delivery_hub"],
  },
];

export const branchesById = new Map(branches.map((branch) => [branch.id, branch]));

/**
 * Delivery coverage. A city absent from this list is genuinely not served,
 * and `quoteDelivery` declines rather than guessing — which is why Dammam
 * appears here explicitly rather than being inferred from having a branch.
 */
export const deliveryZones = [
  { city: "Riyadh", branchIds: ["br-olaya", "br-malaz", "br-narjis"], baseTravelMinutes: 28, maxRadiusKm: 30 },
  { city: "Jeddah", branchIds: ["br-jed-hamra", "br-jed-salamah"], baseTravelMinutes: 32, maxRadiusKm: 28 },
  { city: "Dammam", branchIds: ["br-dmm-shati"], baseTravelMinutes: 30, maxRadiusKm: 22 },
];

/** Cities the address form offers, in both scripts. */
export const servedCities = [
  { value: "Riyadh", ar: "الرياض", en: "Riyadh" },
  { value: "Jeddah", ar: "جدة", en: "Jeddah" },
  { value: "Dammam", ar: "الدمام", en: "Dammam" },
];
