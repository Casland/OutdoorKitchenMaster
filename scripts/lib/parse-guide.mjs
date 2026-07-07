import { marked, blocksHtml, inlineHtml, plainText } from './md.mjs';
import { normalizeMinus, slugify, stableId } from './ids.mjs';

const PHASE_H1 = /^Phase\s+(-?\d+)\s+—\s+(.+)$/u;
const STEP_H3 = /^Step\s+([\d.]+[ab]?)\s+—\s+(.+)$/u;
const GATE_LEAD = /^\*\*Check before moving on:\*\*/u;

/**
 * build-guide.md → structured guide object. Token-walk only — a construct this
 * parser doesn't recognize becomes an html block verbatim; nothing is dropped.
 * Throws loudly on structural surprises (missing diagram file, no phases).
 */
export function parseGuide(src, diagrams) {
  const tokens = marked.lexer(src);

  // ---- partition top-level H1 sections ----
  const buckets = []; // { kind: 'preamble'|'phase'|'materials'|'tools'|'visual'|'links'|'open', heading, tokens }
  let current = { kind: 'preamble', heading: null, tokens: [] };
  buckets.push(current);

  for (const tok of tokens) {
    if (tok.type === 'heading' && tok.depth === 1) {
      const text = normalizeMinus(tok.text);
      if (current.kind === 'preamble' && current.tokens.length === 0 && buckets.length === 1 && !PHASE_H1.test(text)) {
        current.docTitle = tok.text; // the document's own title H1
        continue;
      }
      let kind;
      if (PHASE_H1.test(text)) kind = 'phase';
      else if (/^Master Materials List/i.test(text)) kind = 'materials';
      else if (/^Tools$/i.test(text)) kind = 'tools';
      else if (/^Visual Reference Library/i.test(text)) kind = 'visual';
      else if (/^Reference Links/i.test(text)) kind = 'links';
      else if (/Remaining Open Decisions/i.test(text)) kind = 'open';
      else throw new Error(`ingest: unrecognized top-level H1 in build-guide.md: "${tok.text}"`);
      current = { kind, heading: tok.text, tokens: [] };
      buckets.push(current);
    } else if (tok.type !== 'hr' || current.kind !== 'preamble') {
      current.tokens.push(tok);
    }
  }

  const phases = buckets.filter((b) => b.kind === 'phase').map((b) => parsePhase(b, diagrams));
  if (phases.length === 0) throw new Error('ingest: no "# Phase N —" sections found in build-guide.md');

  const one = (kind) => buckets.find((b) => b.kind === kind);

  return {
    title: buckets[0].docTitle ?? 'Build Guide',
    ...parsePreamble(buckets[0].tokens),
    phases,
    materials: parseMaterials(one('materials')),
    toolsHtml: bucketHtml(one('tools')),
    visualLibraryHtml: bucketHtml(one('visual')),
    referenceLinksHtml: bucketHtml(one('links')),
    openDecisionsDoc: parseOpenDecisions(one('open')),
  };
}

function bucketHtml(bucket) {
  if (!bucket) return '';
  return blocksHtml(bucket.tokens);
}

