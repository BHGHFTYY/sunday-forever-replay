# UCP — Homepage theme directions

Four interactive homepage prototypes, built to be compared and chosen from
before any production code is written.

Open `index.html` to compare them, or open a theme directly:

| | Theme | Concept |
|---|---|---|
| 01 | `theme-01-ninja.html` | **NINJA** — sharp, fast, ink black + electric orange |
| 02 | `theme-02-premium.html` | **PREMIUM** — quiet, editorial, warm paper + serif |
| 03 | `theme-03-modern.html` | **MODERN E-COMMERCE** — dense, sidebar, fewest taps |
| 04 | `theme-04-friendly.html` | **FRIENDLY** — warm, rounded, family-first |

```bash
npx http-server . -p 3200 -c-1
```

No build step, no framework, no backend. Each file is standalone HTML/CSS/JS
and shares only `data.js`, deliberately — the same content rendered four
ways is what makes the *design* comparable rather than the copy.

## These are four architectures, not four colour schemes

| | 01 Ninja | 02 Premium | 03 Modern | 04 Friendly |
|---|---|---|---|---|
| Ground | ink black | warm paper | white | cream |
| Type | Alexandria + JetBrains Mono | Amiri / Cormorant + Readex | Noto Sans Arabic + Inter | Rubik + Baloo |
| Base size | 16px | 15.5px | 14px (dense) | 16px (large) |
| Radius | 2px | 0 | 8px | 22–28px |
| Cards | hard border, dark image well | **no border at all** | compact, bordered | soft shadow, rounded |
| Categories | rectangles, cut corner | asymmetric editorial mosaic | sidebar list | warm squircles |
| Search | inline, orange slab | **icon → full-screen overlay** | scoped field, biggest control | rounded pill |
| Nav | dark bar under search | small-caps hairline | **persistent sidebar + tabs** | pills + **bottom dock** |
| Add to cart | orange slab | outlined, letterspaced | **becomes a −/1/+ stepper** | chunky rounded |
| Opens with | a claim | a claim | a promo grid | **a question** |

## The orange problem, and four answers to it

UCP orange at full saturation (`#FF6A00`) reaches only **2.87:1** against
white. Putting white text on bright orange — the reflex — fails WCAG AA
badly and is the main reason orange retail brands read as cheap. Each theme
answers it differently, and every pairing below was measured, not eyeballed:

- **01 Ninja** — keeps the vivid `#FF6A00` and puts **ink** on it (6.72:1).
  Black on electric orange is the sharpest thing orange can do.
- **02 Premium** — drops to burnt `#B83D06` with white (5.66:1) and uses it
  sparingly: a hairline, a label, one fill.
- **03 Modern** — `#C9450A` with white (4.84:1), the lightest orange that
  passes, reserved for the add-to-cart action only. Blue marks pharmacy
  services so "buy" and "ask a pharmacist" never look alike.
- **04 Friendly** — solid `#C9450A` + white for actions, warm `#FF8A3D` +
  ink for soft chips (6.91:1).

## Content

`data.js` is **placeholder data**. Prices, stock, rankings, branches and
point balances are invented for layout purposes and are not UCP's. No
licence, certification or claim in these prototypes is stated as fact. Every
field maps onto the types already defined in `packages/core/src/types.ts`,
so the chosen theme can be wired to the real catalogue adapter directly.

## Notes for whoever builds the winner

Bugs found and fixed while building these, worth not repeating:

- **Arabic and letter-spacing.** Any `letter-spacing` severs Arabic cursive
  joins — a heading rendered as `تسوّ ق حس ب`. Both files that set tracking
  now override it unconditionally under `:lang(ar)`.
- **Prices and bidi.** Tabular figures need `direction: ltr`, but wrapping
  the whole price string in it drags `ر.س` into the LTR run and the bidi
  algorithm splits it into `ر . س`. `priceHTML()` isolates the numerals only.
- **Specificity.** `.hd-main .wrap` (0,2,0) beat a `.srch-mob` hide rule
  (0,1,0), so the mobile search field stayed visible on desktop as a
  duplicate. Hide rules must match the weight of the layout rule.
