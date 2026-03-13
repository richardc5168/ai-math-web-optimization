#!/usr/bin/env node
// Expand fraction-word-g5 from 160 → 200 questions (+40)
// Run: node tools/_expand_fraction_word_g5.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..", "docs", "fraction-word-g5", "bank.js");
var DIST = path.join(__dirname, "..", "dist_ai_math_web_pages", "docs", "fraction-word-g5", "bank.js");
var TOPIC = "國小五年級｜分數應用題";

// Current: generic(35) remaining(28) of_quantity(25) reverse(24) remain_then(22) of_fraction(16) average(10)
// Target: generic(35) remaining(32) of_quantity(29) reverse(28) remain_then(26) of_fraction(22) average(18) word_compare(10)
// Adds: remaining+4, of_quantity+4, reverse+4, remain_then+4, of_fraction+6, average+8, word_compare+10 = 40

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
    common_mistakes: cm || ["分數運算時分子分母算錯。", "忘了約分或通分。"]
  };
}

var newQs = [];
var nextId = 161; // g5fw_161 onward

function nextID() {
  var id = "g5fw_" + String(nextId).padStart(3, "0");
  nextId++;
  return id;
}

// ---- average_division +8 ----
var avgData = [
  { total:"1/3", parts:4, ans:"1/12", label:"1/3 公升果汁平均倒入 4 杯" },
  { total:"1/2", parts:5, ans:"1/10", label:"1/2 公斤糖果平均分給 5 人" },
  { total:"2/3", parts:4, ans:"1/6", label:"2/3 公升牛奶平均分成 4 份" },
  { total:"3/4", parts:6, ans:"1/8", label:"3/4 公尺的繩子平均剪成 6 段" },
  { total:"1/5", parts:3, ans:"1/15", label:"1/5 公斤麵粉平均分給 3 人" },
  { total:"2/7", parts:2, ans:"1/7", label:"2/7 的蛋糕平均切成 2 塊" },
  { total:"3/8", parts:3, ans:"1/8", label:"3/8 公升的水平均倒入 3 個杯子" },
  { total:"4/9", parts:2, ans:"2/9", label:"4/9 公尺布料平均分成 2 段" }
];
avgData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "average_division", "medium",
    "把 " + d.total + " " + d.label.split(d.total + " ")[1],
    d.ans,
    [
      "L1 先想觀念：看到『平均分成幾份，每份多少』就是除法。",
      "L2 列式：" + d.total + " ÷ " + d.parts + "，分數除以整數 = 分數 × (1/" + d.parts + ")。",
      "📐 動手算：\n① " + d.total + " ÷ " + d.parts + "\n② = " + d.total + " × 1/" + d.parts + "\n③ 分子 × 分子、分母 × 分母\n④ 約分到最簡 ✅",
      "📌 常見錯誤：分數÷整數時反而把整數放在分子上。正確做法：分母乘以除數，或乘以倒數。"
    ],
    d.total + " ÷ " + d.parts + " = " + d.ans + "。",
    ["分數除以整數的方法搞錯。", "忘了約分到最簡。"]
  ));
});

// ---- fraction_of_fraction +6 ----
var fofData = [
  { whole:"一條路的 1/4", op:"2/3", kind2:"舖了柏油", ans:"1/6" },
  { whole:"一箱蘋果的 1/3", op:"1/4", kind2:"分給弟弟", ans:"1/12" },
  { whole:"一塊田的 2/5", op:"1/2", kind2:"種稻子", ans:"1/5" },
  { whole:"一桶水的 3/4", op:"1/3", kind2:"拿去澆花", ans:"1/4" },
  { whole:"全班的 2/3", op:"3/4", kind2:"是女生", ans:"1/2" },
  { whole:"一堆沙的 1/6", op:"1/2", kind2:"運走了", ans:"1/12" }
];
fofData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "fraction_of_fraction", "medium",
    d.whole + "用來" + d.kind2 + "，其中的 " + d.op + " 是在這部分裡。" + d.kind2 + "的部分佔全部的幾分之幾？",
    d.ans,
    [
      "L1 先想觀念：看到『幾分之幾的幾分之幾』，通常是乘法。",
      "L2 列式：兩個分數直接相乘。",
      "📐 動手算：\n① 分子 × 分子\n② 分母 × 分母\n③ 約分到最簡分數 ✅",
      "📌 常見錯誤：把『的』理解成加法或減法。『某事物的幾分之幾』就是乘法！"
    ],
    "兩個分數相乘 = " + d.ans + "。",
    ["把分數的分數理解成加法。", "分子分母相乘後忘了約分。"]
  ));
});

