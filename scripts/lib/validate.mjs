import { existsSync, readFileSync } from 'node:fs';

/**
 * Invariant probes across the source docs. Everything here FLAGS — nothing
 * ever rewrites content. Output feeds the dashboard's "flagged for review"
 * panel alongside the manual flags in content/overlay.json.
 */
export function runValidators({ guide, decisions, overlay, guideRaw, decisionsRaw, contextRaw, modelExportPath }) {
  const flags = [];
  const warnings = [];
  let autoN = 0;
  const addFlag = (summary, details, locations = []) => {
    flags.push({ id: `AUTO-${++autoN}`, source: 'auto', severity: 'review', summary, details, locations, status: 'open' });
  };

  // ---- 1. Cost rollup: recompute section subtotals and the project total ----
  const parseRange = (text) => {
    const m = String(text).replace(/,/g, '').match(/\$\s?(\d+(?:\.\d+)?)(?:\s*[–—-]\s*\$?\s?(\d+(?:\.\d+)?))?/);
    if (!m) return null;
    return { low: Number(m[1]), high: Number(m[2] ?? m[1]) };
  };

  const subtotals = [];
  for (const group of guide.materials.groups) {
    let low = 0, high = 0, stated = null;
    for (const row of group.rows) {
      const est = parseRange(row.plain.at(-1));
      if (!est) continue;
      if (row.isSubtotal) stated = est;
      else { low += est.low; high += est.high; }
    }
    if (stated) {
      subtotals.push(stated);
      if (stated.low !== low || stated.high !== high) {
        addFlag(
          `Materials rollup: "${group.title}" rows sum to $${low.toLocaleString()}–$${high.toLocaleString()} but the stated subtotal is $${stated.low.toLocaleString()}–$${stated.high.toLocaleString()}.`,
          'Computed from the Est. column of the master materials list. Verify which figure is current — the site displays the guide\'s numbers unchanged.',
          [{ doc: 'build-guide', anchor: 'materials' }]
        );
      }
    }
  }
  const totalStated = parseRange(guide.materials.totalHtml.replace(/<[^>]+>/g, ' '));
  const totalComputed = subtotals.reduce((a, r) => ({ low: a.low + r.low, high: a.high + r.high }), { low: 0, high: 0 });
  if (totalStated && subtotals.length && (totalStated.low !== totalComputed.low || totalStated.high !== totalComputed.high)) {
    addFlag(
      `Project total: the three subtotals sum to $${totalComputed.low.toLocaleString()}–$${totalComputed.high.toLocaleString()}, but the guide states roughly $${totalStated.low.toLocaleString()}–$${totalStated.high.toLocaleString()}.`,
      'The guide says "roughly", so this may be deliberate rounding to the landing zone set early on — flagged so you can confirm rather than have the site silently pick one.',
      [{ doc: 'build-guide', anchor: 'materials' }]
    );
  }

  // ---- 2. Cross-doc dimension probes (presence + agreement, never correction) ----
  const probes = [
    { name: 'stud length 32-13/16"', re: /32-13\/16/g, docs: { guide: guideRaw, decisions: decisionsRaw } },
    { name: 'counter depth 31"', re: /\*\*31"?\*\*|31"\s*(?:deep|\()|Counter depth.*31/g, docs: { guide: guideRaw } },
    { name: 'SL30 cutout width 25½"', re: /25½/g, docs: { guide: guideRaw, decisions: decisionsRaw } },
    { name: 'SL36 cutout width 32½"', re: /32½/g, docs: { guide: guideRaw, decisions: decisionsRaw } },
    { name: 'counter height 36" finished', re: /36" finished/g, docs: { guide: guideRaw, decisions: decisionsRaw, context: contextRaw } },
  ];
  for (const probe of probes) {
    for (const [doc, raw] of Object.entries(probe.docs)) {
      if (!raw.match(probe.re)) {
        addFlag(
          `Dimension probe: expected ${probe.name} in ${doc}.md but did not find it.`,
          'A locked dimension that should appear in this document is missing or was reworded. Check the source file.',
          [{ doc, anchor: null }]
        );
      }
    }
  }

  // ---- 3. Open decisions: guide's final section vs overlay tracker ----
  const guideCount = guide.openDecisionsDoc.items.length;
  if (guideCount !== overlay.openDecisions.length) {
    addFlag(
      `Open decisions: the guide lists ${guideCount} but content/overlay.json tracks ${overlay.openDecisions.length}.`,
      'If a decision was made, update both the guide text and the overlay entry (set status/resolution). The dashboard tracker reads the overlay.',
      [{ doc: 'build-guide', anchor: 'open-decisions' }]
    );
  }

  // ---- 4. Overlay reference integrity (build warnings, not owner-facing flags) ----
  const decisionIds = new Set(decisions.map((d) => d.id));
  const phaseNums = new Set(guide.phases.map((p) => p.num));
  for (const [id, phases] of Object.entries(overlay.decisionPhases)) {
    if (!decisionIds.has(id)) warnings.push(`overlay.decisionPhases: unknown decision "${id}"`);
    for (const n of phases) if (!phaseNums.has(n)) warnings.push(`overlay.decisionPhases[${id}]: unknown phase ${n}`);
  }
  for (const od of overlay.openDecisions) {
    if (!decisionIds.has(od.decisionRef)) warnings.push(`overlay.openDecisions: unknown decisionRef "${od.decisionRef}"`);
  }
  const rowLabels = new Set(
    guide.materials.groups.flatMap((g) => g.rows.filter((r) => !r.isSubtotal).map((r) => r.plain[0]))
  );
  for (const key of Object.keys(overlay.materialsPhaseMap)) {
    if (!rowLabels.has(key)) warnings.push(`overlay.materialsPhaseMap: no master-list row labeled "${key}"`);
  }
  for (const label of rowLabels) {
    if (!(label in overlay.materialsPhaseMap)) warnings.push(`overlay.materialsPhaseMap: master-list row "${label}" is not mapped to a phase`);
  }

  // ---- 5. SketchUp model export cross-check (only if the export exists) ----
  let model = null;
  if (existsSync(modelExportPath)) {
    try {
      model = JSON.parse(readFileSync(modelExportPath, 'utf8'));
    } catch (e) {
      addFlag('docs/model-export.json exists but is not valid JSON.', String(e.message), [{ doc: 'model-export', anchor: null }]);
    }
  }
  if (model) {
    const comps = model.components ?? model.entities ?? [];
    const inch = (v) => Math.round(v * 16) / 16; // snap to 1/16"
    const near = (a, b, tol = 1 / 16) => Math.abs(a - b) <= tol;
    const checks = [
      { name: 'stud length', expect: 32 + 13 / 16, match: (c) => /stud/i.test(c.name ?? '') },
      { name: 'counter depth', expect: 31, match: (c) => /counter|granite|deck/i.test(c.name ?? '') },
    ];
    for (const chk of checks) {
      const hits = comps.filter(chk.match);
      if (!hits.length) continue;
      const dims = hits.flatMap((c) => [c.lenX, c.lenY, c.lenZ].filter((v) => typeof v === 'number'));
      if (dims.length && !dims.some((d) => near(d, chk.expect))) {
        addFlag(
          `Model cross-check: no ${chk.name} dimension in model-export.json is within 1/16" of the guide's ${inch(chk.expect)}".`,
          `Model values found: ${[...new Set(dims.map(inch))].join(', ')}. Model vs guide conflicts are findings — verify which is right before cutting.`,
          [{ doc: 'model-export', anchor: null }]
        );
      }
    }
  }

  return { flags, warnings, modelPresent: !!model };
}
