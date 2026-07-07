import content from '../data/content.json';

/**
 * Checklist progress, persisted in localStorage under one key.
 * IDs are content-derived (hash of item text): editing an item's text in
 * build-guide.md resets that one checkbox by design — the content changed,
 * re-verify it. Retired IDs move to `orphaned` so nothing is silently lost.
 */
const KEY = 'okm.progress.v1';
const UI_KEY = 'okm.ui.v1';

const allIds = new Set([
  ...Object.values(content.checkables).flat(),
  ...Object.values(content.buyables).flat(),
]);
const listeners = new Set();

function load() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    data = {};
  }
  const state = { version: 1, updatedAt: data.updatedAt ?? null, checks: {}, orphaned: { ...(data.orphaned ?? {}) } };
  for (const [id, v] of Object.entries(data.checks ?? {})) {
    if (allIds.has(id)) state.checks[id] = v;
    else state.orphaned[id] = v;
  }
  return state;
}

let state = load();

function persist() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const fn of listeners) fn();
}

export const progress = {
  isDone: (id) => !!state.checks[id]?.done,

  toggle(id) {
    if (state.checks[id]?.done) delete state.checks[id];
    else state.checks[id] = { done: true, at: new Date().toISOString() };
    persist();
  },

  phaseStats(num) {
    const ids = content.checkables[num] ?? [];
    const done = ids.filter((id) => state.checks[id]?.done).length;
    return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
  },

  buyStats(num) {
    const ids = content.buyables[num] ?? [];
    const done = ids.filter((id) => state.checks[id]?.done).length;
    return { done, total: ids.length };
  },

  idsDone(ids) {
    return ids.filter((id) => state.checks[id]?.done).length;
  },

  totalStats() {
    let done = 0, total = 0;
    for (const num of Object.keys(content.checkables)) {
      const s = this.phaseStats(num);
      done += s.done;
      total += s.total;
    }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  },

  orphanCount: () => Object.keys(state.orphaned).length,

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `okm-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  /** Merge an exported file back in; per-item latest-timestamp wins. */
  importJson(text) {
    const incoming = JSON.parse(text);
    if (!incoming || typeof incoming.checks !== 'object') throw new Error('Not a progress export file.');
    let merged = 0;
    for (const [id, v] of Object.entries({ ...incoming.checks, ...incoming.orphaned })) {
      if (!v?.done) continue;
      const bucket = allIds.has(id) ? state.checks : state.orphaned;
      const mine = bucket[id];
      if (!mine || (v.at ?? '') > (mine.at ?? '')) {
        bucket[id] = v;
        merged++;
      }
    }
    persist();
    return merged;
  },

  resetPhase(num) {
    for (const id of content.checkables[num] ?? []) delete state.checks[id];
    persist();
  },
};

/**
 * The "you are here" pin — one cursor for one build. Set by the phase runner
 * (jumping or advancing moves it); read by the dashboard's resume chip.
 */
const HERE_KEY = 'okm.here.v1';
export const here = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(HERE_KEY)) ?? null;
    } catch {
      return null;
    }
  },
  set(phase, station, label) {
    try {
      localStorage.setItem(HERE_KEY, JSON.stringify({ phase, station, label, at: new Date().toISOString() }));
    } catch {
      /* private mode — pin just won't persist */
    }
  },
};

export const ui = {
  get(k, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(UI_KEY) ?? '{}')[k] ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}');
    } catch {
      data = {};
    }
    data[k] = v;
    localStorage.setItem(UI_KEY, JSON.stringify(data));
  },
};
