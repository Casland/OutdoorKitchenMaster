# Outdoor Kitchen — Build Site

A static field-guide site for the San Diego outdoor kitchen build. It turns `docs/build-guide.md` into a dashboard, ten phase pages with persistent checklists, a browsable decision log, per-phase shopping lists, a reference library, and a build journal — readable on a laptop before the build, usable on a phone with dusty gloves during it, printable for the binder.

## Run it

```
npm install
npm run dev        # local dev server; edits to docs/ re-ingest live
npm run build      # → dist/index.html
npm run deploy     # build + publish to GitHub Pages
```

**Live site:** https://casland.github.io/OutdoorKitchenMaster/ — served from the `gh-pages` branch. After editing content, run `npm run deploy` (and `git push` to keep the source on GitHub current). If you ever want push-to-deploy automation instead: run `gh auth refresh -s workflow` once in your own terminal, then ask for the Actions workflow to be restored (it was drafted but needs that scope to push).

`dist/index.html` is one self-contained file (~350 KB): host it anywhere, copy it to a phone, or just double-click it — it works offline from `file://`, no server needed.

## Where things live

| Path | What |
|---|---|
| `docs/*.md` | **The source of truth.** Guide, decisions, context. |
| `diagrams/*.svg` | The 8 technical diagrams, embedded inline + zoomable. |
| `content/overlay.json` | Decision↔phase links, ⚠️ open-decision tracker, manual flags, materials→phase map. |
| `content/shopping.json` | Detailed per-phase buy lists (exact specs/quantities, source-tagged). |
| `content/tutorials.json` | Verified technique videos mapped to steps. |
| `content/journal.json` | Build journal entries (+ photos in `content/journal/`). |
| `docs/design/` | Design ethos + iteration log from the design-funnel round. |
| `scripts/ingest.mjs` | Content pipeline: markdown → `src/data/content.json` on every dev/build. |
| `scripts/smoke.mjs` | Headless-browser test of the built site (`node scripts/smoke.mjs`). |
| `src/` | The app (Vite + vanilla JS, hash-routed single page). |

**How to update content → see [CONTENT.md](CONTENT.md).**

## Things worth knowing

- **Checklist progress** persists in the browser (localStorage). Export/import JSON from the dashboard's Progress data card when switching devices.
- **Flagged for review**: the build cross-checks the docs (cost rollups, key dimensions, open-decision counts, and `docs/model-export.json` if you add it) and surfaces disagreements on the dashboard. It never silently reconciles.
- **Print**: every phase page has "Print this phase" and "Shopping list" buttons; the footer links a whole-guide printout. Plain Ctrl+P works on any page too.
- **Search**: the magnifier in the header, or press `/`.
