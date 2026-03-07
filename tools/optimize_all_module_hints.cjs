#!/usr/bin/env node
/**
 * optimize_all_module_hints.cjs
 * ─────────────────────────────
 * Batch-optimize L3 hints (and enrich L1/L2 where too short) for ALL modules
 * EXCEPT fraction-word-g5 (protected) and modules already optimized
 * (g5-grand-slam, commercial-pack1-fraction-sprint, interactive-g5-midterm1, interactive-g5-national-bank).
 *
 * Constraints:
 *   - NO hint may contain the final answer verbatim (answer-leak guard)
 *   - Only hint text is modified — no question/answer/structure changes
 *   - fraction-word-g5 is NEVER modified
 *
 * Usage:
 *   node tools/optimize_all_module_hints.cjs          # preview
 *   node tools/optimize_all_module_hints.cjs --apply  # write changes
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const apply = process.argv.includes('--apply');
const DOCS  = path.resolve(__dirname, '..', 'docs');
const DIST  = path.resolve(__dirname, '..', 'dist_ai_math_web_pages', 'docs');

/* ════════════════════════════════════════════════════════════════════
   Per-kind L3 templates — grouped by theme
   ════════════════════════════════════════════════════════════════════ */
const L3 = {
  // ─── 帝國: 8 題型 ───
  volume_rect_prism: '👉 一步步算：長×寬×高。把三個數依序乘好，記得標上 cm³ 或 m³。驗算：可用估算（把每個數取整後再乘）看答案是否合理。',
  fraction_mul:      '👉 一步步算：先看分子和分母是否能「交叉約分」→ 約完後分子×分子、分母×分母 → 最後確認是最簡分數。',
  unit_convert:      '👉 找到對應的換算倍率（如 1 公斤=1000 公克），乘或除以倍率即可。注意小數乘除時小數點的位置。',
  time_add:          '👉 一步步算：① 原時間的分鐘 + 加上的分鐘 → ② 如果 ≥ 60，進位到小時（分鐘 − 60，小時 +1）→ ③ 如果 ≥ 24 小時，減掉 24。用 HH:MM 寫答案。',
  fraction_addsub:   '👉 一步步算：① 先通分（找最小公倍數）→ ② 分子相加或相減 → ③ 看能不能約分化成最簡 → ④ 如果答案 >1 可以用帶分數或假分數。',
  decimal_mul:       '👉 小撇步：先忽略小數點、當整數相乘，算完後再「數小數位數」把小數點放回去。用估算驗一下：答案大小合不合理。',
  percent_of:        '👉 一步步算：百分率 ÷ 100 = 小數 → 再乘以全體的數量。驗算：答案應 ≤ 全體（如果百分率 ≤ 100%）。',
  decimal_div:       '👉 一步步算：直式除法 → 看商何時需要補 0 → 商的小數點對齊被除數的小數點。不夠除就在右邊補 0 繼續除。',

  // ─── 互動小數 ───
  d_mul_int:           '👉 小撇步：先去掉小數點算整數乘法，再把小數點放回去（小數位數不變）。驗算：估算個位數 × 整數看是否接近。',
  int_mul_d:           '👉 方法：整數 × 小數 = 把小數當乘數，先算整數相乘，再放小數點。打折題：原價 × 小數就是折後價。',
  d_mul_d:             '👉 兩個小數相乘：先忽略小數點算整數乘法 → 兩數的小數位數加起來 → 在乘積從右邊往左數這麼多位放小數點。',
  d_div_int:           '👉 直式除法：把被除數的小數點「抬上去」到商的位置 → 按正常除法做。不夠除就在右邊補 0 繼續。',
  int_div_int_to_decimal: '👉 整數÷整數但「除不盡」→ 在被除數後面補小數點和 0，繼續做直式除法。商的小數點對齊被除數的小數點。',
  x10_shift:           '👉 ×10 小數點右移一位、×100 右移兩位、×0.1 左移一位、×0.01 左移兩位。數好移幾位，不夠的補 0。',

  // ─── 生活應用 & 帝國生活包 u1–u10 ───
  u1_avg_fraction:         '👉 一步步算：總量 ÷ 人數 → 分數除以整數 = 分數 × (1/整數) = 分母乘上整數、分子不動。最後約分成最簡分數。',
  u2_frac_addsub_life:     '👉 一步步算：先通分 → 分子加減 → 約分到最簡。如果兩個分母相同，直接分子加減就好。',
  u3_frac_times_int:       '👉 一步步算：分子 × 整數、分母不動 → 能約分就約 → 看是否需要化成帶分數、假分數或最簡分數。',
  u4_money_decimal_addsub: '👉 小數加減法：對齊小數點（位數不同就補 0），從最右邊開始加/減，進位/借位都跟整數一樣。最後把小數點放上去。',
  u5_decimal_muldiv_price: '👉 分兩種：\n• 乘法(單價×數量)：小數×整數，去掉小數點算整數乘法再放回。\n• 除法(平均)：用直式除法，小數點對齊、不夠除就補 0。',
  u6_frac_dec_convert:     '👉 小數→分數：數小數位數(1位→分母10，2位→分母100…)，再約分到最簡。分數→小數：分子÷分母做直式除法。',
  u7_discount_percent:     '👉 打折計算：折後價 = 原價 × 折數/10。省下 = 原價 − 折後價。小心「打 8 折」= 付 80% = 原價 × 0.8，不是減 8。',
  u8_ratio_recipe:         '👉 比例題：先算總份數（如 a:b → a+b 份）→ 每份 = 總量 ÷ 總份數 → 某項 = 該項份數 × 每份量。',
  u9_unit_convert_decimal: '👉 找到換算倍率（如 1 kg = 1000 g），再用乘法或除法換算。注意小數點移動的方向和位數。',
  u10_rate_time_distance:  '👉 速率公式三角形：距離 = 速率 × 時間、時間 = 距離 ÷ 速率、速率 = 距離 ÷ 時間。套上對應的那一個就好。',

  // ─── 生活應用 G5 (life-applications-g5) ───
  buy_many:            '👉 單價 × 數量 = 總價。小數相乘要注意小數點位。驗算：估算整數部分 × 數量看是否接近。',
  unit_price:          '👉 總價 ÷ 數量 = 單價。用直式除法，商的小數點對齊。',
  discount:            '👉 折後價 = 原價 × 折扣百分比。注意「40% 折扣」= 打 6 折 = 付 60%。驗算：折後價 < 原價。',
  make_change:         '👉 找零 = 付的錢 − 花的錢。對齊小數點做減法，不夠減要借位。',
  shopping_two_step:   '👉 先算各項的小計（單價×數量），再加起來得總金額，最後扣掉折價券或找零。一步一步慢慢來不跳步。',
  table_stats:         '👉 全部數字加起來就是總數。先從左到右兩個兩個配對加，最後加在一起，比較不會加錯。',
  area_tiling:         '👉 先統一單位（都換成公分或公尺）→ 長需要幾塊（房間長÷磚長）、寬需要幾塊（房間寬÷磚寬）→ 兩個相乘。',
  proportional_split:  '👉 比例分配：先算總份數 → 每份 = 總數 ÷ 總份數 → 某人分到 = 該人的份數 × 每份量。',
  volume_fill:         '👉 先把公升換成毫升（×1000），再用「滿水量 − 現有水量 = 還需要加」。',
  temperature_change:  '👉 上升就加、下降就減。溫度可以是負數，注意正負號方向。',
  fraction_remaining:  '👉 剩下 = 全部 × (1 − 用掉的分數)。先算括號裡面，再乘以全部。驗算：剩下 + 用掉 = 全部。',
  perimeter_fence:     '👉 正方形周長 = 邊長 × 4。長方形周長 = (長+寬) × 2。直接套公式。',

  // ─── 比率與百分率 ───
  ratio_part_total:        '👉 部分 ÷ 全體 = 比率（小數）。直式除法做出小數答案。驗算：比率 × 全體 = 部分。',
  percent_find_part:       '👉 部分 = 全體 × 百分率 ÷ 100。先乘再除。驗算：部分 ÷ 全體 × 100 = 百分率。',
  ratio_remaining:         '👉 剩下個數 = 全體 − 用掉的。比率 = 剩下 ÷ 全體。驗算：已用比率 + 剩下比率 = 1。',
  percent_find_percent:    '👉 百分率 = 部分 ÷ 全體 × 100。先做除法得小數，再 ×100 換成百分率。',
  ratio_missing_to_1:      '👉 所有比率加起來 = 1。缺少的 = 1 − 已知的比率加總。驗算：全部加起來 = 1。',
  percent_discount:        '👉 折後價 = 原價 × 折數 ÷ 10（或直接 × 百分比 ÷ 100）。驗算：折後 < 原價。',
  ratio_add_decimal:       '👉 把兩個比率的小數直接相加。對齊小數點再加。驗算：加完 ≤ 1。',
  percent_find_whole:      '👉 全體 = 部分 ÷ 百分率 × 100。先除後乘。驗算：全體 × 百分率 ÷ 100 = 部分。',
  percent_increase_decrease: '👉 增加：新 = 原 × (100 + %)÷100。減少：新 = 原 × (100 − %)÷100。驗算：增→新 > 原、減→新 < 原。',
  percent_interest:        '👉 單利公式：利息 = 本金 × 年利率(%) ÷ 100 × 年數。一步一步乘，最後得到利息。',
  ratio_sub_decimal:       '👉 兩個比率的小數直接相減。對齊小數點做減法。',
  ratio_unit_rate:         '👉 單位率 = 總量 ÷ 總時間（或總數量）。用除法算出每 1 單位的量。',
  percent_meaning:         '👉 百分率的意思就是「每 100 份裡有幾份」。直接把百分號前面的數字寫出來。',
  percent_tax_service:     '👉 加服務費/稅：總價 = 小計 × (100 + 服務費率)%。或先算服務費 = 小計 × 費率%，再加上小計。',
  fraction_to_percent:     '👉 分數→百分率：分子 ÷ 分母 × 100。先除後乘。',
  percent_to_decimal:      '👉 百分率→小數：去掉 % 符號再 ÷ 100（小數點往左移兩位）。',
  decimal_to_percent:      '👉 小數→百分率：小數 × 100 再加 %（小數點往右移兩位）。',

  // ─── 體積 ───
  rect_cm3:        '👉 長方體體積 = 長 × 寬 × 高。三個數依序相乘，記得標單位 cm³。',
  base_area_h:     '👉 體積 = 底面積 × 高。把題目給的底面積直接乘以高就好。',
  composite:       '👉 複合形體分解法：把圖形切成兩塊簡單的長方體 → 各算各的體積 → 最後加起來。',
  cube_cm3:        '👉 正方體體積 = 邊長 × 邊長 × 邊長（三次方）。算好標上 cm³。',
  mixed_units:     '👉 先統一單位！公尺→公分就 ×100。全部變成同一個單位後，再長×寬×高。',
  rect_find_height:'👉 反求高：高 = 體積 ÷ (長 × 寬)。先算長×寬，再用體積去除。',
  decimal_dims:    '👉 帶小數的尺寸一樣用長×寬×高，但要注意小數乘法（數好小數位數）。',
  composite3:      '👉 三段相加：把圖分成 A、B、C 三塊 → 各算體積 → 再全部加起來。小心不要漏掉任何一塊。',
  cube_find_edge:  '👉 反求邊長：邊長 = ³√體積。想想哪個數字自己乘三次等於體積（試 2、3、4、5、6、7…）。',
  cm3_to_m3:       '👉 cm³ → m³：÷ 1,000,000（因為 100×100×100=1,000,000）。去掉 6 個零。',
  m3_to_cm3:       '👉 m³ → cm³：× 1,000,000。把數字加上 6 個零。',

  // ─── 分數計算 ───
  simplify:         '👉 約分 = 分子分母同除以最大公因數。找到 GCD 後同除，確認不能再除了就是最簡分數。',
  mixed_convert:    '👉 假分數→帶分數：分子 ÷ 分母 = 商…餘數 → 商 餘數/分母。帶分數→假分數：整數×分母+分子 放分子。',
  add_like:         '👉 同分母加法：分子直接相加、分母不動。如果分子 ≥ 分母就化成帶分數或假分數。',
  equivalent:       '👉 等值分數：找到分子或分母的倍數關係，另一個也要乘/除同樣的數。',
  sub_like:         '👉 同分母減法：分子直接相減、分母不動。結果能約分就約。',
  mul_int:          '👉 分數×整數：分子 × 整數、分母不變。先看能不能先約分讓數字小一點。',
  add_unlike:       '👉 異分母加法：先通分（找 LCM 當公分母）→ 分子各乘上對應倍數 → 分子相加 → 約分。',
  sub_unlike:       '👉 異分母減法：先通分 → 分子相減 → 約分到最簡。',
  mul:              '👉 分數乘法：先交叉約分 → 分子×分子、分母×分母 → 確認是最簡分數。',

  // ─── 考前衝刺 extra kinds ───
  generic_fraction_word: '👉 分數應用題：先圈出關鍵分數和對象 → 判斷是「加/減/乘/除」→ 列式 → 通分或直接算 → 約分成最簡。',
  general:               '👉 整數四則運算：找是否有「先乘除後加減」或提公因數的簡化方法。小心括號和運算順序。',
  fraction_of_quantity:  '👉 「某數的幾分之幾」= 某數 × 分數。直式計算後看是否要約分或化帶分數。',
  remaining_after_fraction: '👉 剩下 = 全部 × (1 − 用掉的分數)。先算括號再乘。驗算：剩下 + 用掉 = 全部。',
  reverse_fraction:      '👉 反推原量：走了 a/b 剩下 X → 剩下比率 = 1−a/b → 全程 = X ÷ (1−a/b)。',
  remain_then_fraction:  '👉 兩段式：先算第一段剩多少 → 再從剩下的量算第二段用多少 → 最後剩的 = 第一段剩的 − 第二段用的。',

  // ─── 小數第4單元 (同 interactive-decimal 但不同 key) ───
  // (已在上面 d_mul_int, d_mul_d, etc.)

  // ─── 折線圖/其他 ───
  line_trend:      '👉 看趨勢：比較開始和結束的數值，變大→上升、變小→下降。',
  line_max_month:  '👉 把所有月份數字比一比，最大的就是答案。',
};

