import content from '../data/content.json';
import { progress } from '../store/progress.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Display form of a phase number: real minus sign, as the guide writes it. */
export const phaseLabel = (num) => String(num).replace('-', '−');

export function phaseByNum(num) {
  return content.guide.phases.find((p) => p.num === Number(num));
}

export function progressBar(stats, { label = true } = {}) {
  return `
    <div class="progress" role="progressbar" aria-valuenow="${stats.pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-track"><div class="progress-fill" style="width:${stats.pct}%"></div></div>
      ${label ? `<span class="progress-label">${stats.done}/${stats.total} · ${stats.pct}%</span>` : ''}
    </div>`;
}

export function checkRow(item, { interactive = true } = {}) {
  const done = progress.isDone(item.id);
  if (!interactive) {
    return `
      <div class="check-row print ${done ? 'done' : ''}">
        <span class="box" aria-hidden="true">${done ? '✕' : ''}</span>
        <div class="check-body">${item.html}${item.detailsHtml ?? ''}</div>
      </div>`;
  }
  return `
    <div class="check-row ${done ? 'done' : ''}" data-row="${item.id}">
      <label class="check-hit">
        <input type="checkbox" data-check-id="${item.id}" ${done ? 'checked' : ''} />
        <span class="box" aria-hidden="true"></span>
        <span class="visually-hidden">done</span>
      </label>
      <div class="check-body">${item.html}${item.detailsHtml ?? ''}</div>
    </div>`;
}

export function gateBlock(block, { interactive = true } = {}) {
  const done = progress.isDone(block.id);
  return `
    <div class="gate ${done ? 'done' : ''}" data-row="${block.id}">
      <div class="gate-head">Gate</div>
      <div class="gate-inner">
        ${interactive
          ? `<label class="check-hit">
               <input type="checkbox" data-check-id="${block.id}" ${done ? 'checked' : ''} />
               <span class="box" aria-hidden="true"></span>
               <span class="visually-hidden">gate passed</span>
             </label>`
          : `<span class="box" aria-hidden="true">${done ? '✕' : ''}</span>`}
        <p class="gate-text">${block.html}</p>
      </div>
    </div>`;
}

export function diagramFigure(file, alt) {
  const d = content.diagrams[file];
  if (!d) return '';
  return `
    <figure class="diagram" data-zoom="${file}" role="button" tabindex="0" aria-label="Enlarge diagram: ${esc(d.title)}">
      <div class="diagram-svg">${d.svg}</div>
      <figcaption><span>${esc(alt || d.title)}</span><span class="zoom-hint">tap to enlarge</span></figcaption>
    </figure>`;
}

/** Render one section's block list (shared by phase pages and print routes). */
export function renderBlocks(blocks, { interactive = true } = {}) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'html':
          return `<div class="prose">${b.html}</div>`;
        case 'table':
          return `<div class="table-wrap">${b.html}</div>`;
        case 'diagram':
          return diagramFigure(b.file, b.alt);
        case 'gate':
          return gateBlock(b, { interactive });
        case 'checklist':
          return `<div class="checklist">${b.items.map((i) => checkRow(i, { interactive })).join('')}</div>`;
        default:
          return '';
      }
    })
    .join('');
}

export function decisionChips(phaseNum) {
  const related = content.decisions.filter((d) => d.phases.includes(Number(phaseNum)));
  if (!related.length) return '';
  return `
    <section class="related-decisions">
      <h2>Decisions behind this phase</h2>
      <ul class="chip-list">
        ${related
          .map(
            (d) => `<li><a class="chip chip-${d.status}" href="#/decisions@${d.id}">
              <strong>${d.id}</strong> ${esc(d.title)}${d.status === 'open' || d.alsoOpen ? ' ⚠️' : ''}</a></li>`
          )
          .join('')}
      </ul>
    </section>`;
}

export function statusPill(status) {
  const label = { locked: '🔒 locked', open: '⚠️ open', superseded: '🔄 superseded' }[status] ?? status;
  return `<span class="pill pill-${status}">${label}</span>`;
}

/** Update progress bars + row states in place after a checkbox toggle. */
export function refreshProgressUi() {
  for (const el of document.querySelectorAll('[data-progress-phase]')) {
    const stats = progress.phaseStats(el.dataset.progressPhase);
    el.querySelector('.progress-fill').style.width = `${stats.pct}%`;
    const label = el.querySelector('.progress-label');
    if (label) label.textContent = `${stats.done}/${stats.total} · ${stats.pct}%`;
    el.setAttribute('aria-valuenow', stats.pct);
  }
  const total = document.querySelector('[data-progress-total]');
  if (total) {
    const stats = progress.totalStats();
    total.querySelector('.progress-fill').style.width = `${stats.pct}%`;
    const label = total.querySelector('.progress-label');
    if (label) label.textContent = `${stats.done}/${stats.total} · ${stats.pct}%`;
  }
}
