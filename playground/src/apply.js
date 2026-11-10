'use strict';
// Apply one "Try:" suggestion to a program: a deep copy with `value` at `path`.

function bad(path) {
  return new Error('bad path: ' + JSON.stringify(path));
}

function applySuggestion(program, suggestion) {
  const { path, value } = suggestion;
  const out = structuredClone(program);
  if (!Array.isArray(path) || path.length === 0) throw bad(path);
  let node = out;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const last = i === path.length - 1;
    const isArray = Array.isArray(node);
    if (isArray ? typeof key !== 'number' : typeof key !== 'string') throw bad(path);
    if (node === null || typeof node !== 'object') throw bad(path);
    if (isArray) {
      if (!Number.isInteger(key) || key < 0 || key > node.length) throw bad(path);
    } else if (!last && !(key in node)) {
      throw bad(path);
    }
    if (last) {
      node[key] = value;
    } else {
      if (isArray && key === node.length) throw bad(path);
      node = node[key];
    }
  }
  return out;
}

module.exports = { applySuggestion };
