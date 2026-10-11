'use strict';
// The snippet markers are HTML comments: the built site must not show them.
// Checks the output of `mkdocs build` in site/ (CI builds it before npm test),
// or in $MKDOCS_SITE_DIR; skipped when there is no build.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, configPages } = require('./lib/docs');

const SITE = path.resolve(process.env.MKDOCS_SITE_DIR || path.join(ROOT, 'site'));
const built = fs.existsSync(path.join(SITE, 'index.html'));

// docs/development/embedding.md -> site/development/embedding/index.html
const htmlFor = (page) => path.join(SITE, page.replace(/^docs\//, '').replace(/(index)?\.md$/, ''), 'index.html');

test('markers are not visible in the built pages', { skip: built ? false : `no mkdocs build in ${SITE}` }, () => {
  for (const page of configPages()) {
    const file = htmlFor(page);
    assert.ok(fs.existsSync(file), `${file} (built from ${page})`);
    const visible = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(visible, /snippet:/, `${file} shows a snippet marker`);
  }
  const index = path.join(SITE, 'search', 'search_index.json');
  if (fs.existsSync(index)) assert.doesNotMatch(fs.readFileSync(index, 'utf8'), /snippet:/, 'the search index has a snippet marker');
});