/* ── L1 enrichments for kinds where L1 < 40 chars ── */
const L1_ENRICH = {
  volume_rect_prism: '⭐ 觀念提醒\n長方體體積 = 長 × 寬 × 高。三個維度互相垂直。記住公式就能解所有長方體題。',
  cube_cm3:          '⭐ 觀念提醒\n正方體每邊都一樣長，體積 = 邊長³（邊長×邊長×邊長）。',
  u1_avg_fraction:   '⭐ 觀念提醒\n「平均分配」= 總量 ÷ 人數。分數 ÷ 整數 = 分數 × 1/整數。',
  u6_frac_dec_convert:'⭐ 觀念提醒\n小數和分數可以互換：小數的位數決定分母是10、100或1000，數好位數再約分。',
  ratio_part_total:  '⭐ 觀念提醒\n比率 = 部分 ÷ 全體（答案用小數表示）。比率的值在 0 到 1 之間。',
  percent_meaning:   '⭐ 觀念提醒\n百分率就是「把全體當作 100 份，某部分佔幾份」。% 就是 ÷100 的意思。',
  simplify:          '⭐ 觀念提醒\n約分 = 找到分子和分母的「最大公因數」後，同時除以它。結果是最簡分數。',
  equivalent:        '⭐ 觀念提醒\n等值分數：同一個值可以用不同分數表示。分子分母「同乘」或「同除」就能得到等值分數。',
};

