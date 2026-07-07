import content from '../data/content.json';
import { esc } from '../components/ui.js';

export function renderReferences() {
  const page = document.querySelector('#page');

  const gallery = Object.entries(content.diagrams)
    .map(
      ([file, d]) => `
      <figure class="diagram gallery-item" data-zoom="${file}" role="button" tabindex="0" aria-label="Enlarge diagram: ${esc(d.title)}">
        <div class="diagram-svg">${d.svg}</div>
        <figcaption><span>${esc(d.title)}</span><span class="zoom-hint">tap to enlarge</span></figcaption>
      </figure>`
    )
    .join('');

  page.innerHTML = `
    <article class="reference-page">
      <header class="page-head">
        <h1>Reference library</h1>
        <p class="muted">The diagrams, the manufacturer guides worth printing for the binder, and every link from the planning sessions.</p>
      </header>
      <section class="card" id="gallery">
        <h2>Build diagrams</h2>
        <div class="gallery">${gallery}</div>
      </section>
      <section class="card" id="library">
        <h2>Illustrated guides &amp; manuals</h2>
        <div class="prose">${content.guide.visualLibraryHtml}</div>
      </section>
      <section class="card" id="tools">
        <h2>Tools</h2>
        <div class="prose">${content.guide.toolsHtml}</div>
      </section>
      <section class="card" id="links">
        <h2>Reference links</h2>
        <div class="prose">${content.guide.referenceLinksHtml}</div>
      </section>
    </article>`;
}

export function renderContext() {
  const page = document.querySelector('#page');
  page.innerHTML = `
    <article class="context-page">
      <header class="page-head">
        <h1>${esc(content.context.title)}</h1>
      </header>
      ${content.context.sections
        .map(
          (s) => `<section class="card" id="${s.slug}"><h2>${esc(s.title)}</h2><div class="prose">${s.html}</div></section>`
        )
        .join('')}
    </article>`;
}
