#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');

var DOCS = path.join(__dirname, '..', 'docs', 'interactive-g5-life-pack2plus-empire', 'bank.js');
var DIST = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'interactive-g5-life-pack2plus-empire', 'bank.js');

// ---- Helpers ----
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % t; a = t; } return a; }
function fracStr(n, d) { var g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + '/' + d; }
function ips(intVal, places) {
  if (places === 0) return String(intVal);
  var s = String(Math.abs(intVal)).padStart(places + 1, '0');
  var ip = s.slice(0, s.length - places);
  var dp2 = s.slice(s.length - places).replace(/0+$/, '');
  var sign = intVal < 0 ? '-' : '';
  return dp2 ? sign + ip + '.' + dp2 : sign + ip;
}

// ---- Read ----
var src = fs.readFileSync(DOCS, 'utf8');
var w = {};
new Function('window', src)(w);
var bank = w.G5_LIFE_PACK2PLUS_BANK;
console.log('Before:', bank.length);
if (bank.length !== 250) { console.error('Expected 250, got', bank.length); process.exit(1); }

var T = '小五生活應用題｜第二包 基礎入門｜帝國';

// ===== u1_avg_fraction +10 (IDs 21-30) =====
var u1Units = ['公升牛奶','公斤麵粉','公升水','公斤米','公升果汁','公斤糖','公升豆漿','公斤餅乾','公升茶','公斤蛋糕'];
// [totalStr, people] → answer = total/people
var u1Data = [
  ['3',4],['5',8],['7',2],['9',5],['4',3],
  ['11',6],['2',7],['6',5],['8',9],['5',3]
];
u1Data.forEach(function(d, i) {
  var total = d[0], ppl = d[1], unit = u1Units[i];
  var tN = parseInt(total);
  var ans = fracStr(tN, ppl);
  var id = 'g5lp2p_u1_avg_fraction_' + (21 + i);
  bank.push({
    id: id, kind: 'u1_avg_fraction', topic: T, difficulty: 'easy',
    question: '（生活應用｜平均分配）有 ' + total + ' ' + unit + '，平均分給 ' + ppl + ' 人，每人得到多少' + unit + '？（用最簡分數 a/b 表示）',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n「平均分配」= 總量 ÷ 人數。',
      '📊 ' + total + ' ÷ ' + ppl + ' = ?（用分數表示）',
      '📐 一步步算：\n① 列式：' + total + ' ÷ ' + ppl + '\n② 寫成分數\n③ 約分成最簡分數\n④ 檢查大小合理\n算完記得回頭檢查喔！✅',
      '👉 整數 ÷ 整數 = 分數。分子是被除數，分母是除數。記得約分。'
    ],
    steps: ['列式：' + total + ' ÷ ' + ppl, '寫成分數 ' + tN + '/' + ppl, '約分', '= ' + ans],
    explanation: total + ' ÷ ' + ppl + ' = ' + ans + '。',
    common_mistakes: ['分子分母寫反。', '忘了約分。'],
    tags: ['生活應用', '分數', '平均分配'],
    core: ['分數意義', '平均分配=除法', '最簡分數'],
    meta: { people: ppl, total: total, unit: unit }
  });
});

