import type { Category } from "@ucp/core";

/**
 * UCP category tree.
 *
 * Two structural fixes from the brief are visible here:
 *
 *  1. **Lenses is a top-level category**, not a child of Makeup. Contact
 *     lenses are a regulated optical product with their own care range and
 *     their own purchase intent; burying them under cosmetics made them
 *     nearly unfindable for the people specifically shopping for them.
 *
 *  2. **Hair has real subcategories** — shampoo, conditioner, serum, mask,
 *     treatment, styling — because "Hair" as a single bucket of 200 items
 *     is not a category, it is a search results page with no filters.
 *
 * What is deliberately NOT here: subdivisions created to make the
 * navigation look bigger. Every child below holds enough distinct products
 * to be worth its own page.
 */

let position = 0;
const next = () => (position += 1);

function top(id: string, slug: string, ar: string, en: string, iconKey: string, featured = true): Category {
  return { id, slug, name: { ar, en }, parentId: null, iconKey, position: next(), featured };
}

function sub(id: string, slug: string, ar: string, en: string, parentId: string, iconKey: string): Category {
  return { id, slug, name: { ar, en }, parentId, iconKey, position: next() };
}

export const categories: Category[] = [
  // ---- Top level ---------------------------------------------------------
  top("cat-face", "face", "الوجه", "Face", "face"),
  sub("cat-face-cleanser", "face-cleanser", "غسول الوجه", "Face Cleanser", "cat-face", "face"),
  sub("cat-face-moisturiser", "face-moisturiser", "مرطبات الوجه", "Face Moisturiser", "cat-face", "face"),
  sub("cat-face-serum", "face-serum", "سيروم الوجه", "Face Serum", "cat-face", "face"),
  sub("cat-face-sunscreen", "sunscreen", "واقي الشمس", "Sunscreen", "cat-face", "sun"),
  sub("cat-face-mask", "face-mask", "ماسكات الوجه", "Face Masks", "cat-face", "face"),
  sub("cat-face-eye", "eye-care", "العناية بالعين", "Eye Care", "cat-face", "eye"),

  top("cat-hair", "hair", "الشعر", "Hair", "hair"),
  sub("cat-hair-shampoo", "shampoo", "شامبو", "Shampoo", "cat-hair", "hair"),
  sub("cat-hair-conditioner", "conditioner", "بلسم", "Conditioner", "cat-hair", "hair"),
  sub("cat-hair-serum", "hair-serum", "سيروم الشعر", "Hair Serum", "cat-hair", "hair"),
  sub("cat-hair-mask", "hair-mask", "ماسكات الشعر", "Hair Masks", "cat-hair", "hair"),
  sub("cat-hair-treatment", "hair-treatment", "علاجات الشعر", "Hair Treatments", "cat-hair", "hair"),
  sub("cat-hair-styling", "hair-styling", "تصفيف الشعر", "Hair Styling", "cat-hair", "hair"),

  top("cat-body", "body", "الجسم", "Body", "body"),
  sub("cat-body-wash", "body-wash", "غسول الجسم", "Body Wash", "cat-body", "body"),
  sub("cat-body-lotion", "body-lotion", "مرطبات الجسم", "Body Lotion", "cat-body", "body"),
  sub("cat-body-deodorant", "deodorant", "مزيلات العرق", "Deodorant", "cat-body", "body"),
  sub("cat-body-hand-foot", "hand-and-foot", "اليدين والقدمين", "Hand & Foot", "cat-body", "body"),

  top("cat-feminine-care", "feminine-care", "العناية الأنثوية", "Feminine Care", "feminine"),
  sub("cat-feminine-pads", "sanitary-pads", "الفوط الصحية", "Sanitary Pads", "cat-feminine-care", "feminine"),
  sub("cat-feminine-wash", "intimate-wash", "الغسول النسائي", "Intimate Wash", "cat-feminine-care", "feminine"),
  sub("cat-feminine-cycle", "cycle-care", "العناية بالدورة", "Cycle Care", "cat-feminine-care", "feminine"),

  // Standalone — moved out of Makeup.
  top("cat-lenses", "lenses", "العدسات", "Lenses", "lens"),
  sub("cat-lenses-daily", "daily-lenses", "عدسات يومية", "Daily Lenses", "cat-lenses", "lens"),
  sub("cat-lenses-monthly", "monthly-lenses", "عدسات شهرية", "Monthly Lenses", "cat-lenses", "lens"),
  sub("cat-lenses-colour", "coloured-lenses", "عدسات ملونة", "Coloured Lenses", "cat-lenses", "lens"),
  sub("cat-lens-care", "lens-care", "العناية بالعدسات", "Lens Care", "cat-lenses", "lens"),

  top("cat-oral", "oral-care", "العناية بالفم", "Oral Care", "oral"),
  sub("cat-oral-toothpaste", "toothpaste", "معجون الأسنان", "Toothpaste", "cat-oral", "oral"),
  sub("cat-oral-toothbrush", "toothbrush", "فرشاة الأسنان", "Toothbrush", "cat-oral", "oral"),
  sub("cat-oral-mouthwash", "mouthwash", "غسول الفم", "Mouthwash", "cat-oral", "oral"),
  sub("cat-oral-floss", "floss", "خيط الأسنان", "Floss", "cat-oral", "oral"),

  top("cat-vitamins", "vitamins", "الفيتامينات والمكملات", "Vitamins & Supplements", "vitamin"),
  sub("cat-vitamins-multivitamin", "multivitamins", "الفيتامينات المتعددة", "Multivitamins", "cat-vitamins", "vitamin"),
  sub("cat-vitamins-vitamin-d", "vitamin-d", "فيتامين د", "Vitamin D", "cat-vitamins", "vitamin"),
  sub("cat-vitamins-vitamin-c", "vitamin-c", "فيتامين سي", "Vitamin C", "cat-vitamins", "vitamin"),
  sub("cat-vitamins-iron", "iron", "الحديد", "Iron", "cat-vitamins", "vitamin"),
  sub("cat-vitamins-omega", "omega-3", "أوميغا 3", "Omega-3", "cat-vitamins", "vitamin"),
  sub("cat-vitamins-beauty", "hair-skin-nails", "الشعر والبشرة والأظافر", "Hair, Skin & Nails", "cat-vitamins", "vitamin"),

  top("cat-mother-baby", "mother-and-baby", "الأم والطفل", "Mother & Baby", "baby"),
  sub("cat-baby-diapers", "diapers", "الحفاضات", "Diapers", "cat-mother-baby", "baby"),
  sub("cat-baby-skincare", "baby-skincare", "العناية ببشرة الطفل", "Baby Skincare", "cat-mother-baby", "baby"),
  sub("cat-baby-feeding", "baby-feeding", "تغذية الطفل", "Baby Feeding", "cat-mother-baby", "baby"),

  top("cat-devices", "medical-devices", "الأجهزة الطبية", "Medical Devices", "device"),
  sub("cat-devices-bp", "blood-pressure", "أجهزة الضغط", "Blood Pressure", "cat-devices", "device"),
  sub("cat-devices-glucose", "blood-glucose", "أجهزة السكر", "Blood Glucose", "cat-devices", "device"),
  sub("cat-devices-thermometer", "thermometers", "موازين الحرارة", "Thermometers", "cat-devices", "device"),

  top("cat-medicines", "medicines", "الأدوية", "Medicines", "pill"),
  sub("cat-medicines-pain", "pain-relief", "المسكنات", "Pain Relief", "cat-medicines", "pill"),
  sub("cat-medicines-cold", "cold-and-flu", "البرد والإنفلونزا", "Cold & Flu", "cat-medicines", "pill"),
  sub("cat-medicines-allergy", "allergy", "الحساسية", "Allergy", "cat-medicines", "pill"),
  sub("cat-medicines-digestive", "digestive", "الجهاز الهضمي", "Digestive", "cat-medicines", "pill"),

  // Makeup stays, minus lenses.
  top("cat-makeup", "makeup", "المكياج", "Makeup", "makeup", false),
  sub("cat-makeup-face", "face-makeup", "مكياج الوجه", "Face Makeup", "cat-makeup", "makeup"),
  sub("cat-makeup-eyes", "eye-makeup", "مكياج العيون", "Eye Makeup", "cat-makeup", "makeup"),
  sub("cat-makeup-lips", "lip-makeup", "مكياج الشفاه", "Lip Makeup", "cat-makeup", "makeup"),
];

export const categoriesById = new Map(categories.map((c) => [c.id, c]));
export const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));

export const topLevelCategories = categories.filter((c) => c.parentId === null);

export function childrenOf(categoryId: string): Category[] {
  return categories.filter((c) => c.parentId === categoryId);
}

/** Root -> … -> category, for breadcrumbs. */
export function categoryPath(categoryId: string): Category[] {
  const path: Category[] = [];
  let current = categoriesById.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? categoriesById.get(current.parentId) : undefined;
  }
  return path;
}

/** A category id plus every descendant — what a listing page queries by. */
export function categoryWithDescendants(categoryId: string): string[] {
  const out = [categoryId];
  for (const child of childrenOf(categoryId)) out.push(...categoryWithDescendants(child.id));
  return out;
}
