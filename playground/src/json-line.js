'use strict';
// Where the first JSON syntax error is, from the @lezer/json parse tree (the
// grammar the editor uses). JSON.parse is not asked: its messages do not
// reliably carry a position.

const { parser } = require('@lezer/json');

function lineAt(text, pos) {
  let line = 1;
  for (let i = 0; i < pos; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

// {from, to, line} of the first error node (1-based line); the whole text on
// line 1 when there is no value at all (empty or whitespace only); null when
// the text parses.
function firstJsonError(text) {
  const cursor = parser.parse(text).cursor();
  let error = null;
  let hasValue = false;
  do {
    if (cursor.type.isError) {
      if (!error) error = { from: cursor.from, to: cursor.to };
    } else if (!cursor.type.isTop) {
      hasValue = true;
    }
  } while (cursor.next());
  if (!hasValue) return { from: 0, to: text.length, line: 1 };
  if (!error) return null;
  return { ...error, line: lineAt(text, error.from) };
}

function firstJsonErrorLine(text) {
  const error = firstJsonError(text);
  return error ? error.line : null;
}

module.exports = { firstJsonError, firstJsonErrorLine };
