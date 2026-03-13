#!/usr/bin/env node
// Expand fraction-g5 from 187 → 200 questions (+13)
// Run: node tools/_expand_fraction_g5_200.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..", "docs", "fraction-g5", "bank.js");
var DIST = path.join(__dirname, "..", "dist_ai_math_web_pages", "docs", "fraction-g5", "bank.js");
var TOPIC = "國小五年級｜分數（計算）";

function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
function simplify(n, d) { var g = gcd(Math.abs(n), Math.abs(d)); return [n/g, d/g]; }

function makeQ(id, kind, diff, question, answer, hints, explanation, cm) {
  return {
    id: id,
    kind: kind,
    topic: TOPIC,
    difficulty: diff,
    question: question,
    answer: answer,
    hints: hints,
    steps: [],
    meta: {},
    explanation: explanation,
    common_mistakes: cm || ["分數計算時分子分母搞混。", "忘了約分到最簡分數。"]
  };
}

var newQs = [];

// Target: bring smaller kinds from 20→22 or add variety
// Current: simplify 25, add_like 20, sub_like 20, add_unlike 20, sub_unlike 20,
//          mul_int 20, mul 20, equivalent 20, mixed_convert 22
// Add: equivalent +3, mul +3, sub_like +2, add_like +2, sub_unlike +3 = 13

// ---- equivalent +3 (id 23-25) ----
var equivData = [
  { n:23, num:3, den:7, mul:6 },
  { n:24, num:5, den:9, mul:4 },
  { n:25, num:2, den:11, mul:7 }
];
equivData.forEach(function(d) {
  var newN = d.num * d.mul;
  var newD = d.den * d.mul;
  newQs.push(makeQ(
    "fg5_equivalent_" + String(d.n).padStart(2, "0"), "equivalent", "easy",
    "（等值分數）" + d.num + "/" + d.den + " = ?/" + newD,
    String(newN) + "/" + String(newD),
    [
      "觀念：等值分數，分子分母同乘或同除一個數，分數的值不變。",
      "做法：看分母從 " + d.den + " 變成 " + newD + "，乘了幾倍？分子也要乘同樣的倍數。",
      "📐 一步步算：\n① " + newD + " ÷ " + d.den + " = ？（找倍數）\n② 分子 " + d.num + " × 同樣倍數\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：只乘分母不乘分子，或分子分母乘了不同的數。分子分母必須乘相同的倍數！"
    ],
    d.num + "/" + d.den + " = " + newN + "/" + newD + "（分子分母同乘 " + d.mul + "）。",
    ["只改了分母，忘了分子也要乘。", "把乘的倍數算錯。"]
  ));
});

// ---- mul +3 (id 22-24) ----
var mulData = [
  { n:22, n1:2, d1:7, n2:3, d2:5 },
  { n:23, n1:4, d1:9, n2:3, d2:8 },
  { n:24, n1:5, d1:6, n2:2, d2:7 }
];
mulData.forEach(function(d) {
  var rn = d.n1 * d.n2;
  var rd = d.d1 * d.d2;
  var s = simplify(rn, rd);
  var ans = s[0] + "/" + s[1];
  newQs.push(makeQ(
    "fg5_mul_" + String(d.n).padStart(2, "0"), "mul", "medium",
    "（分數乘法）計算：" + d.n1 + "/" + d.d1 + " × " + d.n2 + "/" + d.d2 + " = ?",
    ans,
    [
      "觀念：分數乘法 = 分子×分子 / 分母×分母。",
      "列式：(" + d.n1 + "×" + d.n2 + ") / (" + d.d1 + "×" + d.d2 + ")。",
      "📐 一步步算：\n① 分子相乘 " + d.n1 + "×" + d.n2 + " = " + rn +
        "\n② 分母相乘 " + d.d1 + "×" + d.d2 + " = " + rd +
        "\n③ 約分到最簡\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：把分子和分母交叉相乘（那是乘法的簡化技巧，不是基本步驟）。分數乘法：分子×分子、分母×分母！"
    ],
    d.n1 + "/" + d.d1 + " × " + d.n2 + "/" + d.d2 + " = " + rn + "/" + rd + " = " + ans + "。",
    ["分子分母交叉乘搞混了。", "沒約分到最簡分數。"]
  ));
});

