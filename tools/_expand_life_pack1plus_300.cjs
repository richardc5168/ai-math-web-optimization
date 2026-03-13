#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');

var DOCS = path.join(__dirname, '..', 'docs', 'interactive-g5-life-pack1plus-empire', 'bank.js');
var DIST = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'interactive-g5-life-pack1plus-empire', 'bank.js');

// ---- Helpers ----
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % t; a = t; } return a; }
function simplify(n, d) { var g = gcd(n, d); return [n / g, d / g]; }
function fracStr(n, d) { var s = simplify(n, d); return s[1] === 1 ? String(s[0]) : s[0] + '/' + s[1]; }
function ips(intVal, places) {
  if (places === 0) return String(intVal);
  var s = String(Math.abs(intVal)).padStart(places + 1, '0');
  var ip = s.slice(0, s.length - places);
  var dp2 = s.slice(s.length - places).replace(/0+$/, '');
  var sign = intVal < 0 ? '-' : '';
  return dp2 ? sign + ip + '.' + dp2 : sign + ip;
}

// ---- Read existing bank ----
var src = fs.readFileSync(DOCS, 'utf8');
var w = {};
new Function('window', src)(w);
var bank = w.G5_LIFE_PACK1PLUS_BANK;
console.log('Before:', bank.length);
if (bank.length !== 240) { console.error('Expected 240, got', bank.length); process.exit(1); }

var topicBase = '小五生活應用題｜第一包｜加強版｜帝國';

// ===== u1_avg_fraction (10 new, IDs 21-30) =====
var u1Items = ['蛋糕','餅乾','果汁','牛奶','糖果','蘋果','冰淇淋','布丁','果凍','薯片'];
// [totalN, totalD, people] → answer = totalN / (totalD * people) simplified
var u1Data = [
  [9,5,3],[8,3,4],[15,7,5],[10,9,2],[14,11,7],
  [15,4,5],[20,3,4],[18,7,9],[21,8,3],[16,9,8]
];
u1Data.forEach(function(d, i) {
  var tN = d[0], tD = d[1], ppl = d[2];
  var ansN = tN, ansD = tD * ppl;
  var ans = fracStr(ansN, ansD);
  var total = tN + '/' + tD;
  var id = 'g5lp1p_u1_avg_fraction_' + (21 + i);
  bank.push({
    id: id, kind: 'u1_avg_fraction', topic: topicBase, difficulty: 'hard',
    question: '（生活應用｜平均分配）有 ' + total + ' 個' + u1Items[i] + '，平均分給 ' + ppl + ' 人，每人得到多少個？（用最簡分數 a/b 表示）',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n「平均分配」= 總量 ÷ 人數。分數 ÷ 整數 = 分數 × 1/整數。',
      '📊 把除法改成乘法：除以 ' + ppl + ' 等於乘以 1/' + ppl + '。',
      '📐 一步步算：\n① 把「平均分給 ' + ppl + ' 人」寫成 ÷' + ppl + '\n② 列式：' + total + ' ÷ ' + ppl + '\n③ 等於 ？（最簡分數）\n④ 檢查：人數越多，每人分到應越少。\n算完記得回頭檢查喔！✅',
      '👉 總量 ÷ 人數 → 分數除以整數 = 分數 × (1/整數) = 分母乘上整數、分子不動。最後約分。'
    ],
    steps: ['把「平均分給 ' + ppl + ' 人」寫成 ÷' + ppl, '列式：' + total + ' ÷ ' + ppl, '等於 ' + ans + '（最簡分數）', '檢查：人數越多，每人分到應越少。'],
    explanation: '平均分配：' + total + ' ÷ ' + ppl + ' = ' + ans + '。',
    common_mistakes: ['分數運算時分子分母算錯。', '忘了約分或通分。'],
    tags: ['生活應用', '分數', '平均分配'],
    core: ['分數意義', '平均分配=除法', '最簡分數'],
    meta: { people: ppl, total: total }
  });
});

