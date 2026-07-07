# Design iteration log — phase page usability (July 2026)

## Problem

The v1 phase page worked but read as a wall of collapsible cards: hard to parse position at a glance, shopping lists too coarse to shop from ("2" ABS drain stub + fittings"), no way to mark where the build stands, and no technique reference at the point of use.

## Round 0 — research (5 parallel agents)

- Instructional-execution exemplars (iFixit, aviation checklists, MIL-STD work packages, cook modes, jobsite apps): checklists and teaching documents are different artifacts; hold-points must look categorically different from steps; one-step tunneling destroys lookahead. Full briefs: `research-briefs-r1.md`.
- Checklist/progress UX: position + remaining scope shown together; resume-where-I-left-off is the core multi-session need; whole-row 48px+ targets; near-black on near-white for sunlight.
- BOM/video patterns: shopping lists are store documents (one cart-able line each, qty+unit split, verify-before-buying flags); videos as click-to-load facades with an offline text fallback.
- Content agents derived the 107-line per-phase buy list from the guide (source-tagged guide/estimate/measure) and found 25 technique videos, each verified via YouTube oEmbed.

## Round 1 — diverge (4 variants, eval routes since removed)

| # | Concept | Fate |
|---|---|---|
| 1 | Field Ledger — dense ruled column, number gutter as checkbox | dropped |
| 2 | **Step Runner** — one current-station card, scrubber, pre-flight buy screen, position = pin | **winner** |
| 3 | Wayfinder Split — persistent rail/scrubber with status dots | dropped |
| 4 | Spec Sheet — hairline-table contractor maximalism, print-parity | dropped |

Owner verdict: "Option 2 is the clear winner," with two adjustments: (1) move the tracker to the top, a row beneath the step dots (it was a fixed bottom bar); (2) station headers must toggle — tap to expand, tap the title again to collapse.

## Graduated implementation (src/pages/phase.js)

- Stations: pre-flight (buy list, canonical materials text, phase-general videos) → each step/section → gates split out as their own confirm stations. Everything renders in the DOM; collapse is presentational, so print always gets the whole phase.
- Sticky top tracker: station dots (tap to jump) with the phase progress rail and current-station label beneath.
- ⌖ pin (`okm.here.v1`): opening/jumping to a station pins it; the dashboard grows a Resume chip. Deep links and search do not move the pin.
- Real progress store throughout; buy lines persist like checklist items but do not count toward phase %.
- Gate stations arm the Next button — you cannot advance past an unchecked gate.
- Videos: click-to-load youtube-nocookie facades on their mapped stations; URLs print in the binder sheets.

Verified: 44/44 smoke assertions (structure, toggles, arming, pin→resume, persistence, print, fidelity probes), mobile 375px + desktop screenshots, print shopping sheet.
