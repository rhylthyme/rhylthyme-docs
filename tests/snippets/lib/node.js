'use strict';
// Runs a snippet as a reader would: saved into an empty directory where
// @rhylthyme/timeline is installed (a symlink to this repo's node_modules).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT } = require('./docs');

function projectDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-snippet-node-'));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  return dir;
}

function run(cmd, args, dir) {
  try {
    return execFileSync(cmd, args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  } catch (e) {
    throw new Error(`${cmd} ${args.join(' ')} failed in ${dir}\n${e.stdout || ''}\n${e.stderr || e.message}`);
  }
}

module.exports = { projectDir, run };