/* ── L2 enrichments for kinds where L2 < 30 chars ── */
const L2_ENRICH = {
  u1_avg_fraction:   '🔍 列式引導\n列出除法式子：總量 ÷ 人數。分數除以整數就是分母×整數。先列出來再算。',
  u6_frac_dec_convert:'🔍 列式引導\n小數→分數：看小數幾位 → 分母寫 10/100/1000 → 分子是去掉小數點的整數 → 約分。',
  percent_meaning:   '🔍 列式引導\n直接讀 % 前面的數字就是答案。例如 25% = 每 100 份有 25 份。',
};

/* ── fallback ── */
const L3_FALLBACK = '👉 按照前面提示的觀念和列式，一步步算好後，問自己：單位寫對了嗎？答案大小合理嗎？用估算再確認一次。';

/* ════════════════════════════════════════════════════════════════════
   Module definitions — [dir, globalVar]
   ════════════════════════════════════════════════════════════════════ */
const MODULES = [
  ['exam-sprint',                         'EXAM_SPRINT_BANK'],
  ['interactive-g5-empire',               'INTERACTIVE_G5_EMPIRE_BANK'],
  ['life-applications-g5',                'LIFE_APPLICATIONS_G5_BANK'],
  ['interactive-g5-life-pack2plus-empire', 'G5_LIFE_PACK2PLUS_BANK'],
  ['interactive-decimal-g5',              'INTERACTIVE_DECIMAL_G5_BANK'],
  ['interactive-g5-life-pack1plus-empire', 'G5_LIFE_PACK1PLUS_BANK'],
  ['interactive-g5-life-pack1-empire',    'G5_LIFE_PACK1_BANK'],
  ['interactive-g5-life-pack2-empire',    'G5_LIFE_PACK2_BANK'],
  ['ratio-percent-g5',                    'RATIO_PERCENT_G5_BANK'],
  ['volume-g5',                           'VOLUME_G5_BANK'],
  ['fraction-g5',                         'FRACTION_G5_BANK'],
  ['decimal-unit4',                       'DECIMAL_UNIT4_BANK'],
  ['offline-math',                        'OFFLINE_MATH_BANK'],
];
// NOTE: fraction-word-g5, g5-grand-slam already optimized — EXCLUDED
// NOTE: interactive-g56-core-foundation uses JSON, handled separately

