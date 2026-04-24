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
- Variable `PUBLIC_APP_ORIGIN` (production only — optional for `preview`)

The workflow builds the app with `npm run build` and deploys the adapter-cloudflare output (`.svelte-kit/cloudflare/`) to Cloudflare Pages:

- `main` pushes and manual runs use the `production` environment
- pull requests use the `preview` environment

`client-metadata.json` is served by a Pages Function. Its origin is resolved with this precedence:

1. `PUBLIC_APP_ORIGIN` — explicit override, e.g. when multiple hostnames are bound to the same deployment and you want metadata to pin to one of them.
2. The incoming request's origin — works for the project alias (`<project>.pages.dev`), per-deployment preview URLs, and any custom domain you bind, with no per-environment config.

In most cases leave `PUBLIC_APP_ORIGIN` unset and let the request origin win.

The GitHub Environment URL is populated from the Cloudflare deployment returned by Wrangler.

## Stack

- Svelte 5 (runes mode, enforced globally)
- SvelteKit + Vite
- Dexie (IndexedDB) for local persistence
- Hand-rolled CSS with OKLCH tokens — no Tailwind, no UI kit
- `Young Serif` + `Hanken Grotesk` typography, `@lucide/svelte` icons
