#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');

var DOCS = path.join(__dirname, '..', 'docs', 'fraction-g5', 'bank.js');
var DIST = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'fraction-g5', 'bank.js');

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % t; a = t; } return a; }
function fracStr(n, d) { var g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + '/' + d; }
function lcmFn(a, b) { return a * b / gcd(a, b); }
function pad3(n) { return String(n).padStart(3, '0'); }

var src = fs.readFileSync(DOCS, 'utf8');
var w = {};
new Function('window', src)(w);
var bank = w.FRACTION_G5_BANK;
console.log('Before:', bank.length);
if (bank.length !== 200) { console.error('Expected 200'); process.exit(1); }

var T = '國小五年級｜分數（計算）';
var cm1 = ['分子分母算錯。', '忘了約分。'];
var cm2 = ['通分算錯。', '忘了約分。'];

// Track maxN per kind
var maxN = {};
bank.forEach(function(q) {
  var n = parseInt(q.id.replace(/\D+/g, ' ').trim().split(' ').pop());
  if (!maxN[q.kind] || n > maxN[q.kind]) maxN[q.kind] = n;
});

function mkQ(prefix, kind, diff, question, answer, hints, steps, expl) {
  if (!maxN[kind]) maxN[kind] = 0;
  maxN[kind]++;
  return { id: prefix + '_' + pad3(maxN[kind]), kind: kind, topic: T, difficulty: diff,
    question: question, answer: answer, hints: hints, steps: steps,
    explanation: expl, common_mistakes: cm1 };
}

// ===== simplify +9 =====
[[24,36],[15,45],[14,49],[20,35],[36,48],[21,56],[16,40],[27,63],[35,56]].forEach(function(d) {
  var n = d[0], den = d[1], ans = fracStr(n, den);
  bank.push(mkQ('fg5_simplify', 'simplify', 'easy',
    '（約分）把分數化成最簡分數：' + n + '/' + den,
    ans,
    ['⭐ 觀念提醒\n找分子和分母的最大公因數（GCD），同除。',
     '📊 ' + n + ' 和 ' + den + ' 的 GCD = ' + gcd(n, den) + '。',
     '📐 一步步算：\n① 找 GCD(' + n + ', ' + den + ') = ' + gcd(n, den) + '\n② 分子分母同除以 GCD\n③ 得到最簡分數\n④ 確認無公因數\n算完記得回頭檢查喔！✅',
     '👉 約分就是分子分母同除以最大公因數。'],
    ['GCD = ' + gcd(n, den), n + '÷' + gcd(n, den) + ' / ' + den + '÷' + gcd(n, den), '= ' + ans, '確認最簡 ✓'],
    n + '/' + den + ' = ' + ans + '。'));
});

// ===== add_like +11 =====
[[2,5,11],[3,4,13],[5,7,18],[4,7,15],[3,5,16],[6,8,17],[5,3,14],[2,4,9],[7,9,20],[3,8,19],[5,1,12]].forEach(function(d) {
  var a = d[0], b = d[1], den = d[2], sum = a + b, ans = fracStr(sum, den);
  bank.push(mkQ('fg5_add_like', 'add_like', 'easy',
    '（同分母加法）計算：' + a + '/' + den + ' + ' + b + '/' + den + ' = ?',
    ans,
    ['⭐ 觀念提醒\n同分母加法：分母不變，分子相加。',
     '📊 分子 ' + a + ' + ' + b + ' = ' + sum + '。',
     '📐 一步步算：\n① 分母不變 = ' + den + '\n② 分子相加 = ' + sum + '\n③ 約分\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 同分母直接加分子，最後約分。'],
    ['分母 = ' + den, '分子 ' + a + '+' + b + '=' + sum, '約分', '= ' + ans],
    a + '/' + den + ' + ' + b + '/' + den + ' = ' + ans + '。'));
});

// ===== mixed_convert +11 (all improper→mixed) =====
[[23,7],[41,9],[14,5],[53,8],[16,3],[29,4],[47,11],[67,10],[23,6],[38,7],[65,9]].forEach(function(d) {
  var n = d[0], den = d[1];
  var whole = Math.floor(n / den), rem = n % den;
  var ans = whole + ' ' + rem + '/' + den;
  bank.push(mkQ('fg5_mixed_convert', 'mixed_convert', 'easy',
    '（互換）把假分數改成帶分數：' + n + '/' + den + ' = ?',
    ans,
    ['⭐ 觀念提醒\n假分數→帶分數：用分子÷分母，商是整數、餘數是分子。',
     '📊 ' + n + ' ÷ ' + den + ' = ' + whole + ' 餘 ' + rem + '。',
     '📐 一步步算：\n① ' + n + ' ÷ ' + den + '\n② 商 = 整數部分\n③ 餘數 = 新分子\n④ 組合成帶分數\n算完記得回頭檢查喔！✅',
     '👉 分子÷分母 → 商又餘/分母。'],
    [n + ' ÷ ' + den + ' = ' + whole + '...' + rem, '整數 = ' + whole, '分子 = ' + rem, '= ' + ans],
    n + '/' + den + ' = ' + ans + '。'));
});