// ===== u2_frac_addsub_life +10 (IDs 21-30) =====
var u2Units = ['公升水','公升果汁','公升牛奶','公升油','公升紅茶','公升豆漿','公升檸檬汁','公升蜂蜜水','公升咖啡','公升可可'];
var u2Data = [
  ['+',5,8,1,4],  // 5/8 + 2/8 = 7/8
  ['-',7,10,1,5], // 7/10 - 2/10 = 1/2
  ['+',3,5,1,4],  // 12/20 + 5/20 = 17/20
  ['-',8,9,1,3],  // 8/9 - 3/9 = 5/9
  ['+',1,6,3,8],  // 4/24 + 9/24 = 13/24
  ['-',3,4,1,5],  // 15/20 - 4/20 = 11/20
  ['+',2,7,1,3],  // 6/21 + 7/21 = 13/21
  ['-',9,10,1,4], // 18/20 - 5/20 = 13/20
  ['+',1,4,5,12], // 3/12 + 5/12 = 8/12 = 2/3
  ['-',5,7,1,3]   // 15/21 - 7/21 = 8/21
];
u2Data.forEach(function(d, i) {
  var op = d[0], aN = d[1], aD = d[2], bN = d[3], bD = d[4];
  var lcd = aD * bD / gcd(aD, bD);
  var lN = aN * (lcd / aD), rN = bN * (lcd / bD);
  var resN = op === '+' ? lN + rN : lN - rN;
  var ans = fracStr(resN, lcd);
  var aStr = aN + '/' + aD, bStr = bN + '/' + bD;
  var opW = op === '+' ? '加上' : '用掉';
  var opW2 = op === '+' ? '一共' : '還剩';
  var id = 'g5lp2p_u2_frac_addsub_life_' + (21 + i);
  bank.push({
    id: id, kind: 'u2_frac_addsub_life', topic: T, difficulty: 'hard',
    question: '（生活應用｜分數' + (op === '+' ? '加' : '減') + '法）原本有 ' + aStr + ' ' + u2Units[i] + '，' + opW + ' ' + bStr + ' ' + u2Units[i] + '，' + opW2 + '多少' + u2Units[i] + '？（最簡分數）',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n分數加減法要先通分再計算分子。',
      '📊 通分：' + aD + ' 和 ' + bD + ' 的最小公倍數是 ' + lcd + '。',
      '📐 一步步算：\n① 通分到同分母 ' + lcd + '\n② ' + aStr + ' → ' + lN + '/' + lcd + '，' + bStr + ' → ' + rN + '/' + lcd + '\n③ 分子相' + (op === '+' ? '加' : '減') + '\n④ 約分\n算完記得回頭檢查喔！✅',
      '👉 分數加減：先通分再計算分子。最後約分成最簡分數。'
    ],
    steps: ['通分到同分母 ' + lcd, aStr + ' → ' + lN + '/' + lcd, bStr + ' → ' + rN + '/' + lcd, '分子' + (op === '+' ? '相加' : '相減') + ' → ' + ans],
    explanation: aStr + ' ' + op + ' ' + bStr + ' = ' + ans + '。',
    common_mistakes: ['忘了通分直接加減。', '約分沒約到最簡。'],
    tags: ['生活應用', '分數', '通分', '加減'],
    core: ['通分', '最小公倍數', '最簡分數'],
    meta: { op: op, a: aStr, b: bStr, d1: aD, d2: bD }
  });
});

// ===== u4_money_decimal_addsub +10 (IDs 21-30) =====
var u4Items = [
  ['文具','筆袋','膠帶'],['蘋果','香蕉','橘子'],['麵包','果醬','奶油'],
  ['襪子','手帕','髮夾'],['鑰匙圈','貼紙','徽章'],['本子','彩筆','尺'],
  ['餅乾','巧克力','棒棒糖'],['氣球','緞帶','蠟燭'],['洗手乳','毛巾','肥皂'],
  ['紙杯','紙盤','塑膠袋']
];
var u4Cents = [
  [235,465,150],[345,185,295],[75,265,135],
  [540,315,270],[195,85,345],[460,285,130],
  [325,545,155],[65,235,475],[380,245,350],
  [125,405,695]
];
u4Cents.forEach(function(cents, i) {
  var total = cents[0] + cents[1] + cents[2];
  var ans = ips(total, 2);
  var items = u4Items[i];
  var p0 = ips(cents[0], 2), p1 = ips(cents[1], 2), p2 = ips(cents[2], 2);
  var id = 'g5lp2p_u4_money_decimal_addsub_' + (21 + i);
  bank.push({
    id: id, kind: 'u4_money_decimal_addsub', topic: T, difficulty: 'hard',
    question: '（生活應用｜金錢小數加法）買了 ' + items[0] + ' ' + p0 + ' 元、' + items[1] + ' ' + p1 + ' 元、' + items[2] + ' ' + p2 + ' 元，一共要付多少元？（可寫小數）',
    answer: ans, answer_mode: 'money2',
    hints: [
      '⭐ 觀念提醒\n多個金額相加，小數點要對齊再加。',
      '📊 ' + p0 + ' + ' + p1 + ' + ' + p2 + ' = ?',
      '📐 一步步算：\n① 小數點對齊\n② 從最小位數開始加\n③ 注意進位\n④ 估算檢查\n算完記得回頭檢查喔！✅',
      '👉 金錢加法：小數點對齊後逐位相加，注意進位。'
    ],
    steps: ['小數點對齊', p0 + ' + ' + p1 + ' + ' + p2, '逐位相加', '合計 = ' + ans + ' 元'],
    explanation: p0 + ' + ' + p1 + ' + ' + p2 + ' = ' + ans + ' 元。',
    common_mistakes: ['小數點沒有對齊就加。', '進位時算錯。'],
    tags: ['生活應用', '小數', '金錢', '加減'],
    core: ['小數位值', '金錢計算', '加減法'],
    meta: { prices_cents: cents, scenario: '合計' }
  });
});

