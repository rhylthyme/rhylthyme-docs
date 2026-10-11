'use strict';
// Where @rhylthyme/timeline comes from in this run.
//
// Default: the version the docs pin, from jsDelivr (browser) and from npm
// (node_modules, through package.json / package-lock.json).
//
// RHYLTHYME_TIMELINE_TARBALL=<path.tgz>: an `npm pack` tarball instead, to test
// a release before it is published. The browser's jsDelivr requests for the
// pinned version are answered from the unpacked tarball, and tests/setup.js
// (npm's pretest) installs the tarball into node_modules with --no-save.
//
// RHYLTHYME_LIVE_MCP=1: also run the snippets that call mcp.rhylthyme.com.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, pinnedVersion } = require('./docs');

const TARBALL = process.env.RHYLTHYME_TIMELINE_TARBALL
  ? path.resolve(process.env.RHYLTHYME_TIMELINE_TARBALL)
  : null;
const LIVE_MCP = process.env.RHYLTHYME_LIVE_MCP === '1';
const CACHE = path.join(ROOT, 'tests', '.cache');
const INSTALLED = path.join(ROOT, 'node_modules', '@rhylthyme', 'timeline');

const cdnBase = (version) => `https://cdn.jsdelivr.net/npm/@rhylthyme/timeline@${version}/`;

function tarballVersion(tgz) {
  const pkg = execFileSync('tar', ['-xOzf', tgz, 'package/package.json']).toString();
  return JSON.parse(pkg).version;
}

// The tarball unpacked under tests/.cache (once per tarball content). Returns
// the directory that holds its package.json.
function unpackedTarball() {
  if (!TARBALL) return null;
  if (!fs.existsSync(TARBALL)) throw new Error(`RHYLTHYME_TIMELINE_TARBALL: ${TARBALL} does not exist`);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(TARBALL)).digest('hex').slice(0, 16);
  const dir = path.join(CACHE, `tarball-${sha}`);
  if (!fs.existsSync(path.join(dir, 'package', 'package.json'))) {
    fs.mkdirSync(CACHE, { recursive: true });
    const tmp = fs.mkdtempSync(path.join(CACHE, 'unpack-'));
    execFileSync('tar', ['-xzf', TARBALL, '-C', tmp]);
    try {
      fs.renameSync(tmp, dir);
    } catch (e) {
      // another test process unpacked it first
      fs.rmSync(tmp, { recursive: true, force: true });
      if (!fs.existsSync(path.join(dir, 'package', 'package.json'))) throw e;
    }
  }
  return path.join(dir, 'package');
}

function installedVersion() {
  const pkg = path.join(INSTALLED, 'package.json');
  return fs.existsSync(pkg) ? JSON.parse(fs.readFileSync(pkg, 'utf8')).version : null;
}

// How node_modules/@rhylthyme/timeline was installed, from npm's hidden lockfile.
function installedResolved() {
  try {
    const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', '.package-lock.json'), 'utf8'));
    return lock.packages['node_modules/@rhylthyme/timeline'].resolved || null;
  } catch {
    return null;
  }
}

// Every file of the tarball is in node_modules with the same bytes.
function installedMatchesTarball() {
  const unpacked = unpackedTarball();
  for (const f of fs.readdirSync(unpacked, { recursive: true })) {
    const a = path.join(unpacked, f);
    if (!fs.statSync(a).isFile()) continue;
    const b = path.join(INSTALLED, f);
    if (!fs.existsSync(b) || !fs.readFileSync(a).equals(fs.readFileSync(b))) return false;
  }
  return true;
}

function describeMode() {
  const version = pinnedVersion();
  return TARBALL
    ? `@rhylthyme/timeline ${version} from the tarball ${TARBALL} (jsDelivr routed to it, installed with --no-save)`
    : `@rhylthyme/timeline ${version} from jsDelivr and npm`;
}

module.exports = {
  ROOT,
  TARBALL,
  LIVE_MCP,
  CACHE,
  INSTALLED,
  cdnBase,
  tarballVersion,
  unpackedTarball,
  installedVersion,
  installedResolved,
  installedMatchesTarball,
  describeMode,
  LIVE_MCP_SKIP: LIVE_MCP ? false : 'calls the live mcp.rhylthyme.com; set RHYLTHYME_LIVE_MCP=1 to run it',
};
