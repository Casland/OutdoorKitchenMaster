# How to update the site's content

The markdown files are the source of truth. The site never stores its own copy of the guide — every `npm run dev` or `npm run build` re-reads `docs/*.md`, `diagrams/*.svg`, and `content/*.json` and regenerates everything. Edit the source, rebuild, done.

## The 30-second version

| You want to… | Edit… | Then |
|---|---|---|
| Change guide text, steps, specs, tables | `docs/build-guide.md` | rebuild |
| Add/update a decision | `docs/decisions.md` | rebuild |
| Update project context / status | `docs/project-context.md` | rebuild |
| Add or revise a diagram | `diagrams/*.svg` | rebuild |
| Resolve an ⚠️ open decision | guide text **and** `content/overlay.json` | rebuild |
| Fix a buy-list line (spec/qty/fitting) | `content/shopping.json` | rebuild |
| Add/replace a technique video | `content/tutorials.json` | rebuild |
| Add a journal entry | `content/journal.json` | rebuild |
| Add a manual flagged-for-review note | `content/overlay.json` → `flags` | rebuild |

Rebuild = `npm run build` (output: `dist/index.html`, one self-contained file you can host anywhere or open by double-clicking). During `npm run dev`, saving any of these files re-ingests automatically and reloads the page.

## What the pipeline understands in build-guide.md

- `# Phase N — Title` starts a phase page (N can be −1; both the real minus sign and a plain hyphen work).
- `### Step N.N — Title` starts a step section; other `###` headings ("Steps", "Materials", "Rules"…) become plain sections. Headings starting with **Materials** or **Buying specs** render as the phase's materials callout and feed the shop-by-phase view.
- Every top-level item of a numbered or bulleted list inside a phase becomes a **checkbox**. Nested sub-bullets stay attached to their parent item (one checkbox, details below it).
- A paragraph starting `**Check before moving on:**` becomes a **gate** — the visually distinct, checkable "don't proceed yet" block.
- `![caption](diagram-XX-name.svg)` embeds that diagram inline, click-to-enlarge. The file must exist in `diagrams/` — the build fails loudly if it doesn't.
- The `Master Materials List`, `Tools`, `Visual Reference Library`, `Reference Links`, and `⚠️ Remaining Open Decisions` H1 sections feed the materials page, reference page, and the dashboard tracker.
- Anything the parser doesn't specially recognize renders verbatim as prose — nothing is ever dropped. A structural surprise fails the build with an error rather than silently skipping content.

One writing note: a single `~` reads as "approximately" here (the site disables markdown strikethrough so `~$10` and `~30%` render literally).

## Checkbox progress and content edits

Each checkbox's identity is a hash of its own text. Consequences:

- Reordering steps, inserting new items, or editing *other* items never disturbs a checkbox you've already ticked.
- **Editing an item's own text resets that one checkbox.** That's deliberate — the content changed, so re-verify the work. Nothing is deleted: the old mark moves to an "orphaned" bucket that rides along in exports (the dashboard's Progress data card shows a count).
- Progress lives in the browser's localStorage. **Export before switching phones/browsers** (dashboard → Progress data → Export); import merges, latest mark wins.

## content/overlay.json — the structured layer

Everything the markdown can't express on its own:

- **`decisionPhases`** — which phases each decision (D01–D25) affects. Powers the "Decisions behind this phase" chips and the phase links on the decision log. New decision in decisions.md → add a row here.
- **`openDecisions`** — the dashboard's ⚠️ tracker. `deadlinePhase` + `deadlineStep` locate the deadline (the build resolves the step link automatically). **When you decide one:** set `"status": "decided"`, write the outcome in `"resolution"`, and update the guide text itself. The build warns if the guide's open-decision count and this list disagree — that's your reminder to do both halves.
- **`flags`** — manual flagged-for-review notes: `{ "id": "F1", "severity": "review", "summary": "...", "details": "...", "locations": [], "status": "open" }`. Set `"status": "resolved"` to clear one. Automatic flags (cost-rollup mismatches, dimension probes, model cross-checks) are regenerated on every build and can only be cleared by fixing the source docs.
- **`materialsPhaseMap`** — master-list row label → phase number(s). Drives per-phase shopping lists. The build warns about unmapped rows and stale labels; row labels must match the first column of the master materials tables exactly.

## content/shopping.json — the detailed buy lists

Feeds the pre-flight screen on every phase page, the materials page's shop-by-phase view, and the printable shopping sheets. Each line is one cart-able thing: `item`, `spec` (exact size/length/type), `qty`, `unit`, `source`, `note`.

- `source` meanings: `guide` = stated verbatim in the docs (don't change it here — change the guide); `estimate` = derived during planning, sanity-check the quantity; `measure` = needs a site measurement first (the note says what to measure).
- The `assumptions` array at the bottom lists every derivation judgment call — it renders on the materials page under "Derivation assumptions." If you correct a line, prune its assumption.
- Buy check-offs persist like step checkboxes (and ride along in progress exports) but don't count toward phase completion %.

## content/tutorials.json — technique videos

Short technique videos attached to the steps that need them. Each entry: `technique`, `phase`, `step` (like `"1.1"`) **or** `section` (a section slug), `title`, `channel`, `videoId`, `note`. Leave step and section empty for a phase-general video (shows in pre-flight). The build validates placement and warns on a bad step/section. To find a section slug, check the station's URL anchor on the phase page. Videos load only when tapped (youtube-nocookie); offline they show as text; in print they appear as URLs.

## The ⌖ pin ("you are here")

One cursor for one build, stored in the browser (`okm.here.v1`). Expanding a station or advancing with Next moves it; the dashboard's Resume chip jumps back to it. It is not part of the progress export — after a browser switch, just tap your current station once.

## content/journal.json — the build journal

Append at the top (newest first):

```json
{ "date": "2026-07-18", "note": "Pavers up, three pipes in. The drain sweep fought back.", "photo": "pipes-day.jpg" }
```

Photos go in `content/journal/` and are inlined into the single-file build — keep them ≤500 KB each (the build warns above that; resize before adding, the file balloons otherwise).

## If you add the SketchUp export

Run `tools/MODEL_EXPORT_HOWTO.md`, drop `model-export.json` into `docs/`, rebuild. The build cross-checks key guide dimensions (stud length, counter depth) against components matching by name and raises a flag for anything more than 1/16" off — a model-vs-guide conflict is a finding, never a silent fix.

## Sanity check after big edits

`node scripts/smoke.mjs` drives the built site in a headless browser — dashboard counts, checklists, persistence, diagrams, search, print routes, and the safety-language fidelity checks. Run it after any structural rework of the guide.
