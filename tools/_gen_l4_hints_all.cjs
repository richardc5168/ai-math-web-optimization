#!/usr/bin/env node
/**
 * _gen_l4_hints_all.cjs
 * Generate L4 (常見錯誤/checklist) hints for ALL questions that lack them.
 * L4 format: "👉 [kind-specific solving checklist + common mistake warning]"
 *
 * Does NOT overwrite existing L4 hints.
 * Safe to run multiple times (idempotent).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── Kind → L4 template map ────────────────────────────────────────
// Each value is a function(q) => string, or a static string.
const L4_MAP = {
  // ── Fraction operations ──
  fraction_addsub:        '👉 先通分 → 分子加減 → 約分到最簡。分母相同時直接分子加減。',
  fraction_add_unlike:    '👉 先找公分母通分 → 分子相加 → 約分到最簡分數。',
  add_like:               '👉 分母一樣直接分子相加 → 約分 → 看是否化成帶分數。',
  add_unlike:             '👉 先通分（找最小公分母）再分子相加 → 約分到最簡。',
  sub_like:               '👉 分母一樣直接分子相減 → 約分 → 看是否化成帶分數。',
  sub_unlike:             '👉 先通分再分子相減 → 約分到最簡。若不夠減要從整數借 1。',
  fraction_sub_mixed:     '👉 帶分數減法：先通分 → 分子不夠減就從整數借 1 → 化成假分數再減。',
  fraction_mul:           '👉 分子×分子、分母×分母 → 約分到最簡。整數可看成分母為 1。',
  fraction_times_fraction:'👉 分子×分子、分母×分母 → 約分。可先交叉約分再乘更快。',
  mul_int:                '👉 分子×整數、分母不動 → 約分 → 看是否化成帶分數或最簡分數。',
  mul:                    '👉 分子×分子、分母×分母 → 約分到最簡。帶分數先化假分數再乘。',
  int_times_fraction:     '👉 整數×分子寫在分子、分母不動 → 約分 → 化成最簡。',
  fraction_of_fraction:   '👉 「幾分之幾的幾分之幾」= 兩個分數相乘。分子×分子、分母×分母，答案記得約分。',
  fraction_of_quantity:   '👉 全部數量 × 分數 = 部分。整數×分子÷分母（或先÷分母再×分子看哪個好算）。',
  fraction_remaining:     '👉 先算用掉(全部×分數)，再用全部−用掉=剩餘。注意基準量是誰。',
  remaining_after_fraction:'👉 注意基準量！第二次的分數是基於「剩下」而不是「全部」。算好第一次剩下後，再算第二次。',
  remain_then_fraction:   '👉 「剩下」→ 1 減掉用掉的分數。兩次扣除要乘法串接，不是加法。',
  remaining_by_fraction:  '👉 先算出「剩下多少」，再乘以下一個分數。注意每次基準量不同。',
  reverse_fraction:       '👉 反推原量：已知部分 ÷ 佔比分數 = 原量。把「÷分數」改成「×倒數」更好算。',
  original:               '👉 反推原量：部分 ÷ 佔比分數 = 原量。÷分數 → ×倒數。',
  remain:                 '👉 剩餘 = 全部 × (1 − 已用分數)。先算 1 減掉幾分之幾再乘全部。',
  remain_multi:           '👉 多次取走：每次基準量是「上一次剩下的」，不是原始全部。逐步乘下來。',
  equivalent:             '👉 等值分數：分子分母同乘或同除相同數。找到正確倍率即可。',
  simplify:               '👉 約分：找分子分母的最大公因數，同除到最簡。',
  mixed_convert:          '👉 假分數→帶分數：分子÷分母=商…餘。帶分數→假分數：整數×分母+分子。',
  reciprocal:             '👉 倒數：分子分母互換。整數 n 的倒數 = 1/n。',
  generic_fraction_word:  '👉 分數應用題：先找出基準量和佔比，列式後分數運算 → 約分到最簡。',

  // ── Decimal operations ──
  d_mul_int:              '👉 小數×整數：先當整數算，再把小數點放回去（位數不變）。',
  int_mul_d:              '👉 整數×小數：先忽略小數點算整數乘法，再數小數位數放回小數點。',
  d_mul_d:                '👉 小數×小數：分別數兩個因數的小數位數，相加就是積的小數位數。',
  d_div_int:              '👉 小數÷整數：直式除法，小數點對齊上去。除不盡時補 0 繼續除。',
  decimal_mul:            '👉 小數乘法：去掉小數點算整數乘法，再把所有因數的小數位數加起來放回。',
  decimal_div:            '👉 小數除法：先把除數化成整數（同乘10的倍數），小數點對齊。',
  decimal_times_decimal:  '👉 兩個小數相乘：分別數小數位數，答案的小數位數 = 兩者位數之和。',
  decimal_times_integer:  '👉 小數×整數：忽略小數點先算整數乘法，再放回小數點（位數不變）。',
  decimal_multiplication: '👉 先忽略小數點算整數乘法，再把所有因數的小數位數加起來放回小數點。',
  decimal_dims:           '👉 帶小數的長寬高求面積/體積：去掉小數點算整數，再放回對應的小數位數。',
  x10_shift:              '👉 ×10/÷10 系列：乘10往右移一位、÷10往左移一位。數對零的個數。',
  int_div_int_to_decimal: '👉 整數÷整數得小數：直式除法，除不盡就補小數點和 0 繼續除。',

  // ── Percent ──
  percent_of:             '👉 求某數的百分之幾：數量 × 百分比。百分比要先化成小數（÷100）。',
  percent_discount:       '👉 折後價 = 原價 × (1 − 折扣率)。打 8 折 = 付 80% = ×0.8。',
  discount:               '👉 折後價 = 原價×折數÷10。打 8 折 = 付 80% = 原價×0.8，不是減 8。',
  percent_find_part:      '👉 部分 = 全體 × 百分率。百分率要先÷100 化成小數再乘。',
  percent_find_percent:   '👉 百分率 = 部分 ÷ 全體 × 100%。注意誰是部分、誰是全體。',
  percent_find_whole:     '👉 全體 = 部分 ÷ 百分率。百分率先化成小數再除。',
  percent_increase_decrease:'👉 增加後 = 原量×(1+增幅)。減少後 = 原量×(1−減幅)。注意基準量。',
  percent_interest:       '👉 利息 = 本金 × 年利率 × 年數。到期金額 = 本金 + 利息。',
  percent_meaning:        '👉 百分率就是以 100 為基準的比率。p% = p/100 = 小數。直接讀 % 前面的數字。',
  percent_tax_service:    '👉 含稅價 = 原價 × (1 + 稅率)。服務費同理。先算附加金額再加上。',
  find_percent:           '👉 百分率：部分÷全體×100%。注意誰是基準量（分母）。',
  fraction_to_percent:    '👉 分數→百分率：分子÷分母×100 再加上 %。',
  percent_to_decimal:     '👉 百分率→小數：÷100（小數點往左移 2 位）。',
  decimal_to_percent:     '👉 小數→百分率：×100。例如 0.75 = 75%。',
  percent_to_ppm:         '👉 百分率→千分率(‰)：×10。例如 5% = 50‰。',
  cheng_increase:         '👉 成數計算：一成 = 10%。增加三成 = 原量×1.3。',

  // ── Ratio ──
  ratio_part_total:       '👉 部分÷全體找比率，或用比值×全體找部分。注意各部分加起來要等於全體。',
  ratio_remaining:        '👉 總份數 − 已知份數 = 剩下份數。每份量 = 全體÷總份數。',
  ratio_missing_to_1:     '👉 比的化簡：同÷最大公因數。缺項用等比推算：a:b = c:?  → ? = b×c÷a。',
  ratio_add_decimal:      '👉 比例加上小數：先把所有比值化成整數（同乘），再化簡。',
  ratio_sub_decimal:      '👉 比的減法/差：先統一為整數比再做計算。',
  ratio_unit_rate:        '👉 單位量 = 總量÷份數。比較兩者時都化成「每 1 份」再比。',
  proportional_split:     '👉 按比分配：全體÷總份數=每份 → 各項份數×每份=各項量。',

  // ── Volume ──
  volume_rect_prism:      '👉 長方體體積 = 長×寬×高。三個維度代進去算完記得寫 cm³。',
  rect_cm3:               '👉 長方體體積 = 長×寬×高（單位 cm³）。正方體=邊長³。',
  cube_cm3:               '👉 正方體體積 = 邊長×邊長×邊長 = 邊長³。單位是 cm³。',
  base_area_h:            '👉 體積 = 底面積 × 高。已知底面積直接乘高即可。',
  volume_fill:            '👉 填滿/注水體積 = 容器體積。長×寬×高(水深)。注意是水深不是容器高。',
  rect_find_height:       '👉 高 = 體積 ÷ 底面積。底面積 = 長×寬。',
  cube_find_edge:         '👉 正方體邊長 = ∛體積。找一個數乘三次等於體積。',
  volume_calculation:     '👉 長方體體積=長×寬×高。正方體體積=邊長³。分清楚三個維度再代入公式。',
  cm3_to_m3:              '👉 cm³→m³：÷1000000（因為 100³=1000000）。',
  m3_to_cm3:              '👉 m³→cm³：×1000000。1 m³ = 100×100×100 cm³。',
  cm3_to_ml:              '👉 1 cm³ = 1 mL。體積和容量的換算最直接。',
  composite:              '👉 複合體/挖空：分成幾個長方體算完再加/減。畫線分割比較清楚。',
  composite3:             '👉 三個以上的複合體：逐一分割計算，最後組合（加或減）。',
  surface_area_rect_prism:'👉 長方體表面積 = 2×(長寬+長高+寬高)。六個面兩兩相等。',
  surface_area_cube:      '👉 正方體表面積 = 6×邊長²。六面都一樣大。',
  surface_area_contact_removed:'👉 接合/堆疊時消失的面積 = 接觸面×2（上下各一）。總表面積要減掉。',

  // ── Area / Perimeter ──
  area_tiling:            '👉 鋪磚：總面積÷每塊面積=需要幾塊。注意單位要統一。',
  area_congruent_tile:    '👉 全等磁磚鋪滿：面積÷每塊面積。不整除就看題意是否要無條件進入。',
  area_triangle:          '👉 三角形面積 = 底×高÷2。注意底和高要互相垂直。',
  area_trapezoid:         '👉 梯形面積 = (上底+下底)×高÷2。注意上底下底是平行的兩邊。',
  area_parallelogram:     '👉 平行四邊形面積 = 底×高。高是垂直於底的距離，不是斜邊。',
  area_difference:        '👉 先分別算出兩個圖形的面積，再用大−小求出差。注意單位要統一。',
  perimeter_fence:        '👉 周長 = 所有邊長加起來。靠牆的邊不用圍 → 總周長 − 靠牆邊。',

  // ── Unit conversion ──
  unit_convert:           '👉 找到換算倍率 → 大單位→小單位用乘法、小單位→大單位用除法。',
  unit_convert_decimal:   '👉 找到換算倍率，用乘法或除法換算。小數點移動的位數 = 倍率的零的個數。',
  mixed_units:            '👉 不同單位混合計算：先統一成同一個單位再加減乘除。',
  are_to_m2:              '👉 1 公畝 = 100 m²（10×10）。',
  ha_to_m2:               '👉 1 公頃 = 10000 m²（100×100）= 100 公畝。',
  km2_to_ha:              '👉 1 km² = 100 公頃 = 1000000 m²。',
  liter_to_ml:            '👉 1 L = 1000 mL。升→毫升：×1000。',

  // ── Time ──
  time_add:               '👉 時間加法：分鐘滿 60 進 1 小時、小時滿 24 進 1 天。對齊時分加。',
  time_add_cross_day:     '👉 跨日/跨午夜的時間加法：注意「24:00 = 隔天 00:00」。分段計算比較不會錯。',
  time_sub_cross_day:     '👉 跨日時間減法：先把兩個時間都轉成 24 小時制，再計算差。',
  time_multiply:          '👉 時間的乘法：先把時分轉成只有分鐘（或秒），乘完再換回時分格式。',

  // ── Shopping / Money ──
  buy_many:               '👉 同單價多份 → 乘法。單價×數量=總價。別忘了小數點位置。',
  unit_price:             '👉 單價 = 總價÷數量。比較便宜的 → 求出各自單價再比。',
  shopping_two_step:      '👉 購物兩步問題：先算各品項總價，再加起來。找零 = 付的 − 總價。',
  make_change:            '👉 找零 = 付的錢 − 花掉的錢。仔細對齊小數點做減法。',

  // ── Statistics / Charts ──
  table_stats:            '👉 看表格：先找到正確的列/欄，讀出數字再計算。注意單位。',
  compare:                '👉 比較大小：先統一單位/格式 → 再逐一比較。分數要通分或化小數。',
  temperature_change:     '👉 溫度變化 = 後來 − 之前。負數代表下降。注意正負號。',
  average_division:       '👉 平均 = 總和 ÷ 個數。先把所有數值加起來再除。',
  line_trend:             '👉 折線圖趨勢：看線段是上升/下降/持平。最陡的段代表變化最大。',
  line_max_month:         '👉 找最大月份：在折線圖上找最高點，對應的橫軸就是答案。',
  line_omit_rule:         '👉 省略符號(～)：表示中間跳過一段，不影響判讀但要注意起始值。',

  // ── Geometry ──
  perp_bisector_property: '👉 中垂線性質：中垂線上任一點到線段兩端等距。利用等距條件列等式。',
  perp_bisector_converse: '👉 中垂線逆性質：到線段兩端等距的點在中垂線上。',
  clock_angle:            '👉 時鐘角度：時針每小時走 30°、分針每分鐘走 6°。求夾角取絕對值。',
  sector_central_angle:   '👉 扇形圓心角：佔比×360° = 圓心角。面積 = π×r²×(角度/360)。',
  displacement:           '👉 位移問題：往返/折返的距離與位移不同。位移看起終點，路程看全程。',
  symmetry_axes:          '👉 對稱軸：正 n 邊形有 n 條對稱軸。圓有無限多條。',

  // ── Number theory ──
  gcd_word:               '👉 最大公因數(GCD)應用：「最多平分成幾份」「最大的正方形」→ 用 GCD。',
  lcm_word:               '👉 最小公倍數(LCM)應用：「最少幾個」「何時再同時」→ 用 LCM。',
  prime_or_composite:     '👉 質數只有 1 和自己兩個因數。合數有 3 個以上因數。1 既不是質數也不是合數。',
  place_value_yi_wan:     '👉 大數的位值：億→萬→個。把數字拆成「幾億幾千幾百幾十幾萬幾千…」。',
  place_value_digit:      '👉 位值：找到指定的位數，讀出那一位上的數字。',
  place_value_truncate:   '👉 無條件捨去/四捨五入到指定位數：看下一位決定進位或捨去。',
  large_numbers_comparison:'👉 先比位數（位數多的大）。位數相同時從最高位開始逐位比較。',

  // ── Algebra / Equations ──
  solve_ax:               '👉 解 ax = b → x = b÷a。代回去驗算確認。',
  solve_x_plus_a:         '👉 解 x + a = b → x = b − a。代回去驗算。',
  solve_x_div_d:          '👉 解 x ÷ d = q → x = q × d。代回去驗算。',

  // ── Rate/Time/Distance ──
  rate_time_distance:     '👉 距離=速率×時間、時間=距離÷速率、速率=距離÷時間。',

  // ── Miscellaneous ──
  part_to_total:          '👉 部分÷全體 → 佔比。或 全體×佔比 → 部分。分清楚誰是全體。',
  general:                _genFromCM, // fallback using CM
  '20260302Test':         '👉 按照前面提示的觀念和列式，一步步仔細計算。算完後問自己：單位寫對了嗎？答案大小合理嗎？',
  national_bank_source:   '👉 仔細讀題，把已知條件列出，選對公式後一步步算。',
};

// ── Fallback: generate L4 from common_mistakes ──
function _genFromCM(q) {
  const cm = q.common_mistakes;
  if (cm && Array.isArray(cm) && cm.length > 0) {
    // Pick first meaningful CM
    const warn = cm.find(s => s.length > 5) || cm[0];
    return '👉 按照前面的步驟仔細算，常見錯誤：' + warn;
  }
  return '👉 一步步照前面提示算，算完回頭檢查每一步、單位和小數點是否正確。';
}

// ── Kind alias resolution (some kinds map to the same L4) ──
function getL4(q) {
  const kind = q.kind || 'general';
  const tmpl = L4_MAP[kind];
  if (typeof tmpl === 'function') return tmpl(q);
  if (typeof tmpl === 'string') return tmpl;
  // No exact match — try prefix matching
  for (const [k, v] of Object.entries(L4_MAP)) {
    if (kind.startsWith(k) || kind.includes(k.replace(/_/g, ''))) {
      return typeof v === 'function' ? v(q) : v;
    }
  }
  // Ultimate fallback
  return _genFromCM(q);
}

// ── Main ──
const docsDir = path.resolve(__dirname, '..', 'docs');
const distDir = path.resolve(__dirname, '..', 'dist_ai_math_web_pages', 'docs');
const dirs = fs.readdirSync(docsDir, { withFileTypes: true }).filter(d => d.isDirectory());
let totalFixed = 0;
const stats = [];

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
    if (!q.hints || !Array.isArray(q.hints)) continue;
    if (q.hints.length >= 4 && q.hints[3] && q.hints[3].length >= 10) continue; // already has good L4
    // Generate L4
    const l4 = getL4(q);
    // Pad hints array to length 4 if needed
    while (q.hints.length < 3) q.hints.push('');
    if (q.hints.length < 4) {
      q.hints.push(l4);
    } else {
      q.hints[3] = l4;
    }
    fixed++;
  }

  if (fixed === 0) { stats.push({ mod: dir.name, fixed: 0 }); continue; }

  // Serialize back
  const out = 'window.' + varName + ' = ' + JSON.stringify(items, null, 2) + ';\n';
  fs.writeFileSync(bp, out, 'utf8');
  // Sync to dist
  const distBp = path.join(distDir, dir.name, 'bank.js');
  if (fs.existsSync(path.dirname(distBp))) {
    fs.writeFileSync(distBp, out, 'utf8');
  }
  totalFixed += fixed;
  stats.push({ mod: dir.name, fixed });
}

console.log('\n=== L4 Hint Generation Complete ===');
console.log('Total questions given L4:', totalFixed);
console.table(stats.filter(s => s.fixed > 0));
console.log('\nModules unchanged:', stats.filter(s => s.fixed === 0).map(s => s.mod).join(', '));
