# Admin Dashboard - Design

Date: 2026-11-13
Status: draft for review

## Intent

Rave's Parlor's owner needs to update the site's content without a developer: photos, barbers, prices, opening hours and the services copy. Today all of it is hardcoded in typed constants under `website/lib/data/`, so every change needs a code edit and a deploy.

The build adds a private `/admin` area, backed by Supabase. There is a single login. The client builds up changes as a draft, previews them on the real site, and publishes them in one go.

The same work moves WhatsApp booking to per-barber numbers. When a customer picks a barber, the message goes to that barber's own WhatsApp. Everything else goes to the shop's default number.

## Goals

1. `/admin` login page. It uses the homepage's split layout: a photo on the left and a login form on the right, where the "By appointment" block sits on the homepage.
2. One admin account. There are no users, roles or signups.
3. The following content is editable:
   - **Barbers.** Add, remove, reorder and edit them. Each barber has:
     - name
     - working days (free text, as today, e.g. "Mon, Thu, Fri, Sat & Sun")
     - WhatsApp number
     - cut prices for each column of the cut price table (Gentleman / Ladies / Under 12s)
   - **Prices.** The values of existing services only.
   - **Services copy.** The text in the services section: category intros, item descriptions, "ideal for" lines, notes, and the shared chemical-service note.
   - **Opening hours.** Each entry's days, open time, close time and last appointment.
   - **Default WhatsApp number.** The shop's own number.
   - **Images.** One slot per *place* a photo appears, not per photo, so each place can be swapped independently. The client replaces the photo and edits its alt text. This includes the price poster.
   - **Password.** The client can change it while logged in.
4. Two ways to edit the same draft:
   - **Form mode:** ordinary fields and lists, grouped by section.
   - **Visual mode:** the real site rendered from the draft. Clicking or tapping any editable part opens an editor for that part.
5. Draft workflow:
   - **Save** persists the draft. It survives logging out, and it can be built up over many sessions.
   - **Publish** makes the whole draft live at once and refreshes the public site.
   - **Discard** resets the draft to what's live.
6. Visual mode and the public site render with the same section components. They also fetch and display images the same way, so the preview cannot drift from what ships.
7. The admin is responsive and easy to use on both phone and desktop.
8. Per-barber WhatsApp routing for bookings.

## Non-goals

- Adding or removing services, categories or price columns. The menu structure stays in code.
- Adding new image slots, or a free gallery.
- Editing reviews, nav links, SEO copy, hero captions, the `<h1>`, or slide copy outside the services section.
- Generating the price poster from price data. It stays an uploaded image.
- Multiple admins, roles, or audit trails.
- A booking system. Booking stays a pre-filled `wa.me` link.
- A version-history UI.
- Email of any kind. That means no SMTP provider and no "Forgot password" flow.

## Anti-goals (failure even if it "works")

- The public site gets slower, or loses its static or cached character.
- Admin code or the Supabase write paths end up in the public bundle.
- Visual mode looks different from the live site. If the two render different components, the design has failed.
- A database outage takes the public site down. The site must keep serving the last published content from cache.
- The client loses draft work through a stray tap. Unsaved changes must be visible, and leaving the page with unsaved changes must warn first.
- Any publish leaves the site half-updated. Publishing must be all-or-nothing.

## Current state (from codebase recon)

- The app is Next.js 16.4.5 (App Router), React 19.3, CSS Modules plus global CSS, and Vitest.
  - `next.config.ts` sets `cacheComponents: true`.
  - It is not a static export. There is no backend and no API routes.
  - `website/AGENTS.md` says this Next version has breaking changes. The builder must read `node_modules/next/dist/docs/` before writing code.
- All content lives in `website/lib/data/`:
  - **`site.ts`.** The `SITE` object holds the address, hours, phone, Instagram, maps link and rating.
    - `WHATSAPP_NUMBER = "447789096148"`.
    - `phoneDisplay` is a separate hardcoded string.
  - **`services.ts`.**
    - `BARBERS` is a list of `{ name, days }`.
    - `CUT_PRICES` is indexed by barber *position*.
    - `MENU` maps `CategoryKey` (`cut | colour | perm | treat`) to `MenuCategory`, holding the items, prices, copy and images.
    - Barber names are also hardcoded in copy strings around lines 76, 88 and 98.
  - **`images.ts`.** `PHOTOS` maps slot names to `{ src, alt }`, with files in `public/images/`. `SLIDE_POSITIONS` and `OVERVIEW_IMAGES` hold the crop positions.
