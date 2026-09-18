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

## The screens

All nine, on one design system and one catalogue.

| file | handoff screen |
|---|---|
| `home.html` | 1–2, homepage desktop + mobile |
| `category.html` | 3, category browsing |
| `product.html` | 4, product page |
| `search.html` | 5, search |
| `cart.html` | 6, cart |
| `checkout.html` | 7, checkout + confirmation |
| `loyalty.html` | 8, loyalty |
| `prescription.html` | 9, prescription ordering |
| `app.html` | 10–12, the three app screens |

Header, footer, bottom nav and the **product card** live in `boutique.css` and
`boutique.js`. The card is the one component a customer sees a thousand times;
two copies of it guarantees the screens drift. The app screens use the same
tokens and the same card — the app is not a second design system, it is this
one in a narrower column.

## Where the prototype refuses to pretend

Three places where the honest thing and the impressive thing differ:

**No card fields anywhere.** Checkout shows payment *method* choices only —
no number field, no CVV, nowhere for a card to be typed. A prototype that
renders a plausible card form invites someone to type a real card into a page
with no server, no TLS story and no PCI scope. Fields appear when a payment
provider's hosted form does, and not before.

**A prescription never leaves the device.** The chosen file is read only far
enough to show its name and size; it is held in one local variable for the life
of the page, never uploaded, never written to storage. A prescription is
medical data. The page says this where a user can read it, not only in a
comment.

**Every loyalty figure is illustrative, and says so on the page.** Tiers, earn
rate and balances are not in anything we have been given, and inventing a
rewards scheme a customer might act on is exactly the business claim this must
not make.

The same rule governs the product page's labelled gaps (description,
dispensing status, stock) and the cart's free-delivery threshold, which is
marked as a placeholder rule rather than presented as policy.

## What is verified, and how

Not "looks right" — driven in a real browser:

- **Contrast**: `contrast.mjs` (21 token pairings) and `audit-a11y.mjs`, which
  walks every visible text node on all nine pages, composites its real
  background, and checks the rendered ratio at the right threshold for that
  node's size and weight. Both pass.
- **Flow**: product gallery → stepper → bundle → cart → quantity → removal →
  checkout → method switch → order placed. Totals recomputed at each step.
- **Layout**: no horizontal overflow on any page at 360, 390 or 1366.
- **No console errors** on any page.

### A bug this found

The basket reset on every navigation. `Shell` keeps it in memory, which is fine
for a one-page prototype and wrong here, where each screen is a real page load
— a 45 SAR basket became the 167 SAR demo basket on the way to checkout.
`initCart()` now persists it in `sessionStorage` (not local: a demo basket
should not outlive the tab), wrapped in try/catch so a private window still
runs and simply forgets.

