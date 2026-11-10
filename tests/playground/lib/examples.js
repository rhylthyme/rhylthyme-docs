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

module.exports = { EXAMPLE_IDS, examplesDir, loadExample, shown };
