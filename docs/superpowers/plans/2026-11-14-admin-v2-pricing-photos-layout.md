# Admin v2: Pricing Axes, Per-Service Photos, Form Layout - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace barber-owned cut prices with per-service pricing axes (an editable options list plus an optional barber axis). Give every service its own 1-2 modal photos. Let visual mode open service modals. Re-lay out the form editor as sidebar sections.

**Architecture:**
- `SiteContent` moves to version 2.
- A legacy v1 schema and a pure `migrateV1toV2` live in `lib/content/legacy-v1.ts`. `parseSiteContent` migrates v1 input transparently, so every reader (published loader, draft loader, version history, preview) accepts old rows. Writes are always v2.
- Rendering keeps the existing price components, mapped onto the four price shapes.
- The form editor becomes a two-pane shell (sidebar, then list, then editor). Its selection lives in URL search params.

**Tech Stack:** Next.js 16.4.5 (App Router, cacheComponents), React 19.3, TypeScript strict, zod 4, Supabase, Vitest (node environment).

**Spec:** `docs/superpowers/specs/2026-11-14-admin-pricing-photos-layout-design.md`. It builds on `docs/superpowers/specs/2026-11-13-admin-dashboard-design.md`.

## Global Constraints

- **The app is in `website/`.** Paths are relative to `website/` unless they start with `docs/`, and npm commands run there. Read `website/AGENTS.md`: Next 16 has breaking changes, and its docs are in `node_modules/next/dist/docs/`.
- **Lint and commits:**
  - `@typescript-eslint/consistent-type-imports` is an error.
  - Never silence ESLint with disable comments.
  - Commit with conventional prefixes and no co-author or attribution lines.
- **Fixed structure:** services and categories are fixed in code (keys, names, `single`, `chemicalNote`). The options list and the barber option are editable per service.
- **Price cells** are canonical prices: `£80`, `£100 – £220+`, or `–` (not offered). Each item must have at least one real price.
- **Price shapes:**
  - When `byBarber` is false: `prices.base` with length `max(1, options.length)`.
  - When `byBarber` is true: `prices.barbers` with exactly one entry per current barber id, each of length `max(1, options.length)`.
- **Modal photos:** each service has 1-2 photos. The first is required.
- **Booking messages** use unchanged templates. The option label goes where the column label went, and `cutLabel` still adds " length" for Short/Medium/Long.
- **Public bundle:** `lib/admin/target-key.ts` must keep only type imports. No admin code or zod may reach the `(site)` page's client chunks.
- **Bundled images:** paths starting with `/images/` are never orphan candidates or Storage objects.
- **Testing:** no browser tests. Verification is `npm run check`, `npm run build`, and the commands named in each task.
- **Docs:** no em dash character in any docs written.

## Review Focus

1. **Removing or reordering one option keeps every other column's prices with the right label.** For example, removing "Ladies" from Cutting & Finishing leaves each barber's Gentleman and Under 12s prices intact. Tested in Task 3.
2. **Adding a barber** gives them a prefilled row in every `byBarber` service. **Removing one** drops their row everywhere. The draft still validates either way. Tested in Task 3.
3. **Stored v1 rows** (old draft, published or `content_versions`) still load. Orphan cleanup and rollback keep working across the version change. Tested in Task 1.
4. **Per-service photo uploads are never deleted by orphan cleanup** while referenced from any item. Tested in Task 3.
5. **Toggling the barber option on then off,** with no edits in between, returns the original single row. **Off then on** gives every barber the same row. Tested in Task 3.

---

## File Structure

