import content from '../data/content.json';
import { progress, here } from '../store/progress.js';
import { parseHash } from '../router.js';
import { esc, phaseLabel, phaseByNum, progressBar, renderBlocks, decisionChips } from '../components/ui.js';

/**
 * Phase page — "Step Runner" (design-funnel round 1 winner, graduated).
 * The phase is a sequence of stations: a pre-flight buy screen, then each
 * step/section, with gates split out as their own confirm stations. One
 * station is "current" (the ⌖ pin, okm.here.v1); a sticky tracker under the
 * site nav shows the station dots with the progress rail beneath. Station
 * headers toggle open/closed; Next advances the pin. Everything renders in
 * the DOM (collapse is presentational), so print shows the whole phase.
 */

// ---- station assembly ----------------------------------------------------

export function buildStations(phase) {
  const stations = [];
  const shopping = content.shopping[phase.num] ?? [];
  const vids = content.tutorials.filter((v) => v.phase === phase.num);
  const generalVids = vids.filter((v) => !v.slug);

  const preflight = {
    sid: 'preflight',
    kind: 'preflight',
    short: 'PF',
    title: 'Pre-flight — buy list & prep',
    introHtml: '',
    guideSections: [],
    shopping,
    videos: generalVids,
  };
  stations.push(preflight);

  let ordinal = 0;
  for (const sec of phase.sections) {
    const secVids = vids.filter((v) => v.slug && v.slug === sec.slug);
    const hasWork = sec.blocks.some((b) => b.type === 'checklist' || b.type === 'diagram' || b.type === 'gate');

    if (sec.kind === 'materials' || (sec.kind === 'intro' && !hasWork)) {
      preflight.guideSections.push(sec);
      preflight.videos.push(...secVids);
      continue;
    }

    const gi = sec.blocks.findIndex((b) => b.type === 'gate');
    const workBlocks = gi >= 0 ? sec.blocks.filter((b) => b.type !== 'gate') : sec.blocks;
    ordinal += 1;
    stations.push({
      sid: sec.slug,
      kind: 'work',
      stepNo: sec.stepNo,
      short: sec.stepNo ?? String(ordinal),
      title: sec.kind === 'intro' ? 'Overview & plan' : sec.stepNo ? sec.title.replace(/^Step\s+\S+\s+—\s+/u, '') : sec.title,
      blocks: workBlocks,
      videos: secVids,
      checkIds: collectCheckIds(workBlocks),
    });
    if (gi >= 0) {
      const gate = sec.blocks[gi];
      stations.push({
        sid: `${sec.slug}-gate`,
        kind: 'gate',
        short: 'G',
        title: 'Gate — check before moving on',
        blocks: [gate],
        videos: [],
        checkIds: [gate.id],
        afterTitle: sec.stepNo ? `Step ${sec.stepNo}` : sec.title,
      });
    }
  }
  preflight.checkIds = shopping.map((it) => it.id);
  return stations;
}

function collectCheckIds(blocks) {
  const ids = [];
  for (const b of blocks) {
    if (b.type === 'checklist') ids.push(...b.items.map((i) => i.id));
    if (b.type === 'gate') ids.push(b.id);
  }
  return ids;
}

// ---- markup ----------------------------------------------------------------

const SOURCE_CHIP = {
  guide: '<span class="buy-chip buy-chip-guide" title="Stated in the guide">guide</span>',
  estimate: '<span class="buy-chip buy-chip-est" title="Derived quantity — sanity-check before buying">est</span>',
  measure: '<span class="buy-chip buy-chip-measure" title="Measure on site before buying">measure first</span>',
};

export function buyRowHtml(it, { interactive = true } = {}) {
  const done = progress.isDone(it.id);
  const box = interactive
    ? `<label class="check-hit"><input type="checkbox" data-check-id="${it.id}" ${done ? 'checked' : ''} /><span class="box" aria-hidden="true"></span><span class="visually-hidden">picked up</span></label>`
    : `<span class="box print-box" aria-hidden="true">${done ? '✕' : ''}</span>`;
  return `
    <div class="buy-row check-row ${done ? 'done' : ''}" data-row="${it.id}">
      ${box}
      <div class="check-body">
        <p class="buy-line"><strong>${esc(it.item)}</strong> <span class="buy-qty">${esc(it.qty)} ${esc(it.unit)}</span> ${SOURCE_CHIP[it.source] ?? ''}</p>
        <p class="buy-spec">${esc(it.spec)}</p>
        <p class="buy-note">${esc(it.note)}</p>
      </div>
    </div>`;
}

