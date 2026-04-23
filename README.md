# at-crm

A single-user "Personal CRM" prototype. Every person is a conversation — the app treats relationships as ongoing chat threads across sources (Bluesky, email, Telegram, Signal, personal notes) rather than records in a dashboard.

Built as a Svelte 5 SPA with an in-memory dataset. No backend, no team features.

## Layout

- `app/` — the SvelteKit project
- `design-sketch/` — PDF/Sketch source for the visual direction
- `.impeccable.md` — design brief (brand voice, palette, principles)

## Running

```sh
cd app
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
npm run check    # svelte-check (the only correctness gate)
```

## Stack

- Svelte 5 (runes mode, enforced globally)
- SvelteKit + Vite
- Dexie (IndexedDB) for local persistence
- Hand-rolled CSS with OKLCH tokens — no Tailwind, no UI kit
- `Young Serif` + `Hanken Grotesk` typography, `@lucide/svelte` icons
