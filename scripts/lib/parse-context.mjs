import { marked, blocksHtml, plainText } from './md.mjs';
import { slugify } from './ids.mjs';

/**
 * project-context.md → { title, sections: [{ slug, title, html, plain }],
 *   principles: [html], statusHtml, interimHtml, oneParagraphHtml }
 * H2-sectioned prose. A few sections get pulled out for the dashboard:
 * design-philosophy principles, current status, interim states.
 */
export function parseContext(src) {
  const tokens = marked.lexer(src);
  const sections = [];
  let current = null;
  let title = 'Project Context';

  for (const tok of tokens) {
    if (tok.type === 'heading' && tok.depth === 1) {
      title = tok.text;
    } else if (tok.type === 'heading' && tok.depth === 2) {
      current = { slug: slugify(tok.text), title: tok.text, tokens: [] };
      sections.push(current);
    } else if (current) {
      current.tokens.push(tok);
    }
  }
  if (!sections.length) throw new Error('ingest: no H2 sections found in project-context.md');

  const find = (re) => sections.find((s) => re.test(s.title));

  const philosophy = find(/^Design philosophy/i);
  const principles = [];
  if (philosophy) {
    const list = philosophy.tokens.find((t) => t.type === 'list');
    for (const item of list?.items ?? []) principles.push(blocksHtml(item.tokens));
  }

  const status = find(/^Current status/i);
  const interim = find(/^Interim states/i);
  const onePara = find(/build in one paragraph/i);

  return {
    title,
    sections: sections.map((s) => ({
      slug: s.slug,
      title: s.title,
      html: blocksHtml(s.tokens),
      plain: plainText(s.tokens).replace(/\s+/g, ' ').trim(),
    })),
    principles,
    statusHtml: status ? blocksHtml(status.tokens) : '',
    interimHtml: interim ? blocksHtml(interim.tokens) : '',
    oneParagraphHtml: onePara ? blocksHtml(onePara.tokens) : '',
  };
}
