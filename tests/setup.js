'use strict';
// npm's pretest: makes node_modules/@rhylthyme/timeline the build under test.
//
//   default                           checks node_modules holds the version the docs pin
//   RHYLTHYME_TIMELINE_TARBALL=x.tgz  installs that tarball with --no-save (package.json
//                                     and package-lock.json are not touched); `npm ci`
//                                     puts the published version back

const fs = require('fs');
const { execFileSync } = require('child_process');
const { pinnedVersion } = require('./snippets/lib/docs');
const env = require('./snippets/lib/env');

function fail(msg) {
  console.error(`tests/setup.js: ${msg}`);
  process.exit(1);
}

let pin;
try {
  pin = pinnedVersion();
} catch (e) {
  fail(e.message);
}

if (env.TARBALL) {
  const v = env.tarballVersion(env.TARBALL);
  if (v !== pin) fail(`the tarball is @rhylthyme/timeline ${v}, but the docs pin ${pin}`);
  env.unpackedTarball();
  if (!env.installedMatchesTarball()) {
    // npm keeps a package it considers up to date (same version), so clear it first
    fs.rmSync(env.INSTALLED, { recursive: true, force: true });
    execFileSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', '--ignore-scripts', env.TARBALL], {
      cwd: env.ROOT,
      stdio: 'inherit',
    });
  }
  if (!env.installedMatchesTarball()) fail('node_modules/@rhylthyme/timeline does not match the tarball after installing it');
} else {
  const v = env.installedVersion();
  if (v !== pin) fail(`node_modules has @rhylthyme/timeline ${v}, but the docs pin ${pin}: update package.json and run npm install`);
  const resolved = env.installedResolved();
  if (resolved && resolved.startsWith('file:')) {
    fail(`node_modules/@rhylthyme/timeline was installed from ${resolved} by an earlier tarball run; run npm ci to test the published package`);
  }
}

console.log(`snippet tests: ${env.describeMode()}`);
console.log(`snippet tests: live MCP calls ${env.LIVE_MCP ? 'ON' : 'OFF (set RHYLTHYME_LIVE_MCP=1 to run them)'}`);