**New:**
- `lib/content/legacy-v1.ts`: the v1 zod schema, plus `migrateV1toV2`.
- `lib/content/prices.ts`: pure price-grid helpers shared by the view and the admin (`priceRows`, `allCells`, `rowsIdentical`).
- `components/admin/editors/ItemPhotosEditor.tsx` (+ css), `components/admin/editors/OptionsEditor.tsx` (+ css) and `components/admin/editors/PriceGrid.tsx` (+ css).
- `components/admin/form/FormShell.tsx` (+ css), `components/admin/form/ServiceList.tsx` (+ css) and `components/admin/form/use-form-selection.ts`.
- `scripts/migrate-content.ts`
- Tests: `tests/content-migrate.test.ts` and `tests/content-prices.test.ts`.

**Modified:** `lib/content/{schema,structure,defaults,view}.ts`, `lib/data/services.ts`, `lib/booking/href.ts`, the services components, `lib/admin/{draft-ops,changes,warnings,targets,target-key,orphans}.ts`, `app/(admin)/admin/actions.ts`, the admin editors, `FormMode.tsx`, `PreviewClient.tsx`, `VisualMode.tsx`, `scripts/seed-content.ts`, `package.json`, the docs, and the affected tests.

---

### Task 1: Content model v2, v1 migration and defaults

**Files:**
- Create: `lib/content/legacy-v1.ts`
- Modify: `lib/content/schema.ts`, `lib/content/structure.ts` and `lib/content/defaults.ts`
- Test: `tests/content-migrate.test.ts`. Also update `tests/content-schema.test.ts` and `tests/published.test.ts`.

**Interfaces:**
- **Produces, in schema.ts:**
  - `Barber = { id; name; days; whatsApp }` (no `cutPrices`).
  - `ItemPrices = { base?: string[]; barbers?: Record<string, string[]> }`.
  - `ItemContent = { options: string[]; byBarber: boolean; prices: ItemPrices; desc: string; ideal: string; note?: string; photos: [ImageRef] | [ImageRef, ImageRef] }`.
  - `SiteContent.version: 2`.
  - `IMAGE_SLOTS` loses the 8 `dialog.*` slots, leaving these 13: `heroLeft`, `heroRight`, `split`, `parlor`, `priceList`, `overview.<cat>` ×4 and `media.<cat>` ×4.
  - `itemPhotoFolder(category: CategoryKey, item: string): string` returns `item.${category}.${item}`. Storage keys look like `item.cut.cutting/<uuid>.webp`, and `IMAGE_PATH_PATTERN` must accept them.
  - `contentImagePaths(c: SiteContent): string[]` returns every image path in `c.images` and every item's `photos`.
  - `parseSiteContent(input)` behaves as follows:
    - Input with `version: 1` is parsed with the v1 schema, run through `migrateV1toV2`, then validated as v2.
    - Any other input is validated as v2.
    - Both paths run `checkStructure`.
- **Produces, in structure.ts:**
  - `ItemStructure = { key; name; single?: boolean; chemicalNote?: boolean }`.
  - `CategoryStructure = { name; items }`.
  - `kind`, `cols`, the category `barbers` flag and `CUT_COLUMNS` are removed. `LENGTHS` stays as an exported constant for the migration.
  - `checkStructure(c): string[]` also checks the price shape (Global Constraints), unique non-empty option labels, at least one real price per item, and 1-2 photos.
- **Produces, in legacy-v1.ts:**
  - `siteContentV1Schema`, carrying today's v1 schema (moved verbatim).
  - `migrateV1toV2(v1: SiteContentV1): SiteContent`. Its mapping per the spec's "Migrating existing content" section:
    - `cutting`: options Gentleman / Ladies / Under 12s, `byBarber` true, `barbers[id] = cutPrices`.
    - `cleansing` and `updo`: options `[]`, `byBarber` true, every barber `[range]`.
    - Colour and perm table items: options = the old cols, `base` = the old prices.
    - Range items: options `[]`, `base` = `[range]`.
    - Photos = `[images["dialog.<cat>.0"], images["dialog.<cat>.1"]]` for every item in the category.