// ===== u5_decimal_muldiv_price +10 (IDs 21-30) =====
var u5Items = ['蘋果','巧克力','原子筆','茶葉','糖果','麵包','可樂','泡麵','牛奶糖','果凍'];
var u5Data = [
  [145,6],[375,3],[65,8],[525,3],[115,7],
  [235,5],[425,6],[75,9],[185,4],[295,3]
];
u5Data.forEach(function(d, i) {
  var uc = d[0], qty = d[1];
  var totalC = uc * qty;
  var ans = ips(totalC, 2);
  var price = ips(uc, 2);
  var id = 'g5lp2p_u5_decimal_muldiv_price_' + (21 + i);
  bank.push({
    id: id, kind: 'u5_decimal_muldiv_price', topic: T, difficulty: 'medium',
    question: '（生活應用｜單價×數量）一個' + u5Items[i] + ' ' + price + ' 元，買 ' + qty + ' 個，一共多少元？',
    answer: ans, answer_mode: 'money2',
    hints: [
      '⭐ 觀念提醒\n總價 = 單價 × 數量。',
      '📊 ' + price + ' × ' + qty + ' = ?',
      '📐 一步步算：\n① 列式：' + price + ' × ' + qty + '\n② 先去掉小數點做整數乘法\n③ 放回小數點\n④ 估算檢查\n算完記得回頭檢查喔！✅',
      '👉 單價 × 數量 = 總價。小數乘整數先去小數點再放回。'
    ],
    steps: ['列式：' + price + ' × ' + qty, '整數乘法', '放回小數點', '總價 = ' + ans + ' 元'],
    explanation: price + ' × ' + qty + ' = ' + ans + ' 元。',
    common_mistakes: ['忘了放回小數點。', '乘法計算粗心。'],
    tags: ['生活應用', '小數', '單價', '平均'],
    core: ['乘除關係', '單位（元/分）', '平均概念'],
    meta: { unit_cents: uc, qty: qty, mode: 'mul', people: null }
  });
});

// ===== u6_frac_dec_convert +10 (IDs 21-30) =====
// [decStr, simplified_num, simplified_den, places]
var u6Data = [
  ['0.56',14,25,2],['0.225',9,40,3],['0.64',16,25,2],['0.175',7,40,3],['0.32',8,25,2],
  ['0.525',21,40,3],['0.68',17,25,2],['0.025',1,40,3],['0.36',9,25,2],['0.775',31,40,3]
];
u6Data.forEach(function(d, i) {
  var dec = d[0], fN = d[1], fD = d[2], places = d[3];
  var ans = fN + '/' + fD;
  var rawN = Math.round(Number(dec) * Math.pow(10, places));
  var id = 'g5lp2p_u6_frac_dec_convert_' + (21 + i);
  bank.push({
    id: id, kind: 'u6_frac_dec_convert', topic: T, difficulty: 'easy',
    question: '（生活應用｜等值｜溫度/比例）把小數 ' + dec + ' 寫成最簡分數 a/b。',
    answer: ans, answer_mode: 'fraction',
    hints: [
      '⭐ 觀念提醒\n小數轉分數：看有幾位小數，分母就是 10、100 或 1000。',
      '📊 ' + dec + ' 有 ' + places + ' 位小數，分母是 ' + Math.pow(10, places) + '。',
      '📐 一步步算：\n① ' + dec + ' = ' + rawN + '/' + Math.pow(10, places) + '\n② 找最大公因數\n③ 約分成最簡分數\n④ 驗算\n算完記得回頭檢查喔！✅',
      '👉 小數→分數：寫成幾分之幾，再約分。記得約到最簡！'
    ],
    steps: [dec + ' = ' + rawN + '/' + Math.pow(10, places), '找最大公因數', '約分', '最簡分數 = ' + ans],
    explanation: dec + ' = ' + ans + '。',
    common_mistakes: ['約分沒約到最簡。', '小數位數數錯。'],
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
for (var ni = 250; ni < 300; ni++) {
  var q = bank[ni];
  if (!q.answer || q.answer === 'undefined') { console.error('BAD ANSWER:', q.id); process.exit(1); }
  if (q.hints[2].indexOf(q.answer) !== -1 && q.answer.length > 1) {
    console.error('L3 HINT LEAK:', q.id, 'answer=' + q.answer); process.exit(1);
  }
}
console.log('All 50 new questions verified.');

// ---- Write ----
var out = '/* eslint-disable */\nwindow.G5_LIFE_PACK2PLUS_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
fs.writeFileSync(DOCS, out, 'utf8');
fs.writeFileSync(DIST, out, 'utf8');
console.log('Done. 250 → 300. Written to docs/ and dist/.');
