# website

Next.js app for Rave's Parlor London. See the [root README](../README.md) for the repo layout, scripts
and environment variables.

## How it is organised

- **Page:** `app/page.tsx` composes the sections inside `AppShell` (header, menu, deck) and the
  service dialog. `app/layout.tsx` owns the font, metadata, viewport, skip link and JSON-LD.
- **Data:** everything the site states lives in typed, server-safe modules in `lib/data/`: `site.ts`
  (address, hours, contact, `SITE_URL`), `nav.ts`, `images.ts` and `services.ts` (menu, barbers,
  prices, derived counts and "from" prices). Components import from there; nothing is retyped.
- **Deck:** the page is a fixed stack of full-screen slides. `components/deck/` is the React side
  (`Deck`, `DeckProvider`, `use-deck`); `lib/deck/` is the framework-free paging controller (wheel,
  touch, keys, in-page links) with its pure maths in `math.ts`. The skip link targets `#deck` and
  the controller moves focus there instead of paging.
- **Services:** `components/services/` renders the default category on the server; client islands
  handle the tabs, the cards and the `<dialog>` with its expand/collapse animation. `lib/booking/`
  holds the booking picker logic and the WhatsApp message builders (`lib/contact.ts`).
- **Styling:** `app/globals.css` imports the global partials in `app/styles/` (tokens, base, deck,
  shared slide primitives, scroll reveal, utilities); components own their styles in `*.module.css`
  next to them. `lib/cx.ts` joins class names.
- **SEO:** `lib/seo.ts` builds the schema.org `HairSalon` JSON-LD from `lib/data/site.ts` and
  `components/seo/JsonLd.tsx` renders it. `app/robots.ts`, `app/sitemap.ts` and `app/manifest.ts`
  are generated routes.
- **Security headers:** `next.config.ts` sets `X-Content-Type-Options` and `Referrer-Policy` and
  turns off `X-Powered-By`.

## Generated icons

`app/icon.png`, `app/apple-icon.png` and `app/opengraph-image.png` are placeholders generated from
the wordmark in `public/images/logo.png` (dark on white for the icons; white over the darkened
`parlor-reception.jpg` for the social card). Replace them with proper artwork when available; Next
picks up files with the same names automatically.

## Tests

`npm test` runs Vitest over `tests/`. They cover the pure logic (data, formatting, booking,
deck maths, dialog state, JSON-LD); browser behaviour is checked by hand.
