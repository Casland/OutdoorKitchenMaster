/**
 * Publish dist/index.html to the gh-pages branch without touching the working
 * tree (git plumbing only — no checkout, no worktree). Run via `npm run deploy`,
 * which builds first. The branch is a single history-less commit each time.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const git = (args, input) =>
  execFileSync('git', args, { encoding: 'utf8', input }).trim();

if (!existsSync('dist/index.html')) {
  console.error('deploy: dist/index.html missing — run the build first (npm run deploy does).');
  process.exit(1);
}

const blob = git(['hash-object', '-w', 'dist/index.html']);
const nojekyll = git(['hash-object', '-w', '--stdin'], '');
const tree = git(['mktree'], `100644 blob ${blob}\tindex.html\n100644 blob ${nojekyll}\t.nojekyll\n`);
const head = git(['rev-parse', '--short', 'HEAD']);
const commit = git(['commit-tree', tree, '-m', `Deploy site (source ${head})`]);
git(['push', 'origin', `${commit}:refs/heads/gh-pages`, '--force']);
console.log(`deployed ${commit.slice(0, 7)} → gh-pages (source ${head})`);
