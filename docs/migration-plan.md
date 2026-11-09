# Migration plan: vanilla script to idiomatic Next.js

## Why

`website/lib/site-behavior.js` (1,158 lines) is the original artifact's vanilla JS, mounted by a
single `useEffect`. It finds server-rendered markup by id/class and mutates it (classes, inline
styles, `createElement`). React owns the markup but does not own its behaviour, so the project is
"Next.js in name only": no state, no typed data, a service menu that is empty in the HTML, two owners
of the global `modal-open` class, and a ~2,000-line global stylesheet.

## Review findings (what is necessary)

**P1**
1. The script mutates React-owned DOM (hydration/Strict Mode/HMR risk; two writers of `html.modal-open`).
2. The service menu is empty in the server HTML (no prices/services for crawlers or no-JS; empty `<h2>`).
3. All service/barber/price data lives only inside the script. Hours, address, phone, rating, nav and
   image paths are retyped in many components and will drift.
4. Metadata is minimal; favicon is still the Next default; no OpenGraph, viewport/theme, manifest,
   robots, sitemap or LocalBusiness JSON-LD.

**P2**
5. Closed menu and modal are `aria-hidden` but contain focusable elements (no `inert`); two different
   modal implementations (custom div vs native `<dialog>`); no skip link; footer inside `<main>`;
   `ServicesOverview` heading reads "Our 14 services Services".
6. Prices exist as text only in the script and as an image on the page (`PricePoster`).
7. Phone/WhatsApp shown as plain text (not `tel:`); repeated inline styles in `BookVisit`.
8. Four off-screen slides load images eagerly; static image imports would remove hard-coded sizes.
9. `.reveal` content is invisible until JS runs; `will-change`/reduced-motion handling split across CSS and JS.
10. Fonts: three static Jost weights; check usage and consider the variable font.
11. Bundle: whole script + dataset ships to every visitor.

**P3**
12. `allowJs` only exists for the script; `serviceMessage` has positional booleans; no tests; no
    `engines`; README/`next.config.ts` boilerplate; stale docs after the migration.

CSS (`globals.css`): ~25 repeated `#111`, ~20 `#fff`, many near-duplicate greys, scattered
reduced-motion blocks, a few redundant/overridden rules, two `!important` (needed for next/image's
inline `object-position`). No fully dead selectors. JS creates or queries many class names, so a full
CSS-Modules conversion is not safe; a hybrid is.

## Target architecture

```
website/
  app/            layout.tsx (font, metadata, viewport, skip link, JSON-LD), page.tsx,
                  globals.css (+ styles/tokens.css, base.css, deck.css, motion.css),
                  icon/apple-icon/opengraph-image, manifest.ts, robots.ts, sitemap.ts
  components/
    layout/       SiteHeader, NavMenu, SiteFooter, SkipLink       (client: header, menu)
    deck/         DeckProvider (client), Slide, use-deck, use-header-tone
    sections/     HeroPair, SplitSlide, ParlorSlide, BookVisit, PriceList (server)
    services/     ServicesOverview (server), ServiceMenu, ServiceTabs, ServiceCard,
                  ServiceDialog, PriceTable, BookingPicker          (client islands)
    price-poster/ PricePoster, PosterViewer
    ui/           Icon, ImageOverlay, Reveal, Dialog
  lib/
    data/         site.ts, nav.ts, images.ts, services.ts  (typed, server-safe)
    deck/         framework-free paging/animation logic (testable)
    hooks/        use-media, use-reduced-motion
    contact.ts    whatsappLink, messages (options object)
    seo.ts        JSON-LD builder
```

Principles: server components by default; client islands only where state/events exist; data lives
in typed modules shared by server and client; `<dialog>` for both modals; React state/refs instead
of `document.querySelector`; imperative DOM (refs + Web Animations API) only for 1:1 touch-follow and
FLIP animation, where re-renders per frame would be wrong.

## Phases (each ends lint + typecheck + build, and is its own commit)

0. **Data and contact.** `lib/data/*` (site info, nav, images, services incl. barbers/prices, derived
   counts/"from" values); `serviceMessage` takes an options object; replace hard-coded duplicates in
   TSX. Unit tests for pure logic.
1. **Hooks and overlay state.** `useMedia`/`useReducedMotion`; a context for `menuOpen`/`modalOpen`
   that mirrors `html.menu-open`/`modal-open` (CSS still keys off them). Removes the double owner.
2. **Header and menu.** Client `SiteHeader`/`NavMenu`: burger state, focus handling, Escape, `inert`
   closed menu, header tone hook (same `elementsFromPoint` algorithm, rAF throttled).
3. **Deck.** `DeckProvider` + `Slide`; paging controller in `lib/deck` (wheel, touch follow-the-finger,
   keys, in-page links, inner-scroll hand-off, phone/desktop slide lists, reduced motion). Native
   non-passive listeners via refs. Same constants/thresholds as the original.
4. **Services.** `ServiceMenu` renders the default category on the server; client tabs (roving
   tabindex, ids, `aria-controls`); cards with refs; `ServiceDialog` as native `<dialog>` with FLIP
   expand/collapse via WAAPI (same durations/easings); `BookingPicker` as a hook + `PriceTable`
   (derived selection state, no DOM class toggling); keep exact behaviour from the spec.
5. **Cleanup.** `Reveal` component (IntersectionObserver, visible by default without JS); delete
   `SiteBehavior.tsx`, `lib/site-behavior.js`, `allowJs`.
6. **Styles.** Tokens + base split; CSS Modules for static components (footer, book/visit, price
   list/poster, overview, header/menu, slides) with `:global(...)` for state classes on `<html>`/
   `#head`/slides; remove redundant rules; one reduced-motion strategy.
7. **SEO, a11y, config.** Metadata/OG/viewport/icons/manifest/robots/sitemap; JSON-LD (only with data
   that is true and current); skip link, heading fixes, `tel:` links; `engines`, stricter tsconfig,
   README updates.

## Behaviour that must be preserved (from the specs)

Deck: 450 ms, easings `cubic-bezier(.37,0,.63,1)` / `(.22,.61,.36,1)`; wheel `quiet` momentum
swallow (160 ms / 1.8x / 24 px); touch decide at 6 px, commit at 15 % or flick > 0.35 px/ms, duration
clamp 180-450 ms; `busy` ignores input; inner-scroll edge hand-off; `collect()` keeps position across
the 820 px breakpoint; `goToEl` sets `scrollTop` before the move. Header tone from
`elementsFromPoint`, ignoring header and modal, forced light while the menu is open. Modal: 560 ms
expand, `ready` at 440 ms, close 160 ms delay + 480 ms, card hidden while open, focus returns to the
card. Picker: selection derived state, `Back` keeps selection, Continue disabled until a pick (nudge),
messages as in `lib/contact.ts`.

## Risks

- This is a large rewrite of interaction-heavy code. Lint/typecheck/build cannot prove the deck,
  header tone or modal animation behave identically; they need to be exercised in a browser.
  Phases are small so a regression can be bisected.
- CSS Modules must not rename classes that JS-era CSS selectors depend on until the owning code is
  migrated (hence phase 6 last).
- `cacheComponents` is on: no `new Date()` in server components without a cache boundary.
