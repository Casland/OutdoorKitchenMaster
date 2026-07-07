import content from '../data/content.json';
import { esc, phaseLabel } from '../components/ui.js';
import { ui, progress } from '../store/progress.js';
import { shoppingRows, buyRowHtml } from './phase.js';

export function renderMaterials() {
  const page = document.querySelector('#page');
  const view = ui.get('materialsView', 'master');
  const phaseNums = content.guide.phases.map((p) => p.num);
  const selPhase = ui.get('materialsPhase', phaseNums[0]);

  const toggle = `
    <div class="filter-row">
      <button class="filter-chip ${view === 'master' ? 'on' : ''}" data-materials-view="master">Master list</button>
      <button class="filter-chip ${view === 'phase' ? 'on' : ''}" data-materials-view="phase">Shop by phase</button>
    </div>`;

  let body;
  if (view === 'master') {
    const costFlags = content.flags.filter((f) => f.locations?.some((l) => l.anchor === 'materials') && f.status !== 'resolved');
    body = content.guide.materials.groups
      .map(
        (g) => `
        <section class="card" id="${g.slug}">
          <h2>${esc(g.title)}</h2>
          <div class="table-wrap"><table class="materials-table">
            <thead><tr>${g.header.map((h) => `<th>${h}</th>`).join('')}<th>Phase</th></tr></thead>
            <tbody>
              ${g.rows
                .map((r) => {
                  const phases = content.materialsPhaseMap[r.plain[0]] ?? [];
                  const links = phases.map((n) => `<a href="#/phase/${n}">${phaseLabel(n)}</a>`).join(', ');
                  return `<tr class="${r.isSubtotal ? 'subtotal' : ''}">${r.cells
                    .map((c, i) => `<td class="${i === r.cells.length - 1 ? 'num' : ''}">${c}</td>`)
                    .join('')}<td class="num">${r.isSubtotal ? '' : links}</td></tr>`;
                })
                .join('')}
            </tbody>
          </table></div>
          ${g.extraHtml ? `<div class="prose muted">${g.extraHtml}</div>` : ''}
        </section>`
      )
      .join('') +
      `<section class="card cost-total-card">
        <p class="cost-total prose">${content.guide.materials.totalHtml}</p>
        ${costFlags.length ? `<p class="flag-note">⚠️ ${costFlags.length} rollup note(s) <a href="#/@flags">flagged for review</a> — the stated figures are shown unchanged.</p>` : ''}
      </section>`;
  } else {
    const phaseChips = phaseNums
      .map(
        (n) => `<button class="filter-chip ${n === selPhase ? 'on' : ''}" data-materials-phase="${n}">${phaseLabel(n)}</button>`
      )
      .join('');
    const rows = shoppingRows(selPhase);
    const phase = content.guide.phases.find((p) => p.num === selPhase);
    const bought = progress.buyStats(selPhase);

    body = `
      <section class="card">
        <div class="filter-row phase-filter">${phaseChips}</div>
        <h2>Phase ${phaseLabel(selPhase)} — ${esc(phase?.title ?? '')}</h2>
        ${rows.length
          ? `<p class="buy-legend muted">Every line is one thing for the cart. <span class="buy-chip buy-chip-guide">guide</span> stated in the guide ·
              <span class="buy-chip buy-chip-est">est</span> derived — sanity-check ·
              <span class="buy-chip buy-chip-measure">measure first</span> measure on site before buying.
              ${bought.done}/${rows.length} picked up. Check-offs sync with the phase page.</p>
            <div class="checklist buy-list">${rows.map((it) => buyRowHtml(it)).join('')}</div>`
          : '<p class="muted">No buy list for this phase.</p>'}
        <p class="phase-actions">
          <a class="btn" href="#/print/shopping/${selPhase}">Print this shopping list</a>
          <a class="btn" href="#/phase/${selPhase}">Open Phase ${phaseLabel(selPhase)}</a>
        </p>
        <details class="assumptions">
          <summary>Derivation assumptions (${content.shoppingAssumptions.length}) — audit me</summary>
          <ul class="plain-list muted">${content.shoppingAssumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </details>
      </section>`;
  }

  page.innerHTML = `
    <article class="materials-page">
      <header class="page-head">
        <h1>Materials &amp; cost</h1>
        <p class="muted">Prices are the ranges established in planning — San Diego, mid-2026. You shop per phase; the per-phase view is built for the store run.</p>
        ${toggle}
      </header>
      ${body}
    </article>`;
}
