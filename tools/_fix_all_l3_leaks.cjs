#!/usr/bin/env node
// General L3 answer leak fixer for all JS-format bank files
// Reads audit results and fixes L3 hints that contain the answer
// Run: node tools/_fix_all_l3_leaks.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var AUDIT = path.join(__dirname, "..", "artifacts", "hint_clarity_audit.json");
var audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));

// Group violations by module
var byModule = {};
audit.violations.forEach(function(v) {
  if (v.rule !== "L3_ANSWER_LEAK") return;
  if (v.module === "offline-math") return; // already fixed
  if (!byModule[v.module]) byModule[v.module] = [];
  byModule[v.module].push(v);
});

// Module → bank file mapping
var MODULE_BANKS = {
  "exam-sprint": "docs/exam-sprint/bank.js",
  "volume-g5": "docs/volume-g5/bank.js",
  "ratio-percent-g5": "docs/ratio-percent-g5/bank.js",
  "g5-grand-slam": "docs/g5-grand-slam/bank.js",
  "interactive-g5-life-pack1-empire": "docs/interactive-g5-life-pack1-empire/bank.js",
  "interactive-g5-life-pack1plus-empire": "docs/interactive-g5-life-pack1plus-empire/bank.js",
  "interactive-g5-life-pack2-empire": "docs/interactive-g5-life-pack2-empire/bank.js",
  "interactive-g5-life-pack2plus-empire": "docs/interactive-g5-life-pack2plus-empire/bank.js",
  "interactive-g5-midterm1": "docs/interactive-g5-midterm1/bank.js",
  "interactive-g5-national-bank": "docs/interactive-g5-national-bank/bank.js"
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fixHintLeak(hintText, answerStr) {
  if (!hintText || !answerStr) return hintText;
  var lines = hintText.split("\n");
  var fixed = false;
  // Work backwards: replace answer in last matching line
  for (var i = lines.length - 1; i >= 0; i--) {
    var line = lines[i];
    if (line.indexOf(answerStr) >= 0 && !line.match(/^📐|^觀念|^💡|^🔍/)) {
      lines[i] = line.replace(new RegExp(escapeRegex(answerStr), "g"), "?");
      fixed = true;
      break;
    }
  }
  if (!fixed) {
    // Try replacing any occurrence except in header lines
    for (var j = lines.length - 1; j >= 0; j--) {
      if (lines[j].indexOf(answerStr) >= 0) {
        lines[j] = lines[j].replace(answerStr, "?");
        break;
      }
    }
  }
  return lines.join("\n");
}

var totalFixed = 0;

Object.keys(byModule).forEach(function(mod) {
  var bankPath = MODULE_BANKS[mod];
  if (!bankPath) { console.log("SKIP (no bank path):", mod); return; }

  var srcPath = path.join(__dirname, "..", bankPath);
  var distPath = path.join(__dirname, "..", "dist_ai_math_web_pages", bankPath);

  if (!fs.existsSync(srcPath)) { console.log("SKIP (file missing):", srcPath); return; }

  var src = fs.readFileSync(srcPath, "utf8");

  // Parse: find the variable assignment and array
  var varMatch = src.match(/^([\s\S]*?(?:window\.\w+|var\s+\w+)\s*=\s*)([\s\S]+?)(;\s*$)/m);
  if (!varMatch) { console.log("SKIP (cannot parse):", mod); return; }

  var bankArr;
  try {
    bankArr = (new Function("return " + varMatch[2]))();
  } catch(e) {
    console.log("SKIP (cannot eval):", mod, e.message);
    return;
  }

  // Build ID → violation map
  var leakIds = {};
  byModule[mod].forEach(function(v) { leakIds[v.question_id] = v; });

  var modFixed = 0;
  bankArr.forEach(function(q) {
    if (!leakIds[q.id]) return;
    if (!q.hints || q.hints.length < 3) return;

    var answer = String(q.answer || "");
    if (!answer) return;

    var oldH = q.hints[2];
    var newH = fixHintLeak(oldH, answer);

    if (newH !== oldH) {
      q.hints[2] = newH;
      modFixed++;
    }
  });

  if (modFixed > 0) {
    var out = varMatch[1] + JSON.stringify(bankArr, null, 2) + varMatch[3];
    fs.writeFileSync(srcPath, out, "utf8");
    if (fs.existsSync(distPath)) fs.writeFileSync(distPath, out, "utf8");
    totalFixed += modFixed;
    console.log("Fixed", modFixed, "in", mod);
  } else {
    console.log("No fixes applied in", mod, "(", Object.keys(leakIds).length, "violations)");
  }
});

console.log("\nTotal L3 leaks fixed:", totalFixed);
