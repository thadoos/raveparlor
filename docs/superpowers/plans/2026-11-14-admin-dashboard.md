# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the site's editable content into one Supabase-backed `SiteContent` document. Add a single-login `/admin` with form and visual editing of a draft, plus publish. Route WhatsApp bookings to each barber's own number.

**Architecture:**
- **Content model:** content lives in two JSONB rows (`draft` and `published`) and is validated by one zod schema. Menu *structure* stays in code and is joined to the content by stable keys. `buildSiteView(content)` derives everything the components render.
- **Rendering:** the public page and the visual-mode preview render the same `SitePage` component from a `SiteView`.
- **Preview:** it runs in a same-origin iframe (`/preview`), because the deck is viewport-fixed and binds window and document listeners. The admin sends the unsaved draft to it over `postMessage`.

**Tech Stack:**
- Next.js 16.4.5 App Router with `cacheComponents`, React 19.3 and TypeScript strict
- Supabase: Postgres, Auth and Storage, via `@supabase/supabase-js` and `@supabase/ssr`
- zod
- Vitest (node environment)
- Netlify, with Netlify Functions for the keep-alive

**Spec:** `docs/superpowers/specs/2026-11-13-admin-dashboard-design.md`

## Global Constraints

- **The app lives in `website/`.** Every path below is relative to `website/` unless it starts with `docs/`. All `npm` commands run in `website/`.
- **Next 16 has breaking changes.** Before writing Next-specific code, read the relevant page in `node_modules/next/dist/docs/` (per `website/AGENTS.md`). The facts this plan relies on:
  - `proxy.ts`, not `middleware.ts`.
  - `"use cache"`, `cacheTag` and `cacheLife` come from `next/cache`.
  - `updateTag(tag)` works only inside Server Actions.
  - `cookies()` must not be read inside `"use cache"`. Read cookies inside a `<Suspense>`-wrapped component.
  - No `export const dynamic` or `runtime` route segment exports.
  - `images.remotePatterns` accepts `new URL(...)`.
  - `images.dangerouslyAllowLocalIP` is needed to optimize images from `127.0.0.1` in dev.
  - Multiple root layouts via route groups. Each one renders `<html>` and `<body>`.
- **Lint rules:** `@typescript-eslint/consistent-type-imports` is an error, so use `import type`. Never silence ESLint with disable comments. Fix the cause.
- **Conventions:**
  - Components are PascalCase `.tsx` with a sibling `Name.module.css`.
  - Hooks are `use-*.ts`.
  - Contexts are a `*-context.ts` file plus a `*Provider.tsx`.
  - Pure logic goes in `lib/`, and tests go in `tests/*.test.ts` (node environment, `@/` alias).
- **Migrations:** create Supabase migrations only with `supabase migration new <name>`. Never hand-create migration files.
- **Secrets:** the service-role or secret key is used only by `scripts/seed-content.ts`. It is never imported by app code and never has a `NEXT_PUBLIC_` prefix.
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the publishable key from `supabase status`)
  - `SUPABASE_SECRET_KEY` (seed script only)
  - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (seed script only)
- **No email anywhere.** No "Forgot password" link and no email confirmation.
- **Fixed wording:** booking message text stays exactly as today. For example, `"Hi, I'd like to book an appointment at Rave's Parlor."`, `"… with Julian."` and `"… Any barber is fine."`.
- **Editing scope:** the menu structure (categories, items, columns, item names, which items are pickable) is not editable. Only barbers can be added or removed.
- **Testing:** do not run browser-based tests. The user verifies UI visually. Verification is `npm run check` (lint, typecheck and vitest), `npm run build`, and the SQL and curl checks named in the tasks.
- **Commits:** commit at the end of every task. Use conventional prefixes (`feat:`, `refactor:`, `chore:`, `docs:`, `test:`), and no co-author or attribution lines.
- **Docker:** the Supabase CLI local stack needs Docker Desktop running. Tasks 5 onward need it.

## Review Focus

1. **Phone numbers typed in any common UK form** should all normalize to the same `wa.me` digits, and anything else should be rejected. Examples: `07789 096148`, `+44 7789 096148`, `0044 7789 096148`, `447789096148`. Tested in Task 1.
2. **Prices typed loosely** should normalize to the site's format, and junk should be rejected:
   - `80` becomes `£80`.
   - `£100-£220+` becomes `£100 – £220+`.
   - `-` becomes `–`.

   Tested in Task 1.
