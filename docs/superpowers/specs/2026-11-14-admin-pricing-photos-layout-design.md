# Admin v2: Service Pricing Axes, Per-Service Photos, Form Layout - Design

Date: 2026-11-14
Status: draft for review
Builds on: `docs/superpowers/specs/2026-11-13-admin-dashboard-design.md` (shipped on branch `feature/admin-dashboard`)

## Intent

The client tried the first version of the admin and found three problems:

1. **Barber pricing is modelled wrong.** Prices live on the barber as three fixed cut prices (Gentleman / Ladies / Under 12s), and only "Cutting & Finishing" uses them. In reality any service can be priced per barber, and every service in Cut & Style lets the customer choose a barber, even where the price is the same for all of them.
2. **Modal photos can't be changed per service.** Tapping a service card opens a modal with photos. Today those photos are shared by every service in the category, they are buried in the Photos section, and visual mode can't open the modal at all.
3. **The form editor is hard to follow.** It is one long page of identical-looking cards.

## Goals

1. **Two pricing axes per service, both optional:**
   - **Options axis:** an ordered list of option labels that the client edits (add, rename, remove, reorder), e.g. Short / Medium / Long or Gentleman / Ladies / Under 12s.
   - **Barber axis:** a per-service toggle, "Barber option". When it is on, every current barber is a row.
   - The resulting price shapes:

     | Options | Barbers | Prices | Booking choice |
     |---|---|---|---|
     | none | off | one price or range | none |
     | 1+ | off | one per option | the option |
     | none | on | one per barber | barber, or No preference |
     | 1+ | on | barber x option table | a cell, or No preference + option |

   - Barber option on means booking always offers the barber picker, and the message goes to the chosen barber's WhatsApp. "No preference" goes to the default number. There is no separate "can choose barber" setting: the barber axis implies the choice.
   - Adding a barber adds their row to every service with the barber option on. Removing a barber removes their row everywhere.
2. **Prices move off the barber.** The barber editor keeps only name, working days and WhatsApp number.
3. **Per-service modal photos:** each service has its own 1-2 photos. The first is required and the second is optional. Each photo has its own alt text.
4. **Visual mode can open service modals.** Tapping a service card in visual mode opens its modal, as on the live site. Inside the modal, the photos, prices or barber table, description and other copy are editable regions.
5. **Form editor layout "A" (chosen by the user from mockups):**
   - **Desktop:** a persistent left sidebar of sections (Barbers, Services, Opening hours, Photos, Business), with one section on screen at a time. Services adds a second-level list grouped by category, and the selected service's editor sits to the right.
   - **Phone:** the sidebar becomes a horizontally scrollable tab strip under the draft bar. Services shows the grouped service list, and tapping a service opens its editor full width with a back link.

## Non-goals

- Adding or removing services or categories (decided again by the user: fixed for now).
- More than 2 photos per service.
- More than two pricing axes, or per-option barber availability (e.g. "John doesn't do Under 12s"). A cell can still be `–` (not offered).

## Anti-goals

- Booking messages change wording. The existing templates stay; only the option label inserted into them can now be edited.
- The public site gets slower or loses its static, cached character.
- Visual mode and the live site render different components.
- A service shows a price table where all barber rows are identical. In that case the site collapses them into one row (see Display rules).

## Decided by the user

- One barber setting per service ("Barber option"). Its existence implies the customer can choose a barber.
- Options are editable per service: add, rename, remove, reorder.
- Services and categories stay fixed.
- Each service has its own photos, 1-2 of them.
- Form layout A: sidebar sections, with a tab strip on phones.

## Design (Claude's calls unless stated above)

### Content model changes (`SiteContent` version 2)

- **`Barber`** becomes `{ id, name, days, whatsApp }`, and `cutPrices` is removed.
- **`ItemContent`** becomes:
  ```
  {
    options: string[]                 // 0..n labels; [] = no options axis
    byBarber: boolean                 // barber axis on/off
    prices: {                         // exactly one of these shapes, matching options/byBarber
      base?: string[]                 // byBarber=false: length max(1, options.length)
      barbers?: Record<barberId, string[]>  // byBarber=true: each length max(1, options.length)
    }
    desc, ideal, note?
    photos: [ImageRef] | [ImageRef, ImageRef]   // 1-2 modal photos
  }
  ```
  A cell holds a canonical price: `£80`, a range `£100 – £220+`, or `–` for not offered.
- **Removed from the structure in code:** `kind` (barberTable / table / range), `cols`, the category-level `barbers` flag and `CUT_COLUMNS`. What stays in code per item: `key`, `name`, `single?` and `chemicalNote?`.
- **Images:** the 8 `dialog.<cat>.<n>` slots are removed from `IMAGE_SLOTS`. Modal photos live in `ItemContent.photos`. The other 13 slots (slides, overview, media, price poster) are unchanged.
- **Validation** (added to `checkStructure`):
  - Every item key is present.
  - `base` or `barbers` is present, matching `byBarber`.
  - `barbers` has exactly one entry per current barber id, with no unknown ids.
  - Every price array's length is `max(1, options.length)`.
  - Option labels are non-empty and unique within an item.
  - There are 1-2 photos.
  - At least one cell in each item is a real price, not all `–`.
