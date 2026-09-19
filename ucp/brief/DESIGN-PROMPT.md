# UCP — design brief

Design the complete e-commerce experience for **Urgent Care Pharmacy (UCP)**, a
Saudi pharmacy and health-and-beauty retailer: website and mobile app, Arabic
first, English second.

Everything below is a requirement, not a preference. Where a number is given it
was measured, not chosen by taste — treat it as a constraint.

---

## 1. The direction

**Editorial, near-monochrome, photography-led.**

Reference: https://dribbble.com/shots/27297400-E-Commerce-Website-Design
("Nestery" by Shakuro). Take from it:

- a warm neutral ground, near-black ink, and very small type
- generous whitespace; hairlines instead of boxes; almost no borders
- a full-bleed photographic hero with the headline laid over it
- a small floating product card overlapping the hero image
- **a typographic category index** — categories as plain words with a
  superscript count, not chips or pills
- restraint with the brand colour: in the reference it appears essentially
  once, as a 5px dot

**Do not** take its product density. The reference sells about twenty pieces of
furniture, so five thumbnails in a row *is* its catalogue. UCP has **3,824
SKUs across twelve categories**. The calm transfers; the lookbook does not.
Grids must go to four or six across and support pagination.

Brand personality: fast, sharp, confident, effortless. Not clinical, not cute.

---

## 2. Colour — fixed, do not re-pick

UCP's orange is **#FF7A00**. It must stay that exact value. The scale below
was derived in OKLCH by holding the brand hue at 50.5° and taking the most
saturated in-gamut colour at each required lightness — so each step is the
punchiest orange that still clears its contrast requirement. Do not darken by
multiplying toward black; that drains the chroma and is why "make it pass
contrast" usually looks muddy.

| token | value | job | worst case |
|---|---|---|---|
| `orange-500` | `#FF7A00` | fills, active states, large shapes | **5.84:1** with ink on it |
| `orange-600` | `#D66500` | borders, icons, large numerals | **3.06:1** |
| `orange-700` | `#AB4F00` | small text: prices, links, chips | **4.55:1** |
| `ink` | `#16161C` | body text | 15:1+ |
| `muted` | `#6A6A72` | secondary text | **4.72:1** |
| `line-strong` | `#8E8E96` | the edge of a form field | **3.05:1** |
| `ground` | `#F1F0EE` | the page | — |
| `paper` | `#FFFFFF` | cards | — |

**The rule that follows from this: orange carries DARK text, never white.**
White on `#FF7A00` is 2.61:1 and fails. Ink on it is 5.84:1 and passes. Keeping
white would mean darkening the fill to `#BF5900`, which passes at only 4.52:1
*and* turns the brand brown. Do not do it.

---

## 3. Accessibility — WCAG 2.1 AA, verified not assumed

Thresholds are role-dependent, and that is what makes a vivid palette possible:

- **4.5:1** small text
- **3:1** large text (≥24px, or ≥18.66px bold) and UI component boundaries
- **nothing** for a fill — only what sits *on* it must pass

Also required:

- Every interactive target ≥44×44px.
- Visible focus states on everything reachable by keyboard.
- Form fields need a real boundary at 3:1 — a decorative hairline is not enough.
- **White text over photography must be verified against the rasterised page**,
  not the CSS. Compositing background colours cannot see through an overlay
  scrim. Measure the actual pixels behind the text and take the worst case.
  Hold hero headlines to 4.5:1 even where WCAG would allow 3:1 — the margin is
  what survives a brighter photograph.

---

## 4. Typography

- **Arabic and Latin must share a skeleton.** Pick one family that draws both,
  or a pair that sits together at 13px, not just at 48px.
- Test Arabic at real UI sizes (13–15px) before choosing. Many Arabic webfonts
  fall apart there.
- **Never apply letter-spacing to Arabic.** Arabic letterforms join; tracking
  severs them. Uppercase and letter-spacing are English-only.
- Prices need tabular figures and bidi isolation, or the currency mark gets
  dragged into the numeral run and renders as "ر . س".

---

## 5. Arabic-first and RTL

- Arabic is the default. English is the second locale, not the source.
- A real RTL mirror: the whole layout flips, not just the text. Use logical
  properties throughout.
