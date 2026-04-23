# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `app/` — the SvelteKit project. **All commands below run from `app/`.**
- `design-sketch/` — original PDF/Sketch source for the visual direction (reference only).
- `.impeccable.md` — design brief at the repo root. Treat it as load-bearing: brand voice, palette intent, and design principles live here, not in code comments. Read it before any UI change.

## Commands

Package manager is **npm**. Lockfile is `package-lock.json`. `.npmrc` sets `ignore-scripts=true`, so install-time scripts from dependencies are blocked; none of the current deps need them. If a new dep ever requires an install script, add `@lavamoat/allow-scripts` with an explicit allowlist rather than removing `ignore-scripts`.

```sh
cd app
npm install
npm run dev          # vite dev server
npm run build        # production build
npm run preview      # preview the production build
npm run check        # svelte-kit sync + svelte-check (type + Svelte diagnostics)
npm run check:watch  # same, in watch mode
```

There is no test runner, no linter, and no formatter configured. `npm run check` is the only correctness gate.

## Architecture

This is a **single-user "Personal CRM" prototype**, not a sales/team tool. There is no backend — the entire app is a Svelte 5 SPA driven by an in-memory dataset.

- **Data source**: `src/lib/data.ts` exports `CONTACTS`, a hand-authored array of `Contact` objects. Each contact carries per-source conversation threads (`bluesky | email | telegram | signal | notes`) where each entry is either a `Message` (with `dir: 'in' | 'out'`) or a `NoteEntry` (with a `type` discriminator). Use the `isMessage` / `isNote` type guards rather than checking shape inline.
- **Persistence**: only the active contact id is persisted, in `localStorage` under `crm_activeId`. Don't introduce other persistence without discussing.
- **Routing**: a single page, `src/routes/+page.svelte`. It owns the top-level state (`activeId`, `screen`, overlay flags) and composes the three-pane Discord-structured layout: `Sidebar` | (`ThreadView` + `ContextPanel`) or `ProfileView`. Three modal overlays — `SearchOverlay` (Cmd/Ctrl+K), `RemindersPanel`, `QuickCapture` — are mounted from the same page.
- **Components** live in `src/lib/components/` and import data types via the `$lib` alias. `ThreadView` segments a contact's history by source: an `index` view that mixes everything, plus per-source views switched via `SourcePill`s.

### Svelte 5 / runes

`svelte.config.js` **forces runes mode** for all non-`node_modules` files. Always use `$state`, `$derived`, `$derived.by`, `$effect`, `$props` — never `let`-as-reactive, `$:`, or stores-as-default. Component props use the `let { ... }: Props = $props()` pattern.

### Styling and design tokens

All visual styling is hand-rolled CSS (no Tailwind, no UI kit). The complete token system lives at the top of `src/app.css` as CSS custom properties:

- **Colors are OKLCH**, all warm-tinted (~55–70° hue). There is no dark mode and no pure black/white/cool gray — the design brief explicitly forbids them.
- **Typography**: `Young Serif` (display) and `Hanken Grotesk` (body), loaded from Google Fonts in `src/app.html`. Don't reach for Inter/DM Sans/system defaults.
- **Icons**: `@lucide/svelte` for all UI chrome. Emoji is reserved for user-generated content (messages, notes typed by a person) — never use it in chrome.
- Source-color tokens (`--src-bluesky`, `--src-email`, etc.) are the *only* loud colors. Treat them as punctuation against the warm-paper neutrals.

Per-component styles use scoped `<style>` blocks and reference the tokens — don't hard-code colors, spacing, radii, or shadows. The token scale (`--sp-*`, `--r-*`, `--fs-*`, `--elev-*`, `--dur-*`, `--ease-*`) is the contract.

### Design principles to honor

From `.impeccable.md`: chat is the surface (every person is a conversation, never lead with a dashboard); warmth over sterility; color is earned (60/30/10 neutral/secondary/accent); typography carries the voice; specific over generic. When a UI choice is in tension with these, the brief wins.
