#!/usr/bin/env node
// Expand decimal-unit4 from 144 → 200 questions (+56)
// Run: node tools/_expand_decimal_unit4_200.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..", "docs", "decimal-unit4", "bank.js");
var DIST = path.join(__dirname, "..", "dist_ai_math_web_pages", "docs", "decimal-unit4", "bank.js");
var TOPIC = "國小五年級｜小數（四則運算）";

function pad(n) { return String(n).padStart(2, "0"); }
// precise multiply for decimals
function pmul(a, b) { return Math.round(a * b * 10000) / 10000; }

function makeQ(id, kind, diff, question, answer, hints, explanation, cm) {
  return {
    id: id,
    kind: kind,
    topic: TOPIC,
    difficulty: diff,
    question: question,
    answer: String(answer),
    answer_mode: "exact",
    hints: hints,
    steps: [],
    meta: {},
    explanation: explanation,
    common_mistakes: cm || ["小數點位置算錯。", "乘法/除法的計算粗心。"]
  };
}

var newQs = [];

// Current:  d_mul_int(30) d_mul_d(26) d_div_int(24) int_mul_d(24) x10_shift(20) int_div_int_to_decimal(20) = 144
// Target:   d_mul_int(30) d_mul_d(36) d_div_int(32) int_mul_d(32) x10_shift(30) int_div_int_to_decimal(30) d_add_sub(10) = 200
// Adds: d_mul_d+10, d_div_int+8, int_mul_d+8, x10_shift+10, int_div_int+10, d_add_sub+10 = 56

// ---- d_mul_d +10 (id 27-36) ----
var dmdData = [
  { n:27, a:0.6, b:0.7, ans:0.42 },
  { n:28, a:1.3, b:0.4, ans:0.52 },
  { n:29, a:2.5, b:0.8, ans:2 },
  { n:30, a:0.9, b:0.3, ans:0.27 },
  { n:31, a:1.5, b:1.2, ans:1.8 },
  { n:32, a:0.4, b:0.4, ans:0.16 },
  { n:33, a:3.2, b:0.5, ans:1.6 },
  { n:34, a:0.8, b:0.6, ans:0.48 },
  { n:35, a:2.4, b:0.3, ans:0.72 },
  { n:36, a:1.1, b:0.9, ans:0.99 }
];
dmdData.forEach(function(d) {
  var ans = pmul(d.a, d.b);
  newQs.push(makeQ(
    "d4_d_mul_d_" + pad(d.n), "d_mul_d", "medium",
    "（小數×小數）計算：" + d.a + " × " + d.b + " = ?",
    ans,
    [
      "觀念：小數乘法，先當整數乘，最後看兩個因數總共幾位小數，答案就有幾位小數。",
      "列式：" + d.a + " × " + d.b + "。",
      "📐 動手算：\n① 先把小數當整數：去掉小數點相乘\n② 數兩個因數總共有幾位小數\n③ 在結果移回小數點\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：小數位數加錯（兩個各一位就是兩位小數）。先用整數算，再安放小數點！"
    ],
    d.a + " × " + d.b + " = " + ans + "。",
    ["小數點位數算錯。", "整數部分計算粗心。"]
  ));
});

// ---- d_div_int +8 (id 25-32) ----
var ddiData = [
  { n:25, a:4.8, b:6, ans:0.8 },
  { n:26, a:7.5, b:5, ans:1.5 },
  { n:27, a:9.6, b:8, ans:1.2 },
  { n:28, a:3.6, b:4, ans:0.9 },
  { n:29, a:12.5, b:5, ans:2.5 },
  { n:30, a:6.3, b:9, ans:0.7 },
  { n:31, a:8.4, b:7, ans:1.2 },
  { n:32, a:15.6, b:12, ans:1.3 }
];
ddiData.forEach(function(d) {
  newQs.push(makeQ(
    "d4_d_div_int_" + pad(d.n), "d_div_int", "medium",
    "（小數÷整數）計算：" + d.a + " ÷ " + d.b + " = ?",
    d.ans,
    [
      "觀念：小數除以整數，用直式除法，讓小數點對齊再除。",
      "列式：" + d.a + " ÷ " + d.b + "。",
      "📐 動手算：\n① 先看整數部分夠不夠除\n② 不夠就連帶小數一起除\n③ 商的小數點要對齊被除數的小數點\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：商的小數點忘了對齊，位值就全錯了。直式除法中，小數點要「拉上來」！"
    ],
    d.a + " ÷ " + d.b + " = " + d.ans + "。",
    ["小數點沒對齊。", "除法計算粗心。"]
  ));
});