// ---- remaining_after_fraction +4 ----
var remData = [
  { total:240, frac:"1/4", taken:60, remain:180, label:"鉛筆" },
  { total:360, frac:"1/3", taken:120, remain:240, label:"元" },
  { total:480, frac:"3/8", taken:180, remain:300, label:"公克" },
  { total:150, frac:"2/5", taken:60, remain:90, label:"張色紙" }
];
remData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "remaining_after_fraction", "easy",
    "有 " + d.total + " " + d.label + "，用掉了 " + d.frac + "，還剩幾" + d.label + "？",
    d.remain,
    [
      "L1 先想觀念：用掉幾分之幾，剩下 = 全部 × (1 − 用掉的分數)。",
      "L2 列式：" + d.total + " × (1 − " + d.frac + ")。",
      "📐 動手算：\n① 先算用掉多少：" + d.total + " × " + d.frac + "\n② 再用 " + d.total + " 減掉\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：直接把全部乘以分數當成剩下的（那是用掉的量）。剩下的 = 全部 − 用掉的！"
    ],
    d.total + " × " + d.frac + " = " + d.taken + "，剩下 " + d.total + " − " + d.taken + " = " + d.remain + "。",
    ["把用掉的量當剩下的量。", "分數乘法算錯。"]
  ));
});

// ---- fraction_of_quantity +4 ----
var foqData = [
  { total:180, frac:"2/9", ans:40, label:"公尺的繩子取 2/9" },
  { total:240, frac:"5/8", ans:150, label:"顆糖果分出 5/8" },
  { total:350, frac:"2/7", ans:100, label:"元的存款花了 2/7" },
  { total:270, frac:"1/3", ans:90, label:"公克的麵粉取出 1/3" }
];
foqData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "fraction_of_quantity", "easy",
    d.total + " " + d.label + "，取出多少？",
    d.ans,
    [
      "L1 先想觀念：求『全部的幾分之幾』就是乘法。",
      "L2 列式：" + d.total + " × " + d.frac + "。",
      "📐 動手算：\n① " + d.total + " × 分子 ÷ 分母\n② 也就是 " + d.total + " × " + d.frac + "\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：用除法代替乘法（÷ 和 × 搞混）。『幾分之幾』用乘法！"
    ],
    d.total + " × " + d.frac + " = " + d.ans + "。",
    ["乘除搞混。", "分數乘法計算錯誤。"]
  ));
});

// ---- reverse_fraction +4 ----
var revData = [
  { part:24, frac:"3/8", whole:64, label:"紅珠佔全部的 3/8，紅珠有 24 個，全部有幾個" },
  { part:30, frac:"5/6", whole:36, label:"已完成進度的 5/6，已完成 30 題，全部有幾題" },
  { part:18, frac:"2/9", whole:81, label:"看了書的 2/9，看了 18 頁，全書有幾頁" },
  { part:20, frac:"4/7", whole:35, label:"吃了蛋糕的 4/7，吃了 20 塊，全部有幾塊" }
];
revData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "reverse_fraction", "medium",
    d.label + "？",
    d.whole,
    [
      "L1 先想觀念：已知部分和分數，求全部 → 全部 = 部分 ÷ 分數。",
      "L2 列式：" + d.part + " ÷ " + d.frac + "。",
      "📐 動手算：\n① 除以分數 = 乘以倒數\n② " + d.part + " × 倒數\n③ 算出全部\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：用乘法（部分 × 分數）得到更小的數。反求全部要用除法！"
    ],
    d.part + " ÷ " + d.frac + " = " + d.whole + "。",
    ["用乘法代替除法。", "倒數算錯了。"]
  ));
});

// ---- remain_then_fraction +4 ----
var rtfData = [
  { total:240, f1:"1/3", f2:"1/4", s1:80, remain1:160, s2:40, ans:120, desc:"一盒 240 顆糖，先吃了 1/3，剩下的又給了 1/4，還剩幾顆" },
  { total:360, f1:"1/4", f2:"1/3", s1:90, remain1:270, s2:90, ans:180, desc:"360 公克食材先用了 1/4，剩下的又用了 1/3，還剩幾公克" },
  { total:180, f1:"1/2", f2:"1/3", s1:90, remain1:90, s2:30, ans:60, desc:"180 元先花了 1/2，剩下的又花了 1/3，還剩幾元" },
  { total:200, f1:"1/5", f2:"1/2", s1:40, remain1:160, s2:80, ans:80, desc:"200 張貼紙先送了 1/5，剩下的又送了 1/2，還剩幾張" }
];
rtfData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "remain_then_fraction", "medium",
    d.desc + "？",
    d.ans,
    [
      "L1 先想觀念：這是兩段題：先算第一次剩下，再算第二次（是針對剩下的量）。",
      "L2 列式：第一次剩 = " + d.total + " − " + d.total + "×" + d.f1 + "；第二次是針對剩下的量 ×" + d.f2 + "。",
      "📐 動手算：\n① 第一次用掉 " + d.total + "×" + d.f1 + "\n② 第一次剩下 = " + d.total + " − 用掉\n③ 第二次用掉 = 剩下 × " + d.f2 + "\n④ 最後剩下 = 第一次剩 − 第二次用\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：第二次的分數是針對「原來的量」算的（應該針對第一次剩下的量）！"
    ],
    "第一次用 " + d.s1 + "，剩 " + d.remain1 + "；第二次用 " + d.s2 + "，最後剩 " + d.ans + "。",
    ["第二次的分數用在原來的總量上。", "兩段的減法算錯。"]
  ));
});