export function videoHtml(v) {
  return `
    <div class="vid" data-video="${esc(v.videoId)}" role="button" tabindex="0" aria-label="Play video: ${esc(v.title)}">
      <span class="vid-thumb" aria-hidden="true">
        <img src="https://i.ytimg.com/vi/${esc(v.videoId)}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()" />
        <span class="vid-play">▶</span>
      </span>
      <span class="vid-txt">
        <span class="vid-tech">${esc(v.technique)}</span>
        <span class="vid-title">${esc(v.title)} · ${esc(v.channel)}</span>
        <span class="vid-note">${esc(v.note)}</span>
        <span class="vid-url">https://youtube.com/watch?v=${esc(v.videoId)}</span>
      </span>
    </div>`;
}

function stationMeta(st) {
  const parts = [];
  if (st.kind === 'preflight') {
    if (st.shopping.length) parts.push(`${st.shopping.length} items to buy`);
  } else {
    const n = st.checkIds.length;
    if (n) parts.push(`${n} ${n === 1 ? 'check' : 'checks'}`);
  }
  const d = (st.blocks ?? []).filter((b) => b.type === 'diagram').length;
  if (d) parts.push(d === 1 ? 'diagram' : `${d} diagrams`);
  if (st.videos?.length) parts.push(st.videos.length === 1 ? '1 video' : `${st.videos.length} videos`);
  if (st.od) parts.push('⚠ open decision');
  return parts.join(' · ');
}

function stationBodyHtml(st, phase) {
  let inner = '';
  if (st.od) {
    inner += `
      <aside class="open-banner">
        <span class="open-banner-mark">⚠️</span>
        <div>
          <strong>Open decision: ${esc(st.od.title)}</strong>
          <p>${esc(st.od.deadlineText)}.${st.od.method ? ` ${esc(st.od.method)}` : ''}</p>
          <p class="open-banner-links"><a href="#/decisions@${st.od.decisionRef}">Reasoning (${st.od.decisionRef})</a></p>
        </div>
      </aside>`;
  }
  if (st.videos?.length) {
    inner += `<div class="vid-strip"><span class="vid-strip-label">Technique</span>${st.videos.map(videoHtml).join('')}</div>`;
  }
  if (st.kind === 'preflight') {
    const bought = progress.buyStats(phase.num);
    inner += st.introHtml ? `<div class="prose">${st.introHtml}</div>` : '';
    if (st.shopping.length) {
      inner += `
        <p class="buy-legend muted">Source tags: <span class="buy-chip buy-chip-guide">guide</span> stated in the guide ·
          <span class="buy-chip buy-chip-est">est</span> derived — sanity-check ·
          <span class="buy-chip buy-chip-measure">measure first</span> measure on site before buying.
          <span data-buy-count>${bought.done}</span>/${st.shopping.length} picked up ·
          <a href="#/print/shopping/${phase.num}">printable list</a></p>
        <div class="checklist buy-list">${st.shopping.map((it) => buyRowHtml(it)).join('')}</div>`;
    }
    inner += st.guideSections
      .map((sec) => `${sec.title ? `<h3 class="pf-h3">${esc(sec.title)} <span class="pf-tag">from the guide — canonical</span></h3>` : ''}${renderBlocks(sec.blocks)}`)
      .join('');
  } else {
    inner += renderBlocks(st.blocks);
  }
  return inner;
}

function stationHtml(st, phase, idx, total, open) {
  const state = stationState(st);
  const isGate = st.kind === 'gate';
  return `
    <details class="station ${isGate ? 'station-gate' : ''}" id="${st.sid}" data-station="${st.sid}" ${open ? 'open' : ''}>
      <summary class="st-head">
        <span class="st-no ${state}">${esc(st.short)}</span>
        <span class="st-headtxt">
          <span class="st-title">${esc(st.title)}${isGate && st.afterTitle ? ` <span class="st-after">after ${esc(st.afterTitle)}</span>` : ''}</span>
          <span class="st-meta">${esc(stationMeta(st))}</span>
        </span>
        <span class="st-state" data-st-state>${state === 'done' ? '✓' : state === 'partial' ? '◐' : ''}</span>
        <span class="section-caret" aria-hidden="true"></span>
      </summary>
      <div class="st-body">
        ${stationBodyHtml(st, phase)}
        <div class="st-controls no-print">
          ${idx > 0 ? `<button class="btn" data-run="back">‹ Back</button>` : '<span></span>'}
          ${idx < total - 1
            ? `<button class="btn btn-primary st-next" data-run="next"${isGate ? ` data-gate-arm="${st.checkIds[0]}"` : ''}>${st.kind === 'preflight' ? 'Start work ›' : 'Next station ›'}</button>`
            : `<button class="btn btn-primary st-next" data-run="finish"${isGate ? ` data-gate-arm="${st.checkIds[0]}"` : ''}>Phase done — overview ›</button>`}
        </div>
      </div>
    </details>`;
}

