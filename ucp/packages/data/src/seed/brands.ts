import type { Brand } from "@ucp/core";

/**
 * Brands carried by UCP.
 *
 * `logoUrl` points at the generated wordmark route rather than at scraped
 * brand artwork — see apps/web/src/app/api/media. Swapping in licensed
 * logo files is a change to this field and nothing else.
 */

let position = 0;
const b = (id: string, slug: string, ar: string, en: string): Brand => ({
  id,
  slug,
  name: { ar, en },
  logoUrl: `/api/media/brand/${slug}.svg`,
  position: (position += 1),
});

export const brands: Brand[] = [
  b("br-cerave", "cerave", "سيرافي", "CeraVe"),
  b("br-laroche", "la-roche-posay", "لاروش بوزيه", "La Roche-Posay"),
  b("br-vichy", "vichy", "فيشي", "Vichy"),
  b("br-bioderma", "bioderma", "بيوديرما", "Bioderma"),
  b("br-eucerin", "eucerin", "أوسرين", "Eucerin"),
  b("br-avene", "avene", "أفين", "Avène"),
  b("br-isdin", "isdin", "إيسدين", "ISDIN"),
  b("br-ordinary", "the-ordinary", "ذا أوردينري", "The Ordinary"),
  b("br-neutrogena", "neutrogena", "نيوتروجينا", "Neutrogena"),
  b("br-garnier", "garnier", "غارنييه", "Garnier"),
  b("br-loreal", "loreal-paris", "لوريال باريس", "L'Oréal Paris"),
  b("br-nivea", "nivea", "نيفيا", "Nivea"),
  b("br-dove", "dove", "دوف", "Dove"),
  b("br-sebamed", "sebamed", "سيباميد", "Sebamed"),
  b("br-headshoulders", "head-and-shoulders", "هيد آند شولدرز", "Head & Shoulders"),
  b("br-pantene", "pantene", "بانتين", "Pantene"),
  b("br-nizoral", "nizoral", "نيزورال", "Nizoral"),
  b("br-sensodyne", "sensodyne", "سنسوداين", "Sensodyne"),
  b("br-oralb", "oral-b", "أورال-بي", "Oral-B"),
  b("br-colgate", "colgate", "كولجيت", "Colgate"),
  b("br-listerine", "listerine", "ليسترين", "Listerine"),
  b("br-centrum", "centrum", "سنتروم", "Centrum"),
  b("br-solgar", "solgar", "سولجار", "Solgar"),
  b("br-nowfoods", "now-foods", "ناو فودز", "NOW Foods"),
  b("br-acuvue", "acuvue", "أكيوفيو", "Acuvue"),
  b("br-bausch", "bausch-and-lomb", "باوش آند لومب", "Bausch + Lomb"),
  b("br-always", "always", "أولويز", "Always"),
  b("br-kotex", "kotex", "كوتكس", "Kotex"),
  b("br-pampers", "pampers", "بامبرز", "Pampers"),
  b("br-johnsons", "johnsons", "جونسون", "Johnson's"),
  b("br-omron", "omron", "أومرون", "Omron"),
  b("br-accuchek", "accu-chek", "أكيو تشيك", "Accu-Chek"),
  b("br-panadol", "panadol", "بنادول", "Panadol"),
  b("br-maybelline", "maybelline", "مايبلين", "Maybelline"),
];

export const brandsById = new Map(brands.map((brand) => [brand.id, brand]));
export const brandsBySlug = new Map(brands.map((brand) => [brand.slug, brand]));
