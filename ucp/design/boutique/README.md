# UCP — Warm Boutique

Implementation of the supplied handoff (`design_handoff_ucp_warm_boutique`).
Every token, size and radius here is the handoff's own value.

## What the handoff did not have, and this does

The handoff renders every product as a flat placeholder block, and says so:
*"no real photography exists yet — swap in real photography using the same
aspect ratios and container shapes."* That photography now exists. These pages
use UCP's real MasterSheet catalogue — **3,824 products with real titles, SKUs
and photographs from ucpksa.com** — in exactly the containers the handoff
specifies.

Prices remain placeholder. The export has none.

## Colour: one hue, three jobs

The handoff's palette failed WCAG 2.1 AA in four places, including the primary
CTA. The fix was not to darken everything — WCAG's thresholds depend on the
**role** a colour plays, and that is what makes a vivid palette possible:

| | requirement |
|---|---|
| small text | 4.5:1 |
| large text (≥24px, or ≥18.66px bold) and UI boundaries | 3:1 |
| a fill | none — only what sits *on* it must pass |

So UCP's orange keeps its full brightness exactly where it is most visible —
as a **fill**. Only the steps that must carry small text step down, and those
were derived in OKLCH (`ucp/tools/palette.mjs`): the brand hue is held at
50.5°, and at each required lightness the tool takes the **most saturated
in-gamut colour**. Multiplying toward black would have drained the chroma and
produced exactly the muddy result this avoids.

| token | value | job | worst case |
|---|---|---|---|
| `--orange-500` | `#FF7A00` | fills, active states, large shapes | ink on it, **5.84:1** |
| `--orange-600` | `#D66500` | borders, icons, large numerals | **3.06:1** |
| `--orange-700` | `#AB4F00` | small text: prices, links, chips | **4.55:1** |
| `--ink` | `#2B2420` | body text | 12.73:1 |
| `--muted` | `#75675B` | secondary text | **4.55:1** |
| `--line-strong` | `#988A7E` | the edge of a form field | **3.05:1** |

`--line` `#EFE3D8` stays as it was: decorative, for card edges, where no ratio
applies.

### The one deviation from the handoff

The CTA label is **ink, not white**. The alternative — keeping white text by
darkening the fill — needs `#BF5900`, which passes at only 4.52:1 *and* turns
the brand brown. Ink on the real orange is both more accessible (5.84:1) and
more UCP. `cta-compare.html` renders both side by side.

### Two tools guard this

- `node ucp/tools/contrast.mjs` — checks all 21 token pairings. Exits non-zero
  on failure.
- `node ucp/tools/audit-a11y.mjs <url>` — loads a real page, walks every
  visible text node, composites its actual background up the ancestor chain,
  and checks the real rendered ratio against the right threshold for that
  element's size and weight.

The second is not redundant. It immediately caught the wishlist heart, which
was `--orange` on white at 2.61:1 — sound tokens used wrongly. Token maths
proves the palette; the audit proves the pages use it.

## Reconstructed `support.js`

The handoff references `./support.js`, which was not in the zip, so the design
file rendered raw `{{ }}` mustaches and could not be reviewed at all.
`ucp/design/support.js` is a minimal reimplementation of the contract the
exported file needs (`DCLogic`, `{{ }}` interpolation in text and attributes,
`<sc-for>`, `<sc-if>`, `onClick` binding, and evaluation of the
`<script type="text/x-dc">` block the browser will not run). It exists only to
make the supplied file viewable; nothing in the build depends on it.

## Built so far

- `home.html` — handoff screens 1 and 2 (homepage desktop + mobile)

Still to come: category, product, search, cart, checkout, loyalty,
prescription, and the three app screens.
