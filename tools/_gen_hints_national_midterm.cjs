#!/usr/bin/env node
/**
 * _gen_hints_national_midterm.cjs
 * Generate 4-level hints for national-bank and midterm1 modules that have none.
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
function lcm(a, b) { return a * b / gcd(a, b); }

function extractFractions(text) {
  const re = /(\d+)\s*[\/／]\s*(\d+)/g;
  const result = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    result.push({ n: parseInt(m[1]), d: parseInt(m[2]), str: m[0] });
  }
  return result;
}

function extractIntegers(text) {
  const re = /(?<![.\d\/])(\d+)(?![.\d\/])/g;
  const result = [];
  let m;
  while ((m = re.exec(text)) !== null) result.push(parseInt(m[1]));
  return result;
}

function extractDecimals(text) {
  const re = /(\d+\.\d+)/g;
  const result = [];
  let m;
  while ((m = re.exec(text)) !== null) result.push(parseFloat(m[1]));
  return result;
}

/**
 * Generate hints for a question based on its kind and content.
 */
function generateHints(q) {
  const kind = q.kind || '';
  const text = q.question || '';
  const answer = String(q.answer || '');

  // national_bank_source — reference-only
  if (kind === 'national_bank_source') {
    const num = (q.id.match(/source_(\d+)/) || [])[1] || '';
    return [
      '⭐ 觀念提醒\n仔細讀題，找出關鍵數字和要求什麼。',
      '🔍 列式引導\n把文字轉成算式：找到已知量和未知量，列出計算式。',
      '📐 一步步算：\n① 讀題圈重點：找出有哪些數量\n② 判斷運算：要加、減、乘還是除\n③ 列式計算 → ？\n算完記得檢查答案合理性 ✅',
      '👉 請對照來源試卷解答核對你的答案。'
    ];
  }

  // remain_then_fraction: 先用掉 a/b，剩下再用掉 c/d
  if (/remain_then_fraction/.test(kind)) {
    const fracs = extractFractions(text);
    if (fracs.length >= 2) {
      const f1 = fracs[0], f2 = fracs[1];
      return [
        '⭐ 觀念提醒\n「剩下的幾分之幾」要分兩步算：先扣第一次，再從剩餘扣第二次。',
        '🔍 列式引導\n① 第一步剩 1 − ' + f1.str + '\n② 第二步再乘以 (1 − ' + f2.str + ')',
        '📐 一步步算：\n① 第一次後剩 1 − ' + f1.str + ' = ' + (f1.d - f1.n) + '/' + f1.d + '\n② 第二次用掉其中 ' + f2.str + '，剩 ' + (f1.d - f1.n) + '/' + f1.d + ' × (1 − ' + f2.str + ')\n③ = ' + (f1.d - f1.n) + '/' + f1.d + ' × ' + (f2.d - f2.n) + '/' + f2.d + ' → ？\n通分約分後就是答案 ✅',
        '👉 「剩下」→ 1 減掉用掉的分數。兩次扣除要乘法串接，不是加法。'
      ];
    }
  }

  // fraction_of_quantity: 求某個量的幾分之幾
  if (/fraction_of_quantity/.test(kind)) {
    const fracs = extractFractions(text);
    const ints = extractIntegers(text);
    if (fracs.length >= 1 && ints.length >= 1) {
      const total = ints[0];
      const f = fracs[0];
      return [
        '⭐ 觀念提醒\n求「全部的 ' + f.str + '」就是整數乘分數。',
        '🔍 列式引導\n列式：' + total + ' × ' + f.str,
        '📐 一步步算：\n① 列式：' + total + ' × ' + f.n + '/' + f.d + '\n② = (' + total + ' × ' + f.n + ') ÷ ' + f.d + '\n③ 計算 → ？\n驗算：答案 × ' + f.d + '/' + f.n + ' 應等於 ' + total + ' ✅',
        '👉 「甲的幾分之幾」就是甲 × 分數，整數和分子先乘。'
      ];
    }
  }

  // reverse_fraction: 已知部分求全部
  if (/reverse_fraction/.test(kind)) {
    const fracs = extractFractions(text);
    const ints = extractIntegers(text);
    if (fracs.length >= 1 && ints.length >= 1) {
      const part = ints[ints.length - 1]; // usually the known part
      const f = fracs[0];
      return [
        '⭐ 觀念提醒\n已知「幾分之幾是多少」，求全部 → 用除法反推。',
        '🔍 列式引導\n列式：部分量 ÷ 分數 = 全部量',
        '📐 一步步算：\n① 已走 ' + f.str + ' = ' + part + '\n② 全部 = ' + part + ' ÷ ' + f.str + '\n③ = ' + part + ' × ' + f.d + '/' + f.n + ' → ？\n驗算：答案 × ' + f.str + ' 應等於 ' + part + ' ✅',
        '👉 「÷ 分數」就是「× 倒數」。'
      ];
    }
  }

  // fraction_of_fraction: 連乘
  if (/fraction_of_fraction/.test(kind)) {
    const fracs = extractFractions(text);
    const ints = extractIntegers(text);
    if (fracs.length >= 2) {
      return [
        '⭐ 觀念提醒\n連續求「甲的幾分之幾的幾分之幾」，就是分數連乘。',
        '🔍 列式引導\n列式：全部 × 第一個分數 × 第二個分數',
        '📐 一步步算：\n① 找出全部量和兩個分數\n② 分步計算：先算第一個分數所代表的量\n③ 再求其中的第二個分數 → ？\n約分到最簡，別忘了驗算 ✅',
        '👉 分數乘分數：分子乘分子、分母乘分母，再約分。'
      ];
    }
    if (ints.length >= 1 && fracs.length >= 1) {
      return [
        '⭐ 觀念提醒\n「某量的幾分之幾」→ 整數 × 分數。',
        '🔍 列式引導\n列式：' + ints[0] + ' × ' + fracs[0].str,
        '📐 一步步算：\n① ' + ints[0] + ' × ' + fracs[0].n + ' = ？\n② 再 ÷ ' + fracs[0].d + ' → ？\n③ 如果有第二步再繼續乘\n驗算：逆推回去看是否合理 ✅',
        '👉 整數×分數：整數乘分子後除以分母。'
      ];
    }
  }

  // remaining_after_fraction: 花掉幾分之幾求剩餘
  if (/remaining_after_fraction/.test(kind)) {
    const fracs = extractFractions(text);
    const ints = extractIntegers(text);
    if (fracs.length >= 1 && ints.length >= 1) {
      const total = ints[0];
      const f = fracs[0];
      return [
        '⭐ 觀念提醒\n「花掉 ' + f.str + '」→ 剩下 (1 − ' + f.str + ') → 乘以全部。',
        '🔍 列式引導\n列式：' + total + ' × (1 − ' + f.str + ') = ' + total + ' × ' + (f.d - f.n) + '/' + f.d,
        '📐 一步步算：\n① 剩下的比率 = 1 − ' + f.str + ' = ' + (f.d - f.n) + '/' + f.d + '\n② ' + total + ' × ' + (f.d - f.n) + '/' + f.d + '\n③ = (' + total + ' × ' + (f.d - f.n) + ') ÷ ' + f.d + ' → ？\n驗算：花掉 + 剩下 = ' + total + ' ✅',
        '👉 剩餘 = 總量 × (1 − 用掉的分數)。'
      ];
    }
  }

  // area_difference: 面積差 (unit conversion needed)
  if (/area_difference/.test(kind)) {
    return [
      '⭐ 觀念提醒\n公頃、公畝、平方公尺之間要先統一單位再比較。',
      '🔍 列式引導\n1 公頃 = 10000 平方公尺，1 公畝 = 100 平方公尺。都轉成平方公尺再相減。',
      '📐 一步步算：\n① 把兩個面積都轉成平方公尺\n② 較大的 − 較小的\n③ 注意小數乘法 → ？\n驗算：差值單位是平方公尺 ✅',
      '👉 面積單位換算：公頃×10000、公畝×100。'
    ];
  }

  // division_application
  if (/division_application/.test(kind)) {
    const ints = extractIntegers(text);
    return [
      '⭐ 觀念提醒\n用除法算「夠不夠」或「需要幾組」。',
      '🔍 列式引導\n列式：總金額 ÷ 單價 → 看商夠不夠。',
      '📐 一步步算：\n① 找出總金額和單價\n② 做除法算出可以買幾組\n③ 比較是否足夠 → ？\n注意：有餘數時要看題目問什麼 ✅',
      '👉 「夠不夠」→ 算完比大小，不是直接寫數字。'
    ];
  }

  // decimal_multiplication
  if (/decimal_multiplication/.test(kind)) {
    const decs = extractDecimals(text);
    return [
      '⭐ 觀念提醒\n小數乘法：先當整數乘，再數小數位數放回小數點。',
      '🔍 列式引導\n列出乘法式，注意小數位數加總。',
      '📐 一步步算：\n① 找出要乘的兩個數\n② 去掉小數點做整數乘法\n③ 小數位數加總後放回小數點 → ？\n驗算：估算看答案大小是否合理 ✅',
      '👉 小數乘法的關鍵：小數位數要「加起來」。'
    ];
  }

  // volume_calculation
  if (/volume_calculation/.test(kind)) {
    return [
      '⭐ 觀念提醒\n長方體體積 = 長 × 寬 × 高。組合體要分開算再合併。',
      '🔍 列式引導\n找出每個長方體的長、寬、高，分別算體積再視情況加減。',
      '📐 一步步算：\n① 拆分成基本長方體\n② 每個長方體：長 × 寬 × 高\n③ 加總（或大減小）→ ？\n驗算：檢查單位是立方公分或立方公尺 ✅',
      '👉 組合圖形先拆再合，注意別漏算或重複。'
    ];
  }

  // large_numbers_comparison
  if (/large_numbers_comparison/.test(kind)) {
    return [
      '⭐ 觀念提醒\n不同單位的數量要先換算成同一單位再比較。',
      '🔍 列式引導\n1 公噸 = 1000 公斤。全部轉成公斤（或公噸）再排序。',
      '📐 一步步算：\n① 統一單位（全部換成公斤或公噸）\n② 依大小排列\n③ 找出題目要的答案 → ？\n驗算：換回原單位確認正確 ✅',
      '👉 比大小前一定要「統一單位」。'
    ];
  }

  // 20260302Test — multi-step word problems
  if (/20260302Test/.test(kind)) {
    const fracs = extractFractions(text);
    if (text.includes('%')) {
      // Percent problem
      return [
        '⭐ 觀念提醒\n百分率問題：找出各階段用掉的比例，逆推全部。',
        '🔍 列式引導\n從「最後剩餘」反推：剩餘 ÷ 剩餘比率 = 全部。',
        '📐 一步步算：\n① 第一天用 35%，剩 65%\n② 第二天用剩下的 40%，剩 65% × 60% = 39%\n③ 39% = 390 公斤，全部 = 390 ÷ 0.39 → ？\n驗算：正推驗算每天剩餘量 ✅',
        '👉 百分率反推：從剩下的量和比率逆推全部。'
      ];
    }
    if (fracs.length >= 2) {
      // Multi-step fraction
      return [
        '⭐ 觀念提醒\n連續取幾分之幾後求剩餘或原量：分步計算。',
        '🔍 列式引導\n剩下比率 = (1 − 第一個分數) × (1 − 第二個分數)',
        '📐 一步步算：\n① 第一步後剩 1 − ' + fracs[0].str + '\n② 第二步後剩上一步 × (1 − ' + fracs[1].str + ')\n③ 用剩餘量反推或正算 → ？\n驗算：正反推算一次確認 ✅',
        '👉 多步驟分數問題：把每步的「剩餘比率」串乘。'
      ];
    }
  }

  // Fallback
  return [
    '⭐ 觀念提醒\n仔細讀題，圈出關鍵數字和問題重點。',
    '🔍 列式引導\n把文字轉成算式：找到已知量和未知量。',
    '📐 一步步算：\n① 找出題目關鍵數量\n② 選擇正確的運算（加減乘除）\n③ 列式計算 → ？\n算完記得檢查答案合理性 ✅',
    '👉 數學解題：讀題→列式→計算→驗算。'
  ];
}

// Process both modules
const MODULES = [
  { dir: 'interactive-g5-national-bank' },
  { dir: 'interactive-g5-midterm1' }
];

for (const mod of MODULES) {
  const bp = path.join(__dirname, '..', 'docs', mod.dir, 'bank.js');
  const src = fs.readFileSync(bp, 'utf8');
  const sb = { window: {} };
  vm.createContext(sb);
  vm.runInContext(src, sb);
  const bankKey = Object.keys(sb.window).find(k => Array.isArray(sb.window[k]));
  const items = sb.window[bankKey];

  let generated = 0;
  for (const q of items) {
    if (q.hints && q.hints.length > 0) continue;
    q.hints = generateHints(q);
    generated++;
  }

  const out = 'window.' + bankKey + ' = ' + JSON.stringify(items, null, 2) + ';\n';
  fs.writeFileSync(bp, out, 'utf8');

  // Sync to dist
  const distBp = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', mod.dir, 'bank.js');
  if (fs.existsSync(path.dirname(distBp))) {
    fs.writeFileSync(distBp, out, 'utf8');
  }

  console.log(mod.dir + ': generated ' + generated + ' hint sets');
}