3. **A `postMessage` from another origin, or with a malformed draft,** must be ignored by the preview and must not crash it. Tested in Task 9.
4. **Save failing** (session expired, network down, validation) must keep the local edits and show the reason. The edits must not be reset to the saved draft. Tested in Task 7.
5. **Orphan cleanup** must never delete an image that is still referenced by the draft, the published content, or the last 10 published versions. Files under `/images/...` (the repo's `public/` folder) are never candidates. Tested in Task 8.

---

## File Structure

**New:**
- `lib/content/schema.ts`: zod schemas plus `SiteContent` and related types, `IMAGE_SLOTS`, and `CUT_COLUMNS`.
- `lib/content/normalize.ts`: `normalizeWhatsApp`, `normalizePrice` and `formatUkPhone`.
- `lib/content/structure.ts`: `MENU_STRUCTURE` (categories, items, columns and flags, keyed by `ItemKey`), plus `IMAGE_POSITIONS`.
- `lib/content/defaults.ts`: `DEFAULT_CONTENT: SiteContent`, holding today's values. It is used by seed and tests.
- `lib/content/view.ts`: `buildSiteView`, `resolveImage`, `deriveFrom`, `buildMenu` and `buildSiteInfo`.
- `lib/content/published.ts`: the server-only, cached `getPublishedContent()` and `getSiteView()`.
- `components/site/SitePage.tsx`: the whole homepage tree from a `SiteView`.
- `components/site/SiteViewProvider.tsx` and `components/site/site-view-context.ts`: give client components access to the view.
- `components/edit/Editable.tsx` and `components/edit/edit-context.ts`: the visual-mode click targets.
- `lib/supabase/{public,server,browser}.ts`: Supabase clients.
- `lib/admin/auth.ts`: `requireAdmin()`.
- `lib/admin/draft-ops.ts`, `lib/admin/changes.ts`, `lib/admin/warnings.ts`, `lib/admin/orphans.ts`, `lib/admin/image-resize.ts`, `lib/admin/targets.ts` and `lib/admin/preview-protocol.ts`: pure logic.
- `app/(site)/layout.tsx` and `app/(site)/page.tsx`: the public site (moved from `app/`).
- `app/(admin)/layout.tsx`, `app/(admin)/admin/login/page.tsx`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/password/page.tsx` and `app/(admin)/admin/actions.ts`.
- `app/(preview)/layout.tsx` and `app/(preview)/preview/page.tsx`.
- `components/admin/*`: the admin UI.
- `proxy.ts`
- `supabase/` (via `supabase init`), plus one migration.
- `scripts/seed-content.ts`
- `netlify/functions/keep-alive.mts`

**Modified:**
- `lib/data/services.ts`: keeps only types and helpers. The data moves to `defaults.ts` and `structure.ts`.
- `lib/data/site.ts`: keeps only the non-editable `SITE_STATIC`, `resolveSiteUrl` and `SITE_URL`.
- `lib/data/images.ts`: `PHOTOS`, `SLIDE_POSITIONS` and `OVERVIEW_IMAGES` are removed. `positionClass` is kept.
- `lib/contact.ts`, `lib/booking/{picker,href}.ts`, `lib/format.ts` and `lib/seo.ts`.
- Every component that imports `MENU`, `SITE`, `PHOTOS`, `BARBERS` or `WHATSAPP_NUMBER`.
- `next.config.ts`, `package.json`, `.env.example`, `app/robots.ts`, `app/manifest.ts`, `README.md`.
- The existing tests.

---

### Task 1: Content schema and input normalizers

**Files:**
- Create: `lib/content/schema.ts`
- Create: `lib/content/normalize.ts`
- Modify: `package.json` (add `zod`)
- Test: `tests/content-normalize.test.ts`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Produces:
  - `type CategoryKey = "cut" | "colour" | "perm" | "treat"`. It moves here, and `lib/data/services.ts` re-exports it.
  - `CUT_COLUMNS = ["Gentleman", "Ladies", "Under 12s"] as const`.
  - `IMAGE_SLOTS`, a readonly tuple with these 21 slots:
    - `"heroLeft"`, `"heroRight"`, `"split"`, `"parlor"`, `"priceList"`
    - `"overview.cut"`, `"overview.colour"`, `"overview.perm"`, `"overview.treat"`
    - `"media.cut"`, `"media.colour"`, `"media.perm"`, `"media.treat"`
    - `"dialog.cut.0"`, `"dialog.cut.1"`, `"dialog.colour.0"`, `"dialog.colour.1"`, `"dialog.perm.0"`, `"dialog.perm.1"`, `"dialog.treat.0"`, `"dialog.treat.1"`
  - `type ImageSlot = (typeof IMAGE_SLOTS)[number]`.
  - `ImageRef { path: string; alt: string; width: number; height: number }`. A `path` starting with `/` is a file in `public/`. Any other path is a key in the `site-images` Storage bucket.
  - `OpeningHours`: same fields as today's `lib/data/site.ts` `OpeningHours`. It moves here, and site.ts re-exports it.
  - `Barber { id: string /* uuid */; name: string; days: string; whatsApp: string; cutPrices: [string, string, string] }`. The `cutPrices` are in `CUT_COLUMNS` order.
  - `ItemContent { prices?: string[]; range?: string; desc: string; ideal: string; note?: string }`
  - `CategoryContent { intro: [string, string]; items: Record<string, ItemContent> }`
  - `SiteContent { version: 1; business: { defaultWhatsApp: string; hours: OpeningHours[] }; barbers: Barber[]; services: Record<CategoryKey, CategoryContent>; sharedNotes: { chemical: string }; images: Record<ImageSlot, ImageRef> }`
  - `siteContentSchema: z.ZodType<SiteContent>` and `parseSiteContent(input: unknown): { ok: true; content: SiteContent } | { ok: false; issues: string[] }`.
  - `normalizeWhatsApp(input: string): string | null`, returning digits only, e.g. `"447789096148"`.
  - `normalizePrice(input: string): string | null`.
  - `formatUkPhone(digits: string): string`.

- [ ] **Step 1: Install zod**

Run: `npm install zod`
Expected: `zod` appears in `dependencies`.

- [ ] **Step 2: Write the failing tests**

`tests/content-normalize.test.ts`:
```ts
describe("normalizeWhatsApp", () => {
  it.each(["07789 096148", "+44 7789 096148", "0044 7789 096148", "447789096148", "+44 (0)7789-096148"])(
    "normalizes %s", (input) => expect(normalizeWhatsApp(input)).toBe("447789096148"));
  it.each(["", "hello", "0778909614", "+1 2", "07789 096148 ext 2"])("rejects %s", (input) =>
    expect(normalizeWhatsApp(input)).toBeNull());
  it("keeps other international numbers in E.164 digits", () =>
    expect(normalizeWhatsApp("+33 6 12 34 56 78")).toBe("33612345678"));
});
describe("normalizePrice", () => {
  it.each([["80", "£80"], ["£80", "£80"], [" £ 80 ", "£80"], ["£100-£220+", "£100 – £220+"],
    ["100 - 220", "£100 – £220"], ["£30 – £40", "£30 – £40"], ["-", "–"], ["–", "–"]])(
    "%s -> %s", (input, out) => expect(normalizePrice(input)).toBe(out));
  it.each(["", "free", "£", "£80 – ", "£-5"])("rejects %s", (input) => expect(normalizePrice(input)).toBeNull());
});
describe("formatUkPhone", () => {
  it("formats UK mobiles for display", () => expect(formatUkPhone("447789096148")).toBe("07789 096148"));
  it("falls back to +digits", () => expect(formatUkPhone("33612345678")).toBe("+33612345678"));
});
```

`tests/content-schema.test.ts`: build a minimal valid `SiteContent` fixture in the test file. In Task 2 it switches to `DEFAULT_CONTENT`. Then assert:
- the valid fixture gives `ok: true`
- `barbers: []` gives `ok: false` (at least one barber)
- duplicate barber names (case-insensitive) give `ok: false`
- a barber `whatsApp: "07789 096148"` (not normalized) gives `ok: false`, because the schema accepts only normalized values
- a `cutPrices` entry `"80"` gives `ok: false`
- hours with `open: "19:00", close: "10:00"` give `ok: false`
- `lastAppointment` outside `open..close` gives `ok: false`
- an `images` object missing `"priceList"` gives `ok: false`
- `version: 2` gives `ok: false`
- `issues` is a non-empty string array with readable paths, e.g. one containing `"barbers"`

- [ ] **Step 3: Run the tests to see them fail**

Run: `npx vitest run tests/content-normalize.test.ts tests/content-schema.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 4: Implement `lib/content/normalize.ts` and `lib/content/schema.ts`**

- **Price format:** the canonical form is `£<int>[+]` or `£<int>[+] – £<int>[+]` with an en dash and single spaces, or the lone `–`.
- **WhatsApp:**
  1. Strip spaces, dashes, dots, parentheses and a `(0)` trunk marker.
  2. A leading `+` or `00` means international. A leading `0` followed by 10 digits is UK, so replace the `0` with `44`.
  3. The result must match `^[1-9]\d{7,14}$`.
