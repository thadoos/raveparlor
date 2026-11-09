# Rave's Parlor

Website for Rave's Parlor London, a hair salon in New Malden.

## Layout

```
.
├── .gitignore
├── .claude/launch.json   # dev server config for the Claude preview pane
├── docs/migration-plan.md
└── website/              # Next.js app (App Router, TypeScript)
    ├── app/              # layout (metadata, viewport, skip link, JSON-LD), page, robots, sitemap,
    │                     #   manifest, icons, global styles (styles/)
    ├── components/       # layout/, deck/, slides/, services/, sections/, seo/, ui/
    ├── lib/              # data/ (site, nav, images, services), deck/ (paging), booking/ (picker),
    │                     #   hooks/, contact, seo (JSON-LD)
    ├── tests/            # Vitest unit tests for the pure logic in lib/
    └── public/images/    # photography and the logo
```

## Develop

```bash
cd website
npm install
npm run dev
```

Scripts (run in `website/`):

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Dev server                                               |
| `npm run build`     | Production build                                         |
| `npm start`         | Serve the production build                               |
| `npm run lint`      | ESLint                                                   |
| `npm run typecheck` | `next typegen` (route types), then `tsc --noEmit`        |
| `npm test`          | Vitest unit tests                                        |
| `npm run check`     | `lint`, `typecheck` and `test` in a row (run before PRs) |
| `npm run format`    | Prettier                                                 |

Requires Node.js 20.9 or newer.

## Environment

`NEXT_PUBLIC_SITE_URL` is the canonical origin of the site (for example `https://ravesparlor.com`,
no trailing slash). It feeds `metadataBase`, the canonical and Open Graph URLs, `sitemap.xml`,
`robots.txt` and the JSON-LD. When unset it falls back to `https://$VERCEL_PROJECT_PRODUCTION_URL`
(set by Vercel) and then to `http://localhost:3000`. It is read at build time, so set it for
production builds. See `website/.env.example`.
