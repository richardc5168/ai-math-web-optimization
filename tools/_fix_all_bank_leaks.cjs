#!/usr/bin/env node
/**
 * _fix_all_bank_leaks.cjs
 * Fix L3 answer leaks across ALL bank.js files (not just exam-sprint).
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');
const dirs = fs.readdirSync(docsDir, { withFileTypes: true }).filter(d => d.isDirectory());
let totalFixed = 0;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const dir of dirs) {
  if (dir.name === 'exam-sprint') continue; // already fixed separately
  const bp = path.join(docsDir, dir.name, 'bank.js');
  if (!fs.existsSync(bp)) continue;

  const src = fs.readFileSync(bp, 'utf8');
  const sb = { window: {} };
  vm.createContext(sb);
  try { vm.runInContext(src, sb); } catch (e) { continue; }

  const bankKey = Object.keys(sb.window).find(k => Array.isArray(sb.window[k]));
  if (!bankKey) continue;

  const items = sb.window[bankKey];
  let modFixed = 0;

  for (const q of items) {
    const ans = String(q.answer || '');
    if (!q.hints || !q.hints[2]) continue;
    const h3 = q.hints[2];

    // Fix ratio_recipe: mask answer in check step
    if (q.kind && q.kind.includes('ratio_recipe') && ans.length >= 3 && h3.includes(ans)) {
      const re = new RegExp(escapeRegex(ans) + '(\\s*\\+\\s*[？?])');
      const newH3 = h3.replace(re, '？$1');
      if (newH3 !== h3) {
        q.hints[2] = newH3;
        modFixed++;
        totalFixed++;
        console.log('  Fixed ratio_recipe:', q.id);
      }
    }

    // Fix geometry: mask P?=P? answer
    if (/^P[A-Z]=P[A-Z]$/.test(ans)) {
      const pts = ans.match(/^(P[A-Z])=(P[A-Z])$/);
      if (pts && h3.includes(pts[1] + ' = ' + pts[2])) {
        q.hints[2] = h3.replace(pts[1] + ' = ' + pts[2], pts[1] + ' = ？');
        modFixed++;
        totalFixed++;
        console.log('  Fixed geometry:', q.id);
      }
    }
  }

  if (modFixed > 0) {
    const out = 'window.' + bankKey + ' = ' + JSON.stringify(items, null, 2) + ';\n';
    fs.writeFileSync(bp, out, 'utf8');
    console.log(dir.name + ': fixed ' + modFixed + ' leaks');
  }
}

console.log('\nTotal fixed across other banks:', totalFixed);
