import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import content from './data/content.json';
import { route, startRouter, parseHash, rerender } from './router.js';
import { progress, ui } from './store/progress.js';
import { phaseLabel, refreshProgressUi } from './components/ui.js';
import { openLightbox } from './components/lightbox.js';
import { openSearch } from './components/search.js';

import { renderDashboard } from './pages/dashboard.js';
import { renderPhase } from './pages/phase.js';
import { renderDecisions } from './pages/decisions.js';
import { renderMaterials } from './pages/materials.js';
import { renderReferences, renderContext } from './pages/references.js';
import { renderJournal } from './pages/journal.js';
import { renderPrintPhase, renderPrintShopping, renderPrintAll } from './pages/print.js';

// ---- shell ----
const openCount = content.openDecisions.filter((od) => od.status === 'open').length;
document.querySelector('#app').innerHTML = `
  <header class="site-head no-print">
    <a class="brand" href="#/">Outdoor<span>Kitchen</span></a>
    <button class="search-btn" data-open-search aria-label="Search the guide">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      <span>Search</span>
    </button>
  </header>
  <nav class="site-nav no-print" aria-label="Site">
    <a href="#/" data-nav="/">Overview${openCount ? ` <span class="nav-dot" title="${openCount} open decisions"></span>` : ''}</a>
    ${content.guide.phases.map((p) => `<a href="#/phase/${p.num}" data-nav="/phase/${p.num}" class="nav-phase" title="${p.title}">${phaseLabel(p.num)}</a>`).join('')}
    <a href="#/decisions" data-nav="/decisions">Decisions</a>
    <a href="#/materials" data-nav="/materials">Materials</a>
    <a href="#/reference" data-nav="/reference">Reference</a>
    <a href="#/journal" data-nav="/journal">Journal</a>
  </nav>
  <main id="page"></main>
  <footer class="site-foot no-print">
    <p>Built from <code>docs/build-guide.md</code> — the markdown is the source of truth. The manual is law.</p>
    <p><a href="#/print/all">Print the whole guide</a> · <a href="#/context">Project context</a></p>
  </footer>
  <input type="file" id="import-file" accept="application/json" hidden />`;

// ---- routes ----
const wrap = (fn) => (params) => {
  document.body.classList.remove('print-view');
  fn(params);
  markNav();
};
route('/', wrap(renderDashboard));
route('/phase/:num', wrap(renderPhase));
route('/decisions', wrap(renderDecisions));
route('/materials', wrap(renderMaterials));
route('/reference', wrap(renderReferences));
route('/context', wrap(renderContext));
route('/journal', wrap(renderJournal));
route('/print/phase/:num', wrap(renderPrintPhase));
route('/print/shopping/:num', wrap(renderPrintShopping));
route('/print/all', wrap(renderPrintAll));

function markNav() {
  const { path } = parseHash();
  for (const a of document.querySelectorAll('[data-nav]')) {
    a.classList.toggle('on', a.dataset.nav === path);
  }
}

// ---- event delegation ----
document.addEventListener('change', (e) => {
  const cb = e.target.closest('[data-check-id]');
  if (cb) {
    progress.toggle(cb.dataset.checkId);
    const row = cb.closest('[data-row]');
    if (row) row.classList.toggle('done', progress.isDone(cb.dataset.checkId));
    refreshProgressUi();
  }
});

document.addEventListener('click', (e) => {
  const zoom = e.target.closest('[data-zoom]');
  if (zoom && !e.target.closest('a')) {
    openLightbox(zoom.dataset.zoom);
    return;
  }
  if (e.target.closest('[data-open-search]')) {
    openSearch();
    return;
  }
  if (e.target.closest('[data-export]')) {
    progress.exportJson();
    return;
  }
  if (e.target.closest('[data-import]')) {
    document.querySelector('#import-file').click();
    return;
  }
  const df = e.target.closest('[data-decision-filter]');
  if (df) {
    ui.set('decisionFilter', df.dataset.decisionFilter);
    rerender();
    return;
  }
  const mv = e.target.closest('[data-materials-view]');
  if (mv) {
    ui.set('materialsView', mv.dataset.materialsView);
    rerender();
    return;
  }
  const mp = e.target.closest('[data-materials-phase]');
  if (mp) {
    ui.set('materialsPhase', Number(mp.dataset.materialsPhase));
    rerender();
    return;
  }
});

document.addEventListener('keydown', (e) => {
  const zoom = e.target.closest?.('[data-zoom]');
  if (zoom && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openLightbox(zoom.dataset.zoom);
  }
  if (e.key === '/' && !e.target.closest('input, textarea, [contenteditable]')) {
    e.preventDefault();
    openSearch();
  }
});

document.querySelector('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const merged = progress.importJson(await file.text());
    alert(`Imported — ${merged} check(s) merged.`);
    rerender();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
  e.target.value = '';
});

// Closed <details> would print blank — open everything for the printout, restore after.
let toRestore = [];
window.addEventListener('beforeprint', () => {
  toRestore = [...document.querySelectorAll('details:not([open])')];
  for (const d of toRestore) d.open = true;
});
window.addEventListener('afterprint', () => {
  for (const d of toRestore) d.open = false;
  toRestore = [];
});

startRouter();
