# UCP Platform

Urgent Care Pharmacy — digital pharmacy commerce platform.

> **Standalone project.** This tree has its own `package.json`, tooling and
> git-ignore rules and depends on nothing outside `ucp/`. It is built to be
> lifted into its own repository: copy the folder into an empty repo and it
> runs unchanged.

## Layout

```
packages/design    Design tokens — the single source of truth for colour,
                   type, spacing, radius, elevation and motion. tokens.css
                   is GENERATED from the TypeScript source, so the web and
                   mobile apps cannot drift apart.
packages/core      Domain logic: money, cart pricing, promotions, loyalty,
                   delivery ETA, pickup readiness, search, recommendations,
                   vitamin follow-up, analytics. Dependency-free and
                   platform-free — imported unchanged by web, API and app.
packages/data      Catalogue adapter. An interface plus a seeded in-memory
                   implementation; the real UCP backend implements the same
                   interface and nothing above it changes.
apps/web           Next.js storefront and API.
apps/mobile        React Native (Expo) app, same tokens and same domain core.
```

## Commands

```bash
npm install
npm run dev         # storefront on :3000
npm test            # domain + design-system test suite
npm run typecheck
npm run build
```

## Principles this codebase holds to

- **Money is integer halalas.** No float ever touches a price or a total.
- **The client never sends a price.** Carts are re-priced server-side from
  the catalogue on every request, so tampering with local state changes
  what you asked for, never what you are charged.
- **No fabricated trust signals.** There is no `rating` field, no review
  count, no invented certification and no countdown timer. `Product` has
  no place to put them by design.
- **An ETA that cannot be supported is not shown.** `quoteDelivery` returns
  a confidence and a reason; only `promised` renders as a promise.
- **Empty beats filler.** Every recommendation function can return an empty
  array, and the UI drops the section rather than padding it.
- **Accessibility is tested, not asserted.** The palette's real pairings are
  checked against WCAG AA in CI.
