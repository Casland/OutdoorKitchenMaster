# Round 1 research briefs (design funnel)

# Instructional Execution UI — Research Brief

## What each exemplar teaches

**iFixit repair guides.** The unit of comprehension is the step-card: number + one image + 1–4 short bullets, each bullet color-keyed to a matching marker on the photo. Metadata header (difficulty, time, tools, parts) sits before step 1; prerequisites are separate linked guides, so no guide repeats content. Shines: glanceable "am I looking at the right thing" verification; the image *is* the instruction, text is annotation. Fails: long procedures become 40 flat steps with no hierarchy or "you are here" arc; no state — close the tab, lose your place; commentary/warnings can visually blur into normal bullets.

**Aviation checklists (Degani & Wiener, NASA).** Core insight: a checklist is a *verification device*, not a teaching document — short, one action per line, restricted vocabulary, item order matched to physical flow around the cockpit, "killer items" never buried mid-list, explicit completion call ("gate closed"). Typography is a safety spec: sans-serif, large type, generous line spacing so the eye doesn't skip a line. Shines: execution under stress/fatigue; guarantees nothing critical is skipped. Fails: useless for learning *why*; long checklists get abandoned ("checklist creep"); a checklist with prose in it is neither list nor manual.

**Military TMs (MIL-STD-40051 work packages / S1000D).** Everything is a self-contained *work package*: task title, then an "Initial Setup" block (tools, materials, personnel, equipment conditions — e.g. "power off, verified") before step 1, then numbered steps, then follow-on tasks. WARNING / CAUTION / NOTE are rigidly distinguished, standardized in format and icon, and always placed *before* the step they modify — you read the hazard before your hands move. Shines: zero ambiguity about preconditions; safety language is unmissable and never restyled per author's whim. Fails: bureaucratic density; reads terribly as a continuous narrative; over-fragmentation makes big-picture comprehension hard.

**NYT Cooking / cook-mode UIs.** One step per screen (or strongly focused current step), huge type, swipe/tap-anywhere advancement, screen wake lock, and — the good ones — relevant ingredient quantities repeated *inline in the step* so you never toggle back to the ingredients list. Shines: hands-dirty, at-arm's-length execution. Fails: single-step tunneling destroys lookahead ("should the mortar be mixed already?"); NYT's own noted flaw is exactly the ingredients/steps toggle — context split across two views.

**Jobsite apps (Fieldwire/PlanGrid).** Won the field by being drawing-centric and offline-first: the plan is the home screen, tasks pin to locations on it, everything works with no signal and syncs later. Big list rows, minimal chrome, few taps to anything. Shines: field/office continuity; finding "what applies to where I'm standing." Fails: collaboration/PM machinery is dead weight for a solo builder; they assume the *document* (drawing) is primary and the procedure secondary — the opposite of a build guide.

**Manufacturer install manuals.** The strongest pattern: full-size cutout/clearance diagrams with dimensions on the drawing itself, and "the manual is law" specificity. The weakness: PDF pagination, no state, tiny text — precisely what this site exists to fix. Lesson: link out to the PDF for legal truth, restate the operative numbers in the step.

## Do / Don't brief for this project

**Structure**
- DO make two distinct modes per phase, not one compromise view: a **read-through mode** (prose, reasoning, inline diagrams — laptop, pre-build) and a **checklist mode** (terse, one action per line, big checkboxes — phone, during build). Aviation's core lesson: instruction documents and execution checklists are different artifacts; derive the second from the first.
- DO give every phase page a MIL-STD-style "Initial Setup" block before step 1: tools, materials, and *conditions* ("circuits off and verified dead") required for this phase. Checkable, printed with the phase.
- DO style "before you move on" gates as challenge-response verification items, visually distinct from task steps (different shape/color, e.g. bordered slab), with an explicit completion action. Never let a gate scroll by looking like step text.
- DO place ⚠️ warnings *before* the step they govern, in one rigid, standardized format sitewide (icon + label + verbatim guide language). Three tiers max (safety warning / caution / note). Don't invent per-page variants.
- DO keep each step to one primary action, ≤2 short lines in checklist mode, with dimensions and fastener specs *repeated inline in the step* (the NYT Cooking lesson — never make the user toggle to a materials list mid-task).
- DON'T tunnel to one-step-per-screen. Use a scrolling checklist with the current section expanded and completed sections collapsed — the builder needs lookahead (cure times, "mix before you climb the ladder" awareness).
- DON'T flatten hierarchy: group steps under sub-task headings within a phase (iFixit's failure mode is 40 undifferentiated steps). Show "step 4 of 12 in Framing the grill bay," not "step 23."

