import content from '../data/content.json';
import { esc } from './ui.js';

/**
 * Diagram lightbox: the same inline SVG node, scaled with CSS transforms —
 * vector-crisp at any zoom, never rasterized. Wheel zoom, drag pan,
 * two-pointer pinch for the phone.
 */
let dialog = null;
let stage = null;
let scale = 1;
let tx = 0;
let ty = 0;

const pointers = new Map();
let pinchStart = null;

function apply() {
  stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function reset() {
  scale = 1;
  tx = 0;
  ty = 0;
  apply();
}

function zoomAt(factor, cx, cy) {
  const next = Math.min(8, Math.max(0.5, scale * factor));
  const k = next / scale;
  // keep the point under the cursor/pinch stationary
  const rect = dialog.querySelector('.lb-viewport').getBoundingClientRect();
  const px = cx - rect.left - rect.width / 2;
  const py = cy - rect.top - rect.height / 2;
  tx = px - k * (px - tx);
  ty = py - k * (py - ty);
  scale = next;
  apply();
}

function ensureDialog() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.id = 'lightbox';
  dialog.innerHTML = `
    <div class="lb-bar">
      <span class="lb-title"></span>
      <div class="lb-controls">
        <button data-lb="out" aria-label="Zoom out">−</button>
        <button data-lb="reset" aria-label="Reset zoom">reset</button>
        <button data-lb="in" aria-label="Zoom in">+</button>
        <button data-lb="close" aria-label="Close">✕</button>
      </div>
    </div>
    <div class="lb-viewport"><div class="lb-stage"></div></div>`;
  document.body.appendChild(dialog);
  stage = dialog.querySelector('.lb-stage');
  const viewport = dialog.querySelector('.lb-viewport');

  dialog.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lb]');
    if (!btn) return;
    const rect = viewport.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (btn.dataset.lb === 'close') dialog.close();
    else if (btn.dataset.lb === 'reset') reset();
    else zoomAt(btn.dataset.lb === 'in' ? 1.4 : 1 / 1.4, cx, cy);
  });
  dialog.addEventListener('close', () => pointers.clear());

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }, { passive: false });

  viewport.addEventListener('pointerdown', (e) => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  });
  viewport.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    if (pointers.size === 1) {
      tx += cur.x - prev.x;
      ty += cur.y - prev.y;
      apply();
    }
    pointers.set(e.pointerId, cur);
    if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const target = pinchStart.scale * (dist / pinchStart.dist);
      zoomAt(target / scale, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  });
  const lift = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  viewport.addEventListener('pointerup', lift);
  viewport.addEventListener('pointercancel', lift);
}

export function openLightbox(file) {
  const d = content.diagrams[file];
  if (!d) return;
  ensureDialog();
  dialog.querySelector('.lb-title').textContent = d.title;
  stage.innerHTML = d.svg;
  reset();
  dialog.showModal();
}
