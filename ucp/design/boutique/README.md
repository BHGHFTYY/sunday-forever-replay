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

## The accessibility conflict, stated plainly

The project brief requires WCAG 2.1 AA. Four of the handoff's colour pairings
do not reach it, including the primary CTA:

| pairing | handoff | needs |
|---|---|---|
| white text on `#FF7A00` CTA | **2.61:1** | 4.5:1 |
| `#FF7A00` text on cream | **2.38:1** | 4.5:1 |
| `#FF7A00` text on `#FDE7D3` chip | **2.18:1** | 4.5:1 |
| `#8A7C70` muted text on cream | **3.68:1** | 4.5:1 |

The handoff values are the **default** — nothing has been quietly "corrected".
`data-aa="on"` on `<html>` swaps in the smallest changes that reach AA: same
hue, lower lightness, geometry and layout untouched.

| token | handoff | AA variant | result |
|---|---|---|---|
| `--on-orange` | `#FFFFFF` | `#2B2420` | 5.84:1 |
| `--accent-tx` | `#FF7A00` | `#B35500` | 4.54:1 on cream |
| `--accent-tx` on tint | `#FF7A00` | `#A85100` | 4.57:1 |
| `--muted-tx` | `#8A7C70` | `#74685E` | 4.51:1 on its worst ground |
| `--accent-line` | `#FF7A00` | `#E06B00` | 3.05:1 (WCAG 1.4.11) |

The prototype has a live **WCAG AA** button so the two can be compared on the
real page rather than argued about in the abstract. `node ucp/tools/contrast.mjs`
checks every pairing in both modes and exits non-zero if the AA variant fails.

The visible cost of the AA variant is that the CTA reads dark-on-orange instead
of white-on-orange. That is a real change in feel, and it is the client's call
— but shipping 2.61:1 on the primary action of a pharmacy is not a neutral
default either.

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
