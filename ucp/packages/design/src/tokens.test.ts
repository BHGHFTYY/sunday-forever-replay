import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { theme } from "./index.ts";
import { contrastRatio, WCAG } from "./contrast.ts";

const s = theme.color.semantic;

/**
 * Each entry is a pairing the UI actually renders. If a token changes and
 * drops a real pairing below AA, this fails — the palette cannot silently
 * regress.
 */
const textPairs: Array<[string, string, string]> = [
  [s.primaryOn, s.primary, "primary button label on primary fill"],
  [s.primaryOn, s.primaryHover, "primary button label, hover"],
  [s.primaryOn, s.primaryActive, "primary button label, active"],
  [s.primaryText, s.surface, "primary link on white"],
  [s.primaryText, s.surfaceSunken, "primary link on sunken surface"],
  [s.text, s.surface, "body text on white"],
  [s.text, s.surfaceSunken, "body text on sunken surface"],
  [s.textMuted, s.surface, "muted text on white"],
  [s.textMuted, s.surfaceSunken, "muted text on sunken surface"],
  [s.offerOn, s.offer, "discount badge label on offer fill"],
  [s.offerText, s.offerSoft, "offer text on soft offer surface"],
  [s.primaryOn, s.offerSolid, "white label on solid offer fill"],
  [s.primaryOn, s.service, "white label on service fill"],
  [s.serviceText, s.surface, "service link on white"],
  [s.serviceText, s.serviceSoft, "service text on soft service surface"],
  [s.successText, s.successSoft, "success badge"],
  [s.warningText, s.warningSoft, "warning badge"],
  [s.dangerText, s.dangerSoft, "danger badge"],
  [s.primaryOn, s.danger, "white label on danger fill"],
  [s.textOnInk, s.surfaceInk, "text on ink surface"],
  [s.textOnInkMuted, s.surfaceInk, "muted text on ink surface"],
  [s.textOnInk, s.surfaceInkRaised, "text on raised ink surface"],
  [theme.color.jade[300], s.surfaceInk, "jade accent on ink"],
  [theme.color.ember[400], s.surfaceInk, "ember accent on ink"],
];

const nonTextPairs: Array<[string, string, string]> = [
  [s.focus, s.surface, "focus ring against white"],
  [s.focus, s.surfaceSunken, "focus ring against sunken surface"],
  [s.textMuted, s.surface, "icon on white"],
  [s.brand, s.surfaceInk, "brand mark on ink"],
];

describe("palette accessibility", () => {
  it.each(textPairs)("%s on %s meets AA for text (%s)", (fg, bg, label) => {
    const ratio = contrastRatio(fg, bg);
    expect(ratio, `${label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      WCAG.AA_TEXT,
    );
  });

  it.each(nonTextPairs)("%s on %s meets AA for UI (%s)", (fg, bg, label) => {
    const ratio = contrastRatio(fg, bg);
    expect(ratio, `${label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      WCAG.AA_NON_TEXT,
    );
  });

  it("never lets the vivid brand colour be used as a text surface", () => {
    // jade-500 is the identity colour and only reaches ~3.06:1 with white.
    // It is intentionally absent from every text-bearing semantic slot.
    const textBearing = [s.primary, s.primaryHover, s.primaryActive, s.offerSolid, s.service, s.danger];
    expect(textBearing).not.toContain(theme.color.jade[500]);
  });
});

describe("token generation", () => {
  it("tokens.css is in sync with the TypeScript source", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const script = resolve(here, "..", "scripts", "build-css.mjs");
    expect(() => execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" })).not.toThrow();
  });
});

describe("scales", () => {
  it("ships only three font weights", () => {
    expect(Object.keys(theme.font.weight)).toHaveLength(3);
  });

  it("keeps touch targets at or above 44px", () => {
    expect(parseInt(theme.layout.tapTarget, 10)).toBeGreaterThanOrEqual(44);
  });
});