// ===== sub_unlike +11 =====
[[3,4,1,3],[5,6,1,4],[7,8,2,5],[4,5,1,6],[3,7,1,4],[7,10,1,3],[5,9,1,6],[8,11,1,2],[2,3,3,8],[5,7,2,9],[9,10,2,7]].forEach(function(d) {
  var aN = d[0], aD = d[1], bN = d[2], bD = d[3];
  var lcd = lcmFn(aD, bD);
  var lN = aN * (lcd / aD), rN = bN * (lcd / bD);
  var ans = fracStr(lN - rN, lcd);
  bank.push(mkQ('fg5_sub_unlike', 'sub_unlike', 'medium',
    '（異分母減法）計算：' + aN + '/' + aD + ' − ' + bN + '/' + bD + ' = ?',
    ans,
    ['⭐ 觀念提醒\n異分母減法：先通分，再減分子。',
     '📊 LCD(' + aD + ', ' + bD + ') = ' + lcd + '。',
     '📐 一步步算：\n① 通分到 ' + lcd + '\n② ' + aN + '/' + aD + ' → ' + lN + '/' + lcd + '\n③ ' + bN + '/' + bD + ' → ' + rN + '/' + lcd + '\n④ 分子相減再約分\n算完記得回頭檢查喔！✅',
     '👉 先通分再減分子，最後約分。'],
    ['LCD = ' + lcd, lN + '/' + lcd + ' − ' + rN + '/' + lcd, '分子相減', '= ' + ans],
    aN + '/' + aD + ' − ' + bN + '/' + bD + ' = ' + ans + '。'));
});

// ===== mul_int +12 =====
[[3,8,4],[5,7,3],[2,9,6],[7,12,8],[4,11,5],[3,10,4],[5,6,9],[2,7,14],[8,15,3],[7,9,6],[1,4,10],[3,5,8]].forEach(function(d) {
  var fN = d[0], fD = d[1], k = d[2];
  var ans = fracStr(fN * k, fD);
  bank.push(mkQ('fg5_mul_int', 'mul_int', 'easy',
    '（分數×整數）計算：' + fN + '/' + fD + ' × ' + k + ' = ?',
    ans,
    ['⭐ 觀念提醒\n分數×整數 = 分子×整數 / 分母。',
     '📊 ' + fN + ' × ' + k + ' = ' + (fN * k) + '。',
     '📐 一步步算：\n① 分子 × 整數 = ' + fN + ' × ' + k + '\n② 分母不變 = ' + fD + '\n③ 約分\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 分子乘整數，分母不變，約分。'],
    ['分子 ' + fN + '×' + k + '=' + (fN * k), '分母 = ' + fD, '約分', '= ' + ans],
    fN + '/' + fD + ' × ' + k + ' = ' + ans + '。'));
});

// ===== mul +11 =====
[[2,5,3,7],[4,9,3,8],[7,10,5,14],[3,4,8,15],[5,11,2,3],[6,7,7,12],[8,9,3,4],[5,12,4,5],[3,8,2,9],[9,14,7,6],[2,3,9,14]].forEach(function(d) {
  var aN = d[0], aD = d[1], bN = d[2], bD = d[3];
  var ans = fracStr(aN * bN, aD * bD);
  bank.push(mkQ('fg5_mul', 'mul', 'easy',
    '（分數乘法）計算：' + aN + '/' + aD + ' × ' + bN + '/' + bD + ' = ?',
    ans,
    ['⭐ 觀念提醒\n分數×分數：分子×分子、分母×分母。',
     '📊 (' + aN + '×' + bN + ')/(' + aD + '×' + bD + ') = ' + (aN * bN) + '/' + (aD * bD) + '。',
     '📐 一步步算：\n① 分子 ' + aN + '×' + bN + ' = ' + (aN * bN) + '\n② 分母 ' + aD + '×' + bD + ' = ' + (aD * bD) + '\n③ 約分\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 上×上、下×下，約分到最簡。'],
    ['分子 = ' + (aN * bN), '分母 = ' + (aD * bD), '約分', '= ' + ans],
    aN + '/' + aD + ' × ' + bN + '/' + bD + ' = ' + ans + '。'));
});

