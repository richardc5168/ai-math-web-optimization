#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs', 'interactive-decimal-g5', 'bank.js');
const DIST = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'interactive-decimal-g5', 'bank.js');

// ---- Helpers ----
function pad3(n) { return String(n).padStart(3, '0'); }
function dp(s) { return (String(s).split('.')[1] || '').length; }

/** Convert integer-value + decimal-places → clean string.  ips(57,3)→"0.057" */
function ips(intVal, places) {
  if (places === 0) return String(intVal);
  const s = String(Math.abs(intVal)).padStart(places + 1, '0');
  const ip = s.slice(0, s.length - places);
  const dp2 = s.slice(s.length - places).replace(/0+$/, '');
  const sign = intVal < 0 ? '-' : '';
  return dp2 ? sign + ip + '.' + dp2 : sign + ip;
}

/** Exact decimal × decimal via integer math */
function mulS(aS, bS) {
  const ap = dp(aS), bp = dp(bS);
  const ai = Math.round(Number(aS) * Math.pow(10, ap));
  const bi = Math.round(Number(bS) * Math.pow(10, bp));
  const raw = ai * bi;
  return { ans: ips(raw, ap + bp), ai, bi, ap, bp, tp: ap + bp, raw };
}

/** Exact decimal ÷ integer via integer math */
function divDI(dvdS, dvs) {
  const p = dp(dvdS);
  const intDvd = Math.round(Number(dvdS) * Math.pow(10, p));
  const r = intDvd / dvs;
  if (!Number.isInteger(r)) throw new Error(dvdS + '/' + dvs + ' non-exact');
  return ips(r, p);
}

/** Integer ÷ integer → terminating decimal string */
function divII(a, b) {
  var m = 1, p = 0;
  while (p < 10) {
    if ((a * m) % b === 0) return ips((a * m) / b, p);
    m *= 10; p++;
  }
  throw new Error(a + '/' + b + ' non-terminating');
}

/** ×10/100/1000 shift via string digit manipulation */
function shiftR(xS, shift) {
  var parts = xS.split('.'), ip = parts[0], decP = parts[1] || '';
  var all = ip + decP;
  if (shift >= decP.length) {
    return String(Number(all + '0'.repeat(shift - decP.length)));
  }
  var si = ip.length + shift;
  var iStr = all.slice(0, si);
  var dStr = all.slice(si).replace(/0+$/, '');
  return String(Number(iStr + (dStr ? '.' + dStr : '')));
}

// ---- Read existing bank ----
var src = fs.readFileSync(DOCS, 'utf8');
var w = {};
new Function('window', src)(w);
var bank = w.INTERACTIVE_DECIMAL_G5_BANK;
console.log('Before:', bank.length);
if (bank.length !== 240) { console.error('Expected 240, got', bank.length); process.exit(1); }

var T = '五下｜互動小數計算';
var g = 241;

// ===== 1. x10_shift (10 questions, g=241-250) =====
[
  ['3.14',1],['0.567',2],['12.8',1],['1.045',3],['7.6',2],
  ['0.29',1],['156.3',2],['0.008',3],['45.12',1],['0.73',3]
].forEach(function(pair) {
  var x = pair[0], sh = pair[1];
  var fac = Math.pow(10, sh);
  var ans = shiftR(x, sh);
  bank.push({
    id: 'idg5_shift_' + pad3(g), kind: 'x10_shift', topic: T, difficulty: 'medium',
    question: '（互動）小數點移動：' + x + ' ×' + fac + ' = ?',
    answer: ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n乘以 ' + fac + ' 就是把小數點往右移 ' + sh + ' 格。',
      '📊 把 ' + x + ' 的小數點往右移 ' + sh + ' 格。',
      '📐 一步步算：\n① ' + x + ' ×' + fac + '\n② 小數點往右移 ' + sh + ' 格\n③ 自己算算看！\n④ 結果應該變大\n算完記得回頭檢查喔！✅',
      '👉 乘以 10 的倍數，小數點向右移動。乘10 移1格，乘100 移2格，乘1000 移3格。'
    ],
    steps: [x + ' ×' + fac, '小數點往右移 ' + sh + ' 格', '= ' + ans, '變大 ✓'],
    meta: { x: x, shift: sh, unit: '', context: 'x10_shift' },
    explanation: x + ' × ' + fac + ' = ' + ans + '，小數點往右移 ' + sh + ' 格。',
    common_mistakes: ['小數點位置放錯。', '計算粗心，數字抄錯。']
  });
  g++;
});

