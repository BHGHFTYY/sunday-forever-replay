import { riyals } from "@ucp/core";
import type { Bundle } from "@ucp/core";

/**
 * Curated packages.
 *
 * The Oral Care packages from brief §8 are the anchor: a complete routine
 * — brush, paste, mouthwash, floss — bought once at a package price rather
 * than assembled from four separate pages.
 *
 * The package price is always genuinely below the sum of its parts; the
 * cart computes and displays the real difference from live component
 * prices rather than storing a claimed saving, so the number shown can
 * never drift away from what the components actually cost today.
 */
export const bundles: Bundle[] = [
  {
    id: "bn-oral-essentials",
    slug: "oral-care-essentials",
    name: { ar: "باقة العناية بالفم الأساسية", en: "Oral Care Essentials Package" },
    description: {
      ar: "روتين كامل للعناية بالفم: فرشاة ومعجون وغسول وخيط أسنان في باقة واحدة.",
      en: "A complete oral care routine: brush, toothpaste, mouthwash and floss in one package.",
    },
    items: [
      { productId: "p-oralb-pro-brush", quantity: 1 },
      { productId: "p-colgate-total", quantity: 1 },
      { productId: "p-listerine-cool-mint", quantity: 1 },
      { productId: "p-oralb-floss", quantity: 1 },
    ],
    price: riyals(65), // components total SAR 75
    imageUrl: "/api/media/bundle/bn-oral-essentials.svg",
    categoryId: "cat-oral",
    position: 1,
  },
  {
    id: "bn-oral-sensitive",
    slug: "sensitive-teeth-package",
    name: { ar: "باقة الأسنان الحساسة", en: "Sensitive Teeth Package" },
    description: {
      ar: "معجون للأسنان الحساسة مع فرشاة وخيط، لروتين يومي كامل.",
      en: "Sensitivity toothpaste with a brush and floss, for a complete daily routine.",
    },
    items: [
      { productId: "p-sensodyne-repair", quantity: 1 },
      { productId: "p-oralb-pro-brush", quantity: 1 },
      { productId: "p-oralb-floss", quantity: 1 },
    ],
    price: riyals(55), // components total SAR 62
    imageUrl: "/api/media/bundle/bn-oral-sensitive.svg",
    categoryId: "cat-oral",
    position: 2,
  },
  {
    id: "bn-oral-electric",
    slug: "electric-oral-care-package",
    name: { ar: "باقة العناية الكهربائية بالفم", en: "Electric Oral Care Package" },
    description: {
      ar: "فرشاة كهربائية مع معجون وغسول فم، لترقية روتينك اليومي.",
      en: "An electric toothbrush with toothpaste and mouthwash, to upgrade the daily routine.",
    },
    items: [
      { productId: "p-oralb-electric", quantity: 1 },
      { productId: "p-sensodyne-repair", quantity: 1 },
      { productId: "p-listerine-cool-mint", quantity: 1 },
    ],
    price: riyals(185), // components total SAR 208
    imageUrl: "/api/media/bundle/bn-oral-electric.svg",
    categoryId: "cat-oral",
    position: 3,
  },
  {
    id: "bn-face-routine",
    slug: "daily-face-routine",
    name: { ar: "باقة روتين الوجه اليومي", en: "Daily Face Routine Package" },
    description: {
      ar: "غسول ومرطب وواقي شمس — الخطوات الثلاث الأساسية للعناية اليومية بالوجه.",
      en: "Cleanser, moisturiser and sunscreen — the three core steps of a daily face routine.",
    },
    items: [
      { productId: "p-cerave-foaming-cleanser", quantity: 1 },
      { productId: "p-neutrogena-hydro-boost", quantity: 1 },
      { productId: "p-isdin-fusion-water", quantity: 1 },
    ],
    price: riyals(269), // components total SAR 296
    imageUrl: "/api/media/bundle/bn-face-routine.svg",
    categoryId: "cat-face",
    position: 4,
  },
  {
    id: "bn-hair-repair",
    slug: "hair-repair-package",
    name: { ar: "باقة ترميم الشعر", en: "Hair Repair Package" },
    description: {
      ar: "شامبو وبلسم وماسك وسيروم، لروتين ترميم متكامل للشعر التالف.",
      en: "Shampoo, conditioner, mask and serum for a complete repair routine.",
    },
    items: [
      { productId: "p-pantene-repair-shampoo", quantity: 1 },
      { productId: "p-pantene-repair-conditioner", quantity: 1 },
      { productId: "p-garnier-hair-mask", quantity: 1 },
      { productId: "p-loreal-elvive-serum", quantity: 1 },
    ],
    price: riyals(115), // components total SAR 131
    imageUrl: "/api/media/bundle/bn-hair-repair.svg",
    categoryId: "cat-hair",
    position: 5,
  },
  {
    id: "bn-lens-starter",
    slug: "lens-starter-package",
    name: { ar: "باقة العدسات للمبتدئين", en: "Lens Starter Package" },
    description: {
      ar: "عدسات يومية مع محلول وعلبة حفظ — كل ما تحتاجه للبداية.",
      en: "Daily lenses with solution and a storage case — everything needed to start.",
    },
    items: [
      { productId: "p-acuvue-moist-daily", quantity: 1 },
      { productId: "p-bausch-renu-solution", quantity: 1 },
      { productId: "p-lens-case", quantity: 1 },
    ],
    price: riyals(179), // components total SAR 200
    imageUrl: "/api/media/bundle/bn-lens-starter.svg",
    categoryId: "cat-lenses",
    position: 6,
  },
];

export const bundlesById = new Map(bundles.map((b) => [b.id, b]));
export const bundlesBySlug = new Map(bundles.map((b) => [b.slug, b]));