// ---- preamble: subtitle, at-a-glance (locked table), build order (pipeline) ----
function parsePreamble(tokens) {
  const sections = splitOnHeading(tokens, 2);
  const glance = sections.find((s) => /Build at a Glance/i.test(s.title ?? ''));
  const order = sections.find((s) => /Correct Build Order/i.test(s.title ?? ''));
  if (!glance || !order) throw new Error('ingest: preamble is missing "The Build at a Glance" or "Correct Build Order"');

  // subtitle = leading italic paragraphs before the first H2
  const lead = sections.find((s) => s.title === null);
  const subtitleHtml = lead ? blocksHtml(lead.tokens) : '';

  const tableTok = glance.tokens.find((t) => t.type === 'table');
  if (!tableTok) throw new Error('ingest: locked-decisions table not found in "The Build at a Glance"');
  const before = glance.tokens.slice(0, glance.tokens.indexOf(tableTok));
  const after = glance.tokens.slice(glance.tokens.indexOf(tableTok) + 1);

  // the table's own lead-in ("Locked decisions (from our chats):") travels with the table, not the hero intro
  let tableLead = [];
  const lastBefore = before.filter((t) => t.type === 'paragraph').at(-1);
  if (lastBefore && /locked decisions/i.test(lastBefore.text)) {
    tableLead = before.splice(before.indexOf(lastBefore), 1);
  }

  const codeTok = order.tokens.find((t) => t.type === 'code');
  if (!codeTok) throw new Error('ingest: build-order code block not found in "Correct Build Order"');
  const pipeline = codeTok.text.split(/\r?\n/).filter((l) => l.trim()).map((line) => {
    const m = normalizeMinus(line).match(/^Phase\s+(-?\d+)\s+(.+)$/);
    if (!m) throw new Error(`ingest: unparseable pipeline line: "${line}"`);
    return { num: Number(m[1]), label: m[2].trim() };
  });

  return {
    subtitleHtml,
    atAGlance: {
      introHtml: blocksHtml(before),
      tableLeadHtml: blocksHtml(tableLead),
      lockedTable: tableToData(tableTok),
      notesHtml: blocksHtml(after),
    },
    buildOrder: {
      html: blocksHtml(order.tokens.filter((t) => t.type !== 'code')),
      pipeline,
    },
  };
}

// ---- phases ----
function parsePhase(bucket, diagrams) {
  const m = normalizeMinus(bucket.heading).match(PHASE_H1);
  const num = Number(m[1]);
  const seen = new Map(); // duplicate-text ID disambiguation, threaded per phase

  const rawSections = splitOnHeading(bucket.tokens, 3);
  const sections = rawSections
    .filter((s) => s.title !== null || s.tokens.length)
    .map((s) => {
      let kind = 'section';
      let stepNo = null;
      let title = s.title;
      if (title === null) {
        kind = 'intro';
      } else {
        const sm = title.match(STEP_H3);
        if (sm) {
          kind = 'step';
          stepNo = sm[1];
        } else if (/^(Materials|Buying specs)/i.test(title)) {
          kind = 'materials';
        }
      }
      return {
        kind,
        stepNo,
        title,
        slug: title ? slugify(title) : `phase-${num}-intro`,
        blocks: parseBlocks(s.tokens, { phaseNum: num, seen, diagrams, checkable: kind !== 'materials' }),
      };
    });

  return { num, id: `phase-${num}`, title: m[2].trim(), heading: bucket.heading, sections };
}

/** Token list → typed blocks: html | diagram | gate | checklist | table. */
function parseBlocks(tokens, ctx) {
  const blocks = [];
  for (const tok of tokens) {
    if (tok.type === 'space') continue;
    if (tok.type === 'paragraph') {
      // A diagram reference at the head of a paragraph (with or without a blank
      // line before the following text) becomes a diagram block; any prose
      // sharing the paragraph is rendered after it.
      const img = leadImage(tok);
      if (img) {
        const file = img.href;
        if (!ctx.diagrams[file]) throw new Error(`ingest: diagram "${file}" referenced but not found in diagrams/`);
        blocks.push({ type: 'diagram', file, alt: img.text || ctx.diagrams[file].title });
        const rest = trailingTokens(tok, img);
        if (rest.length) {
          const html = blocksHtml([{ ...tok, tokens: rest, raw: '', text: rest.map((t) => t.raw ?? '').join('') }]);
          if (html.trim()) blocks.push({ type: 'html', html });
        }
        continue;
      }
      if (GATE_LEAD.test(tok.raw.trim())) {
        const text = plainText(tok.tokens);
        blocks.push({
          type: 'gate',
          id: stableId(ctx.phaseNum, text, ctx.seen, 'gate.'),
          html: inlineHtml(tok.text),
        });
        continue;
      }
      blocks.push({ type: 'html', html: blocksHtml([tok]) });
    } else if (tok.type === 'list' && ctx.checkable) {
      blocks.push(listToChecklist(tok, ctx));
    } else if (tok.type === 'table') {
      blocks.push({ type: 'table', html: blocksHtml([tok]) });
    } else {
      blocks.push({ type: 'html', html: blocksHtml([tok]) });
    }
  }
  return blocks;
}

