import { marked, blocksHtml, plainText } from './md.mjs';

const STATUS = { '🔒': 'locked', '⚠️': 'open', '⚠': 'open', '🔄': 'superseded' };

/**
 * decisions.md → [{ id, num, title, status, alsoOpen, html, plain }]
 * Entries are `### D01 — Title 🔒` H3s; body runs to the next H3.
 * Status = first status emoji in the heading; `alsoOpen` marks locked
 * decisions carrying an ⚠️ sub-decision (D07 hinge type, D13 tile choice).
 */
export function parseDecisions(src) {
  const tokens = marked.lexer(src);
  const decisions = [];
  let current = null;

  for (const tok of tokens) {
    if (tok.type === 'heading' && tok.depth === 3) {
      const m = tok.text.match(/^D(\d+)\s+—\s+(.*)$/u);
      if (!m) throw new Error(`ingest: unrecognized decision heading: "${tok.text}"`);
      const emojis = [...m[2].matchAll(/🔒|⚠️|⚠|🔄/gu)].map((e) => STATUS[e[0]]);
      if (!emojis.length) throw new Error(`ingest: decision D${m[1]} has no status emoji`);
      current = {
        id: `D${m[1]}`,
        num: Number(m[1]),
        title: m[2].replace(/\s*(🔒|⚠️|⚠|🔄)\s*/gu, ' ').replace(/\s+/g, ' ').trim(),
        status: emojis[0],
        alsoOpen: emojis[0] === 'locked' && emojis.includes('open'),
        bodyTokens: [],
      };
      decisions.push(current);
    } else if (current && tok.type !== 'hr') {
      current.bodyTokens.push(tok);
    }
  }

  if (decisions.length === 0) throw new Error('ingest: no decisions parsed from decisions.md');
  return decisions.map(({ bodyTokens, ...d }) => ({
    ...d,
    html: blocksHtml(bodyTokens),
    plain: plainText(bodyTokens).replace(/\s+/g, ' ').trim(),
  }));
}
