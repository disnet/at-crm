# at-crm

A single-user "Personal CRM" prototype. Every person is a conversation — the app treats relationships as ongoing chat threads across sources (Bluesky, email, Telegram, Signal, personal notes) rather than records in a dashboard.

Built as a Svelte 5 SPA with an in-memory dataset. No backend, no team features.

## Layout

- `src/`, `static/`, and the Node/Svelte config files live at the repo root
- `design-sketch/` — PDF/Sketch source for the visual direction
- `.impeccable.md` — design brief (brand voice, palette, principles)

## Running

```sh
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
npm run check    # svelte-check (the only correctness gate)
```

## Cloudflare Pages Deploy

The repo includes a GitHub Actions workflow at `.github/workflows/deploy-cloudflare-pages.yml`.

Create two GitHub Environments first:

- `production`
- `preview`

Set these in the appropriate environment before enabling the workflow:

- Secret `CLOUDFLARE_API_TOKEN`
- Secret `CLOUDFLARE_ACCOUNT_ID`
- Variable `CLOUDFLARE_PAGES_PROJECT_NAME`

The workflow builds the app with `npm run build` and deploys the generated `build/` directory to Cloudflare Pages:

- `main` pushes and manual runs use the `production` environment
- pull requests use the `preview` environment

The GitHub Environment URL is populated from the Cloudflare deployment returned by Wrangler.

## Stack

- Svelte 5 (runes mode, enforced globally)
- SvelteKit + Vite
- Dexie (IndexedDB) for local persistence
- Hand-rolled CSS with OKLCH tokens — no Tailwind, no UI kit
- `Young Serif` + `Hanken Grotesk` typography, `@lucide/svelte` icons
