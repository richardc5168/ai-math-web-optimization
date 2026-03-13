#!/usr/bin/env node
// Expand ratio-percent-g5 from 179 → 200 questions (+21)
// Run: node tools/_expand_ratio_percent_g5.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..", "docs", "ratio-percent-g5", "bank.js");
var DIST = path.join(__dirname, "..", "dist_ai_math_web_pages", "docs", "ratio-percent-g5", "bank.js");
var TOPIC = "國小五年級｜比率與百分率";

function pad(n) { return String(n).padStart(2, "0"); }

function makeQ(id, kind, diff, question, answer, hints, explanation, cm) {
  return {
    id: id,
    kind: kind,
    topic: TOPIC,
    difficulty: diff,
    question: question,
    answer: String(answer),
    hints: hints,
    steps: [],
    meta: {},
    explanation: explanation,
    common_mistakes: cm || ["百分率與小數互換搞混。", "計算過程中小數點位置錯誤。"]
  };
}

var newQs = [];

// Fill under-represented kinds:
// decimal_to_percent: 3→8 (+5)
// percent_to_decimal: 5→8 (+3)
// fraction_to_percent: 5→8 (+3)
// ratio_unit_rate: 8→11 (+3)
// ratio_sub_decimal: 8→11 (+3)
// percent_meaning: 8→12 (+4)
// = 21 total

// ---- decimal_to_percent +5 (id 7-11) ----
var d2pData = [
  { n:7, dec:0.35, pct:35 },
  { n:8, dec:0.72, pct:72 },
  { n:9, dec:0.08, pct:8 },
  { n:10, dec:0.95, pct:95 },
  { n:11, dec:1.2, pct:120 }
];
d2pData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_dec2pct_" + pad(d.n), "decimal_to_percent", "easy",
    "（換算）把小數 " + d.dec + " 化成百分率是多少？（可填 " + d.pct + " 或 " + d.pct + "%）",
    d.pct,
    [
      "觀念：小數 → 百分率，就是乘以 100，再加上 %。",
      "列式：" + d.dec + " × 100。",
      "📐 一步步算：\n① 小數點往右移 2 位\n② " + d.dec + " → " + d.pct + "\n③ 加上 % 符號\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：小數點只移了一位（×10 而不是 ×100）。記住百分率一定是 ×100！"
    ],
    d.dec + " × 100 = " + d.pct + "%。",
    ["小數點移錯位數。", "乘以 10 而不是 100。"]
  ));
});

// ---- percent_to_decimal +3 (id 13-15) ----
var p2dData = [
  { n:13, pct:45, dec:"0.45" },
  { n:14, pct:8, dec:"0.08" },
  { n:15, pct:150, dec:"1.5" }
];
p2dData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_pct2dec_" + pad(d.n), "percent_to_decimal", "easy",
    "（換算）把 " + d.pct + "% 化成小數是多少？",
    d.dec,
    [
      "觀念：p% = p/100，把小數點往左移 2 位。",
      "列式：" + d.pct + " ÷ 100。",
      "📐 一步步算：\n① " + d.pct + " ÷ 100\n② 小數點往左移 2 位\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：小數點只往左移 1 位（÷10 而不是 ÷100）。% 就是 ÷100 的意思。"
    ],
    d.pct + "% = " + d.pct + " ÷ 100 = " + d.dec + "。",
    ["小數點往左只移了 1 位。", "除以 1000 而不是 100。"]
  ));
});

// ---- fraction_to_percent +3 (id 10-12) ----
var f2pData = [
  { n:10, num:3, den:5, pct:60 },
  { n:11, num:1, den:8, pct:12.5 },
  { n:12, num:9, den:20, pct:45 }
];
f2pData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_frac2pct_" + pad(d.n), "fraction_to_percent", "easy",
    "（換算）把分數 " + d.num + "/" + d.den + " 化成百分率是多少？（可填 " + d.pct + " 或 " + d.pct + "%）",
    d.pct,
    [
      "觀念：分數化成百分率：先算成小數（或直接 ×100），再加上 %。",
      "列式：" + d.num + " ÷ " + d.den + " × 100。",
      "📐 一步步算：\n① 先把分數化成小數：" + d.num + " ÷ " + d.den +
        "\n② 小數 × 100\n③ 加 %\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：分子分母搞反了（用分母÷分子）。分數化小數是「分子÷分母」。"
    ],
    d.num + "/" + d.den + " = " + (d.num / d.den) + " = " + d.pct + "%。",
    ["分子分母除反了。", "忘了乘 100 轉成百分率。"]
  ));
});

