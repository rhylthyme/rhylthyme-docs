'use strict';
// npm run build:playground: bundles the "Try it live" overlay (CodeMirror, the
// pinned @rhylthyme/timeline engine, element and schedule module) into
// docs/javascripts/playground.bundle.js. The file is built, never committed.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const OUTFILE = path.join(ROOT, 'docs', 'javascripts', 'playground.bundle.js');

// playground/src/json-line.js is CommonJS (Node tests require it), so its
// require('@lezer/json') would pull in the CommonJS build of the Lezer
// packages next to the ES build CodeMirror imports. Resolve it as an import
// so the bundle has one copy.
const lezerOnce = {
  name: 'lezer-once',
  setup(build) {
    build.onResolve({ filter: /^@lezer\// }, (args) =>
      args.kind === 'require-call'
        ? build.resolve(args.path, { kind: 'import-statement', resolveDir: args.resolveDir })
        : undefined,
    );
  },
};

esbuild
  .build({
    entryPoints: [path.join(ROOT, 'playground', 'src', 'panel.js')],
    bundle: true,
    format: 'iife', // panel.js sets window.RhylthymePlayground itself
    minify: true,
    target: 'es2020',
    platform: 'browser', // @rhylthyme/timeline/schedule resolves its browser build
    outfile: OUTFILE,
    legalComments: 'none',
    plugins: [lezerOnce],
    logLevel: 'warning',
  })
  .then(() => {
    const kb = (fs.statSync(OUTFILE).size / 1024).toFixed(1);
    console.log(`build:playground: ${path.relative(ROOT, OUTFILE)} ${kb} KB`);
  })
  .catch(() => process.exit(1));
