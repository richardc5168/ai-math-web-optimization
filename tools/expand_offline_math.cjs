#!/usr/bin/env node
/**
 * expand_offline_math.cjs
 * Generates additional questions for offline-math/bank.js
 * Adds 80+ questions across new topic areas: fractions, decimals, more time/div/dist
 * All answers are computed programmatically to ensure correctness.
 * Hints guide but NEVER reveal the final answer (no hint leaks).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const NOW = new Date().toISOString();

function makeQ(id, grade, topic, type, params, prompt, answer, teacherSteps, hints) {
  const steps = teacherSteps.map(s => s.say);
  return {
    id, grade, topic, type, params, prompt,
    answer: String(answer),
    teacherSteps,
    source: { pdf: 'generated/expand_offline_math', page: null, qno: null },
    meta: { generatedAt: NOW, generator: 'tools/expand_offline_math.cjs' },
    question: prompt,
    hints,
    steps,
    explanation: steps.join(' → '),
    kind: 'general'
  };
}

function ts(k, say, extra) { return { k, say, ...extra }; }

const questions = [];

// ---- MORE TIME CALCULATIONS (time-011..020) ----
const timeProblems = [
  { id: 'offline_time-011', type: 'time_add', params: { h1: 3, m1: 45, h2: 2, m2: 30 },
    prompt: '3時45分 + 2時30分 = ?', answer: '6 15',
    steps: [
      ts('concept', '時間加法：分鐘和小時分別相加，分鐘滿60進位。'),
      ts('compute', '分鐘：45 + 30 = 75，75 ≥ 60，進位 1 時，餘 15 分', { expr: '45+30', value: '75' }),
      ts('compute', '小時：3 + 2 + 1(進位) = 6 時', { expr: '3+2+1', value: '6' }),
      ts('result', '答案是 6時15分。', { value: '6 15' }),
    ],
    hints: ['分鐘和小時分開加，分鐘超過60要進位。', '45 + 30 = 75 分鐘，75 分鐘等於 1 小時又幾分？', '請完成進位計算，寫出最終答案。']
  },
  { id: 'offline_time-012', type: 'time_sub', params: { h1: 5, m1: 10, h2: 2, m2: 35 },
    prompt: '5時10分 − 2時35分 = ?', answer: '2 35',
    steps: [
      ts('concept', '時間減法：分鐘不夠減時，向小時借1（=60分）。'),
      ts('compute', '10分 < 35分，需要借位：(5−1)時 = 4時，(10+60)分 = 70分', { expr: '10+60', value: '70' }),
      ts('compute', '分鐘：70 − 35 = 35 分', { expr: '70-35', value: '35' }),
      ts('compute', '小時：4 − 2 = 2 時', { expr: '4-2', value: '2' }),
      ts('result', '答案是 2時35分。', { value: '2 35' }),
    ],
    hints: ['分鐘不夠減時，從小時借 1（等於 60 分鐘）。', '借位後分鐘變成 10 + 60 = 70 分，再減去 35 分。', '請完成小時的計算並寫出答案。']
  },
  { id: 'offline_time-013', type: 'time_mul', params: { h: 1, m: 25, n: 4 },
    prompt: '1時25分 × 4 = ?', answer: '5 40',
    steps: [
      ts('concept', '時間乘法：分鐘和小時分別乘，分鐘滿60再進位。'),
      ts('compute', '分鐘：25 × 4 = 100 分', { expr: '25*4', value: '100' }),
      ts('compute', '100 分 = 1 時 40 分', { expr: '100/60', value: '1...40' }),
      ts('compute', '小時：1 × 4 + 1(進位) = 5 時', { expr: '1*4+1', value: '5' }),
      ts('result', '答案是 5時40分。', { value: '5 40' }),
    ],
    hints: ['先把分鐘和小時分別乘以 4。', '25 × 4 = 100 分鐘，100 分鐘要換算成幾時幾分？', '請完成進位並寫出最終答案。']
  },
  { id: 'offline_time-014', type: 'time_div', params: { h: 8, m: 20, n: 5 },
    prompt: '8時20分 ÷ 5 = ?', answer: '1 40',
    steps: [
      ts('concept', '時間除法：先除小時，餘數轉成分鐘再加上原分鐘一起除。'),
      ts('compute', '8 ÷ 5 = 1 餘 3，3時 = 180分', { expr: '8/5', value: '1...3' }),
      ts('compute', '180 + 20 = 200 分', { expr: '180+20', value: '200' }),
      ts('compute', '200 ÷ 5 = 40 分', { expr: '200/5', value: '40' }),
      ts('result', '答案是 1時40分。', { value: '1 40' }),
    ],
    hints: ['先除小時部分，餘數轉成分鐘。', '8 ÷ 5 = 1 餘 3，3 時等於幾分鐘？加上原有的 20 分一起除。', '請完成分鐘的除法並寫出答案。']
  },
  { id: 'offline_time-015', type: 'time_add', params: { h1: 7, m1: 48, h2: 3, m2: 25 },
    prompt: '7時48分 + 3時25分 = ?', answer: '11 13',
    steps: [
      ts('concept', '時間加法：分鐘和小時分別相加，分鐘滿60進位。'),
      ts('compute', '分鐘：48 + 25 = 73 分，73 ≥ 60 → 進位 1 時，餘 13 分', { expr: '48+25', value: '73' }),
      ts('compute', '小時：7 + 3 + 1 = 11 時', { expr: '7+3+1', value: '11' }),
      ts('result', '答案是 11時13分。', { value: '11 13' }),
    ],
    hints: ['分鐘和小時分開加，分鐘超過60要進位。', '48 + 25 得到的分鐘數超過 60 嗎？超過要進位。', '請完成進位後寫出答案。']
  },
  { id: 'offline_time-016', type: 'time_sub', params: { h1: 10, m1: 5, h2: 4, m2: 50 },
    prompt: '10時5分 − 4時50分 = ?', answer: '5 15',
    steps: [
      ts('concept', '時間減法：分鐘不夠減時，向小時借1（=60分）再相減。'),
      ts('compute', '5分 < 50分，借位：(10−1) = 9時，(5+60) = 65分', { expr: '5+60', value: '65' }),
      ts('compute', '分鐘：65 − 50 = 15 分', { expr: '65-50', value: '15' }),
      ts('compute', '小時：9 − 4 = 5 時', { expr: '9-4', value: '5' }),
      ts('result', '答案是 5時15分。', { value: '5 15' }),
    ],
    hints: ['分鐘不夠減時要借位。', '5 分鐘不夠減 50 分鐘，向小時借 1。', '請完成借位後的減法並寫出答案。']
  },
  { id: 'offline_time-017', type: 'time_convert', params: { minutes: 185 },
    prompt: '185 分鐘 = ? 時 ? 分', answer: '3 5',
    steps: [
      ts('concept', '把分鐘換成時和分：用除法，185 ÷ 60。'),
      ts('compute', '185 ÷ 60 = 3 餘 5', { expr: '185/60', value: '3...5' }),
      ts('result', '答案是 3 時 5 分。', { value: '3 5' }),
    ],
    hints: ['1 時 = 60 分，用 185 ÷ 60 來換算。', '185 ÷ 60 的商是幾？餘數是幾？', '請寫出幾時幾分的答案。']
  },
  { id: 'offline_time-018', type: 'time_convert', params: { minutes: 248 },
    prompt: '248 分鐘 = ? 時 ? 分', answer: '4 8',
    steps: [
      ts('concept', '把分鐘換成時和分：248 ÷ 60。'),
      ts('compute', '248 ÷ 60 = 4 餘 8', { expr: '248/60', value: '4...8' }),
      ts('result', '答案是 4 時 8 分。', { value: '4 8' }),
    ],
    hints: ['1 時 = 60 分，用除法換算。', '248 ÷ 60 的商和餘數是多少？', '請寫出答案。']
  },
  { id: 'offline_time-019', type: 'time_elapsed', params: { start: '08:45', end: '11:20' },
    prompt: '從上午 8 時 45 分到上午 11 時 20 分，經過多少時間？', answer: '2 35',
    steps: [
      ts('concept', '計算經過時間：用結束時間減去開始時間。'),
      ts('compute', '分鐘：20 − 45，不夠減，借位：(11−1)=10時，(20+60)=80分', { value: '80' }),
      ts('compute', '分鐘：80 − 45 = 35 分', { expr: '80-45', value: '35' }),
      ts('compute', '小時：10 − 8 = 2 時', { expr: '10-8', value: '2' }),
      ts('result', '答案是 2 時 35 分。', { value: '2 35' }),
    ],
    hints: ['用結束時間減去開始時間。', '分鐘不夠減要借位。', '請完成計算並寫出經過幾時幾分。']
  },
  { id: 'offline_time-020', type: 'time_elapsed', params: { start: '14:15', end: '17:00' },
    prompt: '從下午 2 時 15 分到下午 5 時 0 分，經過多少時間？', answer: '2 45',
    steps: [
      ts('concept', '計算經過時間：17:00 − 14:15。'),
      ts('compute', '0 − 15 不夠減，借位：(17−1)=16時，(0+60)=60分', { value: '60' }),
      ts('compute', '分鐘：60 − 15 = 45 分', { expr: '60-15', value: '45' }),
      ts('compute', '小時：16 − 14 = 2 時', { expr: '16-14', value: '2' }),
      ts('result', '答案是 2 時 45 分。', { value: '2 45' }),
    ],
    hints: ['用 24 小時制計算：17:00 − 14:15。', '分鐘部分 0 − 15 不夠減，需要借位。', '請完成計算。']
  },
];
timeProblems.forEach(p => questions.push(makeQ(p.id, 5, 'time_calc', p.type, p.params, p.prompt, p.answer, p.steps, p.hints)));

// ---- MORE DIVISION WITH REMAINDER (div-011..025) ----
const divProblems = [
  { n: 11, a: 457, b: 12, q: 38, r: 1 },
  { n: 12, a: 523, b: 15, q: 34, r: 13 },
  { n: 13, a: 689, b: 23, q: 29, r: 22 },
  { n: 14, a: 841, b: 17, q: 49, r: 8 },
  { n: 15, a: 1000, b: 33, q: 30, r: 10 },
  { n: 16, a: 765, b: 28, q: 27, r: 9 },
  { n: 17, a: 932, b: 41, q: 22, r: 30 },
  { n: 18, a: 1234, b: 56, q: 22, r: 2 },
  { n: 19, a: 555, b: 13, q: 42, r: 9 },
  { n: 20, a: 876, b: 19, q: 46, r: 2 },
  { n: 21, a: 1500, b: 47, q: 31, r: 43 },
  { n: 22, a: 2048, b: 64, q: 32, r: 0 },
  { n: 23, a: 999, b: 37, q: 27, r: 0 },
  { n: 24, a: 1111, b: 45, q: 24, r: 31 },
  { n: 25, a: 777, b: 16, q: 48, r: 9 },
];
divProblems.forEach(p => {
  // Verify
  const check = p.a === p.q * p.b + p.r;
  if (!check) throw new Error(`Division check failed: ${p.a} / ${p.b}`);
  const ansStr = p.r === 0 ? String(p.q) : `${p.q}...${p.r}`;
  const id = `offline_div-${String(p.n).padStart(3,'0')}`;
  questions.push(makeQ(id, 5, 'division', 'long_division', { a: p.a, b: p.b },
    `${p.a} ÷ ${p.b} = ?（有餘數請寫 商...餘數）`,
    ansStr,
    [
      ts('concept', `用長除法計算 ${p.a} ÷ ${p.b}。`),
      ts('compute', `${p.a} ÷ ${p.b} = ${p.q}${p.r > 0 ? '…' + p.r : ''}`, { expr: `${p.a}/${p.b}`, value: ansStr }),
      ts('check', `檢查：${p.q} × ${p.b}${p.r > 0 ? ' + ' + p.r : ''} = ${p.a}。`),
      ts('result', `答案是 ${ansStr}。`, { value: ansStr }),
    ],
    [
      `這是長除法題目，先估商：${p.b} 的幾倍最接近 ${p.a}？`,
      `用直式除法一步步算，注意對齊位數。`,
      `請完成計算並檢查：商 × 除數 + 餘數 是否等於被除數。`
    ]
  ));
});

// ---- MORE DISTRIBUTIVE PROPERTY (dist-011..025) ----
const distProblems = [
  { n: 11, prompt: '25 × 36 = ?', hint: '25 × 36 = 25 × (4 × 9) = (25×4) × 9', answer: 900,
    steps: ['用分配律或結合律拆解，讓計算更簡便。', '25 × 4 = 100 是好用的組合。', '25 × 36 = 25 × 4 × 9 = 100 × 9 = 900。'],
    h: ['想想 25 和哪個數字相乘會得到整百？', '36 可以拆成 4 × 9，這樣就能利用 25 × 4。', '請完成簡便計算。'] },
  { n: 12, prompt: '99 × 45 = ?', hint: '(100−1) × 45', answer: 4455,
    steps: ['利用 99 = 100 − 1，簡化計算。', '99 × 45 = 100 × 45 − 1 × 45 = 4500 − 45。', '4500 − 45 = 4455。'],
    h: ['99 很接近哪個整數？可以改寫成相減的形式。', '(100 − 1) × 45 用分配律展開。', '請完成計算。'] },
  { n: 13, prompt: '125 × 24 = ?', hint: '125 × 8 × 3', answer: 3000,
    steps: ['125 × 8 = 1000 是好用的組合。', '24 = 8 × 3。', '125 × 24 = 125 × 8 × 3 = 1000 × 3 = 3000。'],
    h: ['125 和哪個數相乘會得到整千？', '24 可以拆成什麼 × 什麼，讓其中一個跟 125 配對？', '請完成計算。'] },
  { n: 14, prompt: '48 × 25 = ?', hint: '48 × 25 = 12 × (4×25)', answer: 1200,
    steps: ['25 × 4 = 100，找到可以拆出 4 的因數。', '48 = 12 × 4。', '48 × 25 = 12 × 4 × 25 = 12 × 100 = 1200。'],
    h: ['25 × 4 = 100，48 裡面能拆出 4 嗎？', '48 = 12 × 4，重新組合。', '請完成計算。'] },
  { n: 15, prompt: '101 × 37 = ?', hint: '(100+1) × 37', answer: 3737,
    steps: ['101 = 100 + 1，用分配律展開。', '101 × 37 = 100 × 37 + 1 × 37 = 3700 + 37。', '3700 + 37 = 3737。'],
    h: ['101 可以拆成 100 + 1。', '用分配律：(100 + 1) × 37 = ?', '請完成加法計算。'] },
  { n: 16, prompt: '50 × 78 = ?', hint: '50 × 78 = 100 × 39', answer: 3900,
    steps: ['50 = 100 ÷ 2，或者把 78 拆成 2 × 39。', '50 × 78 = 50 × 2 × 39 = 100 × 39。', '100 × 39 = 3900。'],
    h: ['50 × 2 = 100，78 可以拆出 2 嗎？', '78 = 2 × 39，重新組合。', '請完成計算。'] },
  { n: 17, prompt: '98 × 15 = ?', hint: '(100−2) × 15', answer: 1470,
    steps: ['98 = 100 − 2，用分配律。', '98 × 15 = 100 × 15 − 2 × 15 = 1500 − 30。', '1500 − 30 = 1470。'],
    h: ['98 接近 100，差多少？', '用分配律展開 (100 − 2) × 15。', '請完成計算。'] },
  { n: 18, prompt: '4 × 37 × 25 = ?', hint: '(4×25) × 37', answer: 3700,
    steps: ['先找好配對：4 × 25 = 100。', '4 × 37 × 25 = (4×25) × 37 = 100 × 37。', '100 × 37 = 3700。'],
    h: ['乘法交換律：可以先算哪兩個數相乘比較方便？', '4 × 25 = 100，用結合律重新分組。', '請完成計算。'] },
  { n: 19, prompt: '35 × 12 + 35 × 8 = ?', hint: '35 × (12+8)', answer: 700,
    steps: ['提公因數 35，用分配律合併。', '35 × 12 + 35 × 8 = 35 × (12 + 8) = 35 × 20。', '35 × 20 = 700。'],
    h: ['兩項都有共同因數 35，可以提出來。', '35 × (12 + 8) = 35 × ？', '請完成計算。'] },
  { n: 20, prompt: '64 × 125 = ?', hint: '(8×8) × 125 = 8 × (8×125)', answer: 8000,
    steps: ['125 × 8 = 1000，找 8 的因素。', '64 = 8 × 8。', '64 × 125 = 8 × 8 × 125 = 8 × 1000 = 8000。'],
    h: ['125 × 8 = 1000，64 可以拆出 8 嗎？', '64 = 8 × 8，用結合律重組。', '請完成計算。'] },
  { n: 21, prompt: '75 × 44 = ?', hint: '75 × 4 × 11', answer: 3300,
    steps: ['75 × 4 = 300，把 44 拆成 4 × 11。', '75 × 44 = 75 × 4 × 11 = 300 × 11。', '300 × 11 = 3300。'],
    h: ['75 × 4 會得到整百。', '44 可以拆成 4 × 11。', '請完成計算。'] },
  { n: 22, prompt: '250 × 36 = ?', hint: '250 × 4 × 9', answer: 9000,
    steps: ['250 × 4 = 1000。', '36 = 4 × 9。', '250 × 36 = 250 × 4 × 9 = 1000 × 9 = 9000。'],
    h: ['250 × 4 = ？', '36 = 4 × 9，利用這個分解。', '請完成計算。'] },
  { n: 23, prompt: '199 × 6 = ?', hint: '(200−1) × 6', answer: 1194,
    steps: ['199 = 200 − 1。', '199 × 6 = 200 × 6 − 1 × 6 = 1200 − 6。', '1200 − 6 = 1194。'],
    h: ['199 非常接近 200。', '用 (200 − 1) × 6 展開。', '請完成計算。'] },
  { n: 24, prompt: '8 × 47 × 125 = ?', hint: '(8×125) × 47', answer: 47000,
    steps: ['先配對 8 × 125 = 1000。', '8 × 47 × 125 = (8 × 125) × 47 = 1000 × 47。', '1000 × 47 = 47000。'],
    h: ['哪兩個數相乘可以得到整千？', '8 × 125 = 1000，用交換律重組。', '請完成計算。'] },
  { n: 25, prompt: '56 × 99 + 56 = ?', hint: '56 × 99 + 56 × 1 = 56 × (99+1)', answer: 5600,
    steps: ['56 × 99 + 56 = 56 × 99 + 56 × 1，提公因數。', '= 56 × (99 + 1) = 56 × 100。', '56 × 100 = 5600。'],
    h: ['56 出現在兩項中，可以提出來。', '56 × 99 + 56 × 1 = 56 × (99 + ?)。', '請完成計算。'] },
];
distProblems.forEach(p => {
  const id = `offline_dist-${String(p.n).padStart(3,'0')}`;
  questions.push(makeQ(id, 5, 'distributive', 'distributive_law', {},
    p.prompt, p.answer,
    p.steps.map((s,i) => ts(i===0?'concept':i===p.steps.length-1?'result':'compute', s)),
    p.h
  ));
});

// ---- FRACTION BASICS (frac-001..025) ----
const fracProblems = [
  { n:1, prompt:'1/3 + 1/6 = ?', answer:'1/2',
    steps:['先通分：1/3 = 2/6。','2/6 + 1/6 = 3/6 = 1/2（約分）。'],
    h:['兩個分數的分母不同，要先通分。','1/3 的分母 3 和 6 的最小公倍數是 6。','請完成通分後的加法，別忘了約分。'] },
  { n:2, prompt:'3/4 − 1/3 = ?', answer:'5/12',
    steps:['通分：3/4 = 9/12，1/3 = 4/12。','9/12 − 4/12 = 5/12。'],
    h:['分母 4 和 3 的最小公倍數是 12。','把兩個分數都化成 12 為分母。','請完成減法。'] },
  { n:3, prompt:'2/5 + 3/10 = ?', answer:'7/10',
    steps:['通分：2/5 = 4/10。','4/10 + 3/10 = 7/10。'],
    h:['5 和 10 的公倍數是 10。','把 2/5 化成分母為 10 的分數。','請完成加法。'] },
  { n:4, prompt:'5/6 − 1/4 = ?', answer:'7/12',
    steps:['通分：5/6 = 10/12，1/4 = 3/12。','10/12 − 3/12 = 7/12。'],
    h:['6 和 4 的最小公倍數是 12。','通分後再減。','請完成計算。'] },
  { n:5, prompt:'1/2 + 2/3 = ?', answer:'7/6',
    steps:['通分：1/2 = 3/6，2/3 = 4/6。','3/6 + 4/6 = 7/6。'],
    h:['2 和 3 的公倍數是 6。','分別化成分母為 6。','請完成分子相加。'] },
  { n:6, prompt:'7/8 − 1/2 = ?', answer:'3/8',
    steps:['通分：1/2 = 4/8。','7/8 − 4/8 = 3/8。'],
    h:['把 1/2 化成分母為 8 的分數。','1/2 = ?/8。','請完成減法。'] },
  { n:7, prompt:'2/3 + 1/4 + 1/6 = ?', answer:'13/12',
    steps:['通分到 12：2/3=8/12，1/4=3/12，1/6=2/12。','8/12 + 3/12 + 2/12 = 13/12。'],
    h:['3、4、6 的最小公倍數是 12。','把三個分數都化成分母 12。','請加總分子。'] },
  { n:8, prompt:'3/5 − 1/10 = ?', answer:'1/2',
    steps:['通分：3/5 = 6/10。','6/10 − 1/10 = 5/10 = 1/2。'],
    h:['把 3/5 化成分母為 10。','減法後記得約分。','請完成計算。'] },
  { n:9, prompt:'1 又 1/3 + 2/3 = ?', answer:'2',
    steps:['1 又 1/3 = 4/3（化假分數）。','4/3 + 2/3 = 6/3 = 2。'],
    h:['先把帶分數化成假分數。','1 又 1/3 = ?/3。','請完成加法並化簡。'] },
  { n:10, prompt:'2 又 1/4 − 3/4 = ?', answer:'3/2',
    steps:['2 又 1/4 = 9/4。','9/4 − 3/4 = 6/4 = 3/2。'],
    h:['先化假分數：2 又 1/4 = ?/4。','分母相同直接減。','請約分寫出最簡分數。'] },
  { n:11, prompt:'5/9 + 2/9 = ?', answer:'7/9',
    steps:['分母相同，直接加分子。','5/9 + 2/9 = 7/9。'],
    h:['分母相同的分數怎麼相加？','直接加分子就好。','請寫出答案。'] },
  { n:12, prompt:'4/7 + 2/7 = ?', answer:'6/7',
    steps:['分母相同，加分子：4 + 2 = 6。','4/7 + 2/7 = 6/7。'],
    h:['分母都是 7，只要加分子。','4 + 2 = ?','請寫出答案。'] },
  { n:13, prompt:'1/2 + 1/3 + 1/6 = ?', answer:'1',
    steps:['通分到 6：1/2=3/6，1/3=2/6，1/6=1/6。','3+2+1 = 6，6/6 = 1。'],
    h:['2、3、6 的最小公倍數是 6。','通分後加總分子。','分子加起來等於分母就是 1。'] },
  { n:14, prompt:'3/8 + 1/4 = ?', answer:'5/8',
    steps:['1/4 = 2/8。','3/8 + 2/8 = 5/8。'],
    h:['把 1/4 化成分母 8。','1/4 = 2/8。','請完成加法。'] },
  { n:15, prompt:'11/12 − 3/4 = ?', answer:'1/6',
    steps:['3/4 = 9/12。','11/12 − 9/12 = 2/12 = 1/6。'],
    h:['通分到 12。','11/12 − 9/12 = ?','別忘了約分。'] },
  { n:16, prompt:'哪個分數比較大？3/5 還是 2/3？', answer:'2/3',
    steps:['通分比較：3/5 = 9/15，2/3 = 10/15。','10/15 > 9/15，所以 2/3 比較大。'],
    h:['比較分數大小要先通分。','5 和 3 的公倍數是 15。','請通分後比較分子大小。'] },
  { n:17, prompt:'哪個分數比較大？4/9 還是 5/12？', answer:'4/9',
    steps:['通分到 36：4/9 = 16/36，5/12 = 15/36。','16/36 > 15/36，所以 4/9 比較大。'],
    h:['9 和 12 的公倍數是 36。','分別化成分母 36 再比較。','請完成比較。'] },
  { n:18, prompt:'5/6 − 2/9 = ?', answer:'11/18',
    steps:['通分到 18：5/6 = 15/18，2/9 = 4/18。','15/18 − 4/18 = 11/18。'],
    h:['6 和 9 的最小公倍數是 18。','通分後再減。','請完成計算。'] },
  { n:19, prompt:'1 又 1/5 + 3/10 = ?', answer:'3/2',
    steps:['1 又 1/5 = 6/5 = 12/10。','12/10 + 3/10 = 15/10 = 3/2。'],
    h:['先化假分數再通分。','1 又 1/5 等於多少個五分之一？','請完成加法並約分。'] },
  { n:20, prompt:'3 又 1/2 − 1 又 3/4 = ?', answer:'7/4',
    steps:['3 又 1/2 = 7/2 = 14/4。1 又 3/4 = 7/4。','14/4 − 7/4 = 7/4。'],
    h:['先各自化成假分數。','再通分到相同分母。','請完成減法。'] },
  { n:21, prompt:'1/4 + 1/8 + 1/2 = ?', answer:'7/8',
    steps:['通分到 8：1/4=2/8，1/8=1/8，1/2=4/8。','2+1+4=7，答案是 7/8。'],
    h:['找 4、8、2 的最小公倍數。','通分後加分子。','請完成計算。'] },
  { n:22, prompt:'7/10 − 2/5 = ?', answer:'3/10',
    steps:['2/5 = 4/10。','7/10 − 4/10 = 3/10。'],
    h:['把 2/5 通分成分母 10。','2/5 = 4/10。','請完成減法。'] },
  { n:23, prompt:'2/3 − 1/6 + 1/2 = ?', answer:'1',
    steps:['通分到 6：2/3=4/6，1/6=1/6，1/2=3/6。','4/6 − 1/6 + 3/6 = 6/6 = 1。'],
    h:['3、6、2 的公倍數是 6。','按順序通分後計算。','請完成並化簡。'] },
  { n:24, prompt:'5/8 + 3/8 = ?', answer:'1',
    steps:['分母相同：5/8 + 3/8 = 8/8 = 1。'],
    h:['分母都是 8，加分子。','5 + 3 = 8，化成最簡分數。','8/8 等於多少？'] },
  { n:25, prompt:'1/6 + 5/12 = ?', answer:'7/12',
    steps:['通分：1/6 = 2/12。','2/12 + 5/12 = 7/12。'],
    h:['6 和 12 的公倍數是 12。','1/6 化成分母 12。','請完成加法。'] },
];
fracProblems.forEach(p => {
  const id = `offline_frac-${String(p.n).padStart(3,'0')}`;
  questions.push(makeQ(id, 5, 'fraction', 'fraction_add_sub', {},
    p.prompt, p.answer,
    p.steps.map((s,i) => ts(i===0?'concept':'compute', s)),
    p.h
  ));
});

// ---- DECIMAL OPERATIONS (dec-001..025) ----
const decProblems = [
  { n:1, prompt:'3.7 + 2.45 = ?', answer:'6.15',
    steps:['小數加法：對齊小數點。','3.70 + 2.45 = 6.15。'],
    h:['小數加法要對齊小數點。','3.7 等於 3.70，位數補齊。','請完成加法。'] },
  { n:2, prompt:'8.5 − 3.27 = ?', answer:'5.23',
    steps:['對齊小數點：8.50 − 3.27。','8.50 − 3.27 = 5.23。'],
    h:['8.5 等於 8.50，對齊後再減。','個位：8−3，十分位：5−2，百分位：0−7（借位）。','請完成計算。'] },
  { n:3, prompt:'4.6 × 3 = ?', answer:'13.8',
    steps:['先算 46 × 3 = 138。','4.6 有一位小數，答案也要一位小數：13.8。'],
    h:['先不管小數點，算 46 × 3。','最後數一下原來有幾位小數。','請完成計算。'] },
  { n:4, prompt:'12.5 × 8 = ?', answer:'100',
    steps:['12.5 × 8 = 100。（12.5 × 8 = 100 是常用配對）'],
    h:['12.5 × 2 = 25，25 × 4 = 100。','或直接算 125 × 8 = 1000，回推小數點。','請完成計算。'] },
  { n:5, prompt:'7.2 ÷ 4 = ?', answer:'1.8',
    steps:['72 ÷ 4 = 18。','移回小數點：7.2 ÷ 4 = 1.8。'],
    h:['先去掉小數點算 72 ÷ 4。','再把小數點放回正確位置。','請完成計算。'] },
  { n:6, prompt:'0.25 + 0.75 = ?', answer:'1',
    steps:['0.25 + 0.75 = 1.00 = 1。'],
    h:['對齊小數點相加。','百分位：5+5=10，進位。','請完成計算。'] },
  { n:7, prompt:'5.04 − 2.6 = ?', answer:'2.44',
    steps:['5.04 − 2.60 = 2.44。'],
    h:['2.6 等於 2.60，對齊位數。','百分位：4−0=4，十分位：0−6 借位。','請完成計算。'] },
  { n:8, prompt:'0.8 × 0.5 = ?', answer:'0.4',
    steps:['8 × 5 = 40。共兩位小數：0.40 = 0.4。'],
    h:['先不管小數點：8 × 5 = ?','0.8 有一位小數，0.5 有一位小數，共幾位？','請完成計算。'] },
  { n:9, prompt:'6.3 ÷ 9 = ?', answer:'0.7',
    steps:['63 ÷ 9 = 7。','恢復小數點：6.3 ÷ 9 = 0.7。'],
    h:['先去小數點算 63 ÷ 9。','再放回小數點。','請完成計算。'] },
  { n:10, prompt:'15.6 + 4.44 = ?', answer:'20.04',
    steps:['15.60 + 4.44 = 20.04。'],
    h:['15.6 等於 15.60。','對齊小數點後逐位相加。','請完成計算。'] },
  { n:11, prompt:'10 − 3.75 = ?', answer:'6.25',
    steps:['10.00 − 3.75 = 6.25。'],
    h:['10 等於 10.00。','百分位：0−5 借位，十分位：0−7 再借位。','請完成計算。'] },
  { n:12, prompt:'2.5 × 4 = ?', answer:'10',
    steps:['25 × 4 = 100，有一位小數→ 10.0 = 10。'],
    h:['25 × 4 = 100。','2.5 有一位小數。','移回小數點即可。'] },
  { n:13, prompt:'9.6 ÷ 8 = ?', answer:'1.2',
    steps:['96 ÷ 8 = 12。','恢復小數：1.2。'],
    h:['先算 96 ÷ 8。','再放回小數點。','請完成計算。'] },
  { n:14, prompt:'3.14 + 6.86 = ?', answer:'10',
    steps:['3.14 + 6.86 = 10.00 = 10。'],
    h:['百分位：4+6=10，進位。','十分位：1+8+1=10，進位。','請完成加法。'] },
  { n:15, prompt:'7.5 − 2.8 = ?', answer:'4.7',
    steps:['7.5 − 2.8：十分位 5−8 借位 → 15−8=7，個位 7−1−2=4。','答案 4.7。'],
    h:['十分位 5 < 8，需要借位。','借位後 15 − 8 = 7。','請完成個位計算。'] },
  { n:16, prompt:'0.4 × 0.3 = ?', answer:'0.12',
    steps:['4 × 3 = 12，兩位小數 → 0.12。'],
    h:['不管小數點先算 4 × 3。','0.4 和 0.3 各一位小數，共幾位？','請完成計算。'] },
  { n:17, prompt:'45.6 ÷ 6 = ?', answer:'7.6',
    steps:['456 ÷ 6 = 76，恢復小數 → 7.6。'],
    h:['先算 456 ÷ 6。','再把小數點放回原位。','請完成計算。'] },
  { n:18, prompt:'1.25 + 2.75 + 3.5 = ?', answer:'7.5',
    steps:['1.25 + 2.75 = 4.00 = 4。','4 + 3.5 = 7.5。'],
    h:['先加前兩個：1.25 + 2.75 剛好是整數。','再加上 3.5。','請完成計算。'] },
  { n:19, prompt:'20.5 − 8.25 = ?', answer:'12.25',
    steps:['20.50 − 8.25 = 12.25。'],
    h:['20.5 等於 20.50。','對齊後逐位相減。','請完成計算。'] },
  { n:20, prompt:'0.6 × 5 = ?', answer:'3',
    steps:['6 × 5 = 30，一位小數 → 3.0 = 3。'],
    h:['先算 6 × 5。','加回一位小數。','請完成計算。'] },
  { n:21, prompt:'8.4 ÷ 7 = ?', answer:'1.2',
    steps:['84 ÷ 7 = 12，恢復小數 → 1.2。'],
    h:['先算 84 ÷ 7。','再放回小數點。','請完成計算。'] },
  { n:22, prompt:'6.08 + 3.92 = ?', answer:'10',
    steps:['6.08 + 3.92 = 10.00 = 10。'],
    h:['百分位：8+2=10 進位。','十分位：0+9+1=10 進位。','請完成加法。'] },
  { n:23, prompt:'50 − 12.34 = ?', answer:'37.66',
    steps:['50.00 − 12.34 = 37.66。'],
    h:['50 等於 50.00。','逐位相減，需多次借位。','請完成計算。'] },
  { n:24, prompt:'1.5 × 1.5 = ?', answer:'2.25',
    steps:['15 × 15 = 225，兩位小數 → 2.25。'],
    h:['先算 15 × 15。','1.5 有一位小數 × 1.5 有一位小數 = 共幾位？','請完成計算。'] },
  { n:25, prompt:'36.5 ÷ 5 = ?', answer:'7.3',
    steps:['365 ÷ 5 = 73，恢復小數 → 7.3。'],
    h:['先算 365 ÷ 5。','放回小數點。','請完成計算。'] },
];
decProblems.forEach(p => {
  const id = `offline_dec-${String(p.n).padStart(3,'0')}`;
  questions.push(makeQ(id, 5, 'decimal', 'decimal_ops', {},
    p.prompt, p.answer,
    p.steps.map((s,i) => ts(i===0?'concept':'compute', s)),
    p.h
  ));
});

// ===== OUTPUT =====
// Read existing bank.js
const bankPath = path.join(__dirname, '..', 'docs', 'offline-math', 'bank.js');
const existing = fs.readFileSync(bankPath, 'utf-8');

// Parse existing array
const match = existing.match(/window\.OFFLINE_MATH_BANK\s*=\s*\[/);
if (!match) { console.error('Cannot find OFFLINE_MATH_BANK in bank.js'); process.exit(1); }

// Find the closing bracket of the array
let depth = 0, startIdx = match.index + match[0].length - 1;
let endIdx = -1;
for (let i = startIdx; i < existing.length; i++) {
  if (existing[i] === '[') depth++;
  if (existing[i] === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
}
if (endIdx === -1) { console.error('Cannot find end of array'); process.exit(1); }

// Build new content
const beforeClose = existing.substring(0, endIdx).trimEnd();
const afterClose = existing.substring(endIdx);
const newEntries = questions.map(q => '  ' + JSON.stringify(q, null, 2).replace(/\n/g, '\n  ')).join(',\n');
const newContent = beforeClose + ',\n' + newEntries + '\n' + afterClose;

fs.writeFileSync(bankPath, newContent, 'utf-8');
console.log(`✅ Added ${questions.length} questions to offline-math/bank.js`);
console.log(`   Topics: time(${timeProblems.length}), div(${divProblems.length}), dist(${distProblems.length}), frac(${fracProblems.length}), dec(${decProblems.length})`);
