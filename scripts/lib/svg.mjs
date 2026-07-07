import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

/**
 * Load every diagram SVG for inline embedding.
 * - Strips fixed width/height from the root element (keeps viewBox) so CSS
 *   controls sizing and the vector stays crisp at any scale.
 * - Prefixes any internal id="" / url(#…) / href="#…" per file so eight SVGs
 *   can share one DOM without collisions (currently none have ids — this is
 *   insurance for future diagram edits).
 * Returns { [filename]: { svg, title, viewBox, aspect } }.
 */
export function loadDiagrams(dir) {
  const out = {};
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
  for (const file of files) {
    let svg = readFileSync(join(dir, file), 'utf8').trim();
    const prefix = basename(file, '.svg').replace(/[^a-z0-9-]/gi, '') + '--';

    svg = svg
      .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`)
      .replace(/\bhref="#([^"]+)"/g, (_, id) => `href="#${prefix}${id}"`);

    const rootMatch = svg.match(/<svg\b[^>]*>/);
    if (!rootMatch) throw new Error(`ingest: ${file} has no <svg> root element`);
    const root = rootMatch[0];
    const viewBox = root.match(/viewBox="([^"]+)"/)?.[1];
    if (!viewBox) throw new Error(`ingest: ${file} has no viewBox — cannot scale responsively`);
    const newRoot = root
      .replace(/\s(width|height)="[^"]*"/g, '')
      .replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
    svg = svg.replace(root, newRoot);

    const title = svg.match(/<title>([^<]*)<\/title>/)?.[1] ?? basename(file, '.svg');
    const [, , w, h] = viewBox.split(/\s+/).map(Number);
    out[file] = { svg, title, viewBox, aspect: w / h };
  }
  return out;
}