- The price poster (`public/images/price-list.webp`) is statically imported in `components/sections/PricePoster.tsx`. Its prices duplicate the ones in `services.ts`.
- Booking:
  - `lib/booking/picker.ts` holds the selection as `{ barber: string | null, cut, row, col }`, so the barber is a display name.
  - `lib/booking/href.ts` and `lib/contact.ts` build the `wa.me` link from the single number.
  - The generic Book links are in `NavMenu`, `SiteFooter` and `BookVisit`.
- Other consumers of the phone number and hours:
  - `lib/seo.ts` (JSON-LD)
  - `lib/format.ts`
  - tests in `website/tests/`
- Section components are mostly server components that import the constants directly.
- Hosting will likely be Netlify. There is no Netlify config yet, and the code only falls back to a Vercel URL.

## Decided by the user

- Backend: Supabase, using Auth, Postgres and Storage.
- Development happens locally first, against the Supabase CLI stack.
- A single admin login that still uses proper Supabase Auth, not a custom password check.
- The `/admin` login uses the homepage split layout, with the login form on the right.
- The editable scope is as listed in Goals. Barbers are the only thing that can be added or removed.
- A barber's contact is just their WhatsApp number. Working days is a free-text field.
- Two edit modes, form and visual, both working on one draft.
- Visual mode and the public site share components and image handling.
- Save builds up a draft, and Publish makes it live.
- The price poster stays an uploaded image.
- The admin must be responsive and easy on both phone and desktop.
- WhatsApp routing:
  - A picked barber means that barber's number.
  - "No preference", and every generic Book link, go to the default number.
  - The existing message wording stays.
- Hosting is likely Netlify. A Netlify site already exists, and the remote Supabase project will be created later.
- Image slots are one per place, not one per photo.
- No email provider. The client changes the password in the admin. A forgotten password is reset by the developer.
- Free-tier pause is handled with a daily keep-alive, with an upgrade to Supabase Pro possible later.

## Design (Claude's calls unless stated above)

### Content model

All editable content becomes one typed **content document**, validated by a schema that the site and the admin share (e.g. zod). Its rough shape:

```
SiteContent {
  version: number                       // schema version, for future migrations
  business: { defaultWhatsApp: string, hours: OpeningHours[] }
  barbers: { id: uuid, name, days, whatsApp: string, cutPrices: Record<CutColumn, Price> }[]   // array order = display order
  services: Record<CategoryKey, {
    intro: string[]
    items: Record<ItemKey, { prices..., desc, ideal, note? }>  // prices editable, structure fixed
  }>
  sharedNotes: { chemical: string }
  images: Record<ImageSlot, { path: string, alt: string, width: number, height: number }>
}
```

- **What stays in code:** the menu *structure* (categories, items, columns, which items are pickable or have barbers). Code and content join on stable keys (`CategoryKey`, `ItemKey`, `ImageSlot`, `CutColumn`).
  - The builder adds `ItemKey`s, since items are currently arrays.
  - The cut table's rows are generated from `barbers`, replacing `CUT_PRICES`.
