import { color } from "./color.ts";
import { font, space, radius, shadow, motion, zIndex, breakpoint, layout } from "./scale.ts";

/**
 * The single object both the web app and the React Native app consume.
 *
 * Web reads it indirectly (tokens.css is generated from it by
 * scripts/build-css.mjs, so CSS custom properties can never drift from
 * the TypeScript source). React Native reads it directly, since there is
 * no cascade to hang custom properties on.
 */
export const theme = {
  color,
  font,
  space,
  radius,
  shadow,
  motion,
  zIndex,
  breakpoint,
  layout,
} as const;

export type Theme = typeof theme;
