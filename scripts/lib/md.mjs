import { Marked } from 'marked';

/**
 * One shared marked instance (pinned version — token shapes matter).
 * External links open in a new tab; everything else is stock GFM.
 * All markdown→HTML happens here at ingest; the client ships no parser.
 */
export const marked = new Marked({
  gfm: true,
  // The guide uses "~" as "approximately" (~$10 ea, ~30%, ~18–20") — GFM
  // would strikethrough between tilde pairs, visually corrupting specs.
  // Nothing in the docs wants strikethrough, so the tokenizer is disabled.
  tokenizer: {
    del() {
      return undefined;
    },
  },
  renderer: {
    link(href, title, text) {
      const t = title ? ` title="${title}"` : '';
      const ext = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}"${t}${ext}>${text}</a>`;
    },
  },
});

/** Render a list of block tokens to HTML. */
export function blocksHtml(tokens) {
  return marked.parser(tokens).trim();
}

/** Render inline markdown (bold, links, code) to HTML. */
export function inlineHtml(text) {
  return marked.parseInline(text).trim();
}

/** Plain text of a token list (for IDs, search, validation probes). */
export function plainText(tokens) {
  let out = '';
  for (const t of tokens ?? []) {
    if (t.tokens?.length) out += plainText(t.tokens);
    else if (t.type === 'table') out += (t.raw ?? '').replace(/[|*]/g, ' ');
    else if (typeof t.text === 'string') out += t.text + (t.type === 'paragraph' || t.type === 'heading' ? ' ' : '');
    else if (t.raw) out += t.raw;
    if (t.type === 'paragraph' || t.type === 'heading' || t.type === 'list_item') out += ' ';
  }
  return out;
}