// ---- word_compare (NEW kind) +10 ----
var wcData = [
  { a:"小明", b:"小華", aFrac:"1/3", bFrac:"1/4", total:120, aAmt:40, bAmt:30, ans:10, desc:"120 顆糖果，小明拿了 1/3，小華拿了 1/4，小明比小華多幾顆" },
  { a:"甲", b:"乙", aFrac:"2/5", bFrac:"1/4", total:200, aAmt:80, bAmt:50, ans:30, desc:"200 元獎金，甲分了 2/5，乙分了 1/4，甲比乙多幾元" },
  { a:"哥哥", b:"弟弟", aFrac:"3/8", bFrac:"1/4", total:240, aAmt:90, bAmt:60, ans:30, desc:"240 顆彈珠，哥哥拿了 3/8，弟弟拿了 1/4，哥哥比弟弟多幾顆" },
  { a:"A 班", b:"B 班", aFrac:"1/3", bFrac:"1/5", total:150, aAmt:50, bAmt:30, ans:20, desc:"學校 150 人，A 班佔 1/3，B 班佔 1/5，A 班比 B 班多幾人" },
  { a:"小花", b:"小草", aFrac:"1/2", bFrac:"1/3", total:180, aAmt:90, bAmt:60, ans:30, desc:"180 公克巧克力，小花吃了 1/2，小草吃了 1/3，小花比小草多吃幾公克" },
  { a:"紅色", b:"藍色", aFrac:"3/10", bFrac:"1/5", total:100, aAmt:30, bAmt:20, ans:10, desc:"100 顆球中，紅球佔 3/10，藍球佔 1/5，紅球比藍球多幾顆" },
  { a:"甲", b:"乙", aFrac:"5/12", bFrac:"1/4", total:240, aAmt:100, bAmt:60, ans:40, desc:"240 公升的水，甲桶裝了 5/12，乙桶裝了 1/4，甲比乙多幾公升" },
  { a:"上午", b:"下午", aFrac:"2/5", bFrac:"3/10", total:200, aAmt:80, bAmt:60, ans:20, desc:"一條 200 公尺的路，上午修了 2/5，下午修了 3/10，上午比下午多修幾公尺" },
  { a:"媽媽", b:"爸爸", aFrac:"1/4", bFrac:"1/6", total:360, aAmt:90, bAmt:60, ans:30, desc:"360 元的蛋糕，媽媽付了 1/4，爸爸付了 1/6，媽媽比爸爸多付幾元" },
  { a:"第一天", b:"第二天", aFrac:"3/7", bFrac:"2/7", total:140, aAmt:60, bAmt:40, ans:20, desc:"140 頁的書，第一天看了 3/7，第二天看了 2/7，第一天比第二天多看幾頁" }
];
wcData.forEach(function(d) {
  newQs.push(makeQ(
    nextID(), "word_compare", "medium",
    d.desc + "？",
    d.ans,
    [
      "L1 先想觀念：分別算出兩人各拿多少，再相減。",
      "L2 列式：" + d.total + " × " + d.aFrac + " − " + d.total + " × " + d.bFrac + "。",
      "📐 動手算：\n① " + d.a + " 拿 " + d.total + " × " + d.aFrac +
        "\n② " + d.b + " 拿 " + d.total + " × " + d.bFrac +
        "\n③ 兩者相減\n算完記得回頭檢查 ✅",
      "📌 常見錯誤：直接用兩個分數相減再乘總量（結果相同但容易通分算錯）。建議先各算再減！"
    ],
    d.a + " = " + d.aAmt + "，" + d.b + " = " + d.bAmt + "，差 = " + d.ans + "。",
    ["減法方向搞反了。", "分數乘法計算錯誤。"]
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
console.log("New total:", 160 + newQs.length);
console.log("Synced to dist.");