/* ── helpers ── */
function netLen(s) { return (s || '').replace(/^Hint \d[｜|].*?\n/, '').replace(/^[⭐🔍L].*?\n/, '').trim().length; }
function isBoilerplate(s) {
  if (!s) return true;
  const t = s.trim();
  return t.length < 35
    || t.includes('請依前面步驟完成計算')
    || t.includes('自行檢查單位並寫出答案')
    || t.includes('依上面列式計算');
}
function containsAnswer(text, answer) {
  if (!text || answer == null) return false;
  const a = String(answer).trim();
  if (!a || a.length <= 1) return false; // skip single-char answers like "2"
  const t = text.replace(/[\s,，]/g, '');
  const aNorm = a.replace(/[\s,，]/g, '');
  if (aNorm.length <= 2) {
    return new RegExp('=\\s*' + aNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\d)').test(t);
  }
  return t.includes(aNorm);
}
function sanitizeLeak(hint, answer) {
  const a = String(answer).trim();
  const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return hint.replace(new RegExp('=\\s*' + escaped + '(?![\\d/])', 'g'), '= ？？');
}

/* ── Process all modules ── */
const stats = { totalQuestions: 0, totalModified: 0, totalLeaksFixed: 0, modules: [] };

MODULES.forEach(([dir, gvar]) => {
  const bankPath = path.join(DOCS, dir, 'bank.js');
  const distPath = path.join(DIST, dir, 'bank.js');
  if (!fs.existsSync(bankPath)) { console.log(`⚠ ${dir}: bank.js not found`); return; }

  const src = fs.readFileSync(bankPath, 'utf8');
  const re = new RegExp('window\\.' + gvar + '\\s*=\\s*(\\[[\\s\\S]*?\\]);');
  const m = src.match(re);
  if (!m) { console.log(`⚠ ${dir}: cannot parse ${gvar}`); return; }

  const bank = eval(m[1]);
  let changed = 0, leaksFixed = 0;

  bank.forEach(q => {
    const kind = q.kind || q.type || 'unknown';
    let dirty = false;
    const hints = q.hints || q.teacherSteps || [];
    if (!hints.length) return;

    const lastIdx = hints.length - 1;

    // ── L3 (or L4 for 4-level hints): replace boilerplate ──
    if (isBoilerplate(hints[lastIdx])) {
      const tmpl = L3[kind] || L3_FALLBACK;
      const label = hints.length === 4 ? 'Hint 4｜計算引導' : 'Hint 3｜計算引導';
      hints[lastIdx] = label + '\n' + tmpl;
      dirty = true;
    }

    // Also fix 2nd-to-last for 4-level hints if boilerplate
    if (hints.length >= 4 && isBoilerplate(hints[lastIdx - 1])) {
      const tmpl = L3[kind] || L3_FALLBACK;
      hints[lastIdx - 1] = 'Hint 3｜列式策略\n' + tmpl;
      dirty = true;
    }

    // ── L1: enrich if too short ──
    if (netLen(hints[0]) < 40 && L1_ENRICH[kind]) {
      hints[0] = L1_ENRICH[kind];
      dirty = true;
    }

    // ── L2: enrich if too short ──
    if (hints.length >= 2 && netLen(hints[1]) < 25 && L2_ENRICH[kind]) {
      hints[1] = L2_ENRICH[kind];
      dirty = true;
    }

    // ── answer-leak guard ──
    hints.forEach((h, i) => {
      if (containsAnswer(h, q.answer)) {
        hints[i] = sanitizeLeak(h, q.answer);
        leaksFixed++;
        dirty = true;
      }
    });

    if (dirty) changed++;
  });

  stats.totalQuestions += bank.length;
  stats.totalModified += changed;
  stats.totalLeaksFixed += leaksFixed;
  stats.modules.push({ dir, count: bank.length, changed, leaksFixed });

  console.log(`  ${dir.padEnd(45)} ${String(bank.length).padStart(5)} Qs  ${String(changed).padStart(5)} changed  ${leaksFixed} leaks`);

  if (apply) {
    const bankStr = JSON.stringify(bank, null, 2);
    const newSrc = src.replace(m[0], `window.${gvar} = ${bankStr};`);
    fs.writeFileSync(bankPath, newSrc, 'utf8');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, newSrc, 'utf8');
    }
  }
});

