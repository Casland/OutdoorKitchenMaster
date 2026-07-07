/**
 * Content pipeline: docs/*.md + diagrams/*.svg + content/*.json → src/data/content.json
 * The markdown files stay the source of truth — this runs before every dev/build.
 * Parse failures throw (a silently dropped block would be a fidelity violation).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseGuide } from './lib/parse-guide.mjs';
import { parseDecisions } from './lib/parse-decisions.mjs';
import { parseContext } from './lib/parse-context.mjs';
import { loadDiagrams } from './lib/svg.mjs';
import { runValidators } from './lib/validate.mjs';
import { stableId } from './lib/ids.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// ---- load sources ----
const guideRaw = read('docs/build-guide.md');
const decisionsRaw = read('docs/decisions.md');
const contextRaw = read('docs/project-context.md');
const overlay = JSON.parse(read('content/overlay.json'));
const journalSrc = JSON.parse(read('content/journal.json'));

const diagrams = loadDiagrams(join(root, 'diagrams'));
const guide = parseGuide(guideRaw, diagrams);
const decisions = parseDecisions(decisionsRaw);
const context = parseContext(contextRaw);

// ---- attach overlay cross-links ----
for (const d of decisions) d.phases = overlay.decisionPhases[d.id] ?? [];

const openDecisions = overlay.openDecisions.map((od) => {
  let anchor = null;
  if (od.deadlinePhase !== null && od.deadlineStep) {
    const phase = guide.phases.find((p) => p.num === od.deadlinePhase);
    anchor = phase?.sections.find((s) => s.stepNo === od.deadlineStep)?.slug ?? null;
  }
  return { ...od, deadlineAnchor: anchor };
});

// ---- journal (photos inlined as data URIs so the single-file build stays portable) ----
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
const journal = journalSrc.entries.map((e) => {
  let photoData = null;
  if (e.photo) {
    const p = join(root, 'content', 'journal', e.photo);
    if (!existsSync(p)) throw new Error(`ingest: journal photo not found: content/journal/${e.photo}`);
    const size = statSync(p).size;
    if (size > 500 * 1024) {
      console.warn(`  ⚠ journal photo ${e.photo} is ${(size / 1024 / 1024).toFixed(1)} MB — it inflates the single-file build. Resize to ≤500 KB (see CONTENT.md).`);
    }
    const mime = MIME[extname(e.photo).toLowerCase()];
    if (!mime) throw new Error(`ingest: unsupported journal photo type: ${e.photo}`);
    photoData = `data:${mime};base64,${readFileSync(p).toString('base64')}`;
  }
  return { date: e.date, note: e.note, photo: e.photo ?? null, photoData };
});
journal.sort((a, b) => b.date.localeCompare(a.date)); // newest first, whatever order the file is in

// ---- detailed shopping lists (content/shopping.json) ----
const shoppingSrc = JSON.parse(read('content/shopping.json'));
const shopping = {};
const buyables = {};
const shoppingWarnings = [];
for (const ph of shoppingSrc.phases) {
  if (!guide.phases.some((p) => p.num === ph.phase)) {
    shoppingWarnings.push(`shopping.json: unknown phase ${ph.phase}`);
    continue;
  }
  const seen = new Map();
  shopping[ph.phase] = ph.items.map((it) => {
    if (!['guide', 'estimate', 'measure'].includes(it.source)) {
      shoppingWarnings.push(`shopping.json p${ph.phase} "${it.item}": bad source "${it.source}"`);
    }
    return { ...it, id: stableId(ph.phase, `${it.item}|${it.spec}`, seen, 'buy.') };
  });
  buyables[ph.phase] = shopping[ph.phase].map((it) => it.id);
}
const shoppingAssumptions = shoppingSrc.assumptions ?? [];

// ---- technique videos (content/tutorials.json) ----
const tutorialsSrc = JSON.parse(read('content/tutorials.json'));
const tutorials = tutorialsSrc.videos.map((v) => {
  if (!/^[\w-]{11}$/.test(v.videoId)) throw new Error(`tutorials.json: bad videoId "${v.videoId}"`);
  const phase = guide.phases.find((p) => p.num === v.phase);
  if (!phase) {
    shoppingWarnings.push(`tutorials.json "${v.technique}": unknown phase ${v.phase}`);
    return { ...v, slug: '' };
  }
  let slug = '';
  if (v.section) {
    if (phase.sections.some((s) => s.slug === v.section)) slug = v.section;
    else shoppingWarnings.push(`tutorials.json "${v.technique}": no section "${v.section}" in phase ${v.phase} — will show as phase-general`);
  } else if (v.step) {
    slug = phase.sections.find((s) => s.stepNo === v.step)?.slug ?? '';
    if (!slug) shoppingWarnings.push(`tutorials.json "${v.technique}": no step ${v.step} in phase ${v.phase} — will show as phase-general`);
  }
  return { ...v, slug };
});

// ---- validators → auto flags + build warnings ----
const { flags: autoFlags, warnings, modelPresent } = runValidators({
  guide, decisions, overlay, guideRaw, decisionsRaw, contextRaw,
  modelExportPath: join(root, 'docs', 'model-export.json'),
});
const flags = [...overlay.flags.map((f) => ({ source: 'manual', ...f })), ...autoFlags];

// ---- search index (section-level granularity) ----
const strip = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const search = [];
for (const phase of guide.phases) {
  for (const s of phase.sections) {
    const text = s.blocks.map((b) => {
      if (b.type === 'checklist') return b.items.map((i) => i.plain + ' ' + strip(i.detailsHtml ?? '')).join(' ');
      if (b.type === 'diagram') return b.alt;
      return strip(b.html ?? '');
    }).join(' ');
    search.push({
      route: `#/phase/${phase.num}`,
      anchor: s.kind === 'intro' ? null : s.slug,
      title: `Phase ${phase.num} — ${phase.title}${s.title ? ` · ${s.title}` : ''}`,
      kind: 'phase',
      text,
    });
  }
}
for (const d of decisions) {
  search.push({ route: '#/decisions', anchor: d.id, title: `${d.id} — ${d.title}`, kind: 'decision', text: d.plain });
}
for (const g of guide.materials.groups) {
  for (const row of g.rows.filter((r) => !r.isSubtotal)) {
    search.push({ route: '#/materials', anchor: g.slug, title: `Materials · ${row.plain[0]}`, kind: 'materials', text: row.plain.join(' ') });
  }
}
for (const s of context.sections) {
  search.push({ route: '#/context', anchor: s.slug, title: `Project context · ${s.title}`, kind: 'context', text: s.plain });
}
for (const [phaseNum, items] of Object.entries(shopping)) {
  for (const it of items) {
    search.push({ route: `#/phase/${phaseNum}`, anchor: 'preflight', title: `Buy · ${it.item} (Phase ${phaseNum})`, kind: 'materials', text: `${it.item} ${it.spec} ${it.qty} ${it.unit} ${it.note}` });
  }
}
search.push({ route: '#/reference', anchor: 'tools', title: 'Tools', kind: 'reference', text: strip(guide.toolsHtml) });
search.push({ route: '#/reference', anchor: 'library', title: 'Visual Reference Library', kind: 'reference', text: strip(guide.visualLibraryHtml) });
search.push({ route: '#/reference', anchor: 'links', title: 'Reference Links', kind: 'reference', text: strip(guide.referenceLinksHtml) });

// ---- checklist stats (per phase, for progress rings) ----
const checkables = {};
for (const phase of guide.phases) {
  const ids = [];
  for (const s of phase.sections) {
    for (const b of s.blocks) {
      if (b.type === 'checklist') ids.push(...b.items.map((i) => i.id));
      if (b.type === 'gate') ids.push(b.id);
    }
  }
  checkables[phase.num] = ids;
}

// ---- write ----
const content = {
  meta: {
    generated: 'by scripts/ingest.mjs — do not edit; edit docs/*.md and content/*.json instead',
    modelPresent,
  },
  guide: {
    title: guide.title,
    subtitleHtml: guide.subtitleHtml,
    atAGlance: guide.atAGlance,
    buildOrder: guide.buildOrder,
    phases: guide.phases,
    materials: guide.materials,
    toolsHtml: guide.toolsHtml,
    visualLibraryHtml: guide.visualLibraryHtml,
    referenceLinksHtml: guide.referenceLinksHtml,
    openDecisionsDoc: guide.openDecisionsDoc,
  },
  decisions,
  context,
  diagrams,
  openDecisions,
  flags,
  materialsPhaseMap: overlay.materialsPhaseMap,
  shopping,
  shoppingAssumptions,
  buyables,
  tutorials,
  journal,
  search,
  checkables,
};

// Fidelity guard: every diagram reference must have become an inline-SVG block.
// A raw <img> pointing at a diagram file would 404 in the single-file build.
const leaked = JSON.stringify(content).match(/<img[^>]+diagram-\d[^>]*>/);
if (leaked) throw new Error(`ingest: a diagram reference escaped as a raw <img>: ${leaked[0]}`);

mkdirSync(join(root, 'src', 'data'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'content.json'), JSON.stringify(content, null, 1));

// ---- report ----
const nItems = Object.values(checkables).reduce((a, ids) => a + ids.length, 0);
const nBuy = Object.values(shopping).reduce((a, items) => a + items.length, 0);
console.log(`ingest: ${guide.phases.length} phases, ${nItems} checkable items, ${nBuy} buy-list lines, ${tutorials.length} videos, ${decisions.length} decisions, ${Object.keys(diagrams).length} diagrams, ${journal.length} journal entries, ${flags.length} flags (${autoFlags.length} auto)${modelPresent ? ', model export cross-checked' : ''}`);
for (const w of [...warnings, ...shoppingWarnings]) console.warn(`  ⚠ ${w}`);
if (warnings.length + shoppingWarnings.length === 0) console.log('  overlay/shopping/tutorial references: all valid');
