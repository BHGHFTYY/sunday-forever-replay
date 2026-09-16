import type { SVGProps } from "react";

/**
 * The UCP icon set.
 *
 * Hand-built rather than pulled from an icon library: the set is small,
 * it keeps a third-party dependency out of the bundle, and — more to the
 * point — every glyph is drawn on the same 24px grid with the same 1.75
 * stroke, which is what makes category tiles read as one system instead of
 * a collection of borrowed artwork.
 *
 * Directional icons are marked so they can be mirrored under RTL. Icons
 * that represent objects (a cart, a pill) are NOT mirrored, because a
 * mirrored object just looks wrong; only icons that encode direction are.
 */

const paths = {
  // --- Navigation & chrome
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  user: "M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M18 15l-6-6-6 6",
  chevronEnd: "M9 6l6 6-6 6",
  chevronStart: "M15 6l-6 6 6 6",
  arrowEnd: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M4 12.5 9 17.5 20 6.5",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
  filter: "M4 6h16M7 12h10M10 18h4",
  sort: "M4 7h10M4 12h7M4 17h4M17 5v14M17 19l3-3M17 19l-3-3",
  external: "M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4",

  // --- Commerce & trust
  tag: "M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9ZM7.5 7.5h.01",
  truck: "M3 7h11v9H3zM14 10h3.5l2.5 3v3h-6M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  store: "M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M3 10l1.5-5a1 1 0 0 1 1-.8h13a1 1 0 0 1 1 .8L21 10a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z",
  lock: "M6 11h12v9H6zM9 11V7.5a3 3 0 0 1 6 0V11",
  shield: "M12 3l7 3v5.5c0 4.2-2.9 8-7 9.5-4.1-1.5-7-5.3-7-9.5V6l7-3Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  refresh: "M20 11a8 8 0 1 0-1.6 5.6M20 5v6h-6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  warning: "M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01",
  heart: "M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7-1.3c0 4.9-7 13.3-7 13.3Z",

  // --- Pharmacy services
  prescription: "M7 20V5a1 1 0 0 1 1-1h5l4 4v3M7 9h6M7 13h3M14 20l6-6M20 20l-6-6",
  pill: "M10.5 3.5 3.5 10.5a5 5 0 0 0 7 7l7-7a5 5 0 0 0-7-7ZM7 7l7 7",
  chat: "M4 5h16v11H9l-5 4V5Z",
  video: "M3 7h11v10H3zM14 11l7-4v10l-7-4",
  stethoscope: "M6 3v5a4 4 0 0 0 8 0V3M6 3H4.5M14 3h1.5M10 12v2a5 5 0 0 0 10 0v-1M20 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  bell: "M6 16V10a6 6 0 1 1 12 0v6l2 3H4l2-3ZM10 21h4",
  gift: "M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9ZM3 7h18v4H3zM12 7v14M12 7S10 3 7.5 3a2.5 2.5 0 0 0 0 5M12 7s2-4 4.5-4a2.5 2.5 0 0 1 0 5",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z",
  location: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  phone: "M5 3h3.5l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L15 12l4 1.5V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 5.2 2 2 0 0 1 5 3Z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",

  // --- Category glyphs (one grid, one stroke, one visual family)
  face: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0",
  hair: "M5 20v-7a7 7 0 0 1 14 0v7M5 13c1.5-1 2.5-3 2.5-5M19 13c-1.5-1-2.5-3-2.5-5M9.5 5.5C10.5 4 12 3.5 12 3.5s1.5.5 2.5 2",
  body: "M12 5.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM12 7v7M12 7 7.5 9M12 7l4.5 2M12 14l-2.5 8M12 14l2.5 8",
  feminine: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 14v7M9 18h6",
  lens: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8.5 8.5 7 7",
  eye: "M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  oral: "M4 7c0-2 2-3 4-3s3 1 4 1 2-1 4-1 4 1 4 3c0 4-1.5 5-2.5 8S16 20 15 20s-1.5-3-3-3-2 3-3 3-1.5-2-2.5-5S4 11 4 7Z",
  vitamin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5v9M7.5 12h9",
  // A bottle rather than a face: the face version was indistinguishable
  // from the "face" category glyph at tile size.
  baby: "M9 9h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9ZM10 9V6.5h4V9M11 6.5V4.5a1 1 0 0 1 2 0v2M9 13h6",
  device: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM9 8h6M9 11.5h6M10.5 15h3",
  makeup: "M9 3h6v4H9zM8 7h8l-1 13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1L8 7Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5",
} as const;

export type IconName = keyof typeof paths;

/** Icons whose meaning depends on which way they point. */
const DIRECTIONAL = new Set<IconName>([
  "chevronEnd", "chevronStart", "arrowEnd", "external", "sort",
]);

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Accessible label. Omit for purely decorative icons. */
  title?: string;
}

export function Icon({ name, size = 20, title, className = "", ...rest }: IconProps) {
  const d = paths[name];
  const decorative = !title;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Mirrors only the icons that encode direction, so a chevron points
      // the right way in Arabic while a shopping cart stays a cart.
      className={`${DIRECTIONAL.has(name) ? "rtl:-scale-x-100" : ""} ${className}`.trim()}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}

/** Maps a category's `iconKey` to a glyph, with a safe fallback. */
export function categoryIcon(iconKey: string): IconName {
  const map: Record<string, IconName> = {
    face: "face", hair: "hair", body: "body", feminine: "feminine",
    lens: "lens", oral: "oral", vitamin: "vitamin", baby: "baby",
    device: "device", makeup: "makeup", pill: "pill", sun: "sun", eye: "eye",
  };
  return map[iconKey] ?? "sparkle";
}