/* ── Handle interactive-g56-core-foundation (JSON file) ── */
{
  const dir = 'interactive-g56-core-foundation';
  const jsonPath = path.join(DOCS, dir, 'g56_core_foundation.json');
  const distJsonPath = path.join(DIST, dir, 'g56_core_foundation.json');
  if (fs.existsSync(jsonPath)) {
    const src = fs.readFileSync(jsonPath, 'utf8');
    const bank = JSON.parse(src);
    let changed = 0, leaksFixed = 0;
    bank.forEach(q => {
      const kind = q.kind || q.type || 'core';
      const hints = q.hints || [];
      if (!hints.length) return;
      const lastIdx = hints.length - 1;
      let dirty = false;
      if (isBoilerplate(hints[lastIdx])) {
        hints[lastIdx] = 'Hint 3｜計算引導\n' + (L3[kind] || L3_FALLBACK);
        dirty = true;
      }
      hints.forEach((h, i) => {
        if (containsAnswer(h, q.answer)) {
          hints[i] = sanitizeLeak(h, q.answer);
          leaksFixed++; dirty = true;
        }
      });
      if (dirty) changed++;
    });
    stats.totalQuestions += bank.length;
    stats.totalModified += changed;
    stats.totalLeaksFixed += leaksFixed;
    stats.modules.push({ dir, count: bank.length, changed, leaksFixed });
    console.log(`  ${dir.padEnd(45)} ${String(bank.length).padStart(5)} Qs  ${String(changed).padStart(5)} changed  ${leaksFixed} leaks`);
    if (apply) {
      const newSrc = JSON.stringify(bank, null, 2);
      fs.writeFileSync(jsonPath, newSrc, 'utf8');
      if (fs.existsSync(path.dirname(distJsonPath))) {
        fs.writeFileSync(distJsonPath, newSrc, 'utf8');
      }
    }
  }
}

console.log('\n════════════════════════════════════════════');
console.log(`Total:     ${stats.totalQuestions} questions`);
console.log(`Modified:  ${stats.totalModified}`);
console.log(`Leaks:     ${stats.totalLeaksFixed}`);
console.log('════════════════════════════════════════════');
if (!apply) console.log('\n(dry run — use --apply to write)');
else console.log('\n✅ All changes written. Run validation:\n  python tools/validate_all_elementary_banks.py');
