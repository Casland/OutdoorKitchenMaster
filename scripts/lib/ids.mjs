import { createHash } from 'node:crypto';

/** Normalize the unicode minus (U+2212) to an ASCII hyphen. */
export function normalizeMinus(s) {
  return s.replace(/−/g, '-');
}

/** Plain-text normalization used for stable checklist IDs. */
export function normalizeForId(text) {
  return normalizeMinus(String(text))
    .normalize('NFC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** 8-hex-char sha1 of normalized text. */
export function hash8(text) {
  return createHash('sha1').update(normalizeForId(text), 'utf8').digest('hex').slice(0, 8);
}

/**
 * Stable checklist-item ID: `p<phase>.<hash8>`, with `-2`, `-3`… suffixes for
 * duplicate normalized text within the same phase (document order).
 * `seen` is a Map the caller threads through one phase's parse.
 */
export function stableId(phaseNum, text, seen, prefix = '') {
  const base = `p${phaseNum}.${prefix}${hash8(text)}`;
  const count = (seen.get(base) || 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

/** URL-safe slug from a heading (emoji and punctuation stripped, U+2212 kept as hyphen). */
export function slugify(text) {
  return normalizeMinus(String(text))
    .normalize('NFKD')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}️⚠]/gu, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'section';
}
