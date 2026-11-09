# website

Next.js app for Rave's Parlor London. See the [root README](../README.md) for the repo layout and scripts.

- Styling: `app/globals.css` imports the global partials in `app/styles/` (tokens, base, deck, shared slide primitives, scroll reveal, service menu/dialog); components own their styles in `*.module.css` next to them. `lib/cx.ts` joins class names.
- `components/` holds the page sections, composed in `app/page.tsx`.
- `components/deck/` and `lib/deck/` run the full-screen slide deck; `components/services/` is the service menu and its detail dialog; `lib/booking/` holds the booking picker logic.
