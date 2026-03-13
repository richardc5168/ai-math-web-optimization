#!/usr/bin/env node
/**
 * _fix_exam_sprint_leaks.cjs
 * Fix L3 answer leaks in exam-sprint bank for ratio_recipe and sym_bis kinds.
 *
 * ratio_recipe: mask answer in check step ④ (e.g. "檢查：280 + ？" → "檢查：？ + ？")
 * sym_bis:      mask answer identity (e.g. "PE = PC" → "PE = ？")
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BANK_PATH = path.resolve(__dirname, '..', 'docs', 'exam-sprint', 'bank.js');

const src = fs.readFileSync(BANK_PATH, 'utf8');
const jsonStr = src.replace(/^window\.EXAM_SPRINT_BANK\s*=\s*/, '').replace(/;\s*$/, '');
const items = JSON.parse(jsonStr);

let fixed = 0;

for (const q of items) {
  const ans = String(q.answer || '');
  if (!q.hints || !q.hints[2]) continue;
  const h3 = q.hints[2];

  // Fix ratio_recipe: mask answer in check step ④
  // Pattern: "④ 檢查：280 + ？ = 560" → "④ 檢查：？ + ？ = 560"
  if (q.kind && q.kind.includes('ratio_recipe') && ans.length >= 3 && h3.includes(ans)) {
    const escaped = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped + '(\\s*\\+\\s*[？?])');
    const newH3 = h3.replace(re, '？$1');
    if (newH3 !== h3) {
      q.hints[2] = newH3;
      fixed++;
      console.log('  Fixed ratio_recipe:', q.id);
    }
  }

  // Fix perp_bisector_property: mask answer identity (e.g. "PE = PC" → "PE = ？")
  if (/^P[A-Z]=P[A-Z]$/.test(ans)) {
    const points = ans.match(/^(P[A-Z])=(P[A-Z])$/);
    if (points && h3.includes(points[1] + ' = ' + points[2])) {
      const newH3 = h3.replace(points[1] + ' = ' + points[2], points[1] + ' = ？');
      q.hints[2] = newH3;
      fixed++;
      console.log('  Fixed geometry:', q.id);
    }
  }
}

console.log('\nTotal fixed:', fixed);

// Write back
const out = 'window.EXAM_SPRINT_BANK = ' + JSON.stringify(items, null, 2) + ';\n';
fs.writeFileSync(BANK_PATH, out, 'utf8');
console.log('Wrote', BANK_PATH);
