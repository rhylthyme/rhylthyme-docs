'use strict';
// The playground's example programs and what the panel shows for one.

const fs = require('fs');
const path = require('path');
const { computeStepTimings } = require('@rhylthyme/timeline');
const { validateProgram, analyzeSchedule } = require('@rhylthyme/timeline/schedule');

const EXAMPLE_IDS = [
  'program', 'tracks', 'steps',
  'duration-fixed', 'duration-variable', 'duration-indefinite',
  'trigger-program-start', 'trigger-after-step', 'trigger-manual',
  'instances', 'buffers', 'resource-constraints',
];

// The pages that carry "Try it live" buttons (Markdown source under the repo
// root) and the examples their buttons open, in page order. Every example is
// on exactly one page.
const PAGE_EXAMPLES = {
  'docs/getting-started/concepts.md': [
    'program', 'tracks', 'steps',
    'duration-fixed', 'duration-variable', 'duration-indefinite',
    'trigger-program-start', 'trigger-after-step', 'trigger-manual',
    'instances', 'buffers', 'resource-constraints',
  ],
};

// The built page's URL path for a Markdown page (directory URLs).
function pageUrlPath(md) {
  const dir = md.replace(/^docs\//, '').replace(/\.md$/, '').replace(/(^|\/)index$/, '');
  return dir ? '/' + dir + '/' : '/';
}

const examplesDir = path.join(__dirname, '..', '..', '..', 'docs', 'playground', 'examples');

function loadExample(id) {
  return JSON.parse(fs.readFileSync(path.join(examplesDir, id + '.json'), 'utf8'));
}

function shown(program) {
  return {
    timings: computeStepTimings(program),
    warnings: validateProgram(program).warnings.map((w) => w.code),
    conflicts: analyzeSchedule(program).resourceConflicts,
  };
}

module.exports = { EXAMPLE_IDS, PAGE_EXAMPLES, pageUrlPath, examplesDir, loadExample, shown };