// ===== 2. int_div_int_to_decimal (10, g=251-260) =====
[
  [9,4],[15,8],[7,2],[11,4],[23,5],
  [13,8],[19,4],[31,8],[17,5],[27,4]
].forEach(function(pair) {
  var a = pair[0], b = pair[1];
  var ans = divII(a, b);
  bank.push({
    id: 'idg5_int_div_dec_' + pad3(g), kind: 'int_div_int_to_decimal', topic: T, difficulty: 'medium',
    question: '（互動）計算：' + a + ' ÷ ' + b + ' = ?（商是小數）',
    answer: ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n整數 ÷ 整數 若除不盡，可以加小數點繼續除。',
      '📊 ' + a + ' ÷ ' + b + '，不夠除就補 0 繼續除。',
      '📐 一步步算：\n① ' + a + ' ÷ ' + b + '\n② 不夠除就補 0 繼續\n③ 算出商\n④ 驗算：商 × ' + b + ' 要等於 ' + a + '\n算完記得回頭檢查喔！✅',
      '👉 整數除法不一定整除，可以往下補 0 算出小數。記得驗算！'
    ],
    steps: [a + ' ÷ ' + b, '不夠除就補 0 繼續', '商 = ' + ans, '驗算：' + ans + '×' + b + ' = ' + a],
    meta: { dividend: a, divisor: b, unit: '', context: 'int_div_int_to_decimal' },
    explanation: a + ' ÷ ' + b + ' = ' + ans + '。',
    common_mistakes: ['計算粗心，數字看錯或抄錯。', '公式記錯或套錯。']
  });
  g++;
});

// ===== 3. d_div_int (10, g=261-270) =====
var ddI = ['水','麵粉','果汁','牛奶','砂糖','油','醬油','鮮奶','蜂蜜','茶葉'];
var ddU = ['公升','公斤','公升','公升','公斤','公升','公升','公升','公斤','公斤'];
[
  ['0.456',8],['0.225',5],['0.648',6],['0.312',4],['0.735',7],
  ['0.864',9],['2.448',8],['3.555',5],['1.236',6],['4.284',4]
].forEach(function(pair, i) {
  var dvd = pair[0], dvs = pair[1];
  var ans = divDI(dvd, dvs);
  bank.push({
    id: 'idg5_d_div_int_' + pad3(g), kind: 'd_div_int', topic: T, difficulty: 'medium',
    question: '（互動）把 ' + dvd + ' ' + ddU[i] + ' 的' + ddI[i] + '平均分給 ' + dvs + ' 人，每人多少 ' + ddU[i] + '？',
    answer: ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n小數 ÷ 整數，就是把小數按照直式除法來算。',
      '📊 列式：' + dvd + ' ÷ ' + dvs + '，做直式除法。',
      '📐 一步步算：\n① 列式：' + dvd + ' ÷ ' + dvs + '\n② 做到小數點就往上點到商\n③ 不夠除就補 0 繼續\n④ 記得檢查小數點對齊\n算完記得回頭檢查喔！✅',
      '👉 小數除以整數，商的小數點要和被除數對齊。不夠除的位數補 0 繼續。'
    ],
    steps: ['列式：' + dvd + ' ÷ ' + dvs, '做到小數點就往上點到商', '不夠除就補 0 繼續', '商 = ' + ans + ' ' + ddU[i]],
    meta: { dividend: dvd, divisor: dvs, unit: ddU[i], context: 'd_div_int' },
    explanation: dvd + ' ÷ ' + dvs + ' = ' + ans + ' ' + ddU[i] + '。',
    common_mistakes: ['商的小數點沒有對齊被除數的小數點。', '不夠除時忘了在商上補 0。']
  });
  g++;
});

