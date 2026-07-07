# Site design ethos

Distilled from the design-funnel round (July 2026) and its research. Apply to any new surface on this site.

## Sensibility

Contractor field guide. Parseability beats polish; typography beats decoration; utilitarian, never artisanal. The page should feel like the 8 technical SVG diagrams grew a website.

## Principles

1. **Execution is a runner, reading is a document.** During-build surfaces show one focused unit of work with big controls and lookahead (collapsed-but-visible neighbors); pre-build reading and print get the whole document. Never one-step tunneling without lookahead, never a wall of equal-weight cards.
2. **Position is always visible.** Tracker at the top: where am I, how far along, what's next — one glance. The ⌖ pin is the single cursor of the build; anything that moves it must be a deliberate act (jump, advance), not a side effect of reading.
3. **Hold-points look categorically different.** Gates get their own station, their own visual grammar (slate, DO-CONFIRM), and they arm the advance — safety language is never restyled or summarized.
4. **A buy list is a store document.** One cart-able line per row: item, exact spec, qty + unit, source tag (guide / est / measure-first), buying note. Derived numbers are visibly derived; guide numbers are verbatim.
5. **Technique lives at the point of use.** Videos attach to the step that needs them, as quiet click-to-load facades that degrade to text offline and to URLs in print.
6. **Gloves and sunlight set the floor.** ≥48px whole-row targets, near-black on near-white for anything read mid-task, color reserved for meaning (sage = done/confirm, amber = open decision, slate = hold, red = flagged).
7. **Print is a first-class render.** Everything in the DOM, collapse presentational only; boxes and borders survive grayscale; URLs appear where interaction can't.

## Tokens

Palette (from the kitchen's renders + diagram ink): ink `#2C2C2A`, ink-soft `#5F5E5A`, paper `#FAF8F3`, sand `#F1ECE2`, line `#DDD5C6`, driftwood `#8A7B66`, sage `#8FA98F` / deep `#55704F`, slate `#5C7387`, warn `#9A6416`, flag `#A8433F`. System font stack. Radius 6–10px (0 in print). One accent doing semantic work per element.

## Avoid

Marketing gloss, hero imagery, decorative icons, hover-dependent controls, hiding safety text behind interaction, more than one semantic accent per element, fixed bottom bars (owner preference — controls live in the card, tracker at the top).
