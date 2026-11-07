# website

Next.js app for Rave's Parlor London. See the [root README](../README.md) for the repo layout and scripts.

- `app/globals.css` holds all styling.
- `components/` holds the page sections, composed in `app/page.tsx`.
- `lib/site-behavior.js` drives the full-screen slide deck, menu, service menu and detail panel on the rendered markup. `components/SiteBehavior.tsx` starts it and cleans up on unmount.