// ===== 4. d_mul_d (10, g=271-280) =====
[
  ['2.3','4.5'],['1.6','3.8'],['5.4','2.7'],['3.2','6.5'],['7.1','1.4'],
  ['8.3','2.6'],['4.7','3.3'],['9.2','1.8'],['6.6','5.2'],['3.9','4.1']
].forEach(function(pair) {
  var a = pair[0], b = pair[1];
  var m = mulS(a, b);
  bank.push({
    id: 'idg5_d_mul_d_' + pad3(g), kind: 'd_mul_d', topic: T, difficulty: 'hard',
    question: '（互動）長方形長 ' + a + ' 公尺、寬 ' + b + ' 公尺，面積是多少平方公尺？',
    answer: m.ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n面積 = 長 × 寬。小數 × 小數，先去掉小數點做整數乘法，再放回小數點。',
      '📊 先去掉小數點：' + m.ai + ' × ' + m.bi + ' = ' + m.raw + '。',
      '📐 一步步算：\n① 估算 ' + a + '×' + b + '\n② 去掉小數點做整數乘\n③ 小數位數 ' + m.ap + '+' + m.bp + ' = ' + m.tp + ' 位\n④ 放回小數點\n算完記得回頭檢查喔！✅',
      '👉 小數乘小數：先去掉小數點做整數乘法，再把小數位數加起來放回去。'
    ],
    steps: ['估算 ' + a + '×' + b, '去掉小數點做整數乘', '小數位數 ' + m.ap + '+' + m.bp + ' = ' + m.tp + ' 位', '放回小數點 → ' + m.ans + ' 平方公尺'],
    meta: { a: a, b: b, a_int: m.ai, b_int: m.bi, a_places: m.ap, b_places: m.bp, raw_int_product: m.raw, total_places: m.tp, unit: '平方公尺', context: 'd_mul_d' },
    explanation: a + ' × ' + b + ' = ' + m.ans + ' 平方公尺。',
    common_mistakes: ['忘了放回小數點，直接把整數乘法的結果當成答案。', '小數位數數錯（' + a + ' 有 ' + m.ap + ' 位小數），小數點位置放錯。']
  });
  g++;
});

// ===== 5. int_mul_d (10, g=281-290) =====
var imdN = ['書本','衣服','鞋子','背包','手錶','水壺','雨傘','帽子','文具組','玩具'];
[
  [120,'0.85'],[150,'0.6'],[200,'0.45'],[85,'0.4'],[180,'0.25'],
  [250,'0.8'],[95,'0.3'],[160,'0.55'],[220,'0.15'],[140,'0.35']
].forEach(function(pair, i) {
  var a = pair[0], b = pair[1];
  var m = mulS(String(a), b);
  var pct = Math.round(Number(b) * 100);
  bank.push({
    id: 'idg5_int_mul_d_' + pad3(g), kind: 'int_mul_d', topic: T, difficulty: 'medium',
    question: '（互動）' + imdN[i] + '原價 ' + a + ' 元，打 ' + b + ' 倍（= 付 ' + pct + '%），要付多少元？',
    answer: m.ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n打折 = 原價 × 折數。乘以小於 1 的數，結果會變小。',
      '📊 ' + a + ' × ' + b + ' = ?',
      '📐 一步步算：\n① 乘 ' + b + ' 會變小\n② 先去掉小數點做整數乘\n③ ' + a + ' × ' + b + ' = ?\n④ 答案應該比 ' + a + ' 小\n算完記得回頭檢查喔！✅',
      '👉 打折就是乘以小數。先去掉小數點做整數乘法，再放回小數點。'
    ],
    steps: ['乘 ' + b + ' 會變小', '先去掉小數點做整數乘', a + ' × ' + b + ' = ' + m.ans, '答案 ' + m.ans + ' 元'],
    meta: { a: String(a), b: b, a_int: m.ai, b_int: m.bi, a_places: m.ap, b_places: m.bp, raw_int_product: m.raw, total_places: m.tp, unit: '元', context: 'int_mul_d' },
    explanation: imdN[i] + '原價 ' + a + ' 元，打 ' + b + ' 倍，要付 ' + m.ans + ' 元。',
    common_mistakes: ['小數點位置放錯。', '計算粗心，數字抄錯。']
  });
  g++;
});

