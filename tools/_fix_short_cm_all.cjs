#!/usr/bin/env node
/**
 * _fix_short_cm_all.cjs
 * Replace generic short common_mistakes entries with kind-specific ones.
 * Target: entries where all CM items are < 10 chars (placeholders).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Kind → specific common_mistakes
const CM_MAP = {
  cube_cm3: [
    "把「邊長³」算成「邊長²」（面積而非體積）。",
    "單位寫成 cm² 而不是 cm³。"
  ],
  cube_find_edge: [
    "把立方根和平方根搞混（應該是³√而不是√）。",
    "忘了三個邊長都一樣，只做了一半的反推。"
  ],
  m3_to_cm3: [
    "換算倍率弄錯（1 m³ = 1000000 cm³，不是 100 或 1000）。",
    "小數點移動位數數錯（應該移 6 位）。"
  ],
  cm3_to_ml: [
    "忘了 1 cm³ 就等於 1 mL 的換算關係。",
    "體積和容量搞混，多乘或多除了倍率。"
  ],
  perimeter_fence: [
    "忘了扣掉靠牆的邊（不用圍的那一邊）。",
    "把周長和面積的公式搞混。"
  ],
  perp_bisector_property: [
    "忘了中垂線上的點到兩端等距這個性質。",
    "角平分線和中垂線的性質搞混。"
  ],
  perp_bisector_converse: [
    "逆向推理時忘了「到兩端等距 → 在中垂線上」。",
    "混淆了「垂直」和「中垂」的條件。"
  ],
  solve_ax: [
    "移項時忘了反運算（乘變除、加變減）。",
    "等號兩邊沒有同時做相同運算。"
  ],
  prime_or_composite: [
    "1 既不是質數也不是合數（特例）。",
    "沒有逐一檢查因數就判斷，偶數不一定是合數（2 是質數）。"
  ],
  are_to_m2: [
    "1 公畝 = 100 m²，不是 10 或 1000。",
    "從大單位換小單位該乘，卻做了除法。"
  ],
  ha_to_m2: [
    "1 公頃 = 10000 m²，不是 100 或 1000。",
    "公頃和公畝的倍率搞混（1公頃=100公畝）。"
  ],
  surface_area_contact_removed: [
    "忘了接觸面消失的是兩塊各一面（共扣 2 面），不是只扣 1 面。",
    "只算了原本的表面積，忘了扣掉接合處。"
  ],
  symmetry_axes: [
    "正n邊形有n條對稱軸，不是n/2條。",
    "把旋轉對稱和線對稱搞混了。"
  ],
  surface_area_cube: [
    "忘了正方體有 6 面（只算了 4 面或 5 面）。",
    "用了邊長³（那是體積），面積該用 6×邊長²。"
  ],
  national_bank_source: [
    "審題不仔細，漏看了某個條件或限制。",
    "公式選錯或代入的數字與題目不一致。"
  ],
  general: [
    "計算過程中數字抄錯或漏看條件。",
    "公式選錯或套錯，最後答案沒有回頭驗算。"
  ]
};

const docsDir = path.resolve(__dirname, '..', 'docs');
const distDir = path.resolve(__dirname, '..', 'dist_ai_math_web_pages', 'docs');
const dirs = fs.readdirSync(docsDir, { withFileTypes: true }).filter(d => d.isDirectory());
let totalFixed = 0;

for (const dir of dirs) {
  const bp = path.join(docsDir, dir.name, 'bank.js');
  if (!fs.existsSync(bp)) continue;
  const src = fs.readFileSync(bp, 'utf8');
  const sb = { window: {} };
  vm.createContext(sb);
  try { vm.runInContext(src, sb); } catch (e) { continue; }
  const varName = Object.keys(sb.window).find(k => Array.isArray(sb.window[k]));
  if (!varName) continue;
  const items = sb.window[varName];
  let fixed = 0;

  for (const q of items) {
    const cm = q.common_mistakes;
    if (!cm || !Array.isArray(cm) || cm.length === 0) continue;
    if (!cm.every(s => s.length < 10)) continue; // only fix short ones

    const kind = q.kind || 'general';
    const newCM = CM_MAP[kind] || CM_MAP.general;
    q.common_mistakes = newCM;
    fixed++;
  }

  if (fixed === 0) continue;

  const out = 'window.' + varName + ' = ' + JSON.stringify(items, null, 2) + ';\n';
  fs.writeFileSync(bp, out, 'utf8');
  const distBp = path.join(distDir, dir.name, 'bank.js');
  if (fs.existsSync(path.dirname(distBp))) {
    fs.writeFileSync(distBp, out, 'utf8');
  }
  totalFixed += fixed;
  console.log(dir.name + ': fixed ' + fixed + ' CM entries');
}

console.log('\nTotal CM entries improved:', totalFixed);