- **Produces, in defaults.ts:** `DEFAULT_CONTENT` (v2) equals `migrateV1toV2(DEFAULT_CONTENT_V1)`. Keep the v1 literal as `DEFAULT_CONTENT_V1` in `legacy-v1.ts`, and build the v2 constant from it.

- [ ] **Step 1: Write the failing tests** in `tests/content-migrate.test.ts`:
  - `parseSiteContent(DEFAULT_CONTENT).ok` and `parseSiteContent(DEFAULT_CONTENT_V1).ok` are both true. The second returns `version: 2`.
  - The migrated `cutting` item has `options` `["Gentleman","Ladies","Under 12s"]` and `byBarber` true, and `prices.barbers[raveId]` is `["£55","£80","£35"]`.
  - `cleansing` has `byBarber` true, and every barber row is `["£30 – £40"]`.
  - `roots` has `byBarber` false, options `["Short","Medium","Long"]` and `base` `["£80","–","–"]`.
  - `olaplex` has `base` `["£30"]` and options `[]`.
  - Every `cut` item's photos have the paths of the old `dialog.cut.0` and `dialog.cut.1` slots.
  - `migrated.images` has no `dialog.cut.0` key.
  - `contentImagePaths(DEFAULT_CONTENT)` includes `/images/price-list.webp` and the cut item photo paths.

  In `tests/content-schema.test.ts`, replace the cutPrices and range cases with these, each expecting `ok:false`:
  - a `byBarber` item missing a barber's row
  - a row with an unknown barber id
  - `base` present on a `byBarber` item
  - the wrong row length after adding an option
  - duplicate option labels
  - an empty option label
  - an item whose cells are all `–`
  - 0 photos
  - 3 photos

  Also add one `ok:true` case: a storage key `item.cut.cutting/<uuid>.webp`.
