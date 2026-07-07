import content from '../data/content.json';
import { esc } from '../components/ui.js';

const fmt = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export function renderJournal() {
  const page = document.querySelector('#page');
  const entries = content.journal
    .map(
      (e) => `
      <article class="journal-entry card">
        <time datetime="${esc(e.date)}">${fmt(e.date)}</time>
        <p>${esc(e.note)}</p>
        ${e.photoData ? `<img src="${e.photoData}" alt="Journal photo from ${esc(e.date)}" loading="lazy" />` : ''}
      </article>`
    )
    .join('');

  page.innerHTML = `
    <article class="journal-page">
      <header class="page-head">
        <h1>Build journal</h1>
        <p class="muted">War stories, newest first. To add one: open <code>content/journal.json</code>, add an entry at the top
        (<code>date</code>, <code>note</code>, optional <code>photo</code> filename in <code>content/journal/</code>), then rebuild. Details in CONTENT.md.</p>
      </header>
      ${entries || '<p class="empty">Nothing yet. The first paver comes up soon enough.</p>'}
    </article>`;
}