// ===== u2_frac_addsub_life (10 new, IDs 21-30) =====
var u2Units = ['杯水','杯果汁','杯牛奶','公升油','杯紅茶','杯豆漿','杯茶','杯可可','杯蜂蜜水','杯檸檬汁'];
// [op, aN, aD, bN, bD] → compute answer
var u2Data = [
  ['+',3,4,1,6],   // 9/12 + 2/12 = 11/12
  ['-',5,6,1,3],   // 5/6 - 2/6 = 3/6 = 1/2
  ['+',2,3,3,8],   // 16/24 + 9/24 = 25/24
  ['-',7,8,1,4],   // 7/8 - 2/8 = 5/8
  ['+',1,3,2,5],   // 5/15 + 6/15 = 11/15
  ['-',4,5,1,3],   // 12/15 - 5/15 = 7/15
  ['+',3,7,1,2],   // 6/14 + 7/14 = 13/14
  ['-',5,6,1,4],   // 10/12 - 3/12 = 7/12
  ['+',2,5,3,10],  // 4/10 + 3/10 = 7/10
  ['-',7,9,1,6]    // 14/18 - 3/18 = 11/18
];
u2Data.forEach(function(d, i) {
  var op = d[0], aN = d[1], aD = d[2], bN = d[3], bD = d[4];
  var lcd = aD * bD / gcd(aD, bD);
  var lN = aN * (lcd / aD), rN = bN * (lcd / bD);
  var resN = op === '+' ? lN + rN : lN - rN;
  var ans = fracStr(resN, lcd);
  var aStr = aN + '/' + aD, bStr = bN + '/' + bD;
  var opWord = op === '+' ? '加上' : '用掉';
  var opWord2 = op === '+' ? '一共' : '還剩';
  var id = 'g5lp1p_u2_frac_addsub_life_' + (21 + i);
  bank.push({
    id: id, kind: 'u2_frac_addsub_life', topic: topicBase, difficulty: 'medium',
    question: '（生活應用｜分數' + (op === '+' ? '加' : '減') + '法）原本有 ' + aStr + ' ' + u2Units[i] + '，' + opWord + ' ' + bStr + ' ' + u2Units[i] + '，' + opWord2 + '多少 ' + u2Units[i] + '？（最簡分數）',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n分數加減法要先通分（找最小公倍數），再加減分子。',
      '📊 通分：' + aD + ' 和 ' + bD + ' 的最小公倍數是 ' + lcd + '。',
      '📐 一步步算：\n① 通分到同分母 ' + lcd + '\n② ' + aStr + ' → ' + lN + '/' + lcd + '，' + bStr + ' → ' + rN + '/' + lcd + '\n③ 分子相' + (op === '+' ? '加' : '減') + '\n④ 約分成最簡分數\n算完記得回頭檢查喔！✅',
      '👉 分數加減：先通分再計算分子。最後約分成最簡分數。'
    ],
    steps: ['通分到同分母 ' + lcd, aStr + ' → ' + lN + '/' + lcd, bStr + ' → ' + rN + '/' + lcd, '分子' + (op === '+' ? '相加' : '相減') + ' → ' + ans],
    explanation: aStr + ' ' + op + ' ' + bStr + ' = ' + ans + '。',
    common_mistakes: ['分數運算時分子分母算錯。', '忘了約分或通分。'],
    tags: ['生活應用', '分數', '通分', '加減'],
    core: ['通分', '最小公倍數', '最簡分數'],
    meta: { op: op, a: aStr, b: bStr, d1: aD, d2: bD }
  });
});

// ===== u3_frac_times_int (10 new, IDs 21-30) =====
var u3Items = ['桶牛奶','箱蘋果','盒蛋糕','包糖果','瓶果汁','袋餅乾','罐蜂蜜','杯紅茶','盤水果','份甜點'];
// [fracN, fracD, k]
var u3Data = [
  [7,6,4],[5,8,3],[11,4,2],[3,5,7],[9,7,5],
  [4,9,6],[7,3,4],[5,12,8],[8,5,3],[11,6,9]
];
u3Data.forEach(function(d, i) {
  var fN = d[0], fD = d[1], k = d[2];
  var resN = fN * k, resD = fD;
  var ans = fracStr(resN, resD);
  var frac = fN + '/' + fD;
  var id = 'g5lp1p_u3_frac_times_int_' + (21 + i);
  bank.push({
    id: id, kind: 'u3_frac_times_int', topic: topicBase, difficulty: 'hard',
    question: '（生活應用｜分數×整數）每份是 ' + frac + ' 個' + u3Items[i] + '，共有 ' + k + ' 份，一共有多少個' + u3Items[i] + '？（最簡分數）',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n分數 × 整數 = 分子 × 整數 / 分母。',
      '📊 ' + frac + ' × ' + k + ' = 分子 ' + fN + ' × ' + k + ' / 分母 ' + fD + '。',
      '📐 一步步算：\n① 列式：' + frac + ' × ' + k + '\n② 分子乘整數：' + fN + ' × ' + k + '\n③ 約分成最簡分數\n④ 檢查大小合理\n算完記得回頭檢查喔！✅',
      '👉 分數乘整數：分子 × 整數，分母不變。最後約分。'
    ],
    steps: ['列式：' + frac + ' × ' + k, '分子 × 整數：' + fN + ' × ' + k + ' = ' + resN, '分母不變：' + fD, '約分 → ' + ans],
    explanation: frac + ' × ' + k + ' = ' + ans + '。',
    common_mistakes: ['分數運算時分子分母算錯。', '忘了約分或通分。'],
    tags: ['生活應用', '分數', '乘法'],
    core: ['分數乘整數', '最簡分數'],
    meta: { frac: frac, k: k }
  });
});