**State & findability**
- DO persist per-step checks, show phase % on the dashboard pipeline, and auto-scroll/anchor to the first unchecked step when a phase page opens ("you are here" is the whole game on a jobsite).
- DO make prerequisites links, not repetition (iFixit): a step that depends on a prior phase's gate links to it and shows its completion state.
- DON'T bury the four open decisions — surface them as persistent badges on the phases they block, with deadline phrasing ("decide before Step 1.6").

**Mobile / gloves / sunlight**
- DO: minimum 48px tap targets; make the *entire step row* the checkbox hit area, with checkbox at a consistent edge.
- DO: near-black on near-white for execution mode regardless of the site's warm palette elsewhere — outdoor readability beats aesthetics, and WCAG-passing mid-grays die in sunlight. Reserve color for warnings and gates only, so it stays meaningful at a squint.
- DO: 18px+ body text in checklist mode, sans-serif, line-height ≥1.5 (Degani: spacing prevents line-skipping), and request the Screen Wake Lock API on phase pages.
- DO: diagrams open full-screen with pinch-zoom; SVG text stays vector. Put the operative dimension in the step text too — don't force zooming to read a number.
- DON'T rely on hover, small toggles, swipe gestures, or multi-tap flows; gloved thumbs get one big obvious tap. DON'T use thin font weights or low-contrast "muted" step text for anything that must be read mid-task.

**Print**
- DO print checklist mode: setup block, steps with empty checkboxes, warnings intact, gates boxed, page-break between sub-task groups. Per-phase shopping list as its own printable sheet. Strip nav/color-dependence; warnings must survive grayscale (icon + border, not color alone).

**Voice discipline**
- DO restrict checklist-mode vocabulary (aviation): verb-first imperatives, same term for the same object everywhere ("cold-galv every cut edge," never a paraphrase). The "why" lives one tap away (decision-log links), not inline in the execution line.

