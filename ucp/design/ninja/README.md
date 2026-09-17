# UCP — NINJA, four executions

Same concept, same identity, same palette, same type. Four different page
architectures.

```
index.html       compare the four
ucp.css          the design system — tokens and primitives, shared
ucp.js           data, helpers and shared behaviour
a-blade.html     A · editorial split, bento products
b-grid.html      B · typographic masthead, index rail, hairline grid
c-stack.html     C · full-bleed alternating bands, amber-led hero
d-command.html   D · search-first, tabular rows, side rail
```

```bash
npx http-server ../.. -p 3200 -c-1     # then open /ninja/index.html
```

## What changed from the first round

**Typography, completely.** The previous set used Inter (the most
recognisable "AI-generated" typeface on the web), Baloo (playful to the
point of childish), Amiri (a classical naskh, too fragile at 14px on a
phone) and — worst — set Arabic prices in JetBrains Mono, which has no
Arabic at all, so `ر.س` fell back mid-price to a different face.

Sixteen Arabic families were rendered at real UI sizes and compared. The
column that decided it was a product name at 15px/500, which is where most
Arabic webfonts come apart and where customers actually read.

- **Zain** for display — sharp, contemporary, confident, with real edge at
  large sizes. It is the reason the headlines look like a brand now.
- **IBM Plex Sans Arabic** for text — it holds together at 13–15px and
  carries four genuine weights.

Both draw Arabic *and* Latin, so the two scripts share a skeleton instead of
looking like two different brands on one page.

## Colour comes from the logo, not from a guess

The supplied logo samples at **#FFA300**. That is a light colour:

| pairing | ratio | verdict |
|---|---|---|
| white on #FFA300 | 2.00:1 | unusable |
| dark text on #FFA300 | 8.11:1 | the rule |
| amber on espresso | 8.11:1 | accent on dark |
| #9E6100 on warm paper | 4.76:1 | amber as text |

So UCP amber **always carries dark text and never white**. Every amber
button, badge and chip in all four executions follows it.

**The dark is not black.** An earlier pass used near-black `#12100C`; beside
amber it read harsh and cheap, because the two colours had nothing in
common. The dark is now a warm espresso `#2A1E14` that shares the amber's
hue — it costs a little contrast (16.23:1 with white rather than 19:1, still
far above AA) and buys a palette that looks like one family. Dark is also
used *less*: warm paper is the page, espresso is the header, the footer and
one or two deliberate bands.

## How the four differ

| | A Blade | B Grid | C Stack | D Command |
|---|---|---|---|---|
| Opens with | a statement | a masthead + status line | an amber field | a search field |
| Hero image | one hero product | none at all | none | none |
| Navigation | top bar | **permanent index rail** | top bar + **bottom dock** | thin command bar |
| Categories | numbered marquee | modular squares | **full-width directory** | two-column text index |
| Products | **bento, 1 hero + 8** | hairline grid, no cards | bleeding carousels | **table rows + inline add** |
| Density | medium | high | low | **highest** |
| Dark used for | hero, prescription, footer | masthead, loyalty, footer | alternating bands | hero, footer |

## Content

Placeholder. Prices, stock, rankings, branches and point balances are design
filler, not UCP's. No claim, licence or certification is presented as fact.
`ucp.js` maps onto the types in `packages/core/src/types.ts`, so the chosen
execution can be wired to the real catalogue adapter directly.
