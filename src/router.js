/**
 * Hash router. Routes look like `#/phase/1`, with an optional in-page anchor
 * after `@`: `#/phase/1@step-16-openings…`. Hash-only routing is deliberate —
 * the built file must work from file:// where the history API is useless.
 */
const routes = [];

export function route(pattern, handler) {
  // pattern like '/phase/:num' — ':x' captures one segment (may be negative number)
  const names = [];
  const rx = new RegExp(
    '^' +
      pattern
        .split('/')
        .map((seg) => {
          if (seg.startsWith(':')) {
            names.push(seg.slice(1));
            return '([^/]+)';
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/') +
      '$'
  );
  routes.push({ rx, names, handler });
}

export function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, anchor] = raw.split('@');
  return { path: path || '/', anchor: anchor || null };
}

export function navigate(path, anchor = null) {
  location.hash = anchor ? `${path}@${anchor}` : path;
}

let currentPath = null;

export function dispatch() {
  const { path, anchor } = parseHash();
  const samePage = path === currentPath;
  currentPath = path;

  if (!samePage) {
    for (const { rx, names, handler } of routes) {
      const m = path.match(rx);
      if (m) {
        const params = {};
        names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
        handler(params);
        afterRender(anchor, false);
        return;
      }
    }
    document.querySelector('#page').innerHTML =
      `<div class="empty"><p>No page at <code>${path}</code>.</p><p><a href="#/">Back to the dashboard</a></p></div>`;
  } else {
    afterRender(anchor, true);
  }
}

function afterRender(anchor, smooth) {
  requestAnimationFrame(() => {
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        el.classList.add('anchor-hit');
        setTimeout(() => el.classList.remove('anchor-hit'), 2000);
        return;
      }
    }
    if (!smooth) window.scrollTo(0, 0);
  });
}

export function startRouter() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}

/** Force the current page to re-render (e.g. after a progress import). */
export function rerender() {
  currentPath = null;
  dispatch();
}
