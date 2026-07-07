import content from '../data/content.json';
import { esc, phaseLabel, statusPill } from '../components/ui.js';
import { ui } from '../store/progress.js';

export function renderDecisions() {
  const page = document.querySelector('#page');
  const filter = ui.get('decisionFilter', 'all');
  const counts = { all: content.decisions.length, locked: 0, open: 0, superseded: 0 };
  for (const d of content.decisions) counts[d.status]++;

  const chips = ['all', 'locked', 'open', 'superseded']
    .map(
      (f) => `<button class="filter-chip ${f === filter ? 'on' : ''}" data-decision-filter="${f}">
        ${f === 'all' ? 'All' : { locked: '🔒 Locked', open: '⚠️ Open', superseded: '🔄 Superseded' }[f]} (${counts[f]})</button>`
    )
    .join('');

  const cards = content.decisions
    .filter((d) => filter === 'all' || d.status === filter || (filter === 'open' && d.alsoOpen))
    .map(
      (d) => `
      <article class="card decision" id="${d.id}">
        <header class="decision-head">
          <h2><span class="decision-id">${d.id}</span> ${esc(d.title)}</h2>
          <div class="decision-pills">${statusPill(d.status)}${d.alsoOpen ? statusPill('open') : ''}</div>
        </header>
        <div class="prose">${d.html}</div>
        ${d.phases.length
          ? `<p class="decision-phases">Shapes ${d.phases
              .map((n) => `<a class="chip" href="#/phase/${n}">Phase ${phaseLabel(n)}</a>`)
              .join(' ')}</p>`
          : ''}
      </article>`
    )
    .join('');

  page.innerHTML = `
    <article class="decisions-page">
      <header class="page-head">
        <h1>Decision log</h1>
        <p class="muted">Every major call, what it beat, and why. The reasoning is the point — if a future change tempts you, read the entry first.</p>
        <div class="filter-row">${chips}</div>
      </header>
      ${cards || '<p class="empty">No decisions match this filter.</p>'}
    </article>`;
}
