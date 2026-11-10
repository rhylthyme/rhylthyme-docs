'use strict';
// The status bar's lines for a parsed program: the validator's errors, or a
// "Valid" line followed by its warnings and the analyzer's resource conflicts.
// The validator and analyzer are passed in so Node tests and the browser
// bundle use their own build of @rhylthyme/timeline/schedule.

const MAX_ERRORS = 3;

function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function line(kind, text, fix) {
  return fix ? { kind, text, fix } : { kind, text };
}

function checkProgram(program, { validateProgram, analyzeSchedule }) {
  const result = validateProgram(program);
  if (!result.valid) {
    const lines = result.errors.slice(0, MAX_ERRORS).map((e) => line('error', e.message, e.fix));
    const more = result.errors.length - MAX_ERRORS;
    if (more > 0) lines.push(line('error', '+' + more + ' more'));
    return { state: 'invalid', lines };
  }
  const analysis = analyzeSchedule(program);
  const steps = result.stats.steps;
  const lines = [line('ok', `✓ Valid · ${steps} ${steps === 1 ? 'step' : 'steps'} · takes ${analysis.makespan}`)];
  for (const w of result.warnings) lines.push(line('warn', w.message, w.fix));
  for (const c of analysis.resourceConflicts) {
    const when = formatClock(c.startSeconds) + '–' + formatClock(c.endSeconds);
    lines.push(line('warn', `⚠ ${c.task}: ${c.demand} at once, limit ${c.maxConcurrent} (${when})`, c.fix));
  }
  return { state: 'valid', lines };
}

module.exports = { checkProgram, formatClock };