/**
 * A top-level list inside a step/section → checklist block. Each top-level
 * item is one checkable row; nested lists render as detail inside the row
 * (never separate checkboxes). GFM task items (- [ ]) are rows too.
 */
function listToChecklist(listTok, ctx) {
  const items = listTok.items.map((item) => {
    const nested = item.tokens.filter((t) => t.type === 'list');
    const own = item.tokens.filter((t) => t.type !== 'list');
    const text = plainText(own);
    return {
      id: stableId(ctx.phaseNum, text, ctx.seen),
      html: blocksHtml(own),
      detailsHtml: nested.length ? nested.map((n) => blocksHtml([n])).join('') : null,
      plain: text.replace(/\s+/g, ' ').trim(),
    };
  });
  return { type: 'checklist', ordered: !!listTok.ordered, items };
}

// ---- master materials ----
function parseMaterials(bucket) {
  if (!bucket) throw new Error('ingest: "Master Materials List" section not found');
  const sections = splitOnHeading(bucket.tokens, 3);
  const groups = [];
  let totalHtml = '';

  for (const s of sections) {
    if (s.title === null) continue;
    if (/Project total/i.test(s.title)) {
      totalHtml = inlineHtml(s.title) + blocksHtml(s.tokens);
      continue;
    }
    const tableTok = s.tokens.find((t) => t.type === 'table');
    if (!tableTok) throw new Error(`ingest: materials section "${s.title}" has no table`);
    const data = tableToData(tableTok);
    groups.push({
      title: s.title,
      slug: slugify(s.title),
      header: data.header,
      rows: data.rows.map((cells, i) => ({
        cells,
        plain: data.plainRows[i],
        isSubtotal: /subtotal/i.test(data.plainRows[i][0]),
      })),
      extraHtml: blocksHtml(s.tokens.filter((t) => t.type !== 'table')),
    });
  }
  if (!groups.length) throw new Error('ingest: no materials tables parsed');
  return { groups, totalHtml };
}

// ---- final ⚠️ open decisions section ----
function parseOpenDecisions(bucket) {
  if (!bucket) throw new Error('ingest: "Remaining Open Decisions" section not found');
  const list = bucket.tokens.find((t) => t.type === 'list');
  if (!list) throw new Error('ingest: open-decisions list not found');
  const intro = bucket.tokens.slice(0, bucket.tokens.indexOf(list));
  const items = list.items.map((item, i) => {
    const plain = plainText(item.tokens).replace(/\s+/g, ' ').trim();
    return {
      n: i + 1,
      html: blocksHtml(item.tokens),
      plain,
      deadline: plain.match(/Deadline:\s*([^.]+(?:\.\d+)?)[.]/)?.[1]?.trim() ?? null,
    };
  });
  return { heading: bucket.heading, introHtml: blocksHtml(intro), items };
}

// ---- shared helpers ----
function splitOnHeading(tokens, depth) {
  const out = [{ title: null, tokens: [] }];
  for (const tok of tokens) {
    if (tok.type === 'heading' && tok.depth === depth) {
      out.push({ title: tok.text, tokens: [] });
    } else {
      out.at(-1).tokens.push(tok);
    }
  }
  return out;
}

function leadImage(paragraphTok) {
  const toks = paragraphTok.tokens ?? [];
  const first = toks.find((t) => !(t.type === 'text' && !t.text.trim()) && t.type !== 'br');
  return first?.type === 'image' ? first : null;
}

function trailingTokens(paragraphTok, img) {
  const toks = paragraphTok.tokens ?? [];
  const rest = toks.slice(toks.indexOf(img) + 1);
  while (rest.length && ((rest[0].type === 'text' && !rest[0].text.trim()) || rest[0].type === 'br')) rest.shift();
  return rest;
}

function tableToData(tableTok) {
  const cellHtml = (cell) => inlineHtml(cell.text ?? '');
  const cellPlain = (cell) => plainText(cell.tokens ?? []).replace(/\s+/g, ' ').trim();
  return {
    header: tableTok.header.map(cellHtml),
    rows: tableTok.rows.map((r) => r.map(cellHtml)),
    plainRows: tableTok.rows.map((r) => r.map(cellPlain)),
  };
}