// ---- int_mul_d +8 (id 25-32) ----
var imdData = [
  { n:25, a:6, b:0.7, ans:4.2 },
  { n:26, a:8, b:0.9, ans:7.2 },
  { n:27, a:12, b:0.4, ans:4.8 },
  { n:28, a:15, b:0.3, ans:4.5 },
  { n:29, a:9, b:0.6, ans:5.4 },
  { n:30, a:14, b:0.5, ans:7 },
  { n:31, a:25, b:0.8, ans:20 },
  { n:32, a:11, b:0.7, ans:7.7 }
];
imdData.forEach(function(d) {
  var ans = pmul(d.a, d.b);
  newQs.push(makeQ(
    "d4_int_mul_d_" + pad(d.n), "int_mul_d", "easy",
    "（整數×小數）計算：" + d.a + " × " + d.b + " = ?",
    ans,
    [
      "觀念：整數 × 小數，先當整數乘，再看小數有幾位就點回幾位。",
      "列式：" + d.a + " × " + d.b + "。",
      "📐 動手算：\n① 先算 " + d.a + " × " + Math.round(d.b * 10) +
        " = " + (d.a * Math.round(d.b * 10)) +
        "\n② 因為 " + d.b + " 有一位小數，結果要除以 10\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：忘了最後要移回小數點。整數×小數跟整數乘法一樣，只是最後要補小數點！"
    ],
    d.a + " × " + d.b + " = " + ans + "。",
    ["忘了補小數點。", "整數乘法部分算錯。"]
  ));
});

// ---- x10_shift +10 (id 21-30) ----
var x10Data = [
  { n:21, a:0.037, mul:100, ans:3.7 },
  { n:22, a:2.58, mul:10, ans:25.8 },
  { n:23, a:45.6, div:100, ans:0.456 },
  { n:24, a:0.9, mul:1000, ans:900 },
  { n:25, a:123, div:1000, ans:0.123 },
  { n:26, a:0.05, mul:100, ans:5 },
  { n:27, a:7.89, mul:10, ans:78.9 },
  { n:28, a:340, div:100, ans:3.4 },
  { n:29, a:0.004, mul:1000, ans:4 },
  { n:30, a:56.7, div:10, ans:5.67 }
];
x10Data.forEach(function(d) {
  var op = d.mul ? "×" : "÷";
  var factor = d.mul || d.div;
  var direction = d.mul ? "右" : "左";
  var moves = String(factor).length - 1; // log10
  newQs.push(makeQ(
    "d4_x10_shift_" + pad(d.n), "x10_shift", "easy",
    "（位值移動）計算：" + d.a + " " + op + " " + factor + " = ?",
    d.ans,
    [
      "觀念：乘以 10/100/1000 時小數點往右移；除以 10/100/1000 時小數點往左移。",
      "列式：" + d.a + " " + op + " " + factor + "。小數點往" + direction + "移 " + moves + " 位。",
      "📐 動手算：\n① " + d.a + " 的小數點往" + direction + "移 " + moves + " 位\n② 注意前後是否需要補零\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：移的位數跟 10 的次方數不一樣（×100 要移 2 位，不是 1 位）。數數 0 的個數！"
    ],
    d.a + " " + op + " " + factor + " = " + d.ans + "。",
    ["小數點移錯方向。", "移的位數不對。"]
  ));
});

