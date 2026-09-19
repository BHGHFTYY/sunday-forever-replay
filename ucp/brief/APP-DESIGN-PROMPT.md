# UCP — mobile app design brief

Design the **UCP mobile app** for iOS and Android: Arabic first, English second.

Companion to `DESIGN-PROMPT.md`. Read that first — the brand, the colour scale,
the honesty rules and the catalogue reality all carry over unchanged and are
not repeated here. **The app uses the same design tokens and the same product
card as the website.** It is not a second design system.

This document covers only what is genuinely different on a phone. Most of it is
not decoration; it is platform rules and accessibility mechanics that will break
the design if they are discovered late.

---

## 1. The tension you must resolve first

The chosen direction is editorial: very small type, hairlines, generous
whitespace, near-monochrome. **That style collides with mobile accessibility**,
and pretending otherwise produces a design that fails review.

- iOS **Dynamic Type** and Android **font scale** let a user set text up to
  **200%+**. A 10px brand label becomes 20px+ and the card you designed
  collapses.
- Minimum touch target is **44×44pt (iOS)** and **48×48dp (Android)**. Hairline
  links and 28px icon buttons do not qualify.

**Resolve this at design time, not in QA.** Requirements:

- Set a **floor of 12sp/pt** for any text a customer must read. The website's
  10px brand label does not survive; redesign that line, do not shrink it.
- Every screen must be designed **twice**: at the default text size and at
  **200% scale**. Show both. Layouts must reflow — cards grow taller, rows
  wrap, nothing truncates a price or a dosage.
- Tap targets may be larger than their visible mark. A 24px icon inside a 48px
  target is correct; a 24px target is not.
- Never convey meaning by colour alone — the 5px orange dot marking an active
  item needs a second signal (weight, position, or a label).

---

## 2. What the app must do that the website cannot

These justify the app existing. Design each properly rather than porting the
web equivalent.

**Prescription capture — the single highest-value screen.**
A web file picker is a poor experience; an in-app camera is the reason to
install. Design:
- a live camera view with an alignment guide sized for a printed prescription
- edge detection feedback ("move closer", "too dark", "hold steady")
- a review step: retake, crop, add a second page
- multi-page support — prescriptions are often more than one sheet
- an explicit consent step before anything is sent, stating what is stored and
  for how long
- an upload state that survives the app being backgrounded

**Order tracking.** Live status from accepted → pharmacist review → preparing →
out for delivery → delivered, with the branch it is coming from. This is where
push notifications land.

**Push notifications.** Design the content, not just the toggle:
prescription reviewed, order ready for pickup, out for delivery, vitamin
supply running low. Each needs an opt-in, and the in-app inbox that holds them.

**Biometric unlock.** Face ID / fingerprint for returning to an account that
holds prescription history.

**Nearest branch.** Location-based branch picker with opening hours and a
distance, plus a manual fallback for when location is denied.

**Wallet payment.** Apple Pay and Google Pay alongside mada. These replace the
card form entirely, which is the correct outcome — see the honesty rules.

---

## 3. Screens

**Onboarding and account**
- First-run: 2–3 screens maximum, skippable
- Permission priming — explain *before* the system dialog, for camera,
  notifications and location, each asked at the moment it is needed rather than
  all at launch
- Phone-number sign-in with OTP (the Saudi norm), including the resend and
  wrong-number paths
- Biometric enrolment offer

**Shopping**
- Home
- Category / browse with a filter sheet
- Search, including empty, no-results and recent states
- Product detail with gallery
- Cart
- Checkout, with wallet payment
- Order confirmation
- Order history and live order tracking

**Pharmacy**
- Prescription camera capture → review → consent → submitted → status
- Prescription history
- Talk to a pharmacist (chat entry point)

**Account**
- Profile, addresses, payment methods, notification preferences, language
- Loyalty

**System states, designed not assumed**
- Offline: what is still usable, and what is not
- Slow network: skeletons, not spinners
- Empty: every list
- Error: with a way out, never a dead end
- Session expired

---

## 4. Navigation

