import content from '../data/content.json';
import { esc } from './ui.js';

/**
 * Client-side search over the whole guide — phases, decisions, materials,
 * context, reference. Token scoring, title hits weighted; snippet around the
 * first match. Everything is already in memory, so no index library needed.
 */
let dialog = null;

const records = content.search.map((r) => ({
  ...r,
  titleLc: r.title.toLowerCase(),
  textLc: r.text.toLowerCase(),
}));

function query(q) {
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  const scored = [];
  for (const r of records) {
    let score = 0;
    for (const t of terms) {
      if (r.titleLc.includes(t)) score += 5;
      let i = -1, n = 0;
      while ((i = r.textLc.indexOf(t, i + 1)) !== -1 && n < 10) n++;
      score += n;
    }
    if (terms.every((t) => r.titleLc.includes(t) || r.textLc.includes(t))) score += 4;
    if (score > 0) scored.push({ r, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20).map(({ r }) => r);
}

function snippet(r, q) {
  const t = q.toLowerCase().split(/\s+/).find((x) => x.length > 1 && r.textLc.includes(x));
  if (!t) return esc(r.text.slice(0, 120)) + '…';
  const i = r.textLc.indexOf(t);
  const start = Math.max(0, i - 50);
  const raw = r.text.slice(start, i + 90);
  const safe = esc(raw).replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>');
  return (start ? '…' : '') + safe + '…';
}

const KIND = { phase: 'Phase', decision: 'Decision', materials: 'Materials', context: 'Context', reference: 'Reference' };

function render(q) {
  const box = dialog.querySelector('.search-results');
  if (!q.trim()) {
    box.innerHTML = `<p class="search-hint">Search steps, decisions, materials, specs — try “weep”, “SL36”, “epoxy grout”, “sill seal”.</p>`;
    return;
  }
  const hits = query(q);
  if (!hits.length) {
    box.innerHTML = `<p class="search-hint">Nothing matched “${esc(q)}”. Fewer or shorter words often help.</p>`;
    return;
  }
  box.innerHTML = `<ul class="search-hits">${hits
    .map(
      (r) => `<li><a href="${r.route}${r.anchor ? '@' + r.anchor : ''}" data-search-hit>
        <span class="hit-kind">${KIND[r.kind] ?? r.kind}</span>
        <span class="hit-title">${esc(r.title)}</span>
        <span class="hit-snippet">${snippet(r, q)}</span></a></li>`
    )
    .join('')}</ul>`;
}

function ensureDialog() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.id = 'search';
  dialog.innerHTML = `
    <div class="search-head">
      <input type="search" placeholder="Search the guide" aria-label="Search the guide" autocomplete="off" />
      <button data-search-close aria-label="Close search">✕</button>
    </div>
    <div class="search-results"></div>`;
  document.body.appendChild(dialog);

  const input = dialog.querySelector('input');
  input.addEventListener('input', () => render(input.value));
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-search-close]') || e.target === dialog) dialog.close();
    if (e.target.closest('[data-search-hit]')) dialog.close();
  });
}

export function openSearch() {
  ensureDialog();
  dialog.showModal();
  const input = dialog.querySelector('input');
  input.select();
  render(input.value);
}
