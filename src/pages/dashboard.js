import content from '../data/content.json';
import { progress, here } from '../store/progress.js';
import { esc, phaseLabel, progressBar } from '../components/ui.js';

export function renderDashboard() {
  const page = document.querySelector('#page');
  const total = progress.totalStats();
  const openFlags = content.flags.filter((f) => f.status !== 'resolved');
  const openDecisions = content.openDecisions.filter((od) => od.status === 'open');
  const decided = content.openDecisions.filter((od) => od.status !== 'open');

  const pipeline = content.guide.buildOrder.pipeline
    .map((p) => {
      const stats = progress.phaseStats(p.num);
      const phase = content.guide.phases.find((x) => x.num === p.num);
      return `
        <li>
          <a class="pipeline-row ${stats.pct === 100 ? 'complete' : stats.done > 0 ? 'active' : ''}" href="#/phase/${p.num}">
            <span class="pipeline-num">${phaseLabel(p.num)}</span>
            <span class="pipeline-label">
              <strong>${esc(phase?.title ?? p.label)}</strong>
              <span data-progress-phase="${p.num}">${progressBar(stats)}</span>
            </span>
          </a>
        </li>`;
    })
    .join('');

  const odCards = openDecisions
    .map(
      (od) => `
      <a class="od-card" href="#/decisions@${od.decisionRef}">
        <strong>${esc(od.title)}</strong>
        <span class="od-deadline">Deadline: ${esc(od.deadlineText)}</span>
        ${od.method ? `<span class="od-method">${esc(od.method)}</span>` : ''}
      </a>`
    )
    .join('');

  const costRows = content.guide.materials.groups
    .map((g) => {
      const sub = g.rows.find((r) => r.isSubtotal);
      return `<tr><td><a href="#/materials@${g.slug}">${esc(g.title)}</a></td><td class="num">${sub ? sub.cells.at(-1) : '—'}</td></tr>`;
    })
    .join('');

  const flagsPanel = openFlags.length
    ? `
      <details class="card flags-card" id="flags">
        <summary><h2>Flagged for review <span class="badge badge-flag">${openFlags.length}</span></h2><span class="section-caret"></span></summary>
        <p class="muted">Inconsistencies found between the source documents. The site never silently reconciles — these are yours to settle in the markdown.</p>
        <ul class="flag-list">
          ${openFlags
            .map(
              (f) => `<li class="flag">
                <strong>${esc(f.summary)}</strong>
                ${f.details ? `<p>${esc(f.details)}</p>` : ''}
                <span class="flag-src">${f.source === 'auto' ? 'detected at build' : 'manual note'} · ${f.id}</span>
              </li>`
            )
            .join('')}
        </ul>
      </details>`
    : '';

  const principles = content.context.principles.length
    ? `
      <details class="card">
        <summary><h2>Design philosophy — the recurring principles</h2><span class="section-caret"></span></summary>
        <ol class="principles">${content.context.principles.map((p) => `<li>${p}</li>`).join('')}</ol>
      </details>`
    : '';

  page.innerHTML = `
    <article class="dashboard">
      <header class="dash-hero">
        <p class="kicker">San Diego · L-shaped island on existing pavers</p>
        <h1>${esc(content.guide.title.replace(/ — /, ' — '))}</h1>
        <div class="prose dash-intro">${content.guide.atAGlance.introHtml}</div>
        <div class="dash-total" data-progress-total>${progressBar(total)}</div>
        ${(() => {
          const pin = here.get();
          return pin
            ? `<p class="dash-resume"><a class="btn btn-primary" href="#/phase/${pin.phase}@${pin.station}">⌖ Resume — ${esc(pin.label ?? `Phase ${phaseLabel(pin.phase)}`)}</a></p>`
            : '';
        })()}
      </header>

      <section class="card od-tracker" id="open-decisions">
        <h2>⚠️ Open decisions <span class="badge">${openDecisions.length}</span></h2>
        <p class="muted">${content.guide.openDecisionsDoc.introHtml.replace(/<\/?p>/g, '')}</p>
        <div class="od-grid">${odCards}</div>
        ${decided.length ? `<p class="muted">Decided: ${decided.map((od) => `${esc(od.title)} — ${esc(od.resolution ?? '')}`).join(' · ')}</p>` : ''}
      </section>

      ${flagsPanel}

      <section class="card" id="pipeline">
        <h2>Build order</h2>
        <div class="prose muted build-order-note">${content.guide.buildOrder.html}</div>
        <ol class="pipeline">${pipeline}</ol>
      </section>

      <div class="dash-cols">
        <section class="card" id="costs">
          <h2>Cost summary</h2>
          <div class="table-wrap"><table class="cost-table">
            <tbody>${costRows}</tbody>
          </table></div>
          <p class="cost-total prose">${content.guide.materials.totalHtml}</p>
          <p class="muted"><a href="#/materials">Master materials list →</a></p>
        </section>

        <section class="card" id="status">
          <h2>Where things stand</h2>
          <div class="prose">${content.context.statusHtml}</div>
          <p class="muted"><a href="#/context">Full project context →</a></p>
        </section>
      </div>

      <details class="card" id="locked">
        <summary><h2>Locked decisions — the at-a-glance table</h2><span class="section-caret"></span></summary>
        <div class="prose muted">${content.guide.atAGlance.notesHtml}</div>
        <div class="table-wrap"><table class="locked-table">
          <thead><tr>${content.guide.atAGlance.lockedTable.header.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${content.guide.atAGlance.lockedTable.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="muted">Full reasoning for each: <a href="#/decisions">the decision log</a>.</p>
      </details>

      ${principles}

      <section class="card" id="progress-data">
        <h2>Progress data</h2>
        <p class="muted">Checklist state lives in this browser. Export before switching phones or browsers; import merges (latest mark wins).${progress.orphanCount() ? ` ${progress.orphanCount()} check(s) belong to steps no longer in the guide — kept in the export, not counted.` : ''}</p>
        <p class="phase-actions">
          <button class="btn" data-export>Export progress</button>
          <button class="btn" data-import>Import progress</button>
        </p>
      </section>
    </article>`;
}
