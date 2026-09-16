/**
 * UCP colour ramps.
 *
 * Every pair that carries text has been checked against WCAG 2.1 AA
 * (see scripts/check-contrast.mjs — run `npm run check:contrast`).
 *
 * Two rules that shape how these are used:
 *
 *  1. `jade[500]` is the *identity* colour. It is vivid enough to own the
 *     brand but only reaches 3.06:1 against white, so it is never used for
 *     text or for small filled controls — only large decorative surfaces,
 *     illustration, and icons sitting on ink.
 *  2. The *action* colour is `jade[700]`, which clears 5.58:1 with white
 *     text. Hover/active step down the ramp rather than adding opacity, so
 *     contrast improves under interaction instead of degrading.
 */

export const jade = {
  50: "#E9FBF4",
  100: "#C8F5E6",
  200: "#93EACC",
  300: "#55DAAE",
  400: "#17C08C",
  500: "#00A878", // brand identity — decorative only
  600: "#00875F",
  700: "#007752", // primary action fill (white text, 5.58:1)
  800: "#005E41", // hover + link text on light (7.84:1)
  900: "#00402C", // active
} as const;

/**
 * Discount / offer signal. Deliberately vivid — but note `ember[500]`
 * takes INK text, not white: ink-on-ember is 5.26:1 where white-on-ember
 * is only 3.10:1. This lets the badge stay bright and still pass AA.
 */
export const ember = {
  50: "#FFF0EC",
  100: "#FFDCD2",
  300: "#FF9C83",
  400: "#FF7A5C",
  500: "#FF5A36", // badge fill — pair with ink text
  600: "#E8461F",
  700: "#C7350F", // solid fill when white text is required (5.32:1)
} as const;

/** Clinical services accent: prescriptions, telepharmacy, pickup. */
export const lapis = {
  50: "#EAF1FE",
  100: "#D2E2FD",
  300: "#7CA6F7",
  500: "#2B6CF0",
  600: "#1F57CC",
  700: "#1B4FBF",
} as const;

/** Cool near-black. Header on scroll, footer, hero, dark panels. */
export const ink = {
  700: "#22303D",
  800: "#16212B",
  900: "#0D141A",
  950: "#080C10",
} as const;

/** UI neutrals. `neutral[600]` is the lightest value legible as body text. */
export const neutral = {
  0: "#FFFFFF",
  50: "#F7F8F9",
  100: "#EEF1F3",
  200: "#E1E6EA",
  300: "#C9D1D8",
  400: "#9AA6B1",
  500: "#6E7C89", // decorative / disabled only — 4.28:1, below AA
  600: "#51606D", // muted text (6.47:1)
  700: "#3B4954",
  800: "#283440",
  900: "#16212B",
} as const;

/** Warm neutral. Keeps the surface from reading cold-clinical. */
export const sand = {
  50: "#FAF8F5",
  100: "#F4F1EC",
  200: "#E8E3DA",
  300: "#D9D2C5",
} as const;

export const danger = {
  50: "#FEF3F2",
  100: "#FEE4E2",
  500: "#D92D20",
  600: "#B42318",
  700: "#912018",
} as const;

export const amber = {
  50: "#FEF6E7",
  100: "#FCEAC4",
  500: "#F0A81E",
  700: "#7A4A03",
} as const;

/**
 * Semantic aliases. Components reference these, never the ramps directly,
 * so a re-theme is a single-file change.
 */
export const semantic = {
  brand: jade[500],
  brandSoft: jade[50],

  primary: jade[700],
  primaryHover: jade[800],
  primaryActive: jade[900],
  primaryOn: neutral[0],
  primarySoft: jade[50],
  primaryText: jade[800],

  surface: neutral[0],
  surfaceSunken: sand[50],
  surfaceRaised: neutral[0],
  surfaceInk: ink[900],
  surfaceInkRaised: ink[800],

  border: neutral[200],
  borderStrong: neutral[300],
  borderInk: "#243140",

  text: neutral[900],
  textMuted: neutral[600],
  textFaint: neutral[500],
  textOnInk: neutral[0],
  textOnInkMuted: neutral[300],

  offer: ember[500],
  offerOn: ink[900],
  offerSolid: ember[700],
  offerSoft: ember[50],
  offerText: "#B62F12",

  service: lapis[500],
  serviceSoft: lapis[50],
  serviceText: lapis[700],

  success: jade[700],
  successSoft: jade[50],
  successText: jade[900],

  warning: amber[500],
  warningSoft: amber[50],
  warningText: amber[700],

  danger: danger[600],
  dangerSoft: danger[50],
  dangerText: danger[600],

  focus: jade[700],
  focusRing: "rgba(0, 119, 82, 0.28)",
} as const;

export const color = { jade, ember, lapis, ink, neutral, sand, danger, amber, semantic } as const;