- **Schema:** it validates canonical values only. The editors normalize before writing to the draft.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run tests/content-normalize.test.ts tests/content-schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/content tests/content-normalize.test.ts tests/content-schema.test.ts
git commit -m "feat: add site content schema and input normalizers"
```

### Task 2: Menu structure, default content and the site view

**Files:**
- Create: `lib/content/structure.ts`
- Create: `lib/content/defaults.ts`
- Create: `lib/content/view.ts`
- Test: `tests/content-view.test.ts`
- Modify: `tests/content-schema.test.ts` (use `DEFAULT_CONTENT` as the fixture)

**Interfaces:**
- Consumes: Task 1 types.
- Produces:
  - **Structure:** `MENU_STRUCTURE: Record<CategoryKey, CategoryStructure>`, where:
    - `CategoryStructure { name: string; barbers: boolean; items: readonly ItemStructure[] }`
    - `ItemStructure { key: string; name: string; kind: "barberTable" | "table" | "range"; cols?: readonly string[]; single?: boolean; chemicalNote?: boolean }`
  - **Item keys,** in today's order:
    - cut: `cutting`, `cleansing`, `updo`
    - colour: `roots`, `fullColour`, `halfHighlights`, `fullHighlights`, `technicalHighlight`, `bleach`
    - perm: `coolPerm`, `halfPerm`, `ionStraightening`
    - treat: `olaplex`, `scalpSpa`
  - **Kinds:**
    - `cut.cutting` is the only `barberTable`, with cols `CUT_COLUMNS`.
    - The colour and perm `table` items use the `["Short","Medium","Long"]` cols, except `halfPerm`, which uses `["Short"]`.
    - `chemicalNote: true` is set on all 9 colour and perm items.
    - `single: true` is set on both treat items.
  - **Positions:** `IMAGE_POSITIONS: Partial<Record<ImageSlot, string>>` carries today's values:
    - heroLeft `46% 42%`, heroRight `50% 38%`, split `50% 40%`, parlor `50% 50%`
    - overview: cut `50% 30%`, colour `50% 50%`, perm `50% 40%`, treat `40% 50%`
    - media: cut, colour and perm `50% 30%`; treat `40% 50%`
  - **Defaults:** `DEFAULT_CONTENT: SiteContent` holds every current value: barbers, prices, copy (verbatim), hours, number `447789096148`, CHEM, and alt texts.
    - Barbers get fixed UUIDs written as literals, and each barber's `whatsApp` is `447789096148`.
    - Image paths are today's `/images/...` files with real pixel dimensions (read them with `sips -g pixelWidth -g pixelHeight` and write them as literals).
    - The dialog images follow today's `MENU.*.images` pairs. The overview and media slots follow `OVERVIEW_IMAGES` and `media`.
  - **Resolved images:** `ResolvedImage { src: string; alt: string; width: number; height: number; position?: string }`.
  - **The view:** `SiteView { site: SiteInfo; menu: Record<CategoryKey, MenuCategory>; images: Record<ImageSlot, ResolvedImage> }`. `SiteInfo` is today's interface from `lib/data/site.ts`, with `hours`, `whatsappNumber` and `phoneDisplay` coming from content.
  - **Changes to `MenuCategory` and related types in `lib/data/services.ts`:**
    - `images: readonly ResolvedImage[]`
    - `media: ResolvedImage` (replacing `media` + `mediaPos`)
    - `barbers?: readonly Barber[]`, using the content `Barber` with id and whatsApp
    - `MenuItem` gains `key: string`
    - `PriceRow` gains `barberId?: string`
  - **Functions:**
    - `resolveImage(ref: ImageRef, supabaseUrl: string, position?: string): ResolvedImage`. A path starting with `/` is kept as-is. Any other path becomes `${supabaseUrl}/storage/v1/object/public/site-images/${path}`.
    - `deriveFrom(prices: readonly string[]): string` returns the lowest `£` amount found in any price string, e.g. `["£100 – £220+"]` gives `"£100"`.
    - `buildMenu(content: SiteContent, images: Record<ImageSlot, ResolvedImage>): Record<CategoryKey, MenuCategory>`
    - `buildSiteInfo(content: SiteContent): SiteInfo`
    - `buildSiteView(content: SiteContent, supabaseUrl: string): SiteView`

- [ ] **Step 1: Write the failing tests** in `tests/content-view.test.ts`, using `DEFAULT_CONTENT` and `const view = buildSiteView(DEFAULT_CONTENT, "https://x.supabase.co")`:
  - `parseSiteContent(DEFAULT_CONTENT).ok` is `true`.
  - **Cut table:** `view.menu.cut.items[0]` has `name` "Cutting & Finishing" and `rows.map(r => r.label)` equal to `["Rave","John","Julian"]`. Each row's `barberId` is the barber's id. `rows[0].prices` is `["£55","£80","£35"]` and `rows[0].sub` is `"Mon, Thu, Fri, Sat & Sun"`.
  - **Derived "from" prices:**
    - `cut.cutting` is `"£30"`
    - `colour.technicalHighlight` is `"£100"`
    - `colour.roots` is `"£80"`
    - `treat.olaplex` is `"£30"`
    - `cut.cleansing` is `"£30"`
  - **Chemical note:** `view.menu.colour.items[0].note === DEFAULT_CONTENT.sharedNotes.chemical`, and `view.menu.cut.items[1].note` is its own note.
  - **Barber order:** reordering `content.barbers` reorders `cut.items[0].rows` and `cut.barbers` the same way.
  - **Images:** `resolveImage({path:"/images/a.jpg",...}, url).src === "/images/a.jpg"`. `resolveImage({path:"heroLeft/abc.webp",...}, "https://x.supabase.co").src === "https://x.supabase.co/storage/v1/object/public/site-images/heroLeft/abc.webp"`.
  - **Positions:** `view.images.heroLeft.position === "46% 42%"`.
  - **Site info:** `view.site.whatsappNumber === "447789096148"`, `view.site.phoneDisplay === "07789 096148"`, and `view.site.hours` equals the content hours.
  - **Keys line up:** every `MENU_STRUCTURE` item key exists in `DEFAULT_CONTENT.services`, and vice versa.
- [ ] **Step 2: Run the tests to see them fail.** Run: `npx vitest run tests/content-view.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `structure.ts`, `defaults.ts` and `view.ts`, and update the types in `lib/data/services.ts`. Keep the helpers (`isPrice`, `hasChoices`, `isPickable`, `cutLabel`, `minPriceForColumn`, `categoryStats`, `priceLabel`, `cardAriaLabel`, `adjacentCategory`, `CATEGORY_ORDER`). Don't delete `MENU` and the other constants yet, because Task 3 removes their consumers.
- [ ] **Step 4: Run the tests to see them pass.** Run: `npx vitest run tests/content-view.test.ts tests/content-schema.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: derive site view from content document`.

### Task 3: Render the public site from a `SiteView`

**Files:**
- Create: `components/site/SitePage.tsx`
- Create: `components/site/SiteViewProvider.tsx`
- Create: `components/site/site-view-context.ts`
- Move: `app/layout.tsx` to `app/(site)/layout.tsx`, and `app/page.tsx` to `app/(site)/page.tsx`. `globals.css` and `styles/` stay in `app/`, so fix the import paths.
- Modify:
  - `lib/format.ts` and `lib/seo.ts`
  - the components that import `MENU`, `SITE`, `PHOTOS`, `SLIDE_POSITIONS`, `OVERVIEW_IMAGES` or `formatX()`: HeroPair, SplitSlide, ParlorSlide, ReviewsSlide, ServicesOverview, ServiceGrid, ServiceTabs, MenuHead, ServiceCard, ServiceDialogContent, DialogRating, NavMenu, SiteFooter, BookVisit, PricePoster and ServiceMedia
  - `app/manifest.ts`
- Modify (data): `lib/data/site.ts`, `lib/data/images.ts` and `lib/data/services.ts`, which drop the moved data.
- Test: update `tests/services.test.ts`, `tests/seo.test.ts` and `tests/booking-href.test.ts` to build from `buildSiteView(DEFAULT_CONTENT, …)`. Add `tests/format.test.ts`.