function stationState(st) {
  const ids = st.checkIds ?? [];
  if (!ids.length) return 'plain';
  const done = progress.idsDone(ids);
  return done === ids.length ? 'done' : done > 0 ? 'partial' : 'todo';
}

// ---- page ------------------------------------------------------------------

export function renderPhase(params) {
  const num = Number(params.num);
  const phase = phaseByNum(num);
  const page = document.querySelector('#page');
  if (!phase) {
    page.innerHTML = `<div class="empty"><p>No phase ${esc(params.num)}.</p><p><a href="#/">Back to the dashboard</a></p></div>`;
    return;
  }

  const order = content.guide.phases.map((p) => p.num);
  const idx = order.indexOf(num);
  const prev = idx > 0 ? content.guide.phases[idx - 1] : null;
  const next = idx < order.length - 1 ? content.guide.phases[idx + 1] : null;
  const stats = progress.phaseStats(num);
  const pipelineLabel = content.guide.buildOrder.pipeline.find((p) => p.num === num)?.label ?? '';

  const stations = buildStations(phase);
  const od = content.openDecisions.find((o) => o.status === 'open' && o.deadlinePhase === num);
  if (od) {
    const target = stations.find((s) => od.deadlineAnchor && s.sid === od.deadlineAnchor) ?? null;
    if (target) target.od = od;
    else stations[0].od = od;
  }

  // which station opens: deep-link anchor > this phase's pin > first incomplete
  const { anchor } = parseHash();
  const pin = here.get();
  const pinnedSid = pin && pin.phase === num ? pin.station : null;
  let openSid = null;
  if (anchor) openSid = (stations.find((s) => s.sid === anchor || `${s.sid}-gate` === anchor) ?? {}).sid ?? null;
  if (!openSid && pinnedSid && stations.some((s) => s.sid === pinnedSid)) openSid = pinnedSid;
  if (!openSid) openSid = (stations.find((s) => stationState(s) !== 'done') ?? stations[0]).sid;

  const dots = stations
    .map(
      (st) => `
      <button class="dot ${stationState(st)}" data-dot="${st.sid}" aria-label="${esc(st.title)}" title="${esc(st.title)}">
        <span class="dot-mark" aria-hidden="true"></span>
        <span class="dot-lbl">${esc(st.short)}</span>
      </button>`
    )
    .join('');

  page.innerHTML = `
    <article class="phase-page runner" data-phase="${num}">
      <header class="phase-head">
        <p class="kicker">Phase ${phaseLabel(num)} · ${idx + 1} of ${order.length}${pipelineLabel ? ` · ${esc(pipelineLabel)}` : ''}</p>
        <h1>${esc(phase.title)}</h1>
        <p class="phase-actions no-print">
          <a class="btn" href="#/print/phase/${num}">Print this phase</a>
          ${(content.shopping[num] ?? []).length ? `<a class="btn" href="#/print/shopping/${num}">Shopping list</a>` : ''}
        </p>
      </header>

      <div class="run-top no-print">
        <div class="run-scrub" data-scrub>${dots}</div>
        <div class="run-track">
          <div class="run-track-bar" data-progress-phase="${num}">${progressBar(stats)}</div>
          <span class="run-here" data-run-here></span>
        </div>
      </div>

      <div class="run-stations">
        ${stations.map((st, i) => stationHtml(st, phase, i, stations.length, st.sid === openSid)).join('')}
      </div>

      ${decisionChips(num)}
      <nav class="phase-pager">
        ${prev ? `<a class="pager-prev" href="#/phase/${prev.num}"><span>← Phase ${phaseLabel(prev.num)}</span>${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="pager-next" href="#/phase/${next.num}"><span>Phase ${phaseLabel(next.num)} →</span>${esc(next.title)}</a>` : '<span></span>'}
      </nav>
    </article>`;

  wireRunner(page.querySelector('.runner'), stations, num, openSid, { scrollToPin: !anchor && !!pinnedSid });
}

// ---- behavior --------------------------------------------------------------

function wireRunner(root, stations, phaseNum, openSid, { scrollToPin }) {
  const els = {};
  root.querySelectorAll('details[data-station]').forEach((el) => (els[el.dataset.station] = el));
  const dots = {};
  root.querySelectorAll('[data-dot]').forEach((el) => (dots[el.dataset.dot] = el));
  const sids = stations.map((s) => s.sid);
  let current = openSid;

  const setCurrent = (sid, { scroll = true, pin = true } = {}) => {
    current = sid;
    const st = stations.find((s) => s.sid === sid);
    for (const [k, el] of Object.entries(els)) el.classList.toggle('current', k === sid);
    for (const [k, el] of Object.entries(dots)) el.classList.toggle('current', k === sid);
    const hereEl = root.querySelector('[data-run-here]');
    if (hereEl && st) hereEl.textContent = `⌖ ${st.kind === 'preflight' ? 'Pre-flight' : st.stepNo ? `Step ${st.stepNo}` : st.title}`;
    dots[sid]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (pin && st) here.set(phaseNum, sid, `Phase ${phaseLabel(phaseNum)} · ${st.stepNo ? `Step ${st.stepNo}` : st.title}`);
    if (scroll) {
      requestAnimationFrame(() => {
        const y = els[sid].getBoundingClientRect().top + window.scrollY - topOffset(root);
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }
  };

  const topOffset = (r) => {
    const strip = r.querySelector('.run-top');
    return (strip ? strip.getBoundingClientRect().height : 0) + 104;
  };

  const refreshStates = () => {
    for (const st of stations) {
      const state = stationState(st);
      const dot = dots[st.sid];
      if (dot) {
        dot.classList.toggle('done', state === 'done');
        dot.classList.toggle('partial', state === 'partial');
      }
      const no = els[st.sid]?.querySelector('.st-no');
      if (no) no.className = `st-no ${state}`;
      const stateEl = els[st.sid]?.querySelector('[data-st-state]');
      if (stateEl) stateEl.textContent = state === 'done' ? '✓' : state === 'partial' ? '◐' : '';
    }
    // gate arming + preflight picked-up counter
    root.querySelectorAll('[data-gate-arm]').forEach((btn) => {
      btn.disabled = !progress.isDone(btn.dataset.gateArm);
      btn.title = btn.disabled ? 'Check the gate first — run it now, not from memory' : '';
    });
    const buyCount = root.querySelector('[data-buy-count]');
    if (buyCount) buyCount.textContent = progress.buyStats(phaseNum).done;
  };

  // header taps: opening a station makes it current (pins); closing just closes
  for (const el of Object.values(els)) {
    el.addEventListener('toggle', () => {
      if (el.open && el.dataset.station !== current) setCurrent(el.dataset.station, { scroll: false });
    });
  }

  // dots jump (open + pin + scroll)
  root.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-dot]');
    if (dot) {
      const sid = dot.dataset.dot;
      els[sid].open = true;
      setCurrent(sid);
      return;
    }
    const run = e.target.closest('[data-run]');
    if (run) {
      const dir = run.dataset.run;
      if (dir === 'finish') {
        location.hash = '#/';
        return;
      }
      const i = sids.indexOf(current);
      const target = dir === 'next' ? sids[Math.min(i + 1, sids.length - 1)] : sids[Math.max(i - 1, 0)];
      if (target !== current) {
        els[current].open = false;
        els[target].open = true;
        setCurrent(target);
      }
      return;
    }
    const vid = e.target.closest('[data-video]');
    if (vid) playVideo(vid);
  });

  root.addEventListener('keydown', (e) => {
    const vid = e.target.closest?.('[data-video]');
    if (vid && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      playVideo(vid);
    }
  });

  // any checkbox change inside the runner refreshes dots/gates/counters
  root.addEventListener('change', (e) => {
    if (e.target.closest('[data-check-id]')) requestAnimationFrame(refreshStates);
  });

  refreshStates();
  setCurrent(openSid, { scroll: scrollToPin, pin: false });
}

function playVideo(el) {
  const id = el.dataset.video;
  if (!id || el.querySelector('iframe')) return;
  el.classList.add('vid-playing');
  el.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="Technique video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}

/** Detailed buy list for a phase (shared with materials + print pages). */
export function shoppingRows(num) {
  return content.shopping[num] ?? [];
}