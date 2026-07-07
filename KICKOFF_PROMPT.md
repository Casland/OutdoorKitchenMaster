# Kickoff Prompt — paste this into Claude Code

---

I'm handing you a fully-planned DIY outdoor kitchen project that lives in this repo as documentation. Your job is to build me a static website that makes this plan digestible and usable — replacing "scroll a giant markdown file" with something I can study on my laptop before the build and use on my phone with dusty gloves during it.

Start by reading, in this order:
1. `CLAUDE.md` — your working rules and the site requirements
2. `docs/project-context.md` — what this project is, the site conditions, and how the design evolved
3. `docs/build-guide.md` — the canonical guide (phases −1 through 8, materials, costs, tools)
4. `docs/decisions.md` — 25 decisions with full reasoning
5. Glance at `diagrams/` — 8 self-contained technical SVGs already referenced from the guide by filename
6. Check whether `docs/model-export.json` / `docs/model-views/` / `docs/model-3d/` exist — those are exports from my SketchUp model (see `tools/MODEL_EXPORT_HOWTO.md`). If the JSON is there, treat it as machine truth for dimensions: cross-validate the guide against it and put any mismatches in the flagged-for-review list. If the 3D geometry is there, an embedded orbit viewer is a welcome stretch goal after the core site works.

Then build the site. Key expectations (full detail in CLAUDE.md):

- **Static, simple stack** — your call, but bias toward fewer moving parts. It should `npm run dev` and build to plain files I can host anywhere or open locally.
- **Dashboard** with the locked-decisions table, phase pipeline, cost summary, and a prominent open-decisions tracker (there are exactly 4, each with a deadline — they're marked ⚠️ throughout).
- **One page per phase** with steps as persistent checklists (localStorage + JSON export/import), diagrams embedded inline where the guide references them, per-phase materials, and visually distinct "check before moving on" gates.
- **Decision log page** — browsable, each entry linkable from the phases it affects. The reasoning is the point; don't summarize it away.
- **Materials/cost page** with per-phase shopping list views (I shop per phase).
- **Mobile-first phase pages** (big tap targets, high contrast for sunlight), **print styles** for phases and shopping lists.
- **Content fidelity is sacred**: never alter dimensions, specs, product names, sequencing, or safety language. If you find what looks like an inconsistency between documents, render it with a visible "flagged for review" note and list all flags on the dashboard — do not silently reconcile.

Design direction: coastal and calm — driftwood/sand neutrals with sea-glass sage and slate-blue accents, matching the kitchen itself. Clean field-guide energy, typography-forward, no stock-photo garnish. The SVG diagrams have a consistent technical style; the site should look like they were born in it.

Process I'd like: propose the information architecture and stack in a short plan first (a dozen lines, not a document), then build after I confirm. As you convert the guide into structured pages, keep the markdown source files as the source of truth — I will continue to update `docs/build-guide.md` as the build progresses, so a content pipeline that re-ingests the markdown beats hand-transcribed content. If full auto-ingestion is awkward for some sections (the diagrams' placement, the decision cross-links), a lightweight structured layer (JSON/frontmatter) referencing the markdown is fine — just document how I update content in a CONTENT.md.

One more thing: add a small "build journal" page — just a reverse-chronological list I can append entries to (date + note + optional photo), stored as a simple markdown or JSON file in the repo. Low tech is fine. When this build starts generating war stories, I want somewhere to put them.