**Interfaces:**
- Consumes: `SiteView`, `buildSiteView` and `DEFAULT_CONTENT` (Task 2).
- Produces:
  - `SitePage({ view }: { view: SiteView })`. It has no `"use client"` directive, so it works in the server page and inside the client preview. It renders the exact tree of today's `app/page.tsx`, wrapped in `<SiteViewProvider view={view}>`, and passes view slices as props to components that have no directive.
  - `useSiteView(): SiteView`. It throws outside the provider. Client components (ServiceGrid, ServiceTabs, MenuHead, ServiceCard, ServiceDialogContent, NavMenu, PricePoster) use it instead of importing `MENU`, `SITE` or `PHOTOS`.
  - `lib/format.ts`: every function that reads `SITE` takes `site: SiteInfo` as its first parameter. The names stay the same: `formatHoursSummary(site, separator)`, `formatClosedDays(site)`, `formatAddressLines(site)`, `formatAddress(site)`, `formatAddressShort(site)`, `formatWhatsAppLine(site)`, `formatRatingLine(site)`, `formatGoogleReviews(site)` and `formatCopyright(site)`.
  - `lib/seo.ts`: `buildHairSalonLd(site: SiteInfo, image: ResolvedImage, siteUrl: string = SITE_URL)`. It uses the `parlor` slot image. A relative `src` is prefixed with `siteUrl`, and an absolute one is used as-is.
  - `lib/data/site.ts`:
    - It exports `SITE_STATIC`: everything in today's `SITE` except `hours`, `whatsappNumber` and `phoneDisplay`.
    - It keeps `resolveSiteUrl` and `SITE_URL`.
    - `WHATSAPP_NUMBER` is deleted.
  - `lib/data/images.ts`: keeps only `positionClass` (and the `Photo` type if it is still used).
  - `lib/data/services.ts`: types and helpers only. `MENU`, `BARBERS`, `CUT_PRICES`, `CHEM` and `totalServices` are deleted. The total is computed from the view in ServicesOverview.

Temporary wiring: until Task 5, `app/(site)/page.tsx` renders `<SitePage view={buildSiteView(DEFAULT_CONTENT, "")} />`, and the layout uses the same view for metadata and JSON-LD. Task 5 swaps this for `getSiteView()`.

PricePoster rule: it renders `next/image` with `src`, `width` and `height` from `view.images.priceList` instead of the static import, and the no-JS `<a href>` uses the same `src`.

- [ ] **Step 1: Write the failing tests**
  - `tests/format.test.ts`: with `const site = buildSiteView(DEFAULT_CONTENT, "").site`, assert:
    - `formatWhatsAppLine(site) === "WhatsApp 07789 096148"`
    - `formatHoursSummary(site, ", ")` equals today's output (capture it from the current function before changing it)
    - `formatClosedDays(site) === "Closed Christmas Day, Boxing Day and New Year’s Day"`
  - Update `tests/seo.test.ts` to call `buildHairSalonLd(site, view.images.parlor, "https://example.com")`. Assert `telephone === "+447789096148"` and `image === "https://example.com/images/parlor-reception.jpg"`.
  - Add one more case: a Storage-backed parlor image keeps its absolute URL.
  - Update `tests/services.test.ts` to read the menu from the view instead of `MENU`.
- [ ] **Step 2: Run the tests to see them fail.** Run: `npm test`. Expected: FAIL in format, seo and services.
- [ ] **Step 3: Implement** the provider, `SitePage`, and the component and lib changes. Delete the moved constants. Fix every import until `npm run typecheck` is clean.
- [ ] **Step 4: Verify**
  - Run: `npm run check`. Expected: lint, typecheck and all tests pass.
  - Run: `npm run build`. Expected: the build succeeds, and `/` is listed as prerendered.
- [ ] **Step 5: Commit** with `refactor: render site from a content-derived view`.

### Task 4: Per-barber WhatsApp routing

**Files:**
- Modify: `lib/booking/picker.ts`, `lib/booking/href.ts`, `lib/contact.ts`, PriceTable, NamePicker, SinglePrice, ServiceDialogContent, ServiceCard, BookVisit, NavMenu and SiteFooter.
- Test: `tests/booking-href.test.ts`, `tests/contact.test.ts` and `tests/booking-picker.test.ts`.

**Interfaces:**
- Consumes: `MenuCategory.barbers: Barber[]` with `id` and `whatsApp`, `PriceRow.barberId` (Task 2), and `view.site.whatsappNumber` (Task 3).
- Produces:
  - `Selection { barberId: string | null; cut: string | null; row: number; col: number }`. The `barber` name field is removed.
  - `whatsappLink(number: string, message?: string): string`.
  - `BOOK_MESSAGE` and `serviceMessage` are unchanged.
  - `BookingOptions { item: MenuItem; category: MenuCategory; selection: Selection | null; defaultWhatsApp: string }`.
  - `bookingMessage(options)` looks up the barber's *name* by `selection.barberId` in `category.barbers`. An unknown id behaves like no preference.
  - `bookingHref(options)` uses the selected barber's `whatsApp` if found, otherwise `defaultWhatsApp`.
  - The generic links (BookVisit, NavMenu, SiteFooter) use `whatsappLink(site.whatsappNumber, BOOK_MESSAGE)`.

- [ ] **Step 1: Update the tests so they fail**

In `tests/booking-href.test.ts`, give Julian his own number via a view built from `{...DEFAULT_CONTENT, barbers: DEFAULT_CONTENT.barbers.map(b => b.name === "Julian" ? {...b, whatsApp: "447700900123"} : b)}`. Then:
  - The existing message assertions stay, with `selection.barberId` set to the barber's id. They give the same strings as today, e.g. `"Hi, I'd like to book Cutting and Finishing (Ladies) with Julian."`.
  - `bookingHref` with Julian selected starts with `"https://wa.me/447700900123?text="`.
  - `bookingHref` with `barberId: null` starts with `"https://wa.me/447789096148?text="`, the default.
  - `bookingHref` with `selection: null` uses the default.
  - `bookingHref` with `barberId: "missing-id"` uses the default, and the message says `"Any barber is fine."` for a barber category.

In `tests/contact.test.ts`:
  - `whatsappLink("447789096148")` is `"https://wa.me/447789096148"`.
  - The encoded-message assertions are updated to pass the number.
  - Remove the `WHATSAPP_NUMBER` assertions.

In `tests/booking-picker.test.ts`, replace `barber:` with `barberId:` in the fixtures.
- [ ] **Step 2: Run the tests to see them fail.** Run: `npx vitest run tests/booking-href.test.ts tests/contact.test.ts tests/booking-picker.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - PriceTable's barber rows call `onPick({ barberId: row.barberId ?? null, … })`.
  - NamePicker uses `barber.id`, for both the pick and the React `key`.
  - ServiceDialogContent and ServiceCard pass `defaultWhatsApp: view.site.whatsappNumber`.
- [ ] **Step 4: Verify.** Run: `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: route WhatsApp bookings to the chosen barber's number`.

### Task 5: Supabase schema, seed and cached published content

**Files:**
- Create:
  - `supabase/` (`supabase init` in `website/`)
  - `supabase/migrations/<ts>_site_content.sql` (via `supabase migration new site_content`)
  - `scripts/seed-content.ts`
  - `lib/supabase/public.ts`
  - `lib/content/published.ts`
- Modify:
  - `package.json`: add `@supabase/supabase-js` and `@supabase/ssr`, add dev dependency `tsx`, and add the script `"seed:content": "tsx --env-file=.env.local scripts/seed-content.ts"`
  - `.env.example`
  - `next.config.ts`
  - `app/(site)/page.tsx` and `app/(site)/layout.tsx`
  - `app/robots.ts`
- Test: `tests/published.test.ts` (parsing and fallback logic only).