// ---- sub_like +2 (id 22-23) ----
var subLikeData = [
  { n:22, n1:11, n2:4, den:13 },
  { n:23, n1:9, n2:2, den:11 }
];
subLikeData.forEach(function(d) {
  var rn = d.n1 - d.n2;
  var s = simplify(rn, d.den);
  var ans = s[0] + "/" + s[1];
  newQs.push(makeQ(
    "fg5_sub_like_" + String(d.n).padStart(2, "0"), "sub_like", "easy",
    "（同分母減法）計算：" + d.n1 + "/" + d.den + " − " + d.n2 + "/" + d.den + " = ?",
    ans,
    [
      "觀念：同分母的分數，分母不變，直接把分子相減。",
      "列式：(" + d.n1 + " − " + d.n2 + ") / " + d.den + "。",
      "📐 一步步算：\n① 分子 " + d.n1 + " − " + d.n2 + " = " + rn +
        "\n② 分母不變 = " + d.den +
        "\n③ 約分到最簡\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：分子和分母都減了（分母不應該改變）！同分母就直接分子相減。"
    ],
    d.n1 + "/" + d.den + " − " + d.n2 + "/" + d.den + " = " + rn + "/" + d.den + " = " + ans + "。",
    ["分子分母都減了。", "忘了約分到最簡。"]
  ));
});

// ---- add_like +2 (id 21-22) ----
var addLikeData = [
  { n:21, n1:5, n2:4, den:13 },
  { n:22, n1:3, n2:8, den:17 }
];
addLikeData.forEach(function(d) {
  var rn = d.n1 + d.n2;
  var s = simplify(rn, d.den);
  var ans = s[0] + "/" + s[1];
  newQs.push(makeQ(
    "fg5_add_like_" + String(d.n).padStart(2, "0"), "add_like", "easy",
    "（同分母加法）計算：" + d.n1 + "/" + d.den + " + " + d.n2 + "/" + d.den + " = ?",
    ans,
    [
      "觀念：同分母的分數，分母不變，直接把分子相加。",
      "列式：(" + d.n1 + " + " + d.n2 + ") / " + d.den + "。",
      "📐 一步步算：\n① 分子 " + d.n1 + " + " + d.n2 + " = " + rn +
        "\n② 分母不變 = " + d.den +
        "\n③ 約分到最簡\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：分子和分母都加了（分母不變）！同分母就直接分子相加。"
    ],
    d.n1 + "/" + d.den + " + " + d.n2 + "/" + d.den + " = " + rn + "/" + d.den + " = " + ans + "。",
    ["分子分母都加了。", "忘了約分。"]
  ));
});

// ---- sub_unlike +3 (id 22-24) ----
var subUnlikeData = [
  { n:22, n1:5, d1:6, n2:1, d2:4 },
  { n:23, n1:7, d1:8, n2:1, d2:3 },
  { n:24, n1:4, d1:5, n2:2, d2:7 }
];
subUnlikeData.forEach(function(d) {
  function lcm(a, b) { return a * b / gcd(a, b); }
  var L = lcm(d.d1, d.d2);
  var rn = d.n1 * (L / d.d1) - d.n2 * (L / d.d2);
  var s = simplify(rn, L);
  var ans = s[0] + "/" + s[1];
  newQs.push(makeQ(
    "fg5_sub_unlike_" + String(d.n).padStart(2, "0"), "sub_unlike", "medium",
    "（異分母減法）計算：" + d.n1 + "/" + d.d1 + " − " + d.n2 + "/" + d.d2 + " = ?",
    ans,
    [
      "觀念：異分母減法要先通分（同分母）才能減。",
      "列式：先找分母 " + d.d1 + " 和 " + d.d2 + " 的最小公倍數。",
      "📐 一步步算：\n① lcm(" + d.d1 + "," + d.d2 + ") = " + L +
        "\n② 通分後分子各為 " + d.n1 + "×" + (L / d.d1) + " 和 " + d.n2 + "×" + (L / d.d2) +
        "\n③ 分子相減 → 約分\n算完記得回頭檢查喔！✅",
      "📌 常見錯誤：沒通分就直接減（分母不同不能直接減！）。先通分再減。"
    ],
    d.n1 + "/" + d.d1 + " − " + d.n2 + "/" + d.d2 + " = " + ans + "。",
    ["沒通分直接分子相減。", "分母的最小公倍數算錯。"]
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
console.log("New total:", 187 + newQs.length);
console.log("Synced to dist.");
