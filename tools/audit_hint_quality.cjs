#!/usr/bin/env node
/**
 * audit_hint_quality.cjs — Audit hint quality across ALL interactive module question banks.
 * Excludes fraction-word-g5 per instructions.
 *
 * Usage:  node tools/audit_hint_quality.cjs
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DOCS = path.join(__dirname, '..', 'docs');

// ── Module definitions ──────────────────────────────────────────────────────
const MODULES = [
  { dir: 'exam-sprint',                        file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-empire',               file: 'bank.js',  format: 'window' },
  { dir: 'life-applications-g5',                file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-life-pack2plus-empire', file: 'bank.js',  format: 'window' },
  { dir: 'interactive-decimal-g5',              file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-life-pack1plus-empire', file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-life-pack1-empire',    file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-life-pack2-empire',    file: 'bank.js',  format: 'window' },
  { dir: 'commercial-pack1-fraction-sprint',    file: 'bank.js',  format: 'iife'   },
  { dir: 'g5-grand-slam',                       file: 'bank.js',  format: 'window' },
  { dir: 'ratio-percent-g5',                    file: 'bank.js',  format: 'window' },
  { dir: 'volume-g5',                           file: 'bank.js',  format: 'window' },
  { dir: 'fraction-g5',                         file: 'bank.js',  format: 'window' },
  { dir: 'decimal-unit4',                       file: 'bank.js',  format: 'window' },
  { dir: 'offline-math',                        file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g56-core-foundation',     file: 'g56_core_foundation.json', format: 'json' },
  { dir: 'interactive-g5-midterm1',             file: 'bank.js',  format: 'window' },
  { dir: 'interactive-g5-national-bank',        file: 'bank.js',  format: 'window' },
];

// ── Boilerplate patterns ─────────────────────────────────────────────────────
const BOILERPLATE_PATTERNS = [
  /請依前面步驟完成計算/,
  /請自行完成計算/,
  /請自己完成計算/,
  /依照前面提示完成/,
  /請自行檢查單位並寫出/,
  /自行檢查單位/,
  /最後請自行寫出答案/,
];

function isBoilerplate(text) {
  if (!text) return false;
  // Short generic text (< 25 chars) is likely boilerplate
  const stripped = text.replace(/\s+/g, '');
  for (const pat of BOILERPLATE_PATTERNS) {
    if (pat.test(text)) return true;
  }
  return false;
}

// ── Load bank ────────────────────────────────────────────────────────────────
function loadBank(mod) {
  const fullPath = path.join(DOCS, mod.dir, mod.file);
  if (!fs.existsSync(fullPath)) return { items: [], globalVar: '(not found)', bankPath: fullPath };

  const raw = fs.readFileSync(fullPath, 'utf8');
  const bankPath = `docs/${mod.dir}/${mod.file}`;

  if (mod.format === 'json') {
    const items = JSON.parse(raw);
    return { items, globalVar: '(JSON array)', bankPath };
  }

  // Detect the global variable name
  const varMatch = raw.match(/window\.([A-Z0-9_]+)\s*=/);
  const globalVar = varMatch ? `window.${varMatch[1]}` : '(unknown)';

  // Create a fake window object for evaluation
  const window = {};
  const sandbox = { window, console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isNaN, isFinite };
  try {
    vm.runInNewContext(raw, sandbox, { timeout: 5000 });
  } catch (e) {
    // If vm fails, try regex extraction
    console.error(`  ⚠ VM eval failed for ${mod.dir}: ${e.message}`);
  }

  // Find the bank array from window.*
  let items = [];
  for (const key of Object.keys(sandbox.window)) {
    const val = sandbox.window[key];
    if (Array.isArray(val) && val.length > 0) {
      items = val;
      break;
    }
  }

  return { items, globalVar, bankPath };
}

// ── Extract hints from an item ───────────────────────────────────────────────
function getHints(item) {
  // Standard hints array
  if (Array.isArray(item.hints) && item.hints.length > 0) {
    return item.hints;
  }
  // steps used as hints (midterm1, national-bank)
  if (Array.isArray(item.steps) && item.steps.length > 0 && typeof item.steps[0] === 'string') {
    return item.steps;
  }
  // teacherSteps (offline-math) — extract "say" field
  if (Array.isArray(item.teacherSteps)) {
    return item.teacherSteps.map(s => s.say || '');
  }
  return [];
}

// ── Main ─────────────────────────────────────────────────────────────────────
const results = [];

for (const mod of MODULES) {
  const { items, globalVar, bankPath } = loadBank(mod);
  if (items.length === 0) {
    results.push({
      module: mod.dir,
      bankPath,
      globalVar,
      questionCount: 0,
      kindCount: 0,
      kindValues: [],
      hintLevels: '-',
      boilerplateL3: '-',
      totalL3: 0,
      boilerplatePct: '-',
      avgL1: '-',
      avgL2: '-',
      avgL3: '-',
      note: 'NO DATA / LOAD FAILED'
    });
    continue;
  }

  // Collect kinds
  const kindSet = new Set();
  items.forEach(q => { if (q.kind) kindSet.add(q.kind); });

  // Hint analysis
  let totalL1Len = 0, totalL2Len = 0, totalL3Len = 0;
  let countL1 = 0, countL2 = 0, countL3 = 0;
  let boilerplateL3 = 0;
  let totalL3Items = 0;
  const hintLevelCounts = {};

  for (const item of items) {
    const hints = getHints(item);
    const levels = hints.length;
    hintLevelCounts[levels] = (hintLevelCounts[levels] || 0) + 1;

    if (hints.length >= 1) {
      const h1 = typeof hints[0] === 'string' ? hints[0] : '';
      totalL1Len += h1.length;
      countL1++;
    }
    if (hints.length >= 2) {
      const h2 = typeof hints[1] === 'string' ? hints[1] : '';
      totalL2Len += h2.length;
      countL2++;
    }
    if (hints.length >= 3) {
      // Last hint = L3 (or highest level)
      const lastIdx = hints.length - 1;
      const hLast = typeof hints[lastIdx] === 'string' ? hints[lastIdx] : '';
      totalL3Len += hLast.length;
      countL3++;
      totalL3Items++;
      if (isBoilerplate(hLast)) {
        boilerplateL3++;
      }
    }
  }

  // Determine prevalent hint level
  const hintLevelStr = Object.entries(hintLevelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}(${v})`)
    .join(', ');

  results.push({
    module: mod.dir,
    bankPath,
    globalVar,
    questionCount: items.length,
    kindCount: kindSet.size,
    kindValues: [...kindSet].sort(),
    hintLevels: hintLevelStr,
    boilerplateL3,
    totalL3: totalL3Items,
    boilerplatePct: totalL3Items > 0 ? ((boilerplateL3 / totalL3Items) * 100).toFixed(1) + '%' : '-',
    avgL1: countL1 > 0 ? (totalL1Len / countL1).toFixed(0) : '-',
    avgL2: countL2 > 0 ? (totalL2Len / countL2).toFixed(0) : '-',
    avgL3: countL3 > 0 ? (totalL3Len / countL3).toFixed(0) : '-',
  });
}

// ── Output ───────────────────────────────────────────────────────────────────

// Sort by boilerplate pct descending
results.sort((a, b) => {
  const pctA = typeof a.boilerplatePct === 'string' && a.boilerplatePct.endsWith('%')
    ? parseFloat(a.boilerplatePct) : -1;
  const pctB = typeof b.boilerplatePct === 'string' && b.boilerplatePct.endsWith('%')
    ? parseFloat(b.boilerplatePct) : -1;
  return pctB - pctA;
});

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  HINT QUALITY AUDIT — ALL INTERACTIVE MODULES (excl. fraction-word-g5)');
console.log('══════════════════════════════════════════════════════════════════\n');

// Print table
const COL = {
  mod: 42, qs: 5, kinds: 6, levels: 18, bp: 12, pct: 7, l1: 6, l2: 6, l3: 6, gvar: 38
};

function pad(s, w) { return String(s).padEnd(w); }
function rpad(s, w) { return String(s).padStart(w); }

const header = [
  pad('Module', COL.mod),
  rpad('Qs', COL.qs),
  rpad('Kinds', COL.kinds),
  pad('Hint Levels', COL.levels),
  pad('Boiler/Total', COL.bp),
  rpad('BP%', COL.pct),
  rpad('AvgL1', COL.l1),
  rpad('AvgL2', COL.l2),
  rpad('AvgL3', COL.l3),
  pad('Global Var', COL.gvar),
].join(' │ ');

console.log(header);
console.log('─'.repeat(header.length));

for (const r of results) {
  const bpStr = `${r.boilerplateL3}/${r.totalL3}`;
  console.log([
    pad(r.module, COL.mod),
    rpad(r.questionCount, COL.qs),
    rpad(r.kindCount, COL.kinds),
    pad(r.hintLevels, COL.levels),
    pad(bpStr, COL.bp),
    rpad(r.boilerplatePct, COL.pct),
    rpad(r.avgL1, COL.l1),
    rpad(r.avgL2, COL.l2),
    rpad(r.avgL3, COL.l3),
    pad(r.globalVar, COL.gvar),
  ].join(' │ '));
}

console.log('\n── KIND VALUES PER MODULE ──\n');
for (const r of results) {
  if (r.kindCount > 0) {
    console.log(`  ${r.module} (${r.kindCount} kinds):`);
    console.log(`    ${r.kindValues.join(', ')}`);
  }
}

// Summary
console.log('\n── WORST OFFENDERS (Highest Boilerplate L3 %) ──\n');
for (const r of results) {
  const pct = typeof r.boilerplatePct === 'string' && r.boilerplatePct.endsWith('%')
    ? parseFloat(r.boilerplatePct) : 0;
  if (pct >= 50) {
    console.log(`  ⚠ ${r.module}: ${r.boilerplatePct} boilerplate (${r.boilerplateL3}/${r.totalL3}), avgL3=${r.avgL3} chars`);
  }
}

// Save JSON artifact
const artifactDir = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, 'hint_quality_audit.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);
console.log('\n✓ Saved artifacts/hint_quality_audit.json');