**Interfaces:**
- Consumes: `parseSiteContent`, `DEFAULT_CONTENT` and `buildSiteView`.
- Produces:
  - **SQL tables:**
    - `public.admins(user_id uuid primary key references auth.users on delete cascade)`
    - `public.site_content(id text primary key check (id in ('draft','published')), content jsonb not null, updated_at timestamptz not null default now())`
    - `public.content_versions(id bigint generated always as identity primary key, content jsonb not null, published_at timestamptz not null default now(), published_by uuid)`
  - **SQL functions:**
    - `public.is_admin() returns boolean`: `stable security definer`, `set search_path = ''`, checks `auth.uid()` against `admins`.
    - `public.publish_draft() returns timestamptz`: `security definer`. It raises `'not authorized'` unless `is_admin()`. In one statement block it copies draft to published, sets `updated_at`, and inserts into `content_versions` with `auth.uid()`.
    - `public.discard_draft() returns void`: same guard, copies published to draft.
    - Execute on both functions is revoked from `public` and `anon`, and granted to `authenticated`.
  - **RLS** (enabled on all three tables):
    - `site_content`: `select` for `anon, authenticated` where `id = 'published'`, and for admins on all rows. `update` only for admins where `id = 'draft'`. No insert or delete policies.
    - `content_versions`: select for admins only.
    - `admins`: select for admins only.
  - **Storage:**
    - Bucket `site-images`, `public = true`, `file_size_limit = 10MB`, `allowed_mime_types = {image/webp,image/jpeg,image/png}`, created in the migration with an `insert into storage.buckets`.
    - Policies on `storage.objects` for insert, update and delete: `bucket_id = 'site-images' and public.is_admin()`.
  - **Clients and data:**
    - `createPublicClient()` in `lib/supabase/public.ts`: `createClient(url, publishableKey, { auth: { persistSession: false } })`.
    - `getPublishedContent(): Promise<SiteContent>` in `lib/content/published.ts`. It is marked `"use cache"`, with `cacheLife("max")` and `cacheTag(CONTENT_TAG)`, where `CONTENT_TAG = "site-content"`. It selects `content` from `site_content` where `id = 'published'`, parses with `parseSiteContent`, and throws on a missing row or invalid content (no silent fallback).
    - `getSiteView(): Promise<SiteView>` builds the view with `process.env.NEXT_PUBLIC_SUPABASE_URL`.
    - `published.ts` imports `"server-only"`. Install it if it isn't present.
  - **Seed script:** `scripts/seed-content.ts` is idempotent. It:
    1. creates the admin user with `ADMIN_EMAIL` and `ADMIN_PASSWORD` via `auth.admin.createUser({ email_confirm: true })`, or finds the existing one
    2. upserts `admins`
    3. upserts the `draft` and `published` rows with `DEFAULT_CONTENT` **only if they don't exist**

    It uses `SUPABASE_SECRET_KEY` and prints what it did.
  - **next.config.ts:** `images.remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/**`)]` when the env var is set, and `images.dangerouslyAllowLocalIP: process.env.NODE_ENV === "development"`.
  - **The site:**
    - `app/(site)/page.tsx` becomes `async`, awaits `getSiteView()`, and renders `SitePage`.
    - `app/(site)/layout.tsx` uses `generateMetadata()` with `getSiteView()` for the description and `JsonLd` data.
    - `app/manifest.ts` keeps using `SITE_STATIC`.
  - **robots:** `app/robots.ts` disallows `/admin` and `/preview`.

- [ ] **Step 1:** Start the local stack.

  Run, in `website/`:
  ```bash
  supabase init
  supabase start
  ```
  Expected: the stack starts and prints the API URL and keys.

  Fill `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL=admin@ravesparlor.test` and a generated `ADMIN_PASSWORD`. Record the test credentials in `.env.local` only, never in chat. Update `.env.example` with the variable names and comments.
- [ ] **Step 2:** Configure Auth in `supabase/config.toml`:
  - `[auth] enable_signup = false`
  - `[auth.email] enable_confirmations = false` and `secure_password_change = false`
  - `[auth.email] enable_signup = false` (if present in this CLI version)
- [ ] **Step 3:** Run `supabase migration new site_content` and write the SQL above into the generated file.
- [ ] **Step 4:** Write `tests/published.test.ts` for the pure `parsePublishedRow(row: unknown): SiteContent` helper, exported from `published.ts` (move the parse step into it so it's testable):
  - It throws `"No published content"` for `null`.
  - It throws with the issue paths for invalid content.
  - It returns the content for `DEFAULT_CONTENT`.

  Run it and expect a FAIL.
- [ ] **Step 5:** Implement the clients, `published.ts`, the seed script, the config and the page and layout changes.
- [ ] **Step 6: Verify the database**

  Run:
  ```bash
  supabase db reset
  npm run seed:content
  npm run seed:content
  ```
  Expected: the second seed run reports that everything already exists.

  Then run these curls with the publishable key:
  - `curl "$URL/rest/v1/site_content?select=id" -H "apikey: $KEY"` returns only `[{"id":"published"}]`.
  - A `PATCH` on `site_content?id=eq.draft` with the anon key changes 0 rows. Confirm with `Prefer: return=representation`, which returns `[]`.
  - `curl -X POST "$URL/rest/v1/rpc/publish_draft" -H "apikey: $KEY"` returns an error (permission denied or not authorized).
- [ ] **Step 7: Verify the app.** Run `npm test`, then `npm run check`, then `npm run build` with the local stack running. Expected: everything passes and `/` is still prerendered.
- [ ] **Step 8: Commit** with `feat: store site content in Supabase and serve it cached`. Include `supabase/` but not `.env.local`. Check that `.gitignore` covers `supabase/.temp` and `supabase/.branches`, and add them if needed.

### Task 6: Auth, the admin shell and login

**Files:**
- Create:
  - `lib/supabase/server.ts` and `lib/supabase/browser.ts`
  - `lib/admin/auth.ts`
  - `proxy.ts`
  - `app/(admin)/layout.tsx` and `app/(admin)/admin.css`
  - `app/(admin)/admin/login/page.tsx`
  - `app/(admin)/admin/password/page.tsx`
  - `app/(admin)/admin/actions.ts` (auth actions now, draft actions in Task 7)
  - `components/admin/LoginForm.tsx` + css and `components/admin/PasswordForm.tsx` + css
  - `lib/fonts.ts` (the Jost font, now shared by both root layouts)
- Test: `tests/admin-auth.test.ts` (pure redirect logic).

**Interfaces:**
- Produces:
  - **Clients:**
    - `createServerSupabase(): Promise<SupabaseClient>`, via `@supabase/ssr` `createServerClient` with the `next/headers` cookies `getAll` and `setAll`. `setAll` is wrapped in try/catch so it works from Server Components.
    - `createBrowserSupabase(): SupabaseClient`, a singleton.
  - **`requireAdmin(): Promise<{ userId: string; email: string }>`.** It calls `getUser()`. With no user it does `redirect("/admin/login")`. If `rpc("is_admin")` is false, it signs out and redirects to `/admin/login?error=not-admin`.
  - **`proxyDecision(pathname: string, hasUser: boolean): "next" | "login" | "admin"`.** It is pure and exported from `lib/admin/auth.ts`:
    - `/admin/login` with a user gives `"admin"`.
    - Other `/admin*` paths and `/preview` without a user give `"login"`.
    - Everything else gives `"next"`.
  - **`proxy.ts`:**
    - It refreshes the Supabase session cookies (the standard `@supabase/ssr` proxy pattern, using `getUser()`) and applies `proxyDecision`.
    - `config.matcher` is `["/admin/:path*", "/preview"]`.
  - **Server actions** (`'use server'`; every action re-checks auth itself):
    - `signIn(prev: AuthState, formData: FormData): Promise<AuthState>`. On success it redirects to `/admin`. On failure it returns `{ error: "Wrong email or password." }`.
    - `signOut(): Promise<void>` redirects to `/admin/login`.
    - `changePassword(prev: AuthState, formData: FormData): Promise<AuthState>`. It re-verifies the current password with `signInWithPassword`, requires a new password of at least 10 characters that is different from the current one, then calls `updateUser({ password })`. It returns `{ ok: true }` or `{ error }`.
    - `AuthState = { error?: string; ok?: boolean }`.
  - **`app/(admin)/layout.tsx`:**
    - A root layout with `<html lang="en">`, the Jost variable and `admin.css`.
    - It imports `app/styles/tokens.css` for the shared colours, type and spacing, but not the deck or slide CSS.
    - `metadata.robots = { index: false, follow: false }`.
  - **The login page:**
    - Split layout. On the left, the published `heroLeft` image (via `getSiteView()`; cached, no cookies). On the right, `LoginForm`: email, password and a "Sign in" button with a `pending` state from `useActionState`, and an error line.
    - Below 820px it stacks with the image on top, at reduced height.
    - There is no forgot-password link.
  - **The password page:** it calls `requireAdmin()` inside `<Suspense>` and renders `PasswordForm` with current, new and confirm fields.

- [ ] **Step 1:** Write `tests/admin-auth.test.ts` for `proxyDecision`, using a table of `[pathname, hasUser, expected]`:
  - `["/admin", false, "login"]`
  - `["/admin/login", false, "next"]`
  - `["/admin/login", true, "admin"]`
  - `["/admin/password", false, "login"]`
  - `["/preview", false, "login"]`
  - `["/preview", true, "next"]`
  - `["/", false, "next"]`

  Run it and expect a FAIL.
- [ ] **Step 2:** Implement, run `npx vitest run tests/admin-auth.test.ts`, and expect a PASS.
- [ ] **Step 3: Verify.**
  - Run `npm run check` and `npm run build`. Both should pass.
  - With the local stack running and a production build serving: `curl -sI http://localhost:3000/admin` should give a 307 with a `location` header containing `/admin/login`.
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login` should give `200`.
- [ ] **Step 4: Commit** with `feat: add admin auth, login and password change`.

### Task 7: The draft core (save, publish, discard, changes and warnings)

**Files:**
- Create:
  - `lib/admin/draft-ops.ts`, `lib/admin/changes.ts` and `lib/admin/warnings.ts`
  - `components/admin/AdminApp.tsx` + css
  - `components/admin/DraftBar.tsx` + css
  - `components/admin/use-draft-editor.ts`
  - `components/admin/ConfirmDialog.tsx` + css
  - `app/(admin)/admin/page.tsx`
- Modify: `app/(admin)/admin/actions.ts`
- Test: `tests/admin-draft-ops.test.ts`, `tests/admin-changes.test.ts` and `tests/admin-warnings.test.ts`.

**Interfaces:**
- Consumes: `SiteContent`, `parseSiteContent`, `normalizePrice`, `normalizeWhatsApp`, `requireAdmin`, `createServerSupabase` and `CONTENT_TAG`.
- Produces:
  - **Pure draft operations** in `draft-ops.ts`. Each returns a new `SiteContent` and never mutates its input:
    - `addBarber(c, barber: Omit<Barber,"id">, id: string)`
    - `removeBarber(c, id)`
    - `moveBarber(c, id, toIndex)`
    - `updateBarber(c, id, patch: Partial<Omit<Barber,"id">>)`
    - `setItemContent(c, category, itemKey, patch: Partial<ItemContent>)`
    - `setIntro(c, category, index: 0|1, text)`
    - `setHours(c, hours: OpeningHours[])`
    - `setDefaultWhatsApp(c, digits)`
    - `setChemicalNote(c, text)`
    - `setImage(c, slot, ref: ImageRef)`
    - `setImageAlt(c, slot, alt)`
  - **`summarizeChanges(published: SiteContent, draft: SiteContent): string[]`.** It returns human lines in this order: barbers, prices, copy, hours, number, images. Examples:
    - `"Added barber Mia"`
    - `"Removed barber John"`
    - `"Reordered barbers"`
    - `"Rave: Gentleman £55 → £60"`
    - `"Full Head Colour: prices changed"`
    - `"Cut & Style: intro text changed"`
    - `"Opening hours changed"`
    - `"Default WhatsApp number changed"`
    - `"Photo replaced: heroLeft"`
    - `"Alt text changed: priceList"`

    Identical inputs give `[]`.
  - **`contentWarnings(published, draft): ContentWarning[]`**, where `ContentWarning = { kind: "poster" | "staleBarberName"; message: string }`:
    - **`poster`:** any price (barber `cutPrices`, item `prices` or `range`) differs from published *and* `images.priceList.path` is unchanged. Message: `"Prices changed. Remember to upload an updated price poster."`
    - **`staleBarberName`:** for each barber name that is in published but not in draft (compared by name, case-insensitive), check every copy field (intros, desc, ideal, note, chemical note) for a whole-word match. Each hit gives one warning per field, naming the barber and the service.
  - **Server actions,** each calling `requireAdmin()` first and returning `ActionResult = { ok: true } | { ok: false; error: string }`:
    - `loadDraft(): Promise<{ draft: SiteContent; published: SiteContent }>`
    - `saveDraft(content: SiteContent): Promise<ActionResult>`. It validates with `parseSiteContent`, and on invalid content returns `{ ok:false, error: issues.join("; ") }`. It updates the `draft` row and sets `updated_at`.
    - `publishDraft(content: SiteContent): Promise<ActionResult & { publishedAt?: string }>`. It saves first, then calls `rpc("publish_draft")`, then `updateTag(CONTENT_TAG)`.
    - `discardDraft(): Promise<ActionResult & { content?: SiteContent }>`. It calls `rpc("discard_draft")` and returns the new draft.
  - **`useDraftEditor(initial: { draft: SiteContent; published: SiteContent })`.** It returns:
    - `{ draft, saved, published, dirty: boolean, changeCount: number, status: "idle"|"saving"|"publishing"|"error", error: string | null, warnings: ContentWarning[], apply(op: (c: SiteContent) => SiteContent): void, save(), publish(), discard() }`
    - `changeCount` is `summarizeChanges(saved, draft).length`.
    - A failed save keeps `draft` untouched and sets `error`.
    - It registers a `beforeunload` warning while `dirty`.
  - **DraftBar:**
    - It is sticky (bottom on phones, top on ≥820px) and shows a Form/Visual mode toggle, Save (disabled when not dirty), Publish, Discard, a status text and a menu with "Change password" and "Sign out".
    - The status text is "Unsaved changes (n)", "Draft differs from live" or "Up to date".
    - Publish opens `ConfirmDialog` listing `summarizeChanges(published, draft)` and the warnings. Discard confirms with `"Throw away all draft changes and go back to what's live?"`.
  - **`app/(admin)/admin/page.tsx`:** it renders `<Suspense fallback={…}><AdminLoader /></Suspense>`. `AdminLoader` calls `requireAdmin()` and `loadDraft()`, then renders `<AdminApp initial={…} />`.
  - **`AdminApp`:** it holds `mode: "form" | "visual"`, defaulting to `"form"` and remembered in `localStorage` with try/catch. Form and visual bodies come in Tasks 8 and 9, so render placeholders for now.

- [ ] **Step 1: Write the failing tests**
  - `admin-draft-ops`:
    - `removeBarber` drops only that id.
    - `moveBarber(c, idJulian, 0)` puts Julian first.
    - `addBarber` appends with the given id.
    - All ops leave the input deep-equal to a `structuredClone` taken before.
    - `setItemContent(c,"colour","roots",{prices:["£85","–","–"]})` changes only that item.
  - `admin-changes`: one assertion per example line above, plus `[]` for identical inputs.
  - `admin-warnings`:
    - Changing Rave's Gentleman price gives exactly one `poster` warning.
    - The same change plus a new `priceList.path` gives no poster warning.
    - Removing John gives `staleBarberName` warnings for `cut` intro[1], `cutting` desc, `cleansing` note and `updo` note, because each mentions "John".
    - Removing nobody gives none.
    - A removed barber named "Al" does not match the word "Also" (whole-word matching).
  - `useDraftEditor` failed-save behaviour (Review Focus 4): extract the reducer as `draftEditorReducer(state, action)` in `use-draft-editor.ts` and test it. A `saveFailed` action keeps `draft` and sets `error`, and a `saved` action sets `saved = draft`.
- [ ] **Step 2: Run the tests to see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.**
  - Run `npm run check` and `npm run build`. Both should pass.
  - Then a manual DB check with the local stack: sign in with the seeded user via `supabase.auth.signInWithPassword` in a throwaway `tsx` snippet (not committed), call `rpc("publish_draft")`, and confirm that a row was added to `content_versions` (`supabase db` query or Studio).
- [ ] **Step 5: Commit** with `feat: add admin draft editing core with save, publish and discard`.

### Task 8: Form mode editors and image uploads

**Files:**
- Create:
  - `lib/admin/targets.ts`
  - `lib/admin/image-resize.ts`
  - `lib/admin/orphans.ts`
  - `components/admin/FormMode.tsx` + css
  - `components/admin/editors/` (one component + css each): `BarbersEditor`, `BarberEditor`, `ServiceItemEditor`, `CategoryIntroEditor`, `HoursEditor`, `BusinessEditor`, `ChemicalNoteEditor`, `ImageSlotEditor`, `EditorFor`, plus shared field components (`TextField`, `TextArea`, `PriceField`, `PhoneField`)
- Modify: `app/(admin)/admin/actions.ts` (orphan cleanup in publish and discard).
- Test: `tests/admin-targets.test.ts`, `tests/admin-image-resize.test.ts` and `tests/admin-orphans.test.ts`.

**Interfaces:**
- Consumes: Task 7's `apply` and the draft ops, `MENU_STRUCTURE`, `IMAGE_SLOTS`, the normalizers, and `createBrowserSupabase`.
- Produces:
  - **`EditTarget`:**
    ```ts
    type EditTarget =
      | { kind: "barbers" }
      | { kind: "barber"; id: string }
      | { kind: "item"; category: CategoryKey; item: string }
      | { kind: "intro"; category: CategoryKey }
      | { kind: "hours" }
      | { kind: "business" }
      | { kind: "chemicalNote" }
      | { kind: "image"; slot: ImageSlot };
    ```
  - **Target helpers:**
    - `targetKey(t: EditTarget): string`, e.g. `"item:colour.roots"`, `"image:heroLeft"`, `"barber:<id>"`.
    - `parseTargetKey(key: string): EditTarget | null`. It rejects an unknown kind, category, item or slot.
    - `targetLabel(t, content): string`, a human title for the editor header.
  - **`EditorFor({ target, draft, apply })`.** It renders the right editor. Form mode and visual mode both use it.
  - **Field rules:**
    - `PriceField` and `PhoneField` normalize on blur. If the value can't be normalized they show an inline error and keep the raw text local, without writing it to the draft.
    - `ServiceItemEditor` shows the price inputs for the item's `kind`:
      - `barberTable`: a read-only note, "Prices are set per barber", and a link that opens the barbers editor.
      - `table`: one input per col.
      - `range`: one input.
    - It also shows desc, ideal and its own note. For `chemicalNote` items it shows the shared chemical note with the hint "Shared by 9 services".
    - The item name is read-only.
  - **`BarbersEditor`:** a list with drag handles and up/down buttons (both work on touch), Add and Remove. Remove confirms first. Add opens an inline form, and the new barber is only applied once name, days, WhatsApp and all 3 cut prices are valid. New ids come from `crypto.randomUUID()`.
  - **`HoursEditor`:** edits each entry's days label, short label, `dayOfWeek` checkboxes, open, close and last appointment (`<input type="time">`).
  - **`ImageSlotEditor`:** it shows the current image, a "Replace photo" file input (`accept="image/jpeg,image/png,image/webp"`) and alt text. On file select it calls `resizeImage(file)`, uploads to `site-images` at `${slot}/${crypto.randomUUID()}.webp` with `contentType: "image/webp"`, then `apply(c => setImage(c, slot, { path, alt: current alt, width, height }))`. Errors show inline, e.g. `"Couldn't read that photo. Try a JPEG or PNG."`
  - **`fitWithin(width, height, maxEdge = 2400): { width: number; height: number }`.** It is pure: it scales down proportionally and rounds, and never upscales.
  - **`resizeImage(file: File, maxEdge = 2400, quality = 0.85): Promise<{ blob: Blob; width: number; height: number }>`.** It is browser-only: `createImageBitmap` plus an `OffscreenCanvas` or canvas, encoding to `image/webp`.
  - **`findOrphans(storagePaths: string[], referenced: SiteContent[]): string[]`.** It is pure. It returns the storage paths not referenced by any content's `images[*].path`, ignoring referenced paths that start with `/`.
  - **`cleanupOrphans()`** runs in `actions.ts` after publish and discard succeed. It lists all objects in `site-images` (recursively per slot folder), loads draft, published and the last 10 `content_versions`, and removes `findOrphans(...)`. Cleanup errors are logged and do not fail the publish.
  - **`FormMode`:** sections in this order: Barbers, Services and prices (per category: intro, then items), Opening hours, Business, Images (grouped: Slides, Services overview, Service photos, Service dialog photos, Price poster). The layout is a single column under 820px, with a two-column grid of section cards on desktop.

- [ ] **Step 1: Write the failing tests**
  - `admin-targets`:
    - Every target round-trips through `targetKey` and `parseTargetKey`.
    - `parseTargetKey("item:colour.nope")`, `parseTargetKey("image:nope")` and `parseTargetKey("bogus")` all return `null`.
  - `admin-image-resize`:
    - `fitWithin(4800, 3200)` gives `{2400,1600}`.
    - `fitWithin(1000, 3000)` gives `{800,2400}`.
    - `fitWithin(800, 600)` gives `{800,600}`.
  - `admin-orphans` (Review Focus 5):
    - With storage `["heroLeft/a.webp","heroLeft/b.webp","parlor/c.webp"]`, draft referencing `a`, and a version referencing `c`, the result is `["heroLeft/b.webp"]`.
    - Content whose images are all `/images/...` and an empty storage list gives `[]`.
- [ ] **Step 2: Run the tests to see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.** Run `npm run check` and `npm run build`. Both should pass.
- [ ] **Step 5: Commit** with `feat: add form-mode editors and image uploads`.

### Task 9: Visual mode (preview iframe and editable regions)

**Files:**
- Create:
  - `lib/admin/preview-protocol.ts`
  - `components/edit/edit-context.ts` and `components/edit/Editable.tsx` + `Editable.module.css`
  - `components/edit/EditOverlay.tsx` + css (the hover highlight)
  - `app/(preview)/layout.tsx` (the site root layout's html, body, font and `globals.css`, without JsonLd; `robots` noindex)
  - `app/(preview)/preview/page.tsx`
  - `components/admin/PreviewClient.tsx`
  - `components/admin/VisualMode.tsx` + css
  - `components/admin/EditorSheet.tsx` + css
- Modify: the site components, to wrap their editable regions in `Editable` (list below).
- Test: `tests/admin-preview-protocol.test.ts`.

**Interfaces:**
- Consumes: `SitePage`, `buildSiteView`, `EditTarget`, `targetKey`, `parseTargetKey`, `EditorFor`, `parseSiteContent` and `requireAdmin`.
- Produces:
  - **Message types:**
    ```ts
    type ToPreview = { type: "draft"; content: SiteContent };
    type FromPreview = { type: "ready" } | { type: "edit"; target: string /* targetKey */ };
    ```
  - **`parseToPreview(data: unknown): ToPreview | null`** validates with `parseSiteContent`. **`parseFromPreview(data: unknown): FromPreview | null`** validates the target with `parseTargetKey`.
  - **Origin checks:** both sides ignore messages where `event.origin !== window.location.origin`, or where parsing returns `null`.
  - **`EditContext`:** `{ onEdit(target: EditTarget): void } | null`. It is provided only by `PreviewClient`.
  - **`Editable({ target, children })`:**
    - It is `"use client"`.
    - With no context it returns `children` unchanged, so the public site's DOM is unchanged.
    - With context it renders `<span className={styles.editable} data-edit-target={targetKey(target)}>{children}</span>`, where `.editable { display: contents }`.
  - **`PreviewClient({ initial }: { initial: SiteContent })`:**
    - It renders `<EditContext value={…}><SitePage view={buildSiteView(content, url)} /><EditOverlay /></EditContext>`.
    - On mount it posts `{type:"ready"}` to `window.parent`.
    - On a valid `draft` message it replaces `content`.
    - A document click listener in the **capture** phase finds `closest("[data-edit-target]")`. When there is one, it calls `preventDefault` and `stopPropagation` and posts `{type:"edit", target}`. This beats the deck's bubble-phase hash-link handler.
  - **`EditOverlay`:** on `pointermove`, it draws a fixed outline box around the union of the hovered target's child `getBoundingClientRect()`s, with `pointer-events: none`, `data-tone-ignore` and a high z-index.
  - **`/preview` page:** `<Suspense><PreviewLoader/></Suspense>`. The loader calls `requireAdmin()` and `loadDraft()`, then renders `PreviewClient` with the *saved* draft, so the page also works standalone.
  - **`VisualMode({ draft, apply })`:**
    - It renders an `<iframe src="/preview" title="Site preview">` filling the area under the DraftBar.
    - It posts `{type:"draft", content: draft}` on `ready` and whenever `draft` changes.
    - On `edit` it opens `EditorSheet` with `EditorFor` for that target.
    - The sheet is a bottom sheet under 820px (max 70vh, scrollable, drag handle and close button) and a 420px right side panel on desktop, with the iframe shrinking beside it.
  - **Editable placements** (target in parentheses):
    - **Slides:**
      - HeroPair: left image (`image:heroLeft`), right image (`image:heroRight`)
      - SplitSlide: image (`image:split`)
      - ParlorSlide: image (`image:parlor`), hours summary (`hours`)
    - **Services:**
      - ServicesOverview: each card image (`image:overview.<cat>`)
      - MenuHead: intro (`intro:<cat>`)
      - ServiceMedia (`image:media.<cat>`)
      - each ServiceCard (`item:<cat>.<key>`)
      - PriceTable barber row label (`barber:<id>`)
      - DialogMedia images (`image:dialog.<cat>.<n>`)
    - **Sections:**
      - PricePoster thumbnail (`image:priceList`)
      - BookVisit: hours block (`hours`), WhatsApp line (`business`)
      - SiteFooter: WhatsApp line (`business`)

    Clicking a ServiceCard in visual mode opens the item editor, not the dialog. Dialog images remain editable in form mode.

- [ ] **Step 1: Write the failing tests** (Review Focus 3) in `admin-preview-protocol`:
  - `parseToPreview({type:"draft", content: DEFAULT_CONTENT})` is non-null.
  - `parseToPreview({type:"draft", content: {}})` is `null`.
  - `parseToPreview("x")`, `parseToPreview(null)` and `parseToPreview({type:"other"})` are `null`.
  - `parseFromPreview({type:"edit", target:"image:heroLeft"})` is non-null, and `parseFromPreview({type:"edit", target:"image:../../x"})` is `null`.
  - Also export `acceptMessage(origin: string, expected: string, data: unknown, parse)`, which returns `null` when the origins differ, and test it.
- [ ] **Step 2: Run the tests to see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.**
  - Run `npm run check` and `npm run build`. Both should pass.
  - Check that the public page still has no `data-edit-target` attributes: with the build serving, `curl -s localhost:3000/ | grep -c data-edit-target` should print `0`.
  - `curl -sI localhost:3000/preview` without cookies should give a 307 to `/admin/login`.
- [ ] **Step 5: Commit** with `feat: add visual editing mode with live preview`.

### Task 10: Keep-alive, docs and deploy checklist

**Files:**
- Create: `netlify/functions/keep-alive.mts`
- Modify: `package.json` (dev dependency `@netlify/functions`), `README.md`, `.env.example`
- Create: `docs/admin-deploy.md`

**Interfaces:**
- Produces:
  - **`keep-alive.mts`:** a Netlify scheduled function, `export const config: Config = { schedule: "@daily" }`. The default export does `fetch(`${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_content?select=id&id=eq.published`, { headers: { apikey: PUBLISHABLE_KEY } })`, logs the status and returns `new Response(null, { status: 204 })`. It throws on a non-2xx status so Netlify logs a failure.
  - **`docs/admin-deploy.md`:** a checklist for going remote:
    1. Create the Supabase project.
    2. `supabase link`, then `supabase db push`.
    3. Set the auth settings (signups off, confirmations off, secure password change off) in the dashboard.
    4. Run `npm run seed:content` against remote env vars, with the real admin email.
    5. Set the Netlify env vars (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
    6. Deploy.
    7. **The spike check:** edit a price in `/admin`, Publish, and confirm the live page shows it within seconds. If it doesn't, the fallback is `revalidateTag(CONTENT_TAG, { expire: 0 })` in the publish action.
    8. Confirm that a Storage image renders through Netlify Image CDN.
    9. Confirm in Netlify that the scheduled function ran.
    10. How to reset the admin password from the dashboard.
    11. How to roll back by copying a `content_versions` row into `published` with SQL. Include the snippet.
  - **README:** a new "Admin and content" section covering local setup (`supabase start`, `.env.local`, `npm run seed:content`, the `/admin` URL), and the updated layout tree.

- [ ] **Step 1:** Implement the function and the docs.
- [ ] **Step 2: Verify.** Run `npm run check` and `npm run build`. Both should pass, and `tsc` should cover `netlify/functions/*.mts` (tsconfig already includes `**/*.mts`).
- [ ] **Step 3: Commit** with `chore: add Supabase keep-alive and admin deploy docs`.
