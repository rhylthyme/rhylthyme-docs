'use strict';
// docs/development/embedding.md, "Hosted service from a backend": the curl and
// fetch snippets against the live mcp.rhylthyme.com. Only with
// RHYLTHYME_LIVE_MCP=1 (CI sets it). They call validate_program and
// analyze_schedule; a snippet that would call visualize_schedule (which
// publishes a public link) fails here instead of running.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { snippet } = require('./lib/docs');
const { projectDir, run } = require('./lib/node');
const { LIVE_MCP_SKIP } = require('./lib/env');

function assertDoesNotPublish(code) {
  const live = code.split('\n').filter((l) => /visualize_schedule/.test(l) && !/^\s*(\/\/|#)/.test(l));
  assert.deepEqual(live, [], 'the snippet calls visualize_schedule, which publishes; refusing to run it');
}

test('mcp-curl: validate_program answers valid', { skip: LIVE_MCP_SKIP, timeout: 60000 }, () => {
  const s = snippet('mcp-curl');
  assertDoesNotPublish(s.code);
  const out = JSON.parse(run('bash', ['-c', s.code], process.cwd()));
  assert.equal(out.error, undefined, JSON.stringify(out.error));
  assert.equal(out.result.isError, undefined);
  assert.equal(out.result.structuredContent.valid, true, JSON.stringify(out.result.structuredContent));
});

test('mcp-fetch: validate + analyze print what the snippet logs', { skip: LIVE_MCP_SKIP, timeout: 60000 }, () => {
  const s = snippet('mcp-fetch');
  assertDoesNotPublish(s.code);
  const dir = projectDir();
  fs.writeFileSync(path.join(dir, 'rhylthyme.mjs'), s.code);
  const [first, ...rest] = run('node', ['rhylthyme.mjs'], dir).trim().split('\n');
  assert.equal(first, 'true []', 'console.log(check.valid, check.errors)');
  // console.log(plan.makespanSeconds, plan.steps.map((s) => [s.name, s.startAt]))
  const second = rest.join(' ');
  const makespan = Number(/^(\d+)/.exec(second)[1]);
  assert.ok(makespan > 0, second);
  const finishAt = /finishAt:\s*'([^']+)'/.exec(s.code)[1];
  const programStart = new Date(Date.parse(finishAt) - makespan * 1000).toISOString();
  assert.ok(second.includes(programStart), `planned back from ${finishAt}: expected a step at ${programStart} in ${second}`);
  for (const name of [...s.code.matchAll(/name: '([^']+)', startTrigger/g)].map((m) => m[1])) {
    assert.ok(second.includes(name), `${name} in ${second}`);
  }
});
