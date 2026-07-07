# Getting Your SketchUp Model Into This Repo

The goal: convert the model from a picture into a queryable database, so the Claude Code
session can cross-check the build guide's dimensions against the model's reality and flag
mismatches instead of propagating them.

## Step 1 — Annotate the model (one hour, the highest-value hour)

In SketchUp, before exporting anything:

1. **Name components semantically.** `stud-32.8125`, `track-bottom-11ft-leg`,
   `grill-cutout`, `kamado-cradle-post`, `backsplash-wall`. Anything left as
   `Component#3` or `Group` exports as noise.
2. **Tag by system** (Tags/Layers panel): `FRAMING`, `SHEATHING`, `CLADDING`,
   `APPLIANCES`, `PLUMBING`, `GAS`, `ELECTRICAL`. Tags let the site (and the code
   session) filter the model by build phase.
3. **Use the description field** (Entity Info, on the component *definition*) for
   non-geometric facts: "back face: hardware cloth", "this partition boarded both
   sides", "no-drill zone below". These export as machine-readable notes.
4. Purge unused (Window > Model Info > Statistics > Purge Unused) and delete any
   old iteration geometry so the export reflects only the final plan.

## Step 2 — Run the exporter

1. Save the model.
2. Window > Ruby Console.
3. Open `tools/sketchup-export.rb` in a text editor, copy ALL of it, paste into the
   console, press Enter.
4. It writes `model-export.json` next to your .skp. Move that file to
   `docs/model-export.json` in this repo.

If it prints a tip about unnamed 'Group'/'Component#N' items, that's the annotation
pass telling you what it missed — name them and re-run.

## Step 3 — (If you have SketchUp Pro) Generate Report

File > Generate Report > component quantities with LenX/LenY/LenZ. Save as
`docs/model-cutlist.csv`. This is a free quantity sanity-check against the
materials list.

## Step 4 — Scenes and screenshots (vibes layer)

Set up 6–8 named scenes and export each at high resolution to `docs/model-views/`:

- `front-elevation.png`
- `leg-9ft.png` / `leg-11ft.png`
- `corner-kamado-cradle.png`
- `backsplash-wall.png`
- `framing-only.png` (cladding + counter hidden — the skeleton)
- `underside-utilities.png` (if you modeled the drain/gas/spare crossing)

Screenshots carry spatial understanding and aesthetics; the JSON carries truth.
Nobody should ever measure a pixel.

## Step 5 — (Optional stretch) 3D viewer on the site

Export COLLADA (.dae) from File > Export > 3D Model (Pro or Make 2017), or glTF via
a free Extension Warehouse plugin, into `docs/model-3d/`. The kickoff prompt tells
Claude Code this MAY exist; if it does, an embedded three.js orbit viewer on the
dashboard is a worthwhile stretch goal.

## What the Claude Code session does with all this

- Cross-validates guide numbers against `model-export.json` (stud length, opening
  widths, counter depth, footprint) and surfaces any mismatch as a visible
  "flagged for review" item — never a silent fix.
- Uses tags to associate model parts with build phases.
- Uses descriptions as annotation callouts.
- Uses the scenes as page imagery.
