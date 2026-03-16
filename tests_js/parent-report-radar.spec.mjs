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
  'docs/shared/report/radar_engine.js'
]);

test('computeConceptScores aggregates modules into 5 concepts', () => {
  const engine = windowObj.AIMathRadarEngine;
  const modules = [
    { m: 'fraction-g5', n: 20, ok: 16 },
    { m: 'fraction-word-g5', n: 10, ok: 7 },
    { m: 'interactive-decimal-g5', n: 15, ok: 12 },
    { m: 'volume-g5', n: 8, ok: 6 },
    { m: 'ratio-percent-g5', n: 5, ok: 4 },
    { m: 'life-applications-g5', n: 12, ok: 10 }
  ];

  const scores = engine.computeConceptScores(modules);
  assert.equal(scores.length, 5);

  // 分數: fraction-g5 (20/16) + fraction-word-g5 (10/7) = 30 total, 23 correct
  const fraction = scores.find(s => s.name === '分數');
  assert.equal(fraction.total, 30);
  assert.equal(fraction.score, 23);
  assert.equal(fraction.pct, 77); // Math.round(23/30*100)

  // 小數: interactive-decimal-g5 (15/12)
  const decimal = scores.find(s => s.name === '小數');
  assert.equal(decimal.total, 15);
  assert.equal(decimal.score, 12);
  assert.equal(decimal.pct, 80);

  // 體積: volume-g5 (8/6)
  const volume = scores.find(s => s.name === '體積');
  assert.equal(volume.total, 8);
  assert.equal(volume.score, 6);
  assert.equal(volume.pct, 75);
});

test('computeConceptScores handles empty modules', () => {
  const engine = windowObj.AIMathRadarEngine;
  const scores = engine.computeConceptScores([]);
  assert.equal(scores.length, 5);
  scores.forEach(s => {
    assert.equal(s.total, 0);
    assert.equal(s.pct, 0);
  });
});

test('CONCEPT_MAP covers all 5 concept areas', () => {
  const engine = windowObj.AIMathRadarEngine;
  const names = engine.conceptNames();
  assert.equal(names.length, 5);
  assert.equal(names[0], '分數');
  assert.equal(names[1], '小數');
  assert.equal(names[2], '百分率');
  assert.equal(names[3], '體積');
  assert.equal(names[4], '生活應用');
});

test('computeConceptScores handles partial substring matching', () => {
  const engine = windowObj.AIMathRadarEngine;
  // Module name contains 'commercial-pack1-fraction-sprint'
  const scores = engine.computeConceptScores([
    { m: 'commercial-pack1-fraction-sprint', n: 10, ok: 8 }
  ]);
  const fraction = scores.find(s => s.name === '分數');
  assert.equal(fraction.total, 10);
  assert.equal(fraction.score, 8);
});
