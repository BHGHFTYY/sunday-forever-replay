# UCP — photography brief

Derived from the rendered layout, not from taste. Every dimension below was
measured off the real design (`ucp/design/editorial/index.html`) at 1366px and
390px, so a shot cut to these specs will drop straight in.

---

## 1. Hero backdrop — the one that matters most

This is the single image the whole direction rests on. It sits full-bleed
behind the headline with a dark scrim over it.

| | desktop | mobile |
|---|---|---|
| rendered | 1366 × 640 | 390 × 560 |
| aspect | **2.13 : 1** (landscape) | **0.70 : 1** (portrait) |

**Those two crops are too different to come from one frame.** Shoot it framed
for the landscape crop, but compose so a centred portrait crop still works —
or deliver two separate edits. A single 16:9 image letterboxed onto a phone
will lose the subject.

Supply at 2× for retina: **2732 × 1280** and **780 × 1120**.

**Content.** A pharmacy interior or a counter scene — real UCP, not a stock
lab. Avoid: people looking at camera, obvious staging, anything that reads as
a stock photo. The reference this is drawn from works because the room is
lived in.

**Critical constraint — the bottom 45% must be quiet.** The headline, body
copy and buttons sit there. Busy detail in that band fights the text. Shoot
with deliberate empty space low in the frame.

**Brightness.** The scrim is currently sized for a bright image; text measures
6.36:1 over it. If the photograph is dark the text gets *more* contrast, which
is fine. If it is brighter than roughly 70% average luminance, tell me and I
will re-measure rather than guess — `node ucp/tools/scrim-check.mjs <url>`
samples every pixel behind the text and reports the true worst case.

---

## 2. Product packshots — the consistency problem

Rendered at **159 × 159** desktop, **140 × 140** mobile, always square. Supply
**1000 × 1000**.

The design displays them with `mix-blend-mode: multiply` on a warm tile, which
dissolves a white background into the surface seamlessly. That only works if
the background really is white.

**The single most important instruction: one standard for all of them.** The
existing catalogue has 3,824 images from many suppliers at many standards — a
grid of forty of those is where inconsistency becomes obvious. A new shoot
should fix:

- pure white background (255,255,255), not off-white, not grey
- one camera height and one lens for the whole set
- consistent product scale — a 30ml serum should look smaller than a 500ml wash
- even shadow, or none at all; not one product with a hard shadow beside one without
- no props, no reflections of the studio

If the whole catalogue cannot be reshot, prioritise: everything on the
homepage, then the top ~200 sellers. Those carry the impression.

---

## 3. Category imagery — 12 needed

One per category (Medicines 796, Face 669, Body & Care 501, Hair 425,
Makeup 360, Mother & Baby 210, Oral Care 146, Vitamins 135, Feminine Care 129,
Devices 66, Lenses 38, Other 349).

Square, **800 × 800** supplied. A grouped arrangement of that aisle's products
on the warm ground reads better than a single hero item.

---

## 4. Pharmacist portraits — and the reason they don't exist yet

The reference design uses three portraits with names and job titles, and this
prototype deliberately leaves that as a labelled gap. **Invented pharmacist
names and credentials are not a placeholder — on a pharmacy site they are a
false claim**, which is why nothing was filled in.

With a real shoot this becomes one of the strongest sections you have. Trust
is what a pharmacy sells, and a real licensed pharmacist with a real name does
more for it than any layout.

- **3 portraits**, 3:4 portrait, supplied **1200 × 1600**
- Real UCP staff, consented, with their actual role
- Working environment, not a white backdrop
- Same lighting across all three, or they will not sit together

Same rule for testimonials: real, attributed, consented — or the section stays
empty.

---

## 5. Delivery and pickup — 2 images

Used in the services panels. **16:10**, supplied **1600 × 1000**. A real
courier or a real branch counter. These can be the weakest images in the set
without hurting much; the hero cannot.

---

## Formats

- **WebP** primary, **JPG** fallback. The existing catalogue already mixes
  jpg/png/webp/avif, which is fine — browsers negotiate.
- sRGB. Not Adobe RGB — it will look desaturated in browsers.
- Hero under ~400 KB after compression; packshots under ~80 KB.
- Name files by SKU where one exists (`100009.webp`), so they map to the
  catalogue automatically. The current export has 376 images named
  `image-8.jpeg` and similar, which is why nothing can be matched to a product
  by filename today.

## When they arrive

Drop them in and tell me. Two things I will re-run rather than assume:
`node ucp/tools/scrim-check.mjs` for the hero text, and a look at whether
`mix-blend-mode: multiply` is still right for the new packshots — it is
correct for white backgrounds and wrong for anything else, and it is a
one-line change either way.