- **Barbers:** they get stable ids. Prices and booking selections reference the id, never the name or position.
- **Images:** `ImageSlot` is one key per place a photo appears. Examples:
  - `heroLeft`
  - `heroRight`
  - `parlor`
  - `cut.main`
  - `cut.overview`
  - `colour.gallery.0`
  - `priceList`

  The builder derives the full list from every current use of `PHOTOS` (`SLIDE_POSITIONS`, `OVERVIEW_IMAGES`, each category's `images`, `media` and `mediaPos`, and the slides). Each slot also stores its dimensions, so `next/image` can render without layout shift. Crop and object positions stay in code, keyed by the same slot, as today. Social and SEO images (JSON-LD, OG) keep using whichever slot they use today.
- **Item names:** they are not editable (my call). They are structural, and doubling as labels in the booking message makes them risky to change.

**Storage of the document.** A `site_content` table holds exactly two rows, `draft` and `published`. Each row has the content as JSONB, `updated_at`, and the schema version.
- Publish runs one Postgres function. It validates and copies `draft` into `published` in a single transaction, which makes it atomic.
- Discard copies `published` into `draft`.
- On each publish, a copy also goes into a `content_versions` table. This gives a manual rollback path through SQL without needing a history UI.

Why a document and not normalized tables: the data is tiny, it has a single editor, and it must be published atomically. A document makes draft, publish and discard trivial copies, and it shares one schema with the TypeScript types. Normalized draft and published tables would double every table for no gain.

### Images

- They go in a public Supabase Storage bucket (e.g. `site-images`) under unguessable paths (`<slot>/<uuid>.<ext>`).
- Images uploaded into a draft are publicly reachable only by their exact URL, which nothing links to until the draft is published.
- Unused objects are cleaned up on publish or discard, or by a periodic sweep. The builder picks which.
- Uploads are resized and compressed in the browser before upload, to a sensible maximum edge. The Supabase image transform plan is not required.
- The public site and the visual mode both render through the same `next/image` path.
  - The Storage host is added to `images.remotePatterns`.
  - On Netlify this goes through Netlify Image CDN.
- The initial seed uploads the current `public/images/*` files and writes their paths into the document. Places that share a photo today start out pointing at the same object.
- Orphan cleanup must not delete an object that another slot still references.

### Auth and access

- Supabase Auth with email and password. Public signups are disabled.
  - The one admin user is created in the Supabase dashboard (or by seed locally).
- **Passwords and email:**
  - No email is sent.
  - A "Change password" screen in the admin asks for the current password (verified by re-signing in) and the new one, then calls Supabase's update-user API.
  - A forgotten password is reset by the developer from the Supabase dashboard.
  - Email confirmation and "secure password change" email checks are turned off, since there is no email provider.
- **RLS:**
  - `published` is readable by anyone.
  - `draft`, `content_versions`, all writes, and publish and discard are restricted to admins.
  - Admin is checked by an `is_admin()` SQL function against an `admins` table holding the one user's id. This avoids hardcoding a uid in policies.
  - Storage writes are restricted the same way.
- `/admin/*` is protected server-side. Next 16's request interception (proxy or middleware, per the bundled docs) redirects to login without a session. Every admin server action re-checks the session, and RLS is the real enforcement.
- `/admin` is `noindex` and is excluded from the sitemap.
- Session handling uses `@supabase/ssr`.

### Public site data flow

- One server-only data function, `getPublishedContent()`, reads the `published` row.
  - It is cached with Next 16's cache APIs (`"use cache"` plus a cache tag).
  - Publish invalidates that tag, so the site updates within seconds.
- The page fetches the content once and passes it down as props.
- **Section components become pure.** They take props and render JSX, with no data imports and no fetching. Everything currently reading `lib/data` constants for editable values switches to the content document:
  - `BookVisit`, `SiteFooter`, `NavMenu`, `ServiceMenu`, `PriceTable`, `PricePoster`, the slides
  - `lib/seo.ts` and `lib/format.ts`
- `phoneDisplay` is derived from the WhatsApp number by formatting. It is no longer stored separately.
- If the database is unreachable, the cached published content keeps serving. Seeding means there is always a published row.

### Shared components and visual mode

- **Pure components let the admin render them on the client.** Visual mode mounts the real page tree (sections, deck, dialogs) inside a client-side admin shell, fed by the in-memory draft. Edits update the preview instantly, before saving.
  - Any section that is currently an async server component, or that imports server-only code, must be made pure.
  - Data fetching moves up to `app/page.tsx` and `/admin`.
- **Edit affordances** come from an `<Editable target="...">` wrapper, which reads an `EditContext`.
  - On the public site there is no provider, so it renders its children only, with no extra DOM or behaviour beyond a fragment.
  - In visual mode it adds a hover or focus outline and a click or tap target that opens the editor for that target. Examples of targets: `barber:<id>`, `service:cut.items.<key>`, `image:<slot>`, `hours`.
- **The editor panel** is the *same* field component that form mode uses for that target. Form mode and visual mode share editors as well as the draft.
- **Panel layout:**
  - Phone: a bottom sheet.
  - Desktop: a side panel.
  - The preview renders at its natural width.
- Interactive site behaviour (deck scrolling, service dialog, poster viewer) should keep working in visual mode where practical, so the client can reach every editable part. In edit mode, clicks on editable regions open the editor instead of their normal action. The builder decides how a click on a link that is also an editable region is resolved.

### Admin UI

- **Routes:**
  - `/admin/login`
  - `/admin` (form mode)
  - `/admin/visual` (visual mode)
  - The builder may combine form and visual mode as a toggle.
- **Login page:** the homepage split layout, using the current hero photo on the left and the email/password form on the right. It reuses the site's typography and tokens. There is no "Forgot password" link.
- **Sticky draft bar** on every admin screen:
  - Save
  - Publish
  - Discard
  - a "draft differs from live" indicator
  - an unsaved-changes count
  - a sign-out control
- **Confirmations:**
  - Publish confirms with a short summary of what changed.
  - Discard confirms.
  - Leaving with unsaved edits warns first.
- **Form mode** has one section per area: Barbers, Prices, Services copy, Opening hours, Images, Business.
  - Barbers is a reorderable list with add and remove.
  - Removing a barber confirms first.
  - Adding a barber requires a name, a WhatsApp number and every cut price before the draft can be saved.
- **Validation:**
  - **Phone numbers:** UK numbers are normalized to E.164 digits, as `wa.me` expects (e.g. `447…`).
  - **Prices:** must match the formats the site already uses (`£80`, `£100 – £220+`, `–` for not offered, "from" values).
  - **Hours:** opening must be before close, and the last appointment must fall within open hours.
  - The schema rejects an invalid draft at Save and at Publish.
- **Warnings that don't block Save or Publish:**
  - When prices change, a reminder that the price poster image may need updating too.
  - Services copy that mentions a barber name not in the barber list, e.g. after removing a barber.

### WhatsApp routing

- The picker selection stores `barberId: string | null` instead of the name. `row` and `col` stay for highlighting.
- `bookingHref` resolves the number as follows:
  - If a barber is picked, that barber's `whatsApp`.
  - Otherwise, `business.defaultWhatsApp`.
- The message text still uses the barber's current display name, and the existing wording is unchanged.
- The generic Book links (nav, footer, BookVisit) always use the default number.
- Existing tests in `website/tests/` (contact, booking-href, booking-picker, services, seo) are updated, and new cases cover per-barber routing.

### Local development and deploy

- **Local:**
  - Supabase CLI stack (`supabase start`).
  - Migrations are created with `supabase migration new`.
  - The seed sets up the admin user, a published plus draft document built from today's constants, and images uploaded to local Storage. Every barber's WhatsApp number is seeded as the shop number, and the client updates them in the admin.
  - Env vars go in `.env.local`, and `.env.example` is updated.
- **Netlify:**
  - Add Netlify config for the Next adapter.
  - Add the Storage host to the remote image patterns.
  - Set the Supabase env vars.
- **Keep-alive:** a Netlify scheduled function runs one trivial read against Supabase daily, so a free-tier project never pauses from inactivity. It becomes optional if the project moves to Supabase Pro.
- **Order of work:** the Netlify site exists, but the remote Supabase project comes later. Build and test everything against the local stack first. Run the Netlify spike as soon as a remote project exists, and before relying on publish-to-live in production.
- **De-risk first:** before the main build, deploy a minimal spike to Netlify. It should confirm two things:
  1. `cacheComponents` with tag-based invalidation from a server action actually refreshes the live page.
  2. Remote Storage images render through the image CDN.
  - If invalidation doesn't work on Netlify, fall back to time-based revalidation plus an on-demand revalidation route, or reconsider the host. Raise it with the user before continuing.
- Once the site reads from Supabase, the old constants for editable values are deleted. Structure constants stay.

## Left to the builder

- Exact table and column names, and the zod schema details.
- Whether form and visual mode are separate routes or a toggle.
- How click conflicts between editable regions and links or controls are resolved in visual mode.
- The strategy for cleaning up orphaned images.
- The client-side image resize limits and output format.
- Component and file organization, following the existing conventions: PascalCase components with matching `.module.css`, `use-*.ts` hooks, `*-context.ts` plus a `*Provider.tsx`, and pure logic in `lib/`.
- Test coverage beyond the booking and contact cases named above.