// ---- int_div_int_to_decimal +10 (id 21-30) ----
var idiData = [
  { n:21, a:7, b:4, ans:"1.75" },
  { n:22, a:9, b:6, ans:"1.5" },
  { n:23, a:3, b:8, ans:"0.375" },
  { n:24, a:11, b:4, ans:"2.75" },
  { n:25, a:5, b:2, ans:"2.5" },
  { n:26, a:13, b:8, ans:"1.625" },
  { n:27, a:7, b:5, ans:"1.4" },
  { n:28, a:1, b:8, ans:"0.125" },
  { n:29, a:15, b:4, ans:"3.75" },
  { n:30, a:17, b:8, ans:"2.125" }
];
idiData.forEach(function(d) {
  newQs.push(makeQ(
    "d4_int_div_int_to_decimal_" + pad(d.n), "int_div_int_to_decimal", "medium",
    "（整數÷整數→小數）計算：" + d.a + " ÷ " + d.b + " = ?（答案用小數表示）",
    d.ans,
    [
      "觀念：整數除以整數，如果除不盡，可以在被除數後面加 .0 繼續除，得到小數。",
      "列式：" + d.a + " ÷ " + d.b + "。",
      "📐 動手算：\n① 用直式除法\n② " + d.a + " ÷ " + d.b + " 的整數部分\n③ 餘數繼續加零除\n④ 直到整除或指定位數\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：除不盡時就停了，只寫商和餘數。這種題要繼續除到小數！"
    ],
    d.a + " ÷ " + d.b + " = " + d.ans + "。",
    ["除不盡就停了。", "直式除法中小數點對齊出錯。"]
  ));
});

// ---- d_add_sub (NEW kind) +10 ----
var dasData = [
  { n:1, q:"1.5 + 2.7", ans:"4.2", op:"+" },
  { n:2, q:"5.8 − 3.2", ans:"2.6", op:"−" },
  { n:3, q:"3.45 + 1.55", ans:"5", op:"+" },
  { n:4, q:"7.03 − 2.98", ans:"4.05", op:"−" },
  { n:5, q:"0.6 + 0.47", ans:"1.07", op:"+" },
  { n:6, q:"10 − 3.75", ans:"6.25", op:"−" },
  { n:7, q:"2.34 + 4.66", ans:"7", op:"+" },
  { n:8, q:"8.1 − 0.95", ans:"7.15", op:"−" },
  { n:9, q:"0.125 + 0.875", ans:"1", op:"+" },
  { n:10, q:"6.5 − 2.37", ans:"4.13", op:"−" }
];
dasData.forEach(function(d) {
  var opWord = d.op === "+" ? "加" : "減";
  newQs.push(makeQ(
    "d4_d_add_sub_" + pad(d.n), "d_add_sub", "easy",
    "（小數" + opWord + "法）計算：" + d.q + " = ?",
    d.ans,
    [
      "觀念：小數" + opWord + "法要小數點對齊，再逐位" + opWord + "。",
      "列式：" + d.q + "。",
      "📐 動手算：\n① 把小數點對齊\n② 位數不夠的地方補 0\n③ 逐位" + opWord + "\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：小數點沒對齊就直接算，位值全對不上。一定要先對齊小數點！"
    ],
    d.q + " = " + d.ans + "。",
    ["小數點沒對齊。", opWord + "法進∕借位出錯。"]
  ));
});

// ============ append & write ============
var src = fs.readFileSync(SRC, "utf8");
var closeIdx = src.lastIndexOf("];");
if (closeIdx === -1) { console.error("Cannot find ]; in bank.js"); process.exit(1); }

var before = src.substring(0, closeIdx);
if (before.trimEnd().slice(-1) !== ",") {
  before = before.trimEnd() + ",\n";
}

var newBlock = newQs.map(function(q) {
  return JSON.stringify(q, null, 2);
}).join(",\n");

var after = before + newBlock + "\n];\n";
fs.writeFileSync(SRC, after, "utf8");
fs.writeFileSync(DIST, after, "utf8");

console.log("Added:", newQs.length);
console.log("New total:", 144 + newQs.length);
console.log("Synced to dist.");
