import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

function loadScripts(files) {
  const sandbox = { window: {}, console, Date, Math, JSON, Number };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  files.forEach((file) => {
    const code = fs.readFileSync(path.resolve(file), 'utf8');
    vm.runInContext(code, sandbox);
  });
  return sandbox.window;
}

const windowObj = loadScripts([
  'docs/shared/report/wow_engine.js'
]);

test('computeWoW compares current vs prev week', () => {
  const engine = windowObj.AIMathWoWEngine;
  const result = engine.computeWoW({
    currentTotal: 20,
    currentCorrect: 16,
    prevAttempts: [
      { is_correct: true },
      { is_correct: true },
      { is_correct: false },
      { is_correct: true },
      { is_correct: false }
    ]
  });

  assert.equal(result.rows.length, 3);
  assert.equal(result.hasPrev, true);

  // Check row values
  assert.equal(result.rows[0].cur, 20);
  assert.equal(result.rows[0].prev, 5);
  assert.equal(result.rows[0].suffix, '題');

  // Accuracy: 80% vs 60%
  assert.equal(result.rows[1].cur, 80);
  assert.equal(result.rows[1].prev, 60);

  // Correct count
  assert.equal(result.rows[2].cur, 16);
  assert.equal(result.rows[2].prev, 3);
});

test('computeWoW handles empty prev week', () => {
  const engine = windowObj.AIMathWoWEngine;
  const result = engine.computeWoW({
    currentTotal: 10,
    currentCorrect: 8,
    prevAttempts: []
  });

  assert.equal(result.hasPrev, false);
  assert.equal(result.rows[0].prev, 0);
});

test('formatDelta shows correct arrows and colors', () => {
  const engine = windowObj.AIMathWoWEngine;

  // Positive delta
  const up = engine.formatDelta(80, 60, '%');
  assert.ok(up.includes('+20'));
  assert.ok(up.includes('#3fb950')); // green

  // Negative delta
  const down = engine.formatDelta(5, 10, '題');
  assert.ok(down.includes('-5'));
  assert.ok(down.includes('#f85149')); // red

  // No change
  const same = engine.formatDelta(50, 50, '%');
  assert.ok(same.includes('#8b949e')); // gray

  // No prev data
  const none = engine.formatDelta(10, 0, '題');
  assert.ok(none.includes('上週無資料'));
});

test('computeWoW handles null/undefined gracefully', () => {
  const engine = windowObj.AIMathWoWEngine;
  const result = engine.computeWoW({});
  assert.equal(result.rows[0].cur, 0);
  assert.equal(result.hasPrev, false);

  const result2 = engine.computeWoW(null);
  assert.equal(result2.hasPrev, false);
});