- **Deriving "from" prices** is unchanged in spirit: the lowest real amount across every cell.
- **Draft ops:**
  - `addBarber` adds a row to every `byBarber` item, prefilled from the first existing barber's row.
  - `removeBarber` removes the row everywhere.
  - New ops: `setOptions` (add, rename, remove and reorder keep the price cells aligned), `setByBarber` (on: every barber row is copied from `base`; off: `base` is copied from the first barber's row), `setPrice(item, barberId|null, optionIndex, value)`, `applyRowToAllBarbers(item, barberId)`, and `setItemPhoto`, `addItemPhoto`, `removeItemPhoto` (blocked when it would leave 0).

### Migrating existing content

- Nothing is deployed remotely yet. Local content is migrated by a pure `migrateV1toV2(v1): SiteContent` that is used by the seed script and tested.
- **The mapping:**
  - Cutting & Finishing has options Gentleman / Ladies / Under 12s and `byBarber` on, with each barber's old `cutPrices` as their row.
  - Cleansing & Styling and Up-do Hairdressing have no options and `byBarber` on, with every barber row set to today's range (so the site collapses them to one row).
  - The colour and perm table items have options Short / Medium / Long (Half-Head Perm: Short only) and `byBarber` off, with `base` set to today's prices.
  - Range items have no options and `byBarber` off, with `base` set to `[range]`.
  - Photos are the category's old two dialog photos, copied into each of its services.
- **Local:** `supabase db reset` plus seed works, as does a one-off `npm run migrate:content` that rewrites the local draft and published rows. Old `content_versions` rows stay v1 and are read through the migration (orphan cleanup and rollback must handle v1 versions via `migrateV1toV2`).
- **No SQL migration is needed:** the database stores the document as JSONB.

### Site rendering and booking

- **Rendering:** the menu view model is built from the new item shape. The existing `PriceTable` / `SinglePrice` / `NamePicker` components map onto the four shapes:
  - none/off: single price
  - options/off: one price row
  - none/on: a barber list with one price each (today's NamePicker, now showing prices)
  - options/on: today's per-barber table
- **Display rules (render time only):**
  - If `byBarber` is on and every barber row is identical, show one row: a single price or the per-option prices, with no table. The barber picker still shows in the modal's booking step.
  - A "From" label shows when the item has more than one distinct *cell* value after collapsing. Amounts inside one cell don't count. A single cell is always shown exactly as written, e.g. `£30 – £40` with no "From", as today.
  - **The booking step is never collapsed.** When a `byBarber` item is collapsed in the details view, its booking step still shows the full picker for its shape. For options and barbers, that's the barber x option table, with identical rows. So the picker keeps its single-cell selection model and no two-step picker is needed.
- **Pickers:** `isPickable` is true when `byBarber` is on or there are 2 or more priced options.
- **Booking selection** stays `{ barberId, cut, row, col }`, where `cut` is the option label. Routing and message wording are unchanged.
- **Category flag:** `MenuCategory.barbers` (the category-level flag) is removed. Barber choice is per item.
- **Copy:** text that names barbers ("Choose from Rave, John or Julian") stays as plain text, and the existing stale-barber-name warning still covers it.

### Visual mode

- **Opening modals:** in visual mode, tapping a service card opens the modal, as on the live site. The card itself is no longer an edit target.
- **Edit targets inside the modal:**
  - each photo: `itemPhoto:<cat>.<item>.<n>`
  - the price area, which opens the service editor scrolled to pricing: `item:<cat>.<item>`
  - the description and "ideal for" text, which also go to `item:...`
  - each barber row label: `barber:<id>`
- In visual mode, "Book now" still flips into the booking step, so the barber picker and its `barber:<id>` labels can be reached. Only the actual WhatsApp navigation is blocked: the card-level "Book now" for a non-pickable service and "Continue on WhatsApp" never leave the preview.
- `EditTarget` gains `{ kind: "itemPhoto"; category; item; index: 0 | 1 }`. The `targetKey` and `parseTargetKey` formats are extended. `target-key.ts` must stay free of runtime dependencies (public-bundle constraint).

### Form editor layout (A)

- **Shell:** `FormMode` becomes a two-pane shell.
  - Desktop (820px and up): a section sidebar of about 180px. For Services, a second column of about 220px lists services grouped by category, with category intro text reachable as the first entry, "Cut & Style - intro". The editor pane is on the right.
  - Phone: the section tab strip, then the list, then the editor with a back link.
- **Selection state** (section, service) lives in the URL search params (`?section=services&item=cut.cutting`), so reloads, the back button and links from warnings work.
- **Sections:**
  - **Barbers:** the list with reorder, add and remove. The editor has name, days and WhatsApp.
  - **Services:** the per-service editor with name (read-only), Options (an editable chip list with add, rename inline, remove, and reorder via up/down), the Barber option toggle, the price grid (one row, or barbers x options, with "Apply this row to all barbers" per barber row), description, ideal for, note or shared chemical note, and Photos (1-2, replace, alt, add second, remove second).
  - **Opening hours:** as today.
  - **Photos:** the remaining 13 site slots, grouped (Slides, Services overview, Service photos, Price poster).
  - **Business:** the default WhatsApp number.
- **Dirty indicators:** a dot appears next to sections and services that differ from the saved draft. Warnings in the publish dialog link to their section or service.
- The draft bar, save, publish and discard behaviour are unchanged.

## Left to the builder

- Exact component split, CSS, and how the price grid scrolls horizontally on phones when there are many options.
- The exact wording of empty states and hints.
- Whether option reorder also supports drag (up/down is required).
