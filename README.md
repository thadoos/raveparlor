# Rave's Parlor

Website for Rave's Parlor London, a hair salon in New Malden.

## Layout

```
.
├── .gitignore
├── .claude/launch.json   # dev server config for the Claude preview pane
└── website/              # Next.js app (App Router, TypeScript)
    ├── app/              # layout, page, global styles
    ├── components/       # layout/, deck/, slides/, services/, sections/, ui/
    ├── lib/              # data/, deck/ (paging), booking/ (picker), hooks/, contact
    └── public/images/    # photography
```

## Develop

```bash
cd website
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run format`.