// ---- ratio_unit_rate +3 (id 12-14) ----
var unitData = [
  { n:12, total:240, part:60, label:"走 240 公尺花了 60 分鐘，每分鐘走幾公尺", ans:4, unit:"公尺/分鐘" },
  { n:13, total:180, part:9, label:"9 瓶水共 180 元，每瓶幾元", ans:20, unit:"元/瓶" },
  { n:14, total:350, part:7, label:"7 天看完 350 頁的書，平均每天看幾頁", ans:50, unit:"頁/天" }
];
unitData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_unit_" + pad(d.n), "ratio_unit_rate", "medium",
    "（單位量）" + d.label + "？",
    d.ans,
    [
      "觀念：單位量 = 總量 ÷ 份數（或個數、時間等）。",
      "列式：" + d.total + " ÷ " + d.part + "。",
      "📐 一步步算：\n① 找出總量 = " + d.total + "\n② 找出份數 = " + d.part +
        "\n③ 總量 ÷ 份數\n算完記得加單位 ✅",
      "📌 常見錯誤：除法方向搞反（份數 ÷ 總量）。記住：單位量 = 總量 ÷ 份數。"
    ],
    d.total + " ÷ " + d.part + " = " + d.ans + "（" + d.unit + "）。",
    ["除法方向搞反。", "沒有加上正確的單位。"]
  ));
});

// ---- ratio_sub_decimal +3 (id 12-14) ----
var subDecData = [
  { n:12, whole:1, frac:"3/8", ans:"0.625" },
  { n:13, whole:1, frac:"1/5", ans:"0.8" },
  { n:14, whole:1, frac:"3/10", ans:"0.7" }
];
subDecData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_ratio_subd_" + pad(d.n), "ratio_sub_decimal", "medium",
    "（比率）全班做問卷，贊成的比率是 " + d.frac + "，反對的比率用小數表示是多少？",
    d.ans,
    [
      "觀念：全體 = 1，反對 = 1 − 贊成。把分數化小數即可。",
      "列式：1 − " + d.frac + " = ?（再化成小數）。",
      "📐 一步步算：\n① 反對的分數 = 1 − " + d.frac +
        "\n② 把結果化成小數\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：直接把分數寫成小數，忘了先用 1 減掉。先算 1 − 分數再化小數！"
    ],
    "1 − " + d.frac + " = " + d.ans + "。",
    ["忘了用 1 減。", "分數轉小數算錯了。"]
  ));
});

// ---- percent_meaning +4 (id 12-15) ----
var pctMeanData = [
  { n:12, pct:40, ans:40 },
  { n:13, pct:75, ans:75 },
  { n:14, pct:5, ans:5 },
  { n:15, pct:90, ans:90 }
];
pctMeanData.forEach(function(d) {
  newQs.push(makeQ(
    "rp5_pct_mean_" + pad(d.n), "percent_meaning", "easy",
    "（百分率）" + d.pct + "% 表示『每 100 份裡有幾份』？（請填整數）",
    d.ans,
    [
      "⭐ 觀念提醒\n百分率就是「把全體當作 100 份，某部分佔幾份」。% 就是 ÷100 的意思。",
      "做法：% 前面的數字就是每 100 份中所佔的份數。",
      "📐 一步步想：\n① " + d.pct + "% = " + d.pct + "/100\n② 表示每 100 份裡有多少份？\n直接看 % 前的數字 ✅",
      "📌 常見錯誤：把 % 理解成「每 10 份」或「每 1000 份」。百分率就是「每 100 份」！"
    ],
    d.pct + "% = 每 100 份裡有 " + d.pct + " 份。",
    ["把百分率理解成千分率。", "搞反了分子分母。"]
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
console.log("New total:", 179 + newQs.length);
console.log("Synced to dist.");