// ===== u4_money_decimal_addsub (10 new, IDs 21-30) =====
var u4Items = [
  ['筆記本','彩色筆','膠帶'],['書包','水壺','墊板'],['剪刀','口紅膠','資料夾'],
  ['尺','鉛筆盒','橡皮擦'],['蠟筆','圓規','膠水'],['色紙','訂書機','迴紋針'],
  ['信封','便條紙','鉛筆'],['修正帶','直尺','活頁紙'],['原子筆','美工刀','三角板'],
  ['計算機','量角器','墨水']
];
// prices in cents → [c1, c2, c3]
var u4Cents = [
  [125,375,250],[430,285,160],[95,135,345],
  [240,520,165],[365,45,215],[155,445,350],
  [625,130,95],[280,315,430],[85,435,255],
  [390,160,595]
];
u4Cents.forEach(function(cents, i) {
  var total = cents[0] + cents[1] + cents[2];
  var ans = ips(total, 2);
  var items = u4Items[i];
  var p0 = ips(cents[0], 2), p1 = ips(cents[1], 2), p2 = ips(cents[2], 2);
  var id = 'g5lp1p_u4_money_decimal_addsub_' + (21 + i);
  bank.push({
    id: id, kind: 'u4_money_decimal_addsub', topic: topicBase, difficulty: 'hard',
    question: '（生活應用｜金錢小數加法）買了 ' + items[0] + ' ' + p0 + ' 元、' + items[1] + ' ' + p1 + ' 元、' + items[2] + ' ' + p2 + ' 元，一共要付多少元？（可寫小數）',
    answer: ans, answer_mode: 'money2',
    hints: [
      '⭐ 觀念提醒\n多個金額相加，小數點要對齊再加。',
      '📊 把三個金額小數點對齊：' + p0 + ' + ' + p1 + ' + ' + p2 + '。',
      '📐 一步步算：\n① 小數點對齊\n② 從最小位數開始加\n③ 注意進位\n④ 驗算：答案應約等於估算值\n算完記得回頭檢查喔！✅',
      '👉 金錢加法：小數點對齊後，從右邊開始逐位相加，注意進位。'
    ],
    steps: ['小數點對齊', p0 + ' + ' + p1 + ' + ' + p2, '逐位相加', '合計 = ' + ans + ' 元'],
    explanation: p0 + ' + ' + p1 + ' + ' + p2 + ' = ' + ans + ' 元。',
    common_mistakes: ['小數點沒有對齊就加。', '進位時算錯。'],
    tags: ['生活應用', '小數', '金錢', '加減'],
    core: ['小數位值', '金錢計算', '加減法'],
    meta: { prices_cents: cents, scenario: '合計' }
  });
});