// ===== add_unlike +12 =====
[[1,3,1,4],[2,5,1,6],[3,7,2,3],[1,4,3,10],[5,8,1,6],[2,9,1,4],[3,5,1,7],[4,11,1,3],[1,6,3,8],[2,7,3,5],[5,12,1,9],[1,5,2,11]].forEach(function(d) {
  var aN = d[0], aD = d[1], bN = d[2], bD = d[3];
  var lcd = lcmFn(aD, bD);
  var lN = aN * (lcd / aD), rN = bN * (lcd / bD);
  var ans = fracStr(lN + rN, lcd);
  bank.push(mkQ('fg5_add_unlike', 'add_unlike', 'medium',
    '（異分母加法）計算：' + aN + '/' + aD + ' + ' + bN + '/' + bD + ' = ?',
    ans,
    ['⭐ 觀念提醒\n異分母加法：先通分，再加分子。',
     '📊 LCD(' + aD + ', ' + bD + ') = ' + lcd + '。',
     '📐 一步步算：\n① 通分到 ' + lcd + '\n② ' + aN + '/' + aD + ' → ' + lN + '/' + lcd + '\n③ ' + bN + '/' + bD + ' → ' + rN + '/' + lcd + '\n④ 分子相加再約分\n算完記得回頭檢查喔！✅',
     '👉 先通分再加分子，最後約分。'],
    ['LCD = ' + lcd, lN + '/' + lcd + ' + ' + rN + '/' + lcd, '分子相加', '= ' + ans],
    aN + '/' + aD + ' + ' + bN + '/' + bD + ' = ' + ans + '。'));
});

// ===== sub_like +11 =====
[[8,3,13],[10,4,17],[7,2,11],[9,5,14],[12,7,19],[11,4,15],[8,5,9],[13,9,16],[7,1,12],[15,7,22],[14,5,23]].forEach(function(d) {
  var a = d[0], b = d[1], den = d[2], diff = a - b, ans = fracStr(diff, den);
  bank.push(mkQ('fg5_sub_like', 'sub_like', 'easy',
    '（同分母減法）計算：' + a + '/' + den + ' − ' + b + '/' + den + ' = ?',
    ans,
    ['⭐ 觀念提醒\n同分母減法：分母不變，分子相減。',
     '📊 分子 ' + a + ' − ' + b + ' = ' + diff + '。',
     '📐 一步步算：\n① 分母不變 = ' + den + '\n② 分子 ' + a + ' − ' + b + '\n③ 約分\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 同分母直接減分子，最後約分。'],
    ['分母 = ' + den, '分子 ' + a + '-' + b + '=' + diff, '約分', '= ' + ans],
    a + '/' + den + ' − ' + b + '/' + den + ' = ' + ans + '。'));
});

// ===== equivalent +12 =====
// Mix of "a/b = ?/c" and "a/□ = b/c" formats
[[3,5,35,'n'],[2,7,49,'n'],[4,9,63,'n'],[5,6,42,'n'],[1,4,28,'n'],[7,8,56,'n'],
 [3,11,66,'n'],[5,12,60,'n'],[2,3,24,'n'],[6,7,63,'n'],[4,5,45,'n'],[8,9,72,'n']].forEach(function(d) {
  var origN = d[0], origD = d[1], target = d[2];
  var mul = target / origD;
  var ans = origN * mul; // numerator answer
  bank.push(mkQ('fg5_equivalent', 'equivalent', 'easy',
    '（等值分數）填空：' + origN + '/' + origD + ' = □/' + target,
    String(ans),
    ['⭐ 觀念提醒\n等值分數：分子分母同乘或同除一個數。',
     '📊 ' + origD + ' × ? = ' + target + '，所以乘 ' + mul + '。',
     '📐 一步步算：\n① 分母 ' + origD + ' → ' + target + '，乘了 ' + mul + '\n② 分子也乘 ' + mul + '\n③ ' + origN + ' × ' + mul + ' = ?\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 分子分母同乘相同的數，分數值不變。'],
    ['分母 ×' + mul, '分子 ' + origN + ' × ' + mul, '= ' + ans, '驗算 ✓'],
    origN + '/' + origD + ' = ' + ans + '/' + target + '。'));
});

// ---- Verify ----
console.log('After:', bank.length);
if (bank.length !== 300) { console.error('EXPECTED 300, got', bank.length); process.exit(1); }
var ids = {};
for (var qi = 0; qi < bank.length; qi++) {
  if (ids[bank[qi].id]) { console.error('DUPLICATE ID:', bank[qi].id); process.exit(1); }
  ids[bank[qi].id] = true;
}
for (var ni = 200; ni < 300; ni++) {
  var q = bank[ni];
  if (!q.answer || q.answer === 'undefined') { console.error('BAD ANSWER:', q.id); process.exit(1); }
  if (q.hints[2].indexOf(q.answer) !== -1 && q.answer.length > 1) {
    console.error('L3 HINT LEAK:', q.id, 'answer=' + q.answer); process.exit(1);
  }
}
console.log('All 100 new questions verified.');

var out = '/* eslint-disable */\nwindow.FRACTION_G5_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
fs.writeFileSync(DOCS, out, 'utf8');
fs.writeFileSync(DIST, out, 'utf8');
console.log('Done. 200 → 300. Written to docs/ and dist/.');
