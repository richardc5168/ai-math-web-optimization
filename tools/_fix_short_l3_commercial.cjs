#!/usr/bin/env node
/**
 * _fix_short_l3_commercial.cjs
 * Enhance short L3 hints in commercial-pack1-fraction-sprint.
 * Makes L3 question-specific with step-by-step calculation guidance.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bp = path.join(__dirname, '..', 'docs', 'commercial-pack1-fraction-sprint', 'bank.js');
const src = fs.readFileSync(bp, 'utf8');
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(src, sb);
const varName = Object.keys(sb.window).find(k => Array.isArray(sb.window[k]));
const items = sb.window[varName];

// Helper: extract numbers from question text
function extractNums(text) {
  const m = String(text).match(/\d+\.?\d*/g);
  return m ? m.map(Number) : [];
}

// Helper: extract fractions from text
function extractFracs(text) {
  const m = String(text).match(/(\d+)\/(\d+)/g);
  return m || [];
}

let fixed = 0;

for (const q of items) {
  if (!q.hints || !q.hints[2] || q.hints[2].length >= 20) continue;

  const kind = q.kind || '';
  const qText = String(q.question || '');
  const nums = extractNums(qText);
  const fracs = extractFracs(qText);
  const ans = q.answer;

  let newL3 = '';

  switch (kind) {
    case 'remain': {
      // "剩下數量 = 總量 × 3/4。" → make step-by-step
      const total = nums.find(n => n > 1) || '?';
      const remainFrac = q.hints[1] ? (q.hints[1].match(/(\d+\/\d+).*?$/)||[])[1] || '?' : '?';
      newL3 = `📐 一步步算：\n① 總量 = ${total}\n② 剩下比例 = ${remainFrac}\n③ ${total} × ${remainFrac} = ？\n算完記得回頭檢查喔！✅`;
      break;
    }
    case 'part_to_total': {
      // Make calculation-specific
      const total = nums.find(n => n > 1) || '?';
      const frac = fracs[0] || '?';
      newL3 = `📐 一步步算：\n① 總量 = ${total}\n② 佔比 = ${frac}\n③ ${total} × ${frac} = ？\n算完記得回頭檢查喔！✅`;
      break;
    }
    case 'compare': {
      // Two fractions of same total, find difference
      const total = nums.find(n => n > 1) || '?';
      const f1 = fracs[0] || '?';
      const f2 = fracs[1] || '?';
      newL3 = `📐 一步步算：\n① 第一份 = ${total} × ${f1} = ？\n② 第二份 = ${total} × ${f2} = ？\n③ 差 = 大 − 小 = ？\n算完記得回頭檢查喔！✅`;
      break;
    }
    case 'remain_multi': {
      // Multiple fractions removed from total
      const total = nums.find(n => n > 1) || '?';
      const remainFrac = q.hints[1] ? (q.hints[1].match(/(\d+\/\d+).*?$/)||[])[1] || '?' : '?';
      newL3 = `📐 一步步算：\n① 總量 = ${total}\n② 合計用掉後剩下 = ${remainFrac}\n③ ${total} × ${remainFrac} = ？\n算完記得回頭檢查喔！✅`;
      break;
    }
    default:
      // Generic enhancement
      newL3 = `📐 一步步算：\n① 把數字代入前面的算式\n② 逐步計算\n③ 最後結果 = ？\n算完記得回頭檢查喔！✅`;
  }

  q.hints[2] = newL3;
  fixed++;
}

// Write back
const out = 'window.' + varName + ' = ' + JSON.stringify(items, null, 2) + ';\n';
fs.writeFileSync(bp, out, 'utf8');
// Sync to dist
const distBp = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'commercial-pack1-fraction-sprint', 'bank.js');
fs.writeFileSync(distBp, out, 'utf8');

console.log('Fixed', fixed, 'short L3 hints in commercial-pack1-fraction-sprint');
