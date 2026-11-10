'use strict';
// A static file server for the playground's browser tests: each URL path is
// looked up in the roots in order; `overrides` maps a URL path to one file.

const fs = require('fs');
const http = require('http');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function resolve(roots, overrides, urlPath) {
  if (overrides[urlPath]) return overrides[urlPath];
  const rel = urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath;
  for (const root of roots) {
    const base = path.resolve(root);
    const file = path.join(base, rel);
    if (!file.startsWith(base + path.sep)) continue; // no ../ out of a root
    if (isFile(file)) return file;
  }
  return null;
}

function serve({ roots, overrides = {} }) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      urlPath = null;
    }
    const file = urlPath && resolve(roots, overrides, urlPath);
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => {
      ok({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { serve };
