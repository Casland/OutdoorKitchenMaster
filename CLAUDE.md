# CLAUDE.md — Outdoor Kitchen Build Site

## What this project is

Build a **static website** that presents a DIY outdoor kitchen build guide in a digestible, navigable, on-site-usable form. The owner (a capable DIYer in San Diego) planned this kitchen over ~2 months of design sessions and has a complete, heavily-vetted build guide as one large markdown file. The site's job is to replace "scrolling a giant MD file" with something you can actually use standing next to a pile of steel studs with dusty hands.

**This is a content-presentation project, not a content-creation project.** The guide is finished and battle-tested. Your job is architecture, navigation, and presentation — never rewriting the substance.

## Source files (read in this order)

1. `docs/project-context.md` — site conditions, owner profile, design philosophy, how the design evolved, current status. Read this FIRST for orientation.
2. `docs/build-guide.md` — THE canonical build guide. Phases −1 through 8, materials, costs, tools, links. This is the source of truth for all dimensions, specs, and sequencing.
3. `docs/decisions.md` — the decision log: ~25 major decisions with the options considered and the reasoning. This powers a "why" layer the site should surface.
4. `diagrams/*.svg` — 8 technical diagrams, self-contained SVGs, already referenced from the guide by relative filename. Embed them inline at their referenced locations AND make them viewable full-size.
5. **If present** (owner may add these after running `tools/MODEL_EXPORT_HOWTO.md`): `docs/model-export.json` (every SketchUp component with true dimensions, tags, descriptions, positions — machine truth), `docs/model-cutlist.csv`, `docs/model-views/*.png` (labeled scene renders), `docs/model-3d/` (COLLADA/glTF geometry).

## Hard rules — content fidelity

- **Never alter a dimension, fastener spec, product name, or price.** These were verified across many sessions (e.g., stud length 32-13/16" is derived from 34" minus 3cm granite; the grill cutouts are manufacturer specs). If you think you've found an inconsistency between files, surface it in a visible "flagged for review" note — do not silently fix it.
- **Preserve the ⚠️ open decisions** (grill size 30" vs 36" + LP vs NG, backsplash tile choice, door hinge type, sewer/gas tie-in timing). These are deliberate, each with a deadline tied to a build phase. The site should make them prominent, not bury them.
- **Preserve the safety-critical language verbatim or near-verbatim**: "the manual is law" (Coyote install manual governs cutout/venting/clearances), circuits off + verified dead before conduit work, propane leak-test with soapy water, GFCI everything, sill-seal isolation between PT and steel, cold-galv on every cut edge.
- The build guide's phase ORDER is deliberate and corrects the owner's original ordering (plumbing before everything; electrical rough-in during framing, not after cladding). Don't re-sequence.

## What the site should be

Owner's core need: **read-through comprehension before the build, checklist execution during it.**

Recommended information architecture (adapt as you see fit):
- **Overview / dashboard**: the at-a-glance locked-decisions table, the build-order pipeline, total cost summary, and an "open decisions" tracker with deadlines.
- **Phase pages** (one per phase, −1 through 8): steps as interactive checklists, embedded diagrams where the guide references them, phase-specific materials/tools callouts, "before you move on" gates styled distinctly.
- **Decision log**: browsable/filterable; each decision shows options considered, what won, and why. Link decisions to the phases they affect.
- **Materials & cost**: the master list, filterable by phase, with the cost rollup. A per-phase shopping-list view is high value (owner shops per phase).
- **Reference library**: the manufacturer PDF links and diagram gallery.

## Functional requirements

- **Static site** — no backend, no accounts. Must run from a simple dev server and build to plain files. Plain HTML/CSS/JS, Vite + vanilla, or a lightweight static framework — your call; bias toward fewer moving parts and easy long-term rebuilds.
- **Checklist progress persists in localStorage** (per-step checkboxes, phase completion %). Include an export/import of progress as JSON so it survives browser changes.
- **Mobile-first for the phase pages** — this gets used at the build site on a phone. Big tap targets (gloved hands), readable in sunlight (high contrast), collapsible sections.
- **Print styles** for phase pages and shopping lists — the owner keeps a build binder.
- **Diagrams**: inline at guide positions, click-to-enlarge. They're SVGs with text — keep them crisp, don't rasterize.
- **Search or at minimum a good per-page TOC.** The guide is dense; findability is the whole point of this project.
- **If `docs/model-export.json` exists:** cross-validate the guide's key dimensions against the model (stud length 32-13/16", grill cutout width, counter depth 31", footprint legs) and surface every mismatch in the "flagged for review" mechanism — model vs guide conflicts are findings, never silent fixes. Use component tags to associate parts with phases; use description fields as annotations. If `docs/model-3d/` exists, an embedded three.js orbit viewer on the dashboard is a sanctioned stretch goal.

## Design direction

Match the kitchen's own palette (from the owner's renders): warm driftwood/sand neutrals, sea-glass sage and slate-blue accents, off-white surfaces, generous whitespace. Feel: clean contractor's field guide, not a marketing site. Typography over decoration. The 8 SVG diagrams use a consistent technical style (#2C2C2A text, muted fills) — the site should feel like they belong in it.

## Design ethos (decided July 2026)

The site's UI direction was settled via a design-funnel round: the phase pages are a **Step Runner** (pre-flight buy screen → stations → gates as arming confirm-stations, sticky top tracker, ⌖ resume pin). Before changing any surface, read `docs/design/design-ethos.md` (principles + tokens + avoid list) and `docs/design/design-iteration-phase-page.md` (what was tried and why the runner won). Don't re-litigate the direction; extend it.

## Voice

The guide is written in a specific voice: direct, encouraging, expert, reasons-first ("here's the principle, so you can apply it yourself"). Any UI copy you write (empty states, labels, tooltips) should match it. No exclamation marks, no dumbing down.

## Known open items the site should surface prominently

| Decision | Deadline |
|---|---|
| Grill: Coyote SL 30" vs 36", and LP vs NG | Before framing the grill bay (Phase 1, Step 1.6) |
| Backsplash tile (4 comps; Sea Glass Sage recommended) | Before counter templating (Phase 6) |
| Door hinges: clamp-on concealed (Euro opening preferred) vs piano | Phase 5, before tiling door faces |
| Sewer + gas tie-in timing / permit | No build deadline; jug + capped stubs bridge it |