// ===== u5_decimal_muldiv_price (10 new, IDs 21-30) =====
var u5Items = ['果汁','牛奶','餅乾','咖啡','鉛筆','汽水','奶茶','筆記本','飲料','橡皮擦'];
// [unit_cents, qty]
var u5Data = [
  [250,3],[325,6],[175,9],[450,3],[85,9],
  [625,5],[275,7],[135,4],[380,6],[95,8]
];
u5Data.forEach(function(d, i) {
  var uc = d[0], qty = d[1];
  var totalC = uc * qty;
  var ans = ips(totalC, 2);
  var price = ips(uc, 2);
  var id = 'g5lp1p_u5_decimal_muldiv_price_' + (21 + i);
  bank.push({
    id: id, kind: 'u5_decimal_muldiv_price', topic: topicBase, difficulty: 'easy',
    question: '（生活應用｜單價×數量）一瓶' + u5Items[i] + ' ' + price + ' 元，買 ' + qty + ' 瓶，一共多少元？',
    answer: ans, answer_mode: 'money2',
    hints: [
      '⭐ 觀念提醒\n總價 = 單價 × 數量。',
      '📊 ' + price + ' × ' + qty + ' = ?',
      '📐 一步步算：\n① 列式：' + price + ' × ' + qty + '\n② 先去掉小數點做整數乘法\n③ 放回小數點\n④ 估算檢查\n算完記得回頭檢查喔！✅',
      '👉 單價 × 數量 = 總價。小數乘整數先去小數點再放回。'
    ],
    steps: ['列式：' + price + ' × ' + qty, '先去掉小數點做整數乘法', '放回小數點', '總價 = ' + ans + ' 元'],
    explanation: price + ' × ' + qty + ' = ' + ans + ' 元。',
    common_mistakes: ['忘了放回小數點。', '乘法計算粗心。'],
    tags: ['生活應用', '小數', '單價', '平均'],
    core: ['乘除關係', '單位（元/分）', '平均概念'],
    meta: { unit_cents: uc, qty: qty, mode: 'mul' }
  });
});

// ===== u6_frac_dec_convert (10 new, IDs 21-30) =====
// [decimal string, numerator, denominator (after simplify), places]
var u6Data = [
  ['0.35',7,20,2],['0.125',1,8,3],['0.45',9,20,2],['0.72',18,25,2],['0.375',3,8,3],
  ['0.84',21,25,2],['0.625',5,8,3],['0.15',3,20,2],['0.48',12,25,2],['0.875',7,8,3]
];
u6Data.forEach(function(d, i) {
  var dec = d[0], fN = d[1], fD = d[2], places = d[3];
  var ans = fN + '/' + fD;
  var id = 'g5lp1p_u6_frac_dec_convert_' + (21 + i);
  bank.push({
    id: id, kind: 'u6_frac_dec_convert', topic: topicBase, difficulty: 'medium',
    question: '（生活應用｜等值）把小數 ' + dec + ' 寫成最簡分數 a/b。',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n小數轉分數：看有幾位小數，分母就是 10、100 或 1000。',
      '📊 ' + dec + ' 有 ' + places + ' 位小數，分母是 ' + Math.pow(10, places) + '。',
      '📐 一步步算：\n① ' + dec + ' = ?/' + Math.pow(10, places) + '\n② 找分子、分母的最大公因數\n③ 約分成最簡分數\n④ 驗算：分數轉回小數檢查\n算完記得回頭檢查喔！✅',
      '👉 小數→分數：寫成幾分之幾，再約分。記得約到最簡！'
    ],
    steps: [dec + ' = ' + Math.round(Number(dec) * Math.pow(10, places)) + '/' + Math.pow(10, places), '找最大公因數', '約分', '最簡分數 = ' + ans],
    explanation: dec + ' = ' + ans + '。',
    common_mistakes: ['約分沒約到最簡。', '小數位數數錯，分母寫錯。'],
    tags: ['分數', '小數', '等值'],
    core: ['位值', '約分'],
    meta: { from: dec, to: ans, type: 'decimal_to_fraction', places: places }
  });
});

// ---- Verify ----
console.log('After:', bank.length);
if (bank.length !== 300) { console.error('EXPECTED 300, got', bank.length); process.exit(1); }

var ids = {};
for (var qi = 0; qi < bank.length; qi++) {
  if (ids[bank[qi].id]) { console.error('DUPLICATE ID:', bank[qi].id); process.exit(1); }
  ids[bank[qi].id] = true;
}

// Verify new questions (last 60)
for (var ni = 240; ni < 300; ni++) {
  var q = bank[ni];
  if (!q.answer || q.answer === 'undefined') { console.error('BAD ANSWER:', q.id); process.exit(1); }
  // L3 hint leak check (skip single-char answers)
  if (q.hints[2].indexOf(q.answer) !== -1 && q.answer.length > 1) {
    console.error('L3 HINT LEAK:', q.id, 'answer=' + q.answer); process.exit(1);
  }
}
console.log('All 60 new questions verified.');

// ---- Write ----
var out = '/* eslint-disable */\nwindow.G5_LIFE_PACK1PLUS_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
fs.writeFileSync(DOCS, out, 'utf8');
fs.writeFileSync(DIST, out, 'utf8');
console.log('Done. 240 → 300. Written to docs/ and dist/.');
