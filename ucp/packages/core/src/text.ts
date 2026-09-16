/**
 * Bilingual text normalisation.
 *
 * Arabic search fails in practice for reasons that have nothing to do with
 * spelling ability: users type أ where the catalogue has ا, omit
 * diacritics the data contains, use ه for ة, and paste Arabic-Indic
 * digits. Normalising both the query and the index to one canonical form
 * removes an entire class of "no results" before fuzzy matching is even
 * needed.
 */

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ARABIC_INDIC = /[٠-٩۰-۹]/g;
const NON_WORD = /[^\p{L}\p{N}\s]/gu;
/** Apostrophes are deleted, not spaced: "L'Oréal" and "loreal" must land
 *  on the same token, since customers type the brand both ways. Hyphens
 *  and the rest become spaces, so "anti-dandruff" still matches the
 *  two-word query. */
const APOSTROPHES = /['\u2019\u2018\u02BC\u00B4`]/g;

function latinDigit(ch: string): string {
  const code = ch.codePointAt(0) as number;
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  return ch;
}

/** Canonical form used for both indexing and querying. */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    // Strip Latin combining marks (café -> cafe) without touching Arabic,
    // which is handled explicitly below.
    .replace(/[̀-ͯ]/g, "")
    .replace(TASHKEEL, "")
    .replace(TATWEEL, "")
    .replace(ARABIC_INDIC, latinDigit)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/گ/g, "ك")
    .replace(/پ/g, "ب")
    .replace(APOSTROPHES, "")
    .replace(NON_WORD, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalize(input);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

/**
 * Cross-script synonyms. A customer who knows the English brand word but
 * types Arabic (or the reverse) is the common case in Saudi pharmacy
 * retail, not the exception — this table is what makes "شامبو" find
 * products indexed only as "shampoo".
 */
const SYNONYM_GROUPS: string[][] = [
  ["شامبو", "shampoo"],
  ["بلسم", "conditioner", "كنديشنر"],
  ["سيروم", "serum"],
  ["ماسك", "mask", "قناع"],
  ["عدسات", "عدسه", "lenses", "lens", "contact lenses", "كونتكت"],
  ["مرطب", "moisturizer", "moisturiser", "كريم مرطب"],
  ["واقي شمس", "sunscreen", "sunblock", "spf", "صن بلوك"],
  ["غسول", "cleanser", "wash", "face wash"],
  ["مزيل مكياج", "makeup remover", "micellar", "ميسيلار"],
  ["فيتامين", "vitamin", "vitamins", "فيتامينات"],
  ["حديد", "iron", "ferrous"],
  ["كالسيوم", "calcium"],
  ["زنك", "zinc"],
  ["اوميغا", "omega", "fish oil", "زيت السمك"],
  ["بروبيوتيك", "probiotic", "probiotics"],
  ["معجون اسنان", "toothpaste", "معجون"],
  ["فرشاه اسنان", "toothbrush", "فرشاة"],
  ["غسول فم", "mouthwash", "مضمضه"],
  ["خيط اسنان", "floss", "dental floss"],
  ["حفاضات", "diapers", "nappies", "بامبرز"],
  ["حليب اطفال", "infant formula", "baby milk", "فورمولا"],
  ["فوط", "pads", "sanitary pads", "نسائيه"],
  ["تامبون", "tampons"],
  ["ترمومتر", "thermometer", "مقياس حراره"],
  ["ضغط", "blood pressure", "bp monitor", "جهاز ضغط"],
  ["سكر", "glucose", "glucometer", "جهاز سكر"],
  ["مسكن", "painkiller", "pain relief", "analgesic"],
  ["بارد", "cold", "flu", "انفلونزا"],
  ["تساقط الشعر", "hair loss", "hair fall", "تساقط"],
  ["قشره", "dandruff", "anti-dandruff"],
  ["حب الشباب", "acne", "اكني"],
  ["تجاعيد", "wrinkles", "anti-aging", "مكافحه الشيخوخه"],
  ["تفتيح", "brightening", "whitening"],
  ["شفايف", "lip", "lips", "lip balm", "مرطب شفاه"],
  ["عطر", "perfume", "fragrance"],
  ["ديودرنت", "deodorant", "مزيل عرق"],
];

const SYNONYM_INDEX = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(normalize);
  for (const term of normalized) {
    const existing = SYNONYM_INDEX.get(term) ?? new Set<string>();
    for (const other of normalized) existing.add(other);
    SYNONYM_INDEX.set(term, existing);
  }
}

/** Expands a query with its cross-script equivalents. */
export function expandSynonyms(query: string): string[] {
  const normalized = normalize(query);
  const out = new Set<string>([normalized]);
  const direct = SYNONYM_INDEX.get(normalized);
  if (direct) for (const term of direct) out.add(term);
  for (const token of tokenize(query)) {
    const group = SYNONYM_INDEX.get(token);
    if (group) for (const term of group) out.add(term);
  }
  return [...out];
}

/**
 * Levenshtein distance, abandoned early once it exceeds `max`.
 *
 * Bounding matters: search runs this against every candidate token, and an
 * unbounded distance on long strings is wasted work for a result that will
 * be rejected anyway.
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] as number) + 1, (prev[j] as number) + 1, (prev[j - 1] as number) + cost);
      rowMin = Math.min(rowMin, curr[j] as number);
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] as number;
}

/** Typo tolerance scaled to word length — short words get none. */
export function fuzzyMatches(token: string, candidate: string): boolean {
  if (candidate.includes(token)) return true;
  const allowed = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
  if (allowed === 0) return false;
  if (editDistance(token, candidate, allowed) <= allowed) return true;
  // Also allow a typo inside a longer phrase, word by word.
  return candidate.split(" ").some((word) => editDistance(token, word, allowed) <= allowed);
}