**Bottom tab bar, 5 items:** Search · Home · Loyalty · Cart · Account.
Home is centred and emphasised. Orders live inside Account, not as a tab.

- Respect the **safe area** — the bar sits above the iOS home indicator and
  Android gesture bar, and no content hides behind either.
- Android hardware/gesture **back** must be handled on every screen. iOS needs
  a swipe-back that mirrors correctly in RTL (in Arabic, back swipes from the
  *right*).
- Modals, sheets and navigation transitions should follow each platform's
  conventions rather than a single shared animation.

---

## 5. RTL on native

Not the same problem as on the web.

- Full layout mirroring, including icons that imply direction (back, chevrons,
  progress). A cart icon does not mirror; an arrow does.
- Gesture direction mirrors: back-swipe, carousel swipe, swipe-to-delete.
- **Decide and document the numeral system**: Eastern Arabic (٠١٢٣) or Western
  (0123). Saudi e-commerce commonly uses Western digits with Arabic text.
  Whatever is chosen must be consistent across prices, quantities, dates, OTP
  fields and order numbers.
- Prices need bidi isolation or the currency mark is dragged into the numeral
  run.
- Test with the device language set to Arabic, not just the in-app toggle.

---

## 6. Dark mode

The website does not need it. The app does — phones ship with it on.

- Design a full dark theme. The editorial direction's warm grey ground and
  near-black ink invert badly if done mechanically; re-solve the neutrals
  rather than flipping them.
- **Re-verify every contrast pairing in dark mode.** The orange scale was
  solved against light grounds; `orange-700` on a dark surface is a different
  calculation and will likely be wrong.
- Product photography shot on white needs a treatment for dark mode —
  `mix-blend-mode: multiply` does not translate. Decide: a light tile that
  stays light, or cut-outs with transparency.

---

## 7. Accessibility on native

Beyond the contrast rules in the web brief:

- **VoiceOver and TalkBack**: every control labelled, every image with a
  purpose described, decorative images hidden. Reading order must follow
  visual order in both directions.
- Announce state changes — items added to cart, filters applied, upload
  progress.
- **Respect reduced-motion.** Parallax heroes and animated transitions need a
  static path.
- Do not trap focus in sheets and modals without an escape.
- Prescription and dosage information must never be the smallest text on a
  screen.

---

## 8. Permissions and privacy

A pharmacy app handles health data. This is a design responsibility, not just
legal boilerplate.

- Request each permission **in context**, with a plain-language explanation
  shown before the system prompt, and design the denied path for every one.
- Design the **App Store privacy label / Play Data Safety** disclosure content
  alongside the screens — what is collected, why, and whether it is linked to
  identity. Prescription images are health data and must be declared as such.
- Design account deletion and data export. Both stores require them.
- Never show a full prescription image in a notification preview or the app
  switcher snapshot.

---

## 9. Honesty rules — as the website, plus these

All of section 8 in `DESIGN-PROMPT.md` applies unchanged. Additionally:

- **No notification that manufactures urgency.** "3 people are viewing this"
  and "your cart expires in 10 minutes" are dark patterns and are prohibited.
- **No pre-ticked marketing opt-in.** Transactional and marketing notifications
  are separate choices.
- **Never imply pharmacist review has happened when it has not.** Order status
  must reflect real state.
- Rating prompts only after a completed order, never during checkout or a
  prescription flow.

---

## 10. Deliverables

1. Every screen in section 3, in **Arabic and English**, in **light and dark**.
2. Each screen also at **200% text scale**, proving reflow.
3. iPhone and Android layouts where they genuinely differ — do not ship one
   design with the other's conventions.
4. Component specs shared with the web design system, noting every place the
   app deviates and why.
5. Full prototype of the two flows that matter most: **prescription capture**
   and **checkout**.
6. A contrast report covering light **and** dark, measured from rendered
   screens.
7. App icon and store screenshots.
8. A motion spec, including the reduced-motion alternative.

**Test surfaces:** the smallest phone still supported (360dp wide), a standard
phone, and a large phone. Nothing may scroll horizontally on any of them.