- [ ] **Step 2:** Run `npx vitest run tests/content-migrate.test.ts tests/content-schema.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Update `tests/published.test.ts` fixtures as needed.
- [ ] **Step 4:** Run the same two test files again. Expected: PASS. `npx eslint lib/content tests` should be clean. `npm run typecheck` may still fail in `lib/content/view.ts`, `lib/admin/*`, components and their tests (Tasks 2-4 restore it). List those errors in the report.
- [ ] **Step 5:** Commit with `feat: add v2 content model with per-service pricing and photos`.

### Task 2: Site view, booking and the public service UI

**Files:**
- Create: `lib/content/prices.ts`
- Test: `tests/content-prices.test.ts`
- Modify:
  - `lib/content/view.ts` and `lib/data/services.ts`
  - `lib/booking/href.ts`
  - `components/services/{PriceTable,SinglePrice,NamePicker,ServiceDialogContent,DialogMedia,ServiceCard}.tsx`
  - `scripts/seed-content.ts` (parse before insert)
  - tests: `content-view`, `services`, `booking-href` and `booking-picker`

**Interfaces:**
- **Consumes:** the Task 1 types.
- **Produces, in prices.ts:**
  - `PriceRowData = { barberId: string | null; prices: string[] }`.
  - `priceRows(item: ItemContent, barbers: Barber[]): PriceRowData[]` returns barber rows in barber order when `byBarber` is true, otherwise one row with `barberId: null`.
  - `allCells(item, barbers): string[]`.
  - `rowsIdentical(rows: PriceRowData[]): boolean`.
- **Produces, in services.ts:**
  - `MenuItem` = `{ key; name; options: readonly string[]; byBarber: boolean; rows: readonly PriceRow[]; collapsed: boolean; from: string; single?; desc; ideal; note?; photos: readonly ResolvedImage[] }`.
  - `PriceRow` = `{ label; sub; prices: readonly string[]; barberId: string | null }`. For non-barber rows the label is `""`.
  - `MenuCategory` loses `barbers` and `images`.
  - `MenuCategory.barbers` is replaced by `barbers: readonly Barber[]` on `SiteView` (top level), used by booking.
  - The `cols`, `prices` and `range` fields are removed from `MenuItem`.
- **Display rules (spec):**
  - `collapsed = byBarber && rowsIdentical(rows)`.
  - `priceLabel` shows "From" only when the distinct cell values number more than 1 after collapsing. A single cell is shown verbatim.
  - The details view renders one row when collapsed.
  - The booking step (`picking`/flipped) always renders the full shape: the barber × option table, the barber list with prices, or the option row.
- **Picking:**
  - `isPickable(item) = item.byBarber || (realPrices(firstRow) >= 2 && options.length >= 2)`.
  - `hasChoices` is removed or merged accordingly.
  - `minPriceForColumn(item, col)` is computed over `rows`.
- **Booking:**
  - `BookingOptions` = `{ item; selection; barbers: readonly Barber[]; defaultWhatsApp }`. `category` is removed.
  - `chooseBarber = item.byBarber`.
  - `cut = selection.cut`, where the option label goes through `cutLabel(options, col)`.
  - Routing is unchanged.
- **Pickers:**
  - `NamePicker` shows each barber's price (barbers only, no options).
  - `PriceTable` covers options-only, and barbers × options with a No preference row.
- **Photos:** `DialogMedia` takes `photos: readonly ResolvedImage[]`, renders 1 or 2, and stays edit-free here (Task 6 adds the targets).

- [ ] **Step 1: Write the failing tests**
  - In `tests/content-prices.test.ts`:
    - `priceRows` for `cutting` gives 3 rows in barber order.
    - `rowsIdentical` is true for `cleansing` and false for `cutting`.
    - `allCells` for `roots` is `["£80","–","–"]`.
  - In `tests/content-view.test.ts`:
    - `cleansing` is `collapsed` true with `from` `"£30"`.
    - `cutting` is `collapsed` false, has 3 rows, and its first row's `barberId` is Rave's.
    - `roots` is `byBarber` false with a single row of `barberId: null`.
    - Each item's photos resolve to 2 images for the migrated defaults.
  - In `tests/services.test.ts`:
    - `priceLabel(cleansing)` gives `{text:"£30 – £40"}` with no prefix.
    - `priceLabel(cutting)` gives `{prefix:"From", text:"£30"}`.
    - `isPickable(cleansing)` and `isPickable(roots)` are true. `isPickable(halfPerm)` and `isPickable(olaplex)` are false.
  - In `tests/booking-href.test.ts`, update to the new `BookingOptions`. The existing message strings are unchanged. Add a case where Julian is picked on `cleansing`, giving `"… Cleansing and Styling with Julian."` routed to Julian's number.
- [ ] **Step 2:** Run the tests and confirm they FAIL.
- [ ] **Step 3:** Implement. `seed-content.ts` parses `DEFAULT_CONTENT` with `parseSiteContent` before inserting, and exits non-zero if it's invalid.
- [ ] **Step 4:** Run `npx vitest run` and expect every content, services and booking test to pass. `npm run build` must succeed, with `/` still static. Admin modules may still fail typecheck (Task 3 fixes them). List the errors.
- [ ] **Step 5:** Commit with `feat: render v2 service pricing and per-service modal photos`.

### Task 3: Admin logic for v2

**Files:**
- Modify:
  - `lib/admin/draft-ops.ts`, `lib/admin/changes.ts`, `lib/admin/warnings.ts`
  - `lib/admin/target-key.ts`, `lib/admin/targets.ts`, `lib/admin/orphans.ts`
  - `app/(admin)/admin/actions.ts`
- Test: update `tests/admin-draft-ops.test.ts`, `admin-changes.test.ts`, `admin-warnings.test.ts`, `admin-targets.test.ts` and `admin-orphans.test.ts`.

**Interfaces:**
- **Draft ops** (pure and immutable; existing ops keep their signatures except as noted):
  - `addBarber(c, barber: Omit<Barber,"id">, id)` also adds `prices.barbers[id]` to every `byBarber` item, copied from that item's first barber row.
  - `removeBarber` deletes the row everywhere.
  - `setOptions(c, cat, item, options: string[], mapping: (number | null)[])`. `mapping[i]` is the old index for new option `i`, or `null` for a new option. A new option's cells are `"–"`. This covers add, rename, remove and reorder, and every price array is remapped.
  - `setByBarber(c, cat, item, on: boolean)`:
    - On: every barber gets a copy of `base`, and `base` is deleted.
    - Off: `base` = the first barber's row, and `barbers` is deleted.
  - `setPrice(c, cat, item, barberId: string | null, index: number, value: string)`.
  - `applyRowToAllBarbers(c, cat, item, barberId)`.
  - `setItemPhoto(c, cat, item, index: 0 | 1, ref: ImageRef)`, `setItemPhotoAlt(c, cat, item, index, alt)`, `addItemPhoto(c, cat, item, ref)` (no-op at 2) and `removeItemPhoto(c, cat, item, index)` (no-op when it would leave 0).
  - `setItemContent` no longer accepts price or photo fields.
- **Changes:** `summarizeChanges` gets new lines, replacing the cutPrices lines:
  - `"<Item>: options changed"`
  - `"<Item>: barber option turned on"` / `"… off"`
  - `"<Item>: prices changed"`
  - `"<Item>: photo replaced"`
  - `"<Item>: photo added"` / `"… removed"`
- **Warnings:** the poster warning fires when any item's `prices` or `options` differ and the `priceList` path is unchanged.
- **Targets:**
  - `EditTarget` adds `{ kind: "itemPhoto"; category: CategoryKey; item: string; index: 0 | 1 }`, with key `itemPhoto:<cat>.<item>.<index>` (type-only imports in target-key.ts).
  - `parseTargetKey` validates the category, the item and an index of 0 or 1.
  - `IMAGE_GROUPS` drops "Service dialog photos".
  - `targetLabel` gives `"<Item name> photo <n>"`.
- **Orphans:** `findOrphans` collects referenced paths through `contentImagePaths`.
- **actions.ts:** no shape change (`parseSiteContent` migrates v1). `writeDraft` always writes v2.

- [ ] **Step 1: Write the failing tests** (Review Focus 1, 2, 4, 5):
  - `setOptions` on `cutting` removing index 1 (Ladies), with mapping `[0,2]`, gives every barber row `[gent, u12]` and options `["Gentleman","Under 12s"]`.
  - A reorder with mapping `[2,0,1]` moves the cells with their labels.
  - Adding an option with mapping `[0,1,2,null]` appends `"–"` to every row.
  - `addBarber` gives the new id a row in `cutting`, `cleansing` and `updo`, equal to the first barber's row, and the result passes `parseSiteContent`.
  - `removeBarber` removes the row from all three, and the result still parses.
  - On `roots` (byBarber false), `setByBarber` on then off gives `base` equal to the original. On `cleansing`, off then on gives every barber the same row.
  - `applyRowToAllBarbers(cutting, johnId)` gives every row equal to John's.
  - `removeItemPhoto` with a single photo is a no-op.
  - `findOrphans` keeps `item.cut.cutting/<uuid>.webp` when it is referenced only from an item photo.
  - The `parseTargetKey` round trip covers `itemPhoto` targets, and `itemPhoto:cut.cutting.2` gives `null`.
  - A `summarizeChanges` case for each new line.
  - The poster warning fires on a `setPrice` change.
- [ ] **Step 2:** Run the tests and confirm they FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npx vitest run` and expect all tests to PASS. Typecheck errors may remain only in `components/admin/**` (Task 4). List them.
- [ ] **Step 5:** Commit with `feat: admin draft logic for pricing axes and item photos`.

### Task 4: Service and barber editors for v2

**Files:**
- Create: `components/admin/editors/OptionsEditor.tsx`, `PriceGrid.tsx` and `ItemPhotosEditor.tsx` (each with a .module.css)
- Modify:
  - `components/admin/editors/ServiceItemEditor.tsx`, `BarberEditor.tsx`, `BarbersEditor.tsx` and `EditorFor.tsx`
  - `components/admin/editors/ImageSlotEditor.tsx`: extract the shared upload logic into `lib/admin/upload-image.ts`, with signature `uploadImage(folder: string, file: File): Promise<ImageRef-without-alt>`, and use it for both slots and item photos.

**Interfaces:**
- **Consumes:** the Task 3 ops and the Task 1 helpers.
- **Produces:**
  - **`ServiceItemEditor`**, in this order:
    1. Name (read-only)
    2. `OptionsEditor`: chips with inline rename, remove, up/down, and add. It calls `setOptions` with the right mapping.
    3. A "Barber option" toggle that calls `setByBarber`.
    4. `PriceGrid`: rows are barbers or one row, and columns are options or one "Price" column. Cells are `PriceField`s that call `setPrice`. When `byBarber` is on, each row has an "Apply to all barbers" button. The grid scrolls horizontally inside its own container on phones.
    5. Description, Ideal for, and the note / shared chemical note (as today).
    6. `ItemPhotosEditor`
  - **`ItemPhotosEditor`:** 1-2 photos, each with a preview, "Replace photo", and alt text. It has "Add a second photo" and "Remove" (only on the second). It uploads with `uploadImage(itemPhotoFolder(cat,item), file)`.
  - **Barber editors:** `BarberEditor` and `AddBarberForm` drop the cut price inputs. The add form needs only name, days and WhatsApp.
  - **`EditorFor`:** handles `itemPhoto` by rendering `ItemPhotosEditor` focused on that index.
- [ ] **Step 1:** Implement. These are UI components, so there are no unit tests. Any new pure helper goes in `lib/admin/` and gets a test.
- [ ] **Step 2:** Run `npm run check` and expect full PASS: lint, typecheck clean everywhere, and all tests. Run `npm run build` and expect PASS.
- [ ] **Step 3:** Commit with `feat: edit service options, barber pricing and photos`.

### Task 5: Form layout A (sidebar sections)

**Files:**
- Create: `components/admin/form/FormShell.tsx`, `ServiceList.tsx` and `use-form-selection.ts` (with css)
- Modify: `components/admin/FormMode.tsx`, `components/admin/DraftBar.tsx` (warning links)
- Test: `tests/admin-form-selection.test.ts`, for the pure parse/serialize of the selection.

**Interfaces:**
- **Produces:**
  - `FormSection = "barbers" | "services" | "hours" | "photos" | "business"`.
  - `FormSelection = { section: FormSection; item?: string /* "cut.cutting" or "cut.intro" */ }`.
  - `parseFormSelection(params: URLSearchParams): FormSelection`. It defaults to `{section:"services"}`, and invalid values fall back to defaults.
  - `formSelectionQuery(s): string`.
  - `useFormSelection()` reads and writes `?section=&item=` with `router.replace` (no scroll, no history spam).
  - `dirtySections(saved, draft): Set<FormSection | "cut.cutting" | …>`, built from deep comparisons of the relevant content parts.
- **Layout:**
  - **Desktop (820px and up):**
    - a sidebar of about 180px listing the 5 sections, with a dirty dot on changed sections
    - for Services, a list column of about 220px grouped by category: `<Category> - intro`, then its services, each with a dirty dot
    - the editor pane, rendering `EditorFor` for the selected target
  - **Phone:** a horizontally scrollable section tab strip under the draft bar. Services shows the grouped list. Selecting a service shows its editor full width, with a "‹ Services" back link that clears `item`.
  - **Photos section:** the 13 remaining slots, grouped by `IMAGE_GROUPS`.
  - **Barbers section:** `BarbersEditor`.
  - **Hours and Business:** their editors.
- **Warning links:** publish-dialog warnings link to their target. A stale barber name opens the service or intro whose copy contains it. The poster warning opens Photos.
- [ ] **Step 1:** Write `tests/admin-form-selection.test.ts`:
  - `?section=services&item=cut.cutting` round-trips.
  - `?section=bogus` gives services.
  - `?item=cut.nope` drops the item.
  - `?section=services&item=cut.intro` is valid.
  - `dirtySections` marks `services` and `cut.cutting` after a `setPrice`, and `barbers` after `updateBarber`.

  Run it and expect a FAIL.
- [ ] **Step 2:** Implement. Run it again and expect a PASS.
- [ ] **Step 3:** Run `npm run check` and `npm run build`. Both should pass.
- [ ] **Step 4:** Commit with `feat: sidebar layout for the form editor`.

### Task 6: Visual mode opens service modals

**Files:**
- Modify:
  - `components/services/ServiceCard.tsx` (remove the card-level `useEditTargetProps`)
  - `components/services/{DialogMedia,DialogDetails,PriceTable,NamePicker,SinglePrice,DialogActions}.tsx` (edit regions)
  - `components/admin/PreviewClient.tsx`
- Test: extend `tests/admin-preview-protocol.test.ts` for `itemPhoto` targets.

**Interfaces:**
- **In visual mode,** tapping a card opens its modal (no edit target on the card), and "Book now" flips into the booking step.
- **Edit regions inside the modal:**
  - each photo: `itemPhoto:<cat>.<item>.<i>`
  - the price area, description and ideal/note: `item:<cat>.<item>`
  - each barber row label: `barber:<id>`
- **Blocking WhatsApp:** in `PreviewClient`'s capture click handler, any click on an `a[href^="https://wa.me/"]` calls `preventDefault()` without posting an edit. The existing `[data-edit-target]` interception is unchanged.
- **Public bundle:** all edit regions use `Editable`/`useEditTargetProps` from `components/edit`, which import only `lib/admin/target-key.ts`.
- [ ] **Step 1:** Add protocol tests: `parseFromPreview({type:"edit", target:"itemPhoto:cut.cutting.1"})` is non-null, and `itemPhoto:cut.cutting.5` gives `null`. Run them and expect a FAIL if the parsing is missing, otherwise a PASS from Task 3.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Run `npm run check` and `npm run build`. Then, with `npm run start`:
  - `curl -s localhost:3000/ | grep -c data-edit-target` should print `0`.
  - Grep the `(site)` page client chunks (from `.next/server/app/(site)/page_client-reference-manifest.js`) for `ZodError`. There should be 0 hits.
- [ ] **Step 4:** Commit with `feat: edit service modals from visual mode`.

### Task 7: Local content migration script and docs

**Files:**
- Create: `scripts/migrate-content.ts`
- Modify: `package.json` (`"migrate:content": "tsx --env-file=.env.local scripts/migrate-content.ts"`), `README.md` and `docs/admin-deploy.md`

**Interfaces:**
- **The script:** using `SUPABASE_SECRET_KEY`, it reads the `draft` and `published` rows. Any row with `version: 1` is rewritten through `parseSiteContent` (which migrates it) and updated in place. It prints what it changed and is idempotent: a second run reports nothing to migrate. `content_versions` rows are left alone, since they are read through the migration.
- **Docs:**
  - README "Admin and content" gets one line about `npm run migrate:content`.
  - admin-deploy.md says remote projects seeded after this change start at v2 and need no migration.
- [ ] **Step 1:** Implement. Run `npm run migrate:content` twice against the local stack. The first run should migrate both rows (local rows are v1 today), and the second should report nothing to migrate. Verify with `select content->>'version' from public.site_content;`, which should return `2` for both rows.
- [ ] **Step 2:** Run `npm run check` and `npm run build`. Both should pass.
- [ ] **Step 3:** Commit with `chore: add content migration script and docs`.
