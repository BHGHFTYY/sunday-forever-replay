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

---

## E · RETAIL — built against a measured reference

The first four executions were judged "still AI-made". Rather than guess a
fifth time, the brief was re-grounded on a reference the client named
(ulta.com) and a screen recording they supplied. Three measurable differences
came out of it, and all three were things taste had not caught.

### 1. The brand colour is text and hairlines, not fill

A published extraction of the reference's design system counts its accent
appearing **46 times as text, 46 times as a border, and 8 times as a
background**. Ours was the exact inverse — amber filled every add button and
every badge, roughly forty saturated blocks per page. At that frequency an
accent stops being an accent.

`E · RETAIL` spends vivid `--amber` as a large fill **twice**: the services
band and the loyalty band. Everywhere else the brand reads as `--amber-900`
(#8A5400), the same hue at a lightness that can legally be text:

| use | colour | on white |
|---|---|---|
| large fill, dark text on it | `--amber` #FFA300 | 8.11:1 (text on amber) |
| sale price, chips, eyebrows | `--amber-900` #8A5400 | **6.27:1** |

`--amber` at 2.00:1 on white was never a text colour; pretending otherwise is
what forced it into backgrounds in the first place.

### 2. The primary action is not the brand colour

In the reference, "Add to bag" is a **black, auto-width** control. The accent
is reserved for sale prices. Here the add control is `--ink` espresso, sized
to its label, one per card — not a full-bleed bar.

### 3. Promotion rate has to be believable

63% of the sample catalogue carried a struck-through price, so two thirds of
every grid wore a discount badge. That reads as a fake sale whatever the
layout does. It is now ~25%, and the tile label is the word "Sale"
(`تخفيض`), not a coloured pill.

### Packshots

Brand palettes are no longer hash-assigned: each brand carries **its own real
packaging colours** (CeraVe teal-on-white, Nivea deep blue, Solgar amber
glass), the product is cropped to fill its frame, and it sits on one warm tile
(`--paper-3`) with no border and no gradient — the way a cut-out photograph
sits on a retailer's card. Size still varies with the real pack size, so a
20 ml serum is visibly smaller than a 473 ml wash.

**These remain placeholder renderings.** Production needs UCP's own product
photography; no rendering here should ship as a product image.

---

## The real catalogue

`e-retail.html` no longer runs on invented products. It runs on UCP's own
MasterSheet export (`ucp/data/mastersheet-8-13.csv`), compiled by
`ucp/tools/build-catalogue.mjs` into `catalogue.js`.

| | count |
|---|---|
| products | 3,824 (of 3,828; 4 rows carry no image) |
| with photographs | 3,824, served from ucpksa.com's media library |
| brands | 1,106 derived from titles; the wall shows the largest 16 |
| categories | 11 + "other" (349, 9%) |
| pack sizes parsed | 2,976 (78%) |

**What is real:** product titles, SKUs, photographs and product-page URLs.

**What is derived:** brand, category and pack size, parsed from the title by
heuristics in the builder. They are good enough to shape a browse experience
and are *not* UCP's own taxonomy — the 9% in "other" and any miscategorised
product are artefacts of that parsing, fixable by editing the rules and
re-running.

**What is invented:** every price and every discount. The export contains no
pricing at all. Figures are seeded from the SKU so they stay stable between
runs, the promotion rate is held at 21%, and the page ribbon says outright
that prices are placeholder. None of them should ever be shown to a customer.

### Two gaps worth naming

1. **The export is English-only.** Product titles therefore stay English even
   in Arabic mode; only the interface translates. That is how the prototype
   renders it rather than machine-translating 3,824 pharmaceutical names, which
   would produce confident nonsense on dosages and actives. Arabic titles need
   a second export column.
2. **Photographs cannot be verified from here.** This container's network
   policy blocks `ucpksa.com`, so every screenshot in this repo shows the
   *fallback* drawing, not the real photo. The page requests the real URLs and
   a normal browser will load them. If a URL 404s, `IMGFAIL()` swaps in the
   drawn packshot rather than a broken-image glyph.

---

## The listing page

`e-list.html` is the browse page, over all 3,824 products. It was built second
on purpose: a homepage can hide a weak system behind big type and one good
photograph, but a listing page shows forty cards at once, so any excess in the
card compounds forty times.

Shared chrome now lives in `retail.css` and `retail.js` — the header, category
nav, footer, toast and, most importantly, the **product card**. That is the one
component a customer sees a thousand times; if the homepage's card and the
listing page's card drift apart, the site stops looking like one site.

### Facets count against the current result set

Selecting *Vitamins* then *Jamieson* narrows 3,824 → 135 → 18, and each brand's
number is what selecting it would actually return — not its count in the
unfiltered catalogue. A facet is excluded from its own count, so the numbers
never promise results a click cannot deliver.

Brands are ranked by matches in the current view rather than listed
alphabetically: 1,106 brands cannot all be shown, and A–Z would bury the useful
ones under whatever begins with "A". A selected brand stays pinned in view even
when it falls below the cut.

### State is in the URL

`?cat=&brand=&price=&offers=&sort=&page=` — so a filtered view can be linked,
bookmarked and reloaded, and the back button does what a shopper expects.
Verified: back from page 2 returns to page 1 with the sort intact.

### Deliberately no amber

This page uses **no vivid amber fill at all**. It is a utility surface, and the
brand colour's whole job here is to stay out of the way of 3,824 products. The
two amber bands on the homepage are the budget for the whole execution.

---

## The product page

`e-product.html?sku=…` is where the 1,241 galleries pay off, and where this
prototype's data gaps are most visible — so they are **stated, not hidden**.

A pharmacy PDP normally carries a description, ingredients, directions,
prescription status and live stock per branch. The MasterSheet export has none
of these. Each missing block therefore renders as a dashed, labelled slot
naming the system the data has to come from, so the page can be reviewed for
layout without anyone reading a fiction.

The prescription slot matters most. **A fabricated "no prescription required"
on a real SKU is the single most dangerous sentence this prototype could
contain**, so the dispensing status is never guessed — medicines get an
explicit slot saying the regulatory status comes from UCP's pharmacy record.

Real on this page: title, SKU, brand, category, pack size and every photograph.
Placeholder: the price, and nothing else is asserted.

A bad `?sku=` shows a not-found state rather than silently falling back to a
different product. On a pharmacy site, showing product B under a link to
product A is exactly the kind of quiet substitution that has to fail loudly.

### Reviewing with photographs present

`ucpksa.com` is blocked by this environment's network policy, so screenshots
taken here normally show the drawn fallbacks. `scratchpad/stub.mjs` intercepts
those requests and serves neutral grey packshots at realistic proportions,
which is how the grid and the PDP gallery were checked with imagery in place.
**Those stand-ins are not UCP's photographs** — they only prove that spacing,
aspect ratios and `mix-blend-mode` behave.

One open risk: the tile uses `mix-blend-mode: multiply`, which is right for
packshots on white (it dissolves the white box into the tile) and wrong for
lifestyle photography with dark backgrounds. Which one UCP has is unverified.
