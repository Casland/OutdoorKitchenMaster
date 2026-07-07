import content from '../data/content.json';
import { esc, phaseLabel, phaseByNum, renderBlocks } from '../components/ui.js';
import { shoppingRows } from './phase.js';

/**
 * Binder-ready print routes. Everything expanded, checkboxes as real boxes
 * (done items show an ✕ so a mid-build printout carries state), no chrome.
 * The pages also print fine via Ctrl+P from their normal routes — these
 * routes exist for clean single-purpose sheets.
 */
const printBar = `
  <div class="print-bar no-print">
    <a class="btn" href="#/" onclick="history.back(); return false;">← Back</a>
    <button class="btn btn-primary" onclick="window.print()">Print</button>
  </div>`;

function phaseSheet(phase) {
  const vids = content.tutorials.filter((v) => v.phase === phase.num);
  return `
    <section class="print-phase">
      <header class="print-head">
        <h1>Phase ${phaseLabel(phase.num)} — ${esc(phase.title)}</h1>
        <p class="print-sub">${esc(content.guide.title)} · printed ${new Date().toLocaleDateString()}</p>
      </header>
      ${phase.sections
        .map((s) => {
          const body = renderBlocks(s.blocks, { interactive: false });
          return s.title ? `<section class="print-section"><h2>${esc(s.title)}</h2>${body}</section>` : `<div class="print-section">${body}</div>`;
        })
        .join('')}
      ${vids.length
        ? `<section class="print-section print-vids"><h2>Technique videos referenced</h2>
            <ul>${vids.map((v) => `<li>${esc(v.technique)} — “${esc(v.title)}” (${esc(v.channel)}) · youtube.com/watch?v=${esc(v.videoId)}</li>`).join('')}</ul>
          </section>`
        : ''}
    </section>`;
}

export function renderPrintPhase(params) {
  const phase = phaseByNum(Number(params.num));
  const page = document.querySelector('#page');
  if (!phase) {
    page.innerHTML = '<p class="empty">No such phase.</p>';
    return;
  }
  document.body.classList.add('print-view');
  page.innerHTML = printBar + phaseSheet(phase);
}

export function renderPrintShopping(params) {
  const num = Number(params.num);
  const phase = phaseByNum(num);
  const page = document.querySelector('#page');
  if (!phase) {
    page.innerHTML = '<p class="empty">No such phase.</p>';
    return;
  }
  document.body.classList.add('print-view');
  const rows = shoppingRows(num);
  const SRC = { guide: 'guide', estimate: 'EST — sanity-check', measure: 'MEASURE FIRST' };

  page.innerHTML = `
    ${printBar}
    <section class="print-shopping">
      <header class="print-head">
        <h1>Shopping list — Phase ${phaseLabel(num)}: ${esc(phase.title)}</h1>
        <p class="print-sub">${esc(content.guide.title)} · printed ${new Date().toLocaleDateString()} ·
          qty tags: guide = stated in the guide · EST = derived, sanity-check · MEASURE FIRST = needs a site measurement</p>
      </header>
      ${rows.length
        ? `<table class="shopping-table">
            <thead><tr><th></th><th>Item</th><th>Qty</th><th>Source</th></tr></thead>
            <tbody>${rows
              .map(
                (it) => `<tr>
                  <td class="tick"><span class="box"></span></td>
                  <td><strong>${esc(it.item)}</strong><br /><span class="shop-spec">${esc(it.spec)}</span><br /><span class="shop-note">${esc(it.note)}</span></td>
                  <td class="num">${esc(it.qty)} ${esc(it.unit)}</td>
                  <td class="shop-src">${SRC[it.source] ?? esc(it.source)}</td>
                </tr>`
              )
              .join('')}</tbody>
          </table>`
        : '<p>No buy list for this phase.</p>'}
    </section>`;
}

export function renderPrintAll() {
  const page = document.querySelector('#page');
  document.body.classList.add('print-view');
  const t = content.guide.atAGlance.lockedTable;

  page.innerHTML = `
    ${printBar}
    <section class="print-all">
      <header class="print-head print-cover">
        <h1>${esc(content.guide.title)}</h1>
        <div class="prose">${content.guide.subtitleHtml}</div>
        <div class="prose">${content.guide.atAGlance.introHtml}</div>
        <h2>Build order</h2>
        <ol class="print-pipeline">
          ${content.guide.buildOrder.pipeline.map((p) => `<li><strong>Phase ${phaseLabel(p.num)}</strong> — ${esc(p.label)}</li>`).join('')}
        </ol>
        <div class="prose">${content.guide.atAGlance.tableLeadHtml}</div>
        <table><thead><tr>${t.header.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <div class="prose">${content.guide.atAGlance.notesHtml}</div>
      </header>
      ${content.guide.phases.map(phaseSheet).join('')}
      <section class="print-section">
        <h2>${esc(content.guide.openDecisionsDoc.heading)}</h2>
        <div class="prose">${content.guide.openDecisionsDoc.introHtml}</div>
        <ol class="prose">${content.guide.openDecisionsDoc.items.map((i) => `<li>${i.html}</li>`).join('')}</ol>
      </section>
    </section>`;
}