- One global language toggle that switches copy **and** `dir` site-wide.
- Product titles are currently English-only in the catalogue export, but Arabic
  product pages **do exist** in UCP's system — request an export that includes
  them rather than machine-translating. Machine-translating 3,824
  pharmaceutical names produces confident nonsense on dosages and actives.

---

## 6. Screens required

**Website:** homepage · category / browse with filters and sort · product
detail · search · cart · checkout + order confirmation · loyalty ·
prescription ordering · account and order history

**App:** home · product · cart · profile/navigation · prescription upload

The app must use the **same tokens and the same product card** as the website.
It is not a second design system; it is the same one in a narrower column.

**Bottom nav (mobile, 5 items):** Search · Home · Loyalty · Cart · Account.
Orders live inside Account, not as their own tab.

---

## 7. The catalogue you are designing for

Real numbers — design against these, not against a demo of twelve products.

| category | SKUs |
|---|---|
| Medicines | 796 |
| Face | 669 |
| Body & Care | 501 |
| Hair | 425 |
| Makeup | 360 |
| Mother & Baby | 210 |
| Oral Care | 146 |
| Vitamins & Supplements | 135 |
| Feminine Care | 129 |
| Devices & Supplies | 66 |
| Lenses | 38 |
| Other | 349 |

Roughly **1,100 brands**. Any brand list must be ranked by relevance and
searchable — an alphabetical list of 1,100 is useless. About **21%** of
products carry a promotion; do not design as though every card has a badge.

Search is not a decoration at this scale. It is the primary navigation.

---

## 8. Honesty rules — non-negotiable

This is a pharmacy. The following are not placeholder conventions, they are
false claims, and none may appear in any deliverable:

- **No invented reviews, ratings or testimonials.** If real ones do not exist,
  the component does not exist.
- **No invented pharmacist names, photographs or credentials.** A real
  consented staff photo is one of the strongest trust signals a pharmacy has;
  a fabricated one is a lie about a licensed professional.
- **No invented prescription / OTC status.** A fabricated "no prescription
  required" on a real SKU is the single most dangerous thing this project could
  ship. If the data is absent, show a labelled gap.
- **No invented prices, certifications, statistics or guarantees.**
- **No dark patterns**: no fake scarcity, no fake countdowns, no pre-ticked
  add-ons, no manufactured urgency.

Where data is missing, design the **empty state and the labelled gap** — not a
convincing fiction. A page that names what it is missing can be reviewed; one
that quietly fills the hole cannot.

---

## 9. Checkout and prescriptions — design constraints

- **Show payment methods, not card fields.** Card data is entered on the
  payment provider's hosted page. A design that draws a card form invites
  someone to build one.
- Delivery vs. pickup is a real single-select and changes the fee.
- **A prescription image is medical data.** Design the upload, the review
  status and the consent copy on that basis. It is not a file attachment.
- Every price must show VAT-inclusive, per Saudi practice.

---

## 10. Photography — the dependency this direction rests on

This direction is roughly 80% photography. Without it the hero is a grey void.
Specify, and plan the shoot before the design is signed off:

- **Hero**: renders 2.13:1 on desktop and 0.70:1 on mobile. Those crops are too
  far apart for one frame — deliver two edits, or compose so a centred portrait
  crop still works. The bottom 45% must be visually quiet; the headline, body
  and buttons sit there.
- **Packshots**: square, pure white background (the tile uses
  `mix-blend-mode: multiply`, which dissolves white seamlessly and muddies
  anything else). **Consistency matters more than quality** — one camera
  height, one lens, consistent product scale, even shadow. A grid of forty
  images from forty suppliers is where inconsistency becomes obvious.
- **Category imagery**: one per category, square.
- **Staff portraits**: only real, consented UCP pharmacists, with real roles.

---

## 11. What to deliver

1. Design tokens as a real system (colour, type scale, spacing, radius,
   elevation) — not a set of screens with hard-coded values.
2. Every screen in section 6, at **390px and 1366px**, in **both Arabic and
   English**.
3. Component specs for the pieces that repeat: product card, filter surface,
   quantity stepper, price block, empty states, loading states, error states.
4. A written contrast report proving every text and UI pairing meets AA,
   including any text set over photography, measured from the rendered design.
5. The photography shot list.

**No horizontal scrolling at any viewport.** Test at 360px, not just 390px.
