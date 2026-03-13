#!/usr/bin/env node
// Fix L3 hint leaks in offline-math bank
// Pattern: replace final answer line in L3 (hints[2]) with "= ?"
// Run: node tools/_fix_offline_math_l3_leaks.cjs
"use strict";
var fs = require("fs");
var path = require("path");

var SRC = path.join(__dirname, "..", "docs", "offline-math", "bank.js");
var DIST = path.join(__dirname, "..", "dist_ai_math_web_pages", "docs", "offline-math", "bank.js");

// IDs with L3 leaks from audit
var LEAK_IDS_FILE = path.join(__dirname, "..", "artifacts", "hint_clarity_audit.json");
var audit = JSON.parse(fs.readFileSync(LEAK_IDS_FILE, "utf8"));
var leakIds = {};
audit.violations.forEach(function(v) {
  if (v.module === "offline-math" && v.rule === "L3_ANSWER_LEAK") {
    leakIds[v.question_id] = v.detail;
  }
});

var src = fs.readFileSync(SRC, "utf8");

// Parse the bank
var match = src.match(/^([\s\S]*?window\.OFFLINE_MATH_BANK\s*=\s*)([\s\S]+?)(;\s*$)/m);
if (!match) { console.error("Cannot parse bank.js"); process.exit(1); }
var prefix = match[1];
var suffix = match[3];

// Safely eval the array
var bankArr;
try {
  bankArr = (new Function("return " + match[2]))();
} catch(e) {
  console.error("Cannot eval bank array:", e.message);
  process.exit(1);
}

var fixCount = 0;
bankArr.forEach(function(q) {
  if (!leakIds[q.id]) return;
  if (!q.hints || q.hints.length < 3) return;

  var h = q.hints[2]; // L3
  var answer = q.answer || (q.params && q.params.answer);
  if (!answer) return;

  var ansStr = String(answer);

  // Strategy: replace the answer in the last computation line with "?"
  // Multiple patterns:

  // Pattern 1: "① = ANSWER\n" — replace ANSWER with "?"
  var newH = h.replace(new RegExp("① = " + escapeRegex(ansStr), "g"), "① = ?");

  // Pattern 2: "合計：X+Y=ANSWER" — replace last = onwards
  if (newH === h) {
    // Try replacing the final occurrence of the answer
    var lines = h.split("\n");
    var changed = false;
    for (var i = lines.length - 1; i >= 0; i--) {
      if (lines[i].indexOf(ansStr) >= 0 && !lines[i].match(/^📐|^算完/)) {
        // Replace the answer with "?" in this line
        lines[i] = lines[i].replace(ansStr, "?");
        changed = true;
        break;
      }
    }
    if (changed) newH = lines.join("\n");
  }

  if (newH !== h) {
    q.hints[2] = newH;
    fixCount++;
  }
});

// Also fix L4 if it has a leak (check common pattern)
// The validator only checks L3, so focus on L3

// Rebuild
var out = prefix + JSON.stringify(bankArr, null, 2) + suffix;
fs.writeFileSync(SRC, out, "utf8");
fs.writeFileSync(DIST, out, "utf8");

console.log("Fixed L3 leaks:", fixCount, "out of", Object.keys(leakIds).length);
console.log("Synced to dist.");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
