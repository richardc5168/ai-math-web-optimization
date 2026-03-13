#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');

var files = [
  'docs/index.html',
  'docs/about/index.html',
  'docs/interactive-g5-empire/index.html',
  'docs/parent-report/index.html',
  'docs/pricing/index.html',
  'dist_ai_math_web_pages/docs/index.html',
  'dist_ai_math_web_pages/docs/about/index.html',
  'dist_ai_math_web_pages/docs/interactive-g5-empire/index.html',
  'dist_ai_math_web_pages/docs/parent-report/index.html',
  'dist_ai_math_web_pages/docs/pricing/index.html'
];

var root = path.join(__dirname, '..');
var count = 0;
files.forEach(function(f) {
  var fp = path.join(root, f);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found):', f); return; }
  var src = fs.readFileSync(fp, 'utf8');
  // Replace 6600 with 6700 (avoid matching 86400000 ms constant)
  var out = src.replace(/(?<!\d)6600/g, '6700');
  if (out !== src) {
    fs.writeFileSync(fp, out, 'utf8');
    var matches = (src.match(/(?<!\d)6600/g) || []).length;
    console.log('Updated', f, '(' + matches + ' replacements)');
    count += matches;
  } else {
    console.log('No change:', f);
  }
});
console.log('Total replacements:', count);