// ===== 6. d_mul_int (10, g=291-300) =====
var dmiN = ['白米','紅茶','橘子','牛奶','花生','砂糖','果汁','蜂蜜','咖啡豆','葡萄'];
var dmiU = ['公斤','公升','公斤','公升','公斤','公斤','公升','公斤','公斤','公斤'];
[
  ['0.35',8],['1.24',3],['0.67',9],['2.15',4],['0.48',7],
  ['3.06',5],['1.73',6],['0.82',8],['4.25',3],['0.59',7]
].forEach(function(pair, i) {
  var a = pair[0], b = pair[1];
  var m = mulS(a, String(b));
  bank.push({
    id: 'idg5_d_mul_int_' + pad3(g), kind: 'd_mul_int', topic: T, difficulty: 'medium',
    question: '（互動）' + dmiN[i] + '每份 ' + a + ' ' + dmiU[i] + '，買 ' + b + ' 份，一共多少' + dmiU[i] + '？（可寫小數）',
    answer: m.ans, answer_mode: 'number',
    hints: [
      '⭐ 觀念提醒\n小數 × 整數，先去掉小數點做整數乘法，再放回小數點。',
      '📊 去掉小數點做整數乘法：' + m.ai + ' × ' + m.bi + ' = ' + m.raw + '。',
      '📐 一步步算：\n① 列式：' + a + ' × ' + b + '\n② 去掉小數點做整數乘法\n③ 放回小數點（' + a + ' 有 ' + m.ap + ' 位小數）\n④ 估算檢查\n算完記得回頭檢查喔！✅',
      '👉 小數乘整數：先去小數點做整數乘，再按原小數位數放回。'
    ],
    steps: ['列式：' + a + ' × ' + b, '去掉小數點做整數乘法', '放回小數點 → ' + m.ans, '估算檢查 ✓'],
    meta: { a: a, b: String(b), a_int: m.ai, b_int: m.bi, a_places: m.ap, b_places: m.bp, raw_int_product: m.raw, total_places: m.tp, unit: dmiU[i], context: 'd_mul_int' },
    explanation: a + ' × ' + b + ' = ' + m.ans + ' ' + dmiU[i] + '。',
    common_mistakes: ['忘了放回小數點，直接把整數乘法的結果當成答案。', '小數位數數錯（' + a + ' 有 ' + m.ap + ' 位小數），小數點位置放錯。']
  });
  g++;
});

// ---- Verify ----
console.log('After:', bank.length);
if (bank.length !== 300) { console.error('EXPECTED 300, got', bank.length); process.exit(1); }

var ids = {};
for (var qi = 0; qi < bank.length; qi++) {
  var q = bank[qi];
  if (ids[q.id]) { console.error('DUPLICATE ID:', q.id); process.exit(1); }
  ids[q.id] = true;
}

for (var ni = 240; ni < 300; ni++) {
  var nq = bank[ni];
  if (isNaN(Number(nq.answer))) { console.error('BAD ANSWER:', nq.id, nq.answer); process.exit(1); }
  if (nq.hints[2].indexOf(nq.answer) !== -1 && nq.answer.length > 1) {
    console.error('L3 HINT LEAK:', nq.id, 'answer=' + nq.answer); process.exit(1);
  }
}
console.log('All 60 new questions verified.');

// ---- Write ----
var out = '/* eslint-disable */\nwindow.INTERACTIVE_DECIMAL_G5_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
fs.writeFileSync(DOCS, out, 'utf8');
fs.writeFileSync(DIST, out, 'utf8');
console.log('Done. 240 → 300. Written to docs/ and dist/.');
