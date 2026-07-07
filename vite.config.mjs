import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Re-run the content pipeline whenever a source doc changes during dev.
 * Without this, editing docs/build-guide.md would silently show stale content —
 * the markdown is the source of truth, so ingest must chase it.
 */
function reingest() {
  let root;
  return {
    name: 'okm-reingest',
    configResolved(c) {
      root = c.root;
    },
    configureServer(server) {
      const dirs = [resolve(root, 'docs'), resolve(root, 'content'), resolve(root, 'diagrams')];
      server.watcher.add(dirs);
      server.watcher.on('change', (file) => {
        const f = file.replace(/\\/g, '/');
        if (/\/(docs|content|diagrams)\//.test(f) && !/model-3d/.test(f)) {
          const r = spawnSync(process.execPath, [resolve(root, 'scripts/ingest.mjs')], { stdio: 'inherit' });
          if (r.status !== 0) console.error('ingest failed — content.json NOT updated');
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [reingest(), viteSingleFile()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    modulePreload: { polyfill: false },
    reportCompressedSize: false,
  },
});