Sources: [Degani & Wiener, Cockpit Checklists: Concepts, Design, and Use](https://s3.amazonaws.com/kajabi-storefronts-production/sites/3839/themes/2022276/downloads/VauqPYTC8jFaUycRTgrf_Degani_-_Human_Factors_The_Journal_of_the_Human_Factor.pdf) · [NASA CR-177549, Human Factors of Flight-Deck Checklists](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/19910017830.pdf) · [iFixit: Creating a Repair Guide](https://www.ifixit.com/Info/Repair_Guide) · [Writing Technical Manuals to MIL-STD-40051](https://www.dandr.com/blog-%20writing-and-Publishing-Technical-Manuals-to-MIL-STD-40051.html) · [MIL-STD-40051-2A](https://cvgstrategy.com/wp-content/uploads/2013/08/MIL-STD-40051-2A.pdf) · [Design Critique: NYT Cooking (Pratt IXD)](https://ixd.prattsi.org/2025/02/design-critique-nyt-cooking-mobile-app/) · [Fieldwire jobsite management](https://www.fieldwire.com/blog/best-construction-management-software/) · [Designing UIs for sunlight-readable displays](https://fwdisplays.com/elementor-1920/) · [Flight Safety Foundation: Making a List](https://flightsafety.org/asw-article/making-a-list/)

---

## Checklist/Progress UX for Long Multi-Session Procedures — Do/Don't Findings

### 1. Progress wayfinding & resume ("you are here")

**Do**
- Make the dashboard answer three questions in one glance: where am I (current phase), how far along (per-phase % + overall), what's next (the next unchecked step). Steppers/progress trackers work because they show position + remaining scope simultaneously.
- Provide a persistent **"Resume" affordance** that deep-links to the first unchecked step of the furthest in-progress phase (compute from localStorage — the first unchecked box in the lowest incomplete phase). Save-and-resume patterns hinge on prefilling state so the user lands exactly where they stopped, not at the top of the page.
- Label progress steps with **recognizable real names** ("Phase 2 — Framing"), never internal/abstract labels; users orient by names, not numbers alone.
- Show per-phase completion as a fraction ("14/23 steps") in addition to a bar — fractions are checkable against reality; bars alone aren't.
- On phase pages, add a sticky mini-indicator (phase name + % + next-step link) so scroll position never costs orientation.
- Timestamp the last checked item ("last worked: Step 3.4, June 12") — multi-week gaps between sessions are the norm for a DIY build; recency is wayfinding.

**Don't**
- Don't make progress purely linear-visual (a single bar across 10 phases) — with phases of wildly different step counts it lies about effort remaining.
- Don't auto-scroll/auto-collapse on load in a surprising way; resume should be an offered jump, not a forced one (the user may be reviewing, not executing).
- Don't store progress only implicitly — the export/import JSON is the real resume mechanism across devices/browsers.

### 2. Progressive disclosure vs. everything-visible

**Do**
- Follow the NN/g rule: **frequently needed content stays visible up front; disclosure is only for secondary detail.** For a build guide: step titles + the action line always visible; rationale, tips, long explanations collapsible.
- Make collapsed headers self-describing so the user can decide whether to expand without expanding ("Why 32-13/16-inch studs" beats "More info").
- Default-expand the **current** phase's current section; default-collapse completed sections. State-dependent disclosure beats a global choice.
- Offer a per-page **"Expand all"** toggle (and expand everything for print). This resolves the tradeoff cheaply: dense on demand.
- Keep safety-critical text ("the manual is law", circuits-off verification, leak test) **never collapsed** — hiding it under an accordion is the classic failure mode where "valuable content hidden under an accordion is missed altogether" (NN/g).

**Don't**
- Don't hide gate/checkpoint content behind disclosure — gates must interrupt.
- Don't nest accordions more than one level; findability collapses at level two.
- Don't collapse content that print styles need — expand-all on `@media print`.

### 3. Step numbering & gutter design

**Do**
- Use **hierarchical persistent numbers** (1.6, 2.3) that never change — they're the shared vocabulary between site, print binder, and conversation ("stuck on 3.2"). Numbers are addresses, not just sequence.
- Put the checkbox + number in a fixed-width left gutter, aligned across all steps, with the checkbox itself being the large tap target (see §5) — a stable gutter is what makes scanning for "first unchecked" fast.
- Follow aviation checklist typography (Degani/NASA): **sans-serif, generous line spacing to prevent line-skipping**, one action per line, imperative verb first, restricted consistent vocabulary. Degani's print floor: never below ~0.10 in (2.5mm) character height; 0.14–0.20 in preferred — on mobile that translates to body text ≥16px, step titles larger.
- Visually distinguish checked steps (dim + strikethrough or checkmark fill) so the eye lands on the boundary between done/not-done — that boundary IS the "you are here" marker mid-page.
- Chunk long phases into sub-groups of roughly **5–9 steps** (working-memory limit per Gawande) with sub-headers.

**Don't**
- Don't renumber when content changes — breaks the binder and the owner's memory.
- Don't bury the verb ("The conduit should now be run" → "Run the conduit").
- Don't mix step numbering with decision numbering in one sequence — separate namespaces (Step 1.6 vs Decision D-03).

### 4. Gates / hold points (aviation + surgery)

**Do**
- Model gates on the WHO surgical checklist's **pause points**: a small number of explicit stop-the-line moments placed where proceeding wrongly is most expensive (before anesthesia / incision / leaving the room ↔ before pour / before cladding / before countertop templating). The guide's "before you move on" gates are exactly this — style them as a distinct component, full-width, visually unlike normal steps.
- Make gates **DO-CONFIRM** style (Gawande): the steps above were the work; the gate is a short confirmation list ("confirm: stubs pressure-tested, inspector signed off, photos taken"). Normal steps are READ-DO; gates are DO-CONFIRM. The two deserve different visual grammar.
- Keep each gate to the **"killer items"** — the few checks most dangerous to skip — and short enough to run in 60–90 seconds; past that a checklist becomes a distraction (Gawande/Ariadne Labs).
- Require explicit interaction to pass: a gate is not "all boxes above checked" — it's its own checkbox row(s), and the phase can't show 100% without it. Consider a distinct color (the site's slate-blue) + icon reserved only for gates so they're recognizable at arm's length.
- Attach open decisions to their gates (grill size → gate before framing step 1.6; tile → gate before templating). A deadline tied to a gate is aviation's "checklist has a defined trigger point" principle.

**Don't**
- Don't let gates be silently skippable in the UI (no auto-check, no "check all"). Aviation's lesson: checklists fail when completion is assumed rather than confirmed.
- Don't write gates as prose paragraphs — they must be verifiable yes/no items, not advice.
- Don't add gates everywhere; if everything is a hold point, nothing is. The guide's existing gates are the set.

### 5. Sunlight + gloves: mobile ergonomics numbers

**Do**
- **Tap targets ≥48×48 CSS px** (Android/Material minimum; Apple HIG is 44×44pt; WCAG 2.5.8 AA floor is 24×24 but that's far too small here). For gloved/dusty hands, go bigger: **56–64px checkboxes** with ≥8px spacing between adjacent targets; make the *entire step row* the toggle target, not just the box glyph.
- **Contrast: target WCAG AAA, 7:1** for body text (AA 4.5:1 washes out in direct sun; industrial-UX guidance is to markedly exceed minimums outdoors). Near-black #2C2C2A on off-white already clears 7:1 — verify accent-colored text (sage/slate) does too, or reserve accents for non-text.
- Non-text UI (checkbox borders, gate outlines) needs **≥3:1** against background (WCAG 1.4.11) — thin 1px light-gray borders disappear in glare; use 2px+ and darker strokes.
- Prefer **dark-on-light for sunlit reading of long text**, but note display-industry guidance that bright-on-dark holds up well for isolated controls; either way, avoid mid-gray text (#767676 is the 4.5:1 floor — stay well under, e.g. #4a4a44 or darker for secondary text).
- Respect the **thumb zone** (Hoober: 49% one-handed grip, ~75% of touches are thumb): put the resume button, phase nav, and expand-all in the bottom third / bottom-center; a bottom sticky bar beats a top nav for on-site use. Top corners are the red zone — nothing task-critical there.
- Big line-height (≥1.5) and 16–18px minimum body text; step titles 18–20px. Undo must be trivial: tapping a checked box unchecks it — gloved mis-taps will happen, so never confirm-dialog a checkbox.

**Don't**
- Don't rely on hover states, long-press, or swipe gestures — none work reliably gloved.
- Don't place adjacent interactive rows with <8px gap or shared borders; gloved touch is ±several mm of slop.
- Don't use color alone to encode state (checked vs gate vs flagged) — glare kills hue discrimination; always pair with icon/weight/strikethrough.
- Don't use subtle shadows or low-contrast dividers as the only structure; in sunlight they vanish — use whitespace + strong rules.

### Quick numbers card
| Metric | Value |
|---|---|
| Tap target minimum | 48×48px (glove-friendly: 56–64px), ≥8px spacing |
| Body text contrast | ≥7:1 (AAA); never below 4.5:1; UI strokes ≥3:1 |
| Body text size | ≥16px, line-height ≥1.5; checklist print ≥ Degani's 2.5mm floor |
| Checklist chunk size | 5–9 items per group |
| Gate runtime | ≤60–90 seconds, killer items only |
| One-handed grip prevalence | ~49%; ~75% of touches by thumb → bottom-center = prime real estate |

Sources: [W3C WCAG Understanding 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html), [WCAG 2.5.8 implementation guide](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide), [LogRocket — accessible touch target sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/), [Smashing — finger-friendly target sizes](https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/), [Industrial UX: sunlight-susceptible screens](https://medium.com/@callumjcoe/industrial-ux-sunlight-susceptible-screens-2e52b1d9706b), [OnLogic — sunlight-readable displays](https://www.onlogic.com/blog/using-a-sunlight-readable-display-for-a-user-interface-in-a-bright-environment/), [Degani — Human Factors of Flight-Deck Checklists (NASA CR-177549)](https://users.cs.northwestern.edu/~robby/courses/395-495-2017-winter/checklists/Degani%20Human%20Factors%20of%20Flight-Deck%20Checklists%20The%20Normal%20Checklist.pdf), [NASA TM-2016-219421 — Designing Flightdeck Procedures](https://hsi.arc.nasa.gov/publications/Barshi_Procedure_Checklist_Design_NASA_TM_2016.pdf), [Flight Safety Foundation — Making a List](https://flightsafety.org/asw-article/making-a-list/), [Ariadne Labs — WHO Surgical Safety Checklist](https://www.ariadnelabs.org/safe-surgery-safe-systems/surgical-safety/who-surgical-safety-checklist/), [WHO Surgical Safety Checklist — Wikipedia](https://en.wikipedia.org/wiki/WHO_Surgical_Safety_Checklist), [Checklist Manifesto lessons (Runn summary)](https://www.runn.io/blog/the-checklist-manifesto-summary), [DO-CONFIRM vs READ-DO (Shortform)](https://www.shortform.com/blog/types-of-checklists/), [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [NN/g — Accordions on Desktop](https://www.nngroup.com/articles/accordions-on-desktop/), [NN/g — Wizards](https://www.nngroup.com/articles/wizards/), [AppMaster — save-and-resume wizard patterns](https://appmaster.io/blog/save-and-resume-multi-step-wizard), [UXPin — progress trackers](https://www.uxpin.com/studio/blog/design-progress-trackers/), [Smashing — The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/), [A List Apart — How We Hold Our Gadgets (Hoober)](https://alistapart.com/article/how-we-hold-our-gadgets/)

---

## Brief: BOM/shopping-list presentation + embedded tutorial-video UX

### A. Buy lists, cut lists, and shopping runs

**Core structural convention: these are three different documents. Don't merge them.**
1. **Cut list** — every part, one row per part: Part ID/letter, description, qty, thickness × width × length, material. Organized by assembly, largest parts first. Used at the saw, not the store.
2. **Shopping/pick list** — what you actually buy: nominal stock sizes ("3 × 2x4x8 PT"), sheet goods by sheet count, lumber in purchasable lengths with waste factored in. This is the store document.
3. **Hardware & consumables list** — fasteners, adhesives, sealants, abrasives kept as a separate section/BOM (they're bought by box/tube, not by piece, and often at a different aisle or store).

**DO:**
- **Columns, in this order:** check-off box → qty → unit (ea/box/tube/lf/sheet) → item name → exact spec (the load-bearing column: gauge, coating, size, e.g. "#8 × 1/2" self-drilling pancake head, 410 SS") → manufacturer/SKU or product link → phase used → unit price → line total. Qty and unit are separate columns; never "some" or "a few."
- **Group by store department for the shopping view** (Lumber, Fasteners, Electrical, Plumbing, Masonry, Specialty-order) — that's the walking order of a Home Depot run. Offer **group-by-phase as the alternate view** since the owner shops per phase; per-phase department-grouped lists are the ideal intersection.
- **Big check-off affordances** on every row (this is used in-store on a phone with one hand); persist state; a "picked up / still need" count at the top of each list.
- **Flag long-lead / special-order items visually** (grill, doors, granite) separately from cash-and-carry items — contractors always split "order now" from "buy day-of."
- **Use the VIF convention for verify-flags.** Construction drawings mark dimensions "VIF — verify in field," bubbled/highlighted, meaning measure before cutting or ordering. Give the site an equivalent badge on any row where a spec depends on an open decision (grill cutout hardware, door hinges, tile) or on an as-built measurement: a distinct amber "⚠ verify before buying" chip stating *what* to verify and *which decision/measurement* gates it. This dovetails perfectly with the project's open-decisions tracker.
- Note **nominal vs actual** dimensions where it matters (2x4 ≠ 2"×4") — good plans state actuals once, in a footnote or column tooltip, not on every row.
- Print styles: one department-group per page break where feasible; keep checkboxes as printed squares.

**DON'T:**
- Don't mix cut dimensions into the shopping list (buy "2 sheets 1/2" cement board," not "14 pieces of cut cement board").
- Don't hide unit prices or the rollup — cost transparency per row and per phase is a stated need.
- Don't restate qty inside the description ("Screws (100)") — quantity lives in its own column with revision-safe single source of truth.
- Don't invent SKUs or substitute products; specs in this project are verified and locked (CLAUDE.md hard rule).

### B. Embedded tutorial-video UX

**Facade pattern (mandatory for a static, phone-on-jobsite page):**
- **DO** use a click-to-load facade ([lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed) or a hand-rolled equivalent): static thumbnail + play button + title; `preconnect` to YouTube on hover/touchstart; swap in the real iframe (with `autoplay=1`) only on click. A real YouTube embed is ~1.2 MB vs ~27 kB for the facade — huge on cell connections.
- **DO** use `youtube-nocookie.com` for the loaded iframe, `playsinline` so iOS doesn't force fullscreen, and lazy-load facades below the fold via IntersectionObserver.
- **DO** show a **duration chip** on the thumbnail (bottom-right, mono, dark pill — the YouTube-native convention) plus the title. NN/g: duration displayed *before* playback is what lets users decide whether to commit. YouTube gives no duration in the embed — bake it in at authoring time (or fetch once via oEmbed/Data API at build) as a data attribute; never leave it blank.
- **DO** add a one-line **"what you'll learn / why this video"** annotation under the title, in the guide's voice ("Watch the first 4 minutes for the leak-test technique; the rest is product review"). This framing line is more valuable than the video title itself.

**Placement:**
- **DO** place each video **inline at the top of the step/section it supports** — NN/g found section-top placement correctly signals scope; page-top placement is only for a video covering the whole page.
- **DON'T** put videos in a sidebar/right rail (right-rail blindness, read as ads) or dump them at the end of the section/page (routinely missed).
- **DO** keep video strictly **supplemental to text** — some users read-only, some watch-only, some skim-then-watch. Never make a video the sole carrier of a spec, dimension, or safety step. (Also a fidelity requirement here: the guide text is canonical.)

**Timestamps/chapters:**
- **DO** deep-link to the relevant moment: facade click loads the iframe with `?start=SECONDS`; render a small list of chapter links ("2:14 — mixing ratio," "6:40 — first coat") under the facade that reload/seek the iframe. Timeline markers measurably improve navigation in instructional video.
- **DON'T** link a 20-minute video with no entry point; if only one segment matters, say so and start there.

**Offline / degradation:**
- **DO** degrade to a labeled link: the facade should contain a plain `<a href="https://youtube.com/watch?v=...">` with the title as fallback (works with JS off; lite-youtube does this natively).
- **DO** handle thumbnail failure (offline jobsite, blocked domain): on image `onerror`, keep the card — title, duration, "what you'll learn," and the raw URL remain visible so the reference isn't lost; optionally ship a tiny inline SVG placeholder. Never let an offline video leave a broken-image hole or shift layout (reserve the 16:9 box with `aspect-ratio`).
- **DON'T** rely on the video for any "before you move on" gate content — jobsite connectivity is not guaranteed.

Sources: [NN/g — Instructional Video Guidelines](https://www.nngroup.com/articles/instructional-video-guidelines/), [NN/g — Video Usability](https://www.nngroup.com/articles/video-usability/), [paulirish/lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed), [CSS-Tricks — lite-youtube-embed](https://css-tricks.com/lite-youtube-embed/), [roboleary — YouTube embeds are bloated](https://www.roboleary.net/2024/02/10/youtube-embeds-suck-but), [WoodBin — Bill of Materials and Cut List](https://woodbin.com/ref/project-design-and-planning/bill-of-materials/), [Woodcraft — A Pro's Guide to Cut Lists](https://www.woodcraft.com/blogs/shop-knowledge-guides/a-pro-s-guide-to-cut-lists), [CutList Plus — Terminology](https://cutlistplus.com/Terms), [Fictiv — How to Build a BOM](https://www.fictiv.com/articles/how-to-build-a-bom), [Wikipedia — Verify in field](https://en.wikipedia.org/wiki/Verify_in_field), [Pine and Poplar — Buying Wood for DIY](https://pineandpoplar.com/buying-wood-for-diy-projects/)