/**
 * Typography, spacing, radii, shadow and motion scales.
 *
 * Typeface: IBM Plex Sans Arabic for both scripts. It is one superfamily
 * with a genuine, purpose-drawn Arabic — not a Latin face with Arabic
 * bolted on — so Arabic and English share the same skeleton, weight and
 * rhythm instead of looking like two different brands on one page.
 *
 * Only three weights ship (400 / 600 / 700). Arabic has no synthetic
 * small-caps or italic to lean on, so hierarchy is carried by size,
 * colour and spacing rather than by stacking weights.
 */

export const font = {
  family: {
    sans: '"IBM Plex Sans Arabic", "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    /** Tabular figures for prices, quantities, order numbers, points. */
    numeric: '"IBM Plex Sans Arabic", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  },
  weight: {
    regular: 400,
    semibold: 600,
    bold: 700,
  },
  size: {
    xs: "0.75rem", // 12 — badges, meta, legal
    sm: "0.875rem", // 14 — secondary text, labels
    base: "1rem", // 16 — body
    lg: "1.125rem", // 18 — lead, card titles
    xl: "1.375rem", // 22 — section headings (mobile)
    "2xl": "1.75rem", // 28 — section headings
    "3xl": "2.25rem", // 36 — page titles
    "4xl": "3rem", // 48 — hero
  },
  leading: {
    tight: "1.2",
    snug: "1.35",
    normal: "1.55",
    /** Arabic sits taller and needs more room between lines than Latin. */
    body: "1.7",
    arabicBody: "1.8",
  },
  tracking: {
    tight: "-0.02em",
    normal: "0",
    /** Latin-only; never applied when the active script is Arabic, where
     *  letter-spacing breaks cursive joins. */
    wide: "0.04em",
  },
} as const;

/** 4px base grid. */
export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

/**
 * Radii. Cards are softer than controls, which reads as "product on a
 * shelf, tool in the hand" and keeps the two layers distinguishable at a
 * glance.
 */
export const radius = {
  xs: "6px",
  sm: "8px",
  md: "10px", // buttons, inputs, chips
  lg: "14px", // cards
  xl: "20px", // panels, sheets, modals
  "2xl": "28px",
  pill: "999px",
} as const;

/** Cool-tinted, low-spread. Elevation comes from contrast, not haze. */
export const shadow = {
  xs: "0 1px 2px rgba(13, 20, 26, 0.06)",
  sm: "0 2px 6px rgba(13, 20, 26, 0.07)",
  md: "0 6px 16px -4px rgba(13, 20, 26, 0.10)",
  lg: "0 16px 32px -8px rgba(13, 20, 26, 0.14)",
  xl: "0 28px 56px -12px rgba(13, 20, 26, 0.20)",
  focus: "0 0 0 3px rgba(0, 119, 82, 0.28)",
  none: "none",
} as const;

/**
 * Motion. The brand reads "fast and deliberate", so durations are short
 * and easings decelerate hard — movement arrives rather than drifts.
 * Nothing on a critical path (add-to-cart, checkout) waits on an
 * animation to finish.
 */
export const motion = {
  duration: {
    instant: "80ms",
    fast: "120ms",
    base: "180ms",
    slow: "280ms",
  },
  easing: {
    /** Default: quick departure, soft landing. */
    standard: "cubic-bezier(0.2, 0.6, 0.2, 1)",
    /** Entrances that should feel snapped into place. */
    emphasis: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  header: 200,
  drawer: 300,
  modal: 400,
  toast: 500,
} as const;

export const breakpoint = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const layout = {
  containerMax: "1280px",
  gutter: { mobile: space[4], tablet: space[6], desktop: space[8] },
  /** Minimum comfortable touch target. */
  tapTarget: "44px",
  headerHeight: { mobile: "56px", desktop: "64px" },
} as const;
