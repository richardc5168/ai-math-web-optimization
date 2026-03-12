#!/usr/bin/env node
/**
 * auto_iterate_quality.cjs
 * ────────────────────────
 * Comprehensive quality auto-iterator:
 *   Phase A: Replace ALL boilerplate L3 hints with kind-specific templates
 *   Phase B: Add common_mistakes arrays where missing
 *   Phase C: Answer-leak guard on all hints
 *
 * Usage:
 *   node tools/auto_iterate_quality.cjs             # dry-run (preview)
 *   node tools/auto_iterate_quality.cjs --apply     # write changes
 *
 * BUG FIX: Uses substring concatenation instead of String.replace()
 *          to avoid $-pattern corruption in replacement strings.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const apply = process.argv.includes('--apply');
const DOCS  = path.resolve(__dirname, '..', 'docs');
const DIST  = path.resolve(__dirname, '..', 'dist_ai_math_web_pages', 'docs');

/* ════════════════════════════════════════════════════════════════════
   PHASE A: L3 Kind-Specific Templates
   ════════════════════════════════════════════════════════════════════ */
const L3 = {
  // ─── 體積 ───
  volume_rect_prism: '👉 一步步算：長×寬×高。把三個數依序乘好，記得標上 cm³ 或 m³。驗算：可用估算（把每個數取整後再乘）看答案是否合理。',
  base_area_h:       '👉 底面積×高：直接把底面積和高這兩個數相乘。驗算：答案的單位是「立方」，不是「平方」喔。',
  composite:         '👉 先把複合形體拆成兩個（或更多）長方體，各自算體積後再加起來。注意：共用的邊只能算一次。',
  composite3:        '👉 拆成多個簡單形體（長方體/正方體），分別算好再加總。畫分割線幫助自己看清楚。',
  cube_cm3:          '👉 正方體體積 = 邊長×邊長×邊長（邊長的三次方）。邊長5就是 5×5×5。單位是 cm³。',
  cube_find_edge:    '👉 已知體積求邊長：邊長 = ∛體積。試試哪個整數的三次方等於題目數字。',
  rect_cm3:          '👉 長方體體積 = 長×寬×高。三個數字依序相乘，不管先乘誰都可以。',
  rect_find_height:  '👉 已知體積和底面積求高：高 = 體積 ÷ 底面積。用直式除法算。驗算：底面積×高 = 體積。',
  decimal_dims:      '👉 有小數的長方體：先去掉小數點當整數乘，再把小數位數加起來放回小數點。',
  mixed_units:       '👉 先把所有長度統一單位（都換成 cm 或都換成 m），再用長×寬×高。不統一會出錯！',
  cm3_to_m3:         '👉 1 m³ = 1000000 cm³（6 個零）。cm³→m³ 就除以 1000000，小數點左移 6 位。',
  m3_to_cm3:         '👉 1 m³ = 1000000 cm³。m³→cm³ 就乘以 1000000，小數點右移 6 位。',
  cm3_to_ml:         '👉 1 cm³ = 1 mL（體積和容量的橋梁）。直接把 cm³ 的數字當 mL。',
  liter_to_ml:       '👉 1 公升 = 1000 毫升。公升→毫升乘 1000，毫升→公升除 1000。',
  volume_fill:       '👉 先把公升換成毫升（×1000），再算滿水量 − 現有水量 = 還需要加多少。',

  // ─── 分數 ───
  fraction_mul:      '👉 分數乘法：先看能不能「交叉約分」（左分子和右分母、右分子和左分母），約完後分子×分子、分母×分母，最後確認是最簡分數。',
  fraction_addsub:   '👉 先通分（找最小公倍數當公分母）→ 分子相加或相減 → 看能不能約分化成最簡 → 如果答案 >1 可以用帶分數。',
  fraction_add_unlike:'👉 異分母加法：先通分（找兩個分母的最小公倍數）→ 分子各乘上相應倍數 → 分子相加 → 約分到最簡。',
  fraction_sub_mixed: '👉 帶分數減法：先把帶分數化成假分數 → 通分 → 分子相減 → 結果化回帶分數並約分。',
  fraction_times_fraction: '👉 分數×分數：分子乘分子、分母乘分母。先交叉約分可以讓數字更小更好算。',
  fraction_of_fraction:    '👉 「幾分之幾的幾分之幾」= 兩個分數相乘。分子×分子、分母×分母，答案記得約分。',
  fraction_of_quantity:    '👉 全部數量 × 分數 = 部分。整數×分子÷分母（或先÷分母再×分子看哪個好算）。',
  int_times_fraction:      '👉 整數×分數 = 整數×分子÷分母。如果整數能被分母整除，先除再乘更簡單。',
  fraction_remaining:      '👉 剩下 = 全部 × (1 − 用掉的分數)。先算括號裡面，再乘以全部。驗算：剩下 + 用掉 = 全部。',
  remaining_by_fraction:   '👉 先算用掉多少（全部×分數），再用全部 − 用掉 = 剩下。注意分數的基準量是「全部」。',
  remaining_after_fraction:'👉 注意基準量！第二次的分數是基於「剩下」而不是「全部」。算好第一次剩下後，再算第二次。',
  remain_then_fraction:    '👉 分兩步：①全部−用掉=剩下 ②剩下×分數=某部分。注意第二步的基準是「剩下」。',
  reverse_fraction:        '👉 反推原量：已知部分 ÷ 佔比分數 = 原量。把「÷分數」改成「×倒數」更好算。',
  generic_fraction_word:   '👉 分數應用題：先找出「全部量」和「佔幾分之幾」，再用乘法（求部分）或除法（求全部）。',
  add_like:          '👉 同分母加法：分母不動，分子直接相加。有帶分數就整數加整數、分數加分數。',
  sub_like:          '👉 同分母減法：分母不動，分子相減。如果分子不夠減，要從整數借 1 變成分數。',
  add_unlike:        '👉 異分母加法：先通分 → 分子相加 → 約分到最簡分數。',
  sub_unlike:        '👉 異分母減法：先通分 → 分子相減 → 約分到最簡。不夠減要先從整數借 1。',
  simplify:          '👉 約分：找到分子和分母的最大公因數(GCD)，然後分子分母同時除以 GCD。結果就是最簡分數。',
  equivalent:        '👉 等值分數：分子和分母同乘（或同除）一個數，分數的值不變。找到那個倍數就好。',
  mixed_convert:     '👉 帶分數↔假分數：帶→假 = 整數×分母+分子（放分子），分母不變。假→帶 = 分子÷分母 求商和餘數。',
  mul:               '👉 分數乘法：分子乘分子、分母乘分母。能約分就先約再乘，數字小比較不會算錯。',
  mul_int:           '👉 分數×整數：整數×分子放分子，分母不變。答案如果是假分數，記得化成帶分數。',
  reciprocal:        '👉 倒數 = 分子分母對調。整數 n 的倒數是 1/n。1 的倒數是 1，0 沒有倒數。',

  // ─── 小數 ───
  decimal_mul:       '👉 先忽略小數點、當整數相乘，算完後再「數小數位數」（兩數的小數位數加起來）把小數點放回去。',
  decimal_div:       '👉 直式除法：小數點「抬上去」到商的位置 → 按正常除法做。不夠除就在被除數右邊補 0 繼續。',
  decimal_times_decimal: '👉 兩個小數相乘：先忽略小數點算整數乘法 → 兩數的小數位數加起來 → 在乘積從右往左數這麼多位放小數點。',
  decimal_times_integer: '👉 小數×整數：先忽略小數點算整數乘法，再從積的右邊數回小數位數，放上小數點。',
  decimal_to_percent:    '👉 小數→百分率：小數 ×100，小數點右移兩位，加上 % 符號。例如 0.35 = 35%。',
  d_mul_int:           '👉 去掉小數點當整數乘法，再把小數點放回去（小數位數不變）。驗算：估算個位數×整數看是否接近。',
  int_mul_d:           '👉 整數×小數：去掉小數點算整數相乘，再把小數點放回（看小數有幾位就從右往左數幾位）。',
  d_mul_d:             '👉 兩個小數相乘：去掉小數點算整數乘法 → 小數位數加起來 → 從乘積右邊往左數這麼多位放小數點。',
  d_div_int:           '👉 直式除法：把被除數的小數點「抬上去」到商的位置 → 按正常除法做。不夠除就補 0 繼續。',
  int_div_int_to_decimal: '👉 整數÷整數除不盡 → 在被除數後面補小數點和 0，繼續做直式除法。商的小數點對齊被除數的。',
  x10_shift:           '👉 ×10 小數點右移一位、×100 右移兩位、×0.1 左移一位、×0.01 左移兩位。數好位數，不夠的補 0。',
  decimal_mul_combined:'👉 先算小數乘法（去掉小數點當整數乘後放回），再做其他運算。一步步慢慢來。',
  place_value_digit:   '👉 從小數點開始往右數位數：第一位是十分位、第二位是百分位、第三位是千分位。',
  place_value_truncate:'👉 無條件捨去：找到指定位數的下一位，直接去掉（不四捨五入）。',
  place_value_yi_wan:  '👉 先找到萬位或億位的數字，再看下一位決定四捨五入。',

  // ─── 單位換算 ───
  unit_convert:      '👉 找到對應的換算倍率（如 1 公斤=1000 公克），乘或除以倍率即可。注意小數點的方向。',
  are_to_m2:         '👉 1 公畝 = 100 平方公尺。公畝→平方公尺就 ×100。',
  ha_to_m2:          '👉 1 公頃 = 10000 平方公尺。公頃→平方公尺就 ×10000（4 個零）。',
  km2_to_ha:         '👉 1 平方公里 = 100 公頃。平方公里→公頃 ×100。',
  u9_unit_convert_decimal: '👉 找到換算倍率，用乘法或除法換算。小數點移動的位數 = 倍率的零的個數。',

  // ─── 時間 ───
  time_add:          '👉 ①分鐘+分鐘 → ②如果 ≥60，進位到小時（分鐘−60，小時+1）→ ③如果 ≥24 小時，減 24。答案用 HH:MM。',
  time_add_cross_day:'👉 加完後如果超過 24:00 就跨日。把小時−24，日期+1。分鐘的進位照常處理。',
  time_sub_cross_day:'👉 相減時如果分鐘不夠減，從小時借 1（=60 分鐘）。如果小時不夠減，要加 24（跨日）。',
  time_multiply:     '👉 時間×倍數：分鐘×倍數→進位到小時（÷60 取商和餘數），小時×倍數 + 進位的小時。',

  // ─── 百分率 ───
  percent_of:        '👉 百分率÷100 = 小數 → 再乘以全體的數量。驗算：如果百分率 ≤100%，答案應 ≤ 全體。',
  percent_find_part: '👉 部分 = 全體 × 百分率 ÷ 100。先乘再除。驗算：部分 ÷全體 ×100 = 百分率。',
  percent_find_percent:  '👉 百分率 = 部分 ÷ 全體 × 100。先做除法得小數，再 ×100 換成百分率。',
  percent_find_whole:    '👉 全體 = 部分 ÷ 百分率 × 100。已知部分和百分率，反推全體。',
  percent_discount:      '👉 折後價 = 原價 × 折數÷10（或 ×百分比÷100）。驗算：折後 < 原價。',
  percent_meaning:       '👉 百分率就是「每 100 份佔幾份」。直接讀 % 前面的數字。25% 就是 25/100 = 1/4。',
  percent_increase_decrease: '👉 增加：原量 × (1 + 增加百分比)。減少：原量 × (1 − 減少百分比)。',
  percent_interest:      '👉 利息 = 本金 × 利率(%) ÷ 100 × 期數。記得利率要除以 100 變成小數。',
  percent_tax_service:   '👉 含稅價 = 原價 ×(1 + 稅率%)。小費 = 原價 × 百分比 ÷ 100。',
  percent_to_decimal:    '👉 百分率→小數：去掉 % 然後 ÷100（小數點左移兩位）。25% = 0.25。',
  percent_to_ppm:        '👉 百分率(%)→千分率(‰)：×10。千分率→百分率：÷10。',
  find_percent:          '👉 百分率 = 部分÷全體×100%。先列出部分和全體分別是什麼，再做除法。',

  // ─── 比率 ───
  ratio_part_total:      '👉 部分 ÷ 全體 = 比率(小數)。直式除法做出小數。驗算：比率 × 全體 = 部分。',
  ratio_remaining:       '👉 剩下 = 全體 − 用掉的。比率 = 剩下 ÷ 全體。驗算：已用比率 + 剩下比率 = 1。',
  ratio_missing_to_1:    '👉 所有比率加起來=1。缺少的 = 1 − 已知比率加總。驗算：全部比率相加=1。',
  ratio_unit_rate:       '👉 單位量 = 總量 ÷ 總份數。比較時算出每一份多少，再比較大小。',
  ratio_add_decimal:     '👉 比率加法：兩個小數比率直接相加。注意小數點要對齊。',
  ratio_sub_decimal:     '👉 比率減法：大比率 − 小比率。小數點對齊，不夠減就借位。',
  fraction_to_percent:   '👉 分數→百分率：分子÷分母 得小數 → ×100 加 %。或通分成分母 100。',

  // ─── 生活應用 ───
  buy_many:            '👉 單價 × 數量 = 總價。小數相乘注意小數點位數。估算驗一下。',
  unit_price:          '👉 總價 ÷ 數量 = 單價。用直式除法，商的小數點對齊。',
  discount:            '👉 折後價 = 原價 × 折扣百分比。「40% off」= 打 6 折 = 付 60%。驗算：折後 < 原價。',
  make_change:         '👉 找零 = 付的錢 − 花的錢。對齊小數點做減法。',
  shopping_two_step:   '👉 先算各項小計（單價×數量），再加起來，最後扣掉折價券或找零。一步步來。',
  table_stats:         '👉 全部數字加起來就是總數。兩個兩個配對加，最後加在一起。',
  area_tiling:         '👉 先統一單位 → 長需要幾塊（房間長÷磚長）、寬需要幾塊（房間寬÷磚寬）→ 兩個相乘。',
  proportional_split:  '👉 先算總份數 → 每份 = 總數÷總份數 → 某人分到 = 該人份數×每份量。',
  temperature_change:  '👉 上升就加、下降就減。溫度可以是負數，注意正負號。',
  perimeter_fence:     '👉 正方形周長=邊長×4。長方形周長=(長+寬)×2。代入數字就好。',

  // ─── 生活應用帝國包 u1–u10 ───
  u1_avg_fraction:         '👉 總量 ÷ 人數 → 分數除以整數 = 分數 × (1/整數) = 分母乘上整數、分子不動。最後約分。',
  u2_frac_addsub_life:     '👉 先通分 → 分子加減 → 約分到最簡。分母相同時直接分子加減。',
  u3_frac_times_int:       '👉 分子×整數、分母不動 → 約分 → 看是否化成帶分數或最簡分數。',
  u4_money_decimal_addsub: '👉 對齊小數點（位數不同就補 0），從右邊開始加/減，進位/借位跟整數一樣。最後放上小數點。',
  u5_decimal_muldiv_price: '👉 乘法(單價×數量)：去掉小數點算整數乘法再放回。除法(平均)：直式除法，小數點對齊。',
  u6_frac_dec_convert:     '👉 小數→分數：數小數位數(1位→分母10)，再約分。分數→小數：分子÷分母。',
  u7_discount_percent:     '👉 折後價 = 原價×折數÷10。打 8 折 = 付 80% = 原價×0.8，不是減 8 喔。',
  u8_ratio_recipe:         '👉 先算總份數 → 每份=總量÷總份數 → 某項=該項份數×每份量。',
  u10_rate_time_distance:  '👉 距離=速率×時間、時間=距離÷速率、速率=距離÷時間。套上對應公式。',

  // ─── 其他 ───
  general:           '👉 按照前面提示的觀念和列式，一步步仔細計算後，問自己：單位寫對了嗎？答案大小合理嗎？',
  gcd_word:          '👉 找最大公因數(GCD)：列出兩數的因數，找最大的共同因數。或用短除法。',
  lcm_word:          '👉 找最小公倍數(LCM)：列出倍數直到找到相同的，或用短除法。',
  prime_or_composite:'👉 質數只有 1 和自己兩個因數。合數有3個以上因數。用小質數(2,3,5,7)試除。',
  solve_ax:          '👉 移項：把 x 留一邊，數字移另一邊（加→減、乘→除）。算出 x 的值。',
  solve_x_plus_a:    '👉 x + a = b → x = b − a。移項後算出 x。驗算：把 x 代回去看等式成立。',
  solve_x_div_d:     '👉 x ÷ d = q → x = q × d。反向操作求出 x。',
  symmetry_axes:     '👉 對稱軸是把圖形分成完全重合的兩半的線。正 n 邊形有 n 條對稱軸。',
  cheng_increase:    '👉 盈虧問題：用(差額)÷(每人多分或少分的量)=人數。再從人數推總量。',
  displacement:      '👉 排水法：物體沉入水中，水面上升的體積 = 物體的體積。',
  clock_angle:       '👉 時鐘每小時大格=30°。分針走一格=6°。時針每分鐘走 0.5°。兩針角度相減取絕對值。',
  sector_central_angle: '👉 圓心角的大小 = 該扇形佔整個圓的比例 × 360°。',
  average_division:  '👉 平均 = 總和 ÷ 個數。先把所有數字加起來，再除以有幾個。',

  // ─── 面積 ───
  area_parallelogram: '👉 平行四邊形面積 = 底×高。高要垂直於底邊，不是斜邊。',
  area_trapezoid:    '👉 梯形面積 = (上底+下底)×高÷2。注意上底和下底要弄對。',
  area_triangle:     '👉 三角形面積 = 底×高÷2。高要垂直於底邊。',
  area_congruent_tile:'👉 先量出一塊磁磚面積，再看需要幾塊可以鋪滿。',

  // ─── 表面積 ───
  surface_area_cube:   '👉 正方體表面積 = 6×邊長×邊長。6 個面都一樣大。',
  surface_area_rect_prism: '👉 長方體表面積 = 2×(長×寬 + 長×高 + 寬×高)。三對面各算完加起來。',
  surface_area_contact_removed: '👉 兩個長方體緊貼時，接觸面要從總表面積中扣掉（扣兩次，上下各一面）。',

  // ─── 垂直/對稱 ───
  perp_bisector_property:  '👉 中垂線上的點到線段兩端點距離相等。利用這個性質來求未知長度。',
  perp_bisector_converse:  '👉 如果一點到線段兩端等距，那這點在中垂線上。反過來用。',

  // ─── 折線圖 ───
  line_trend:        '👉 看趨勢：比開始和結束的數值，變大→上升、變小→下降。',
  line_max_month:    '👉 把所有月份數字比一比，最大的就是答案。',
  line_omit_rule:    '👉 折線圖省略符號(〰)表示中間刻度被省略了，讀數時要注意起始刻度。',

  // ─── 國中段考/國家題庫 ───
  area_difference:     '👉 先分別算出兩個圖形的面積，再用大−小求出差。注意單位要統一。',
  division_application:'👉 先釐清被除數和除數分別是什麼，再用直式除法。有餘數時要看題目怎麼問。',
  decimal_multiplication:'👉 先忽略小數點算整數乘法，再把所有因數的小數位數加起來放回小數點。',
  volume_calculation:  '👉 長方體體積=長×寬×高。正方體體積=邊長³。分清楚三個維度再代入公式。',
  large_numbers_comparison: '👉 先比位數（位數多的大）。位數相同時從最高位開始逐位比較。',
  national_bank_source:'👉 仔細讀題，把已知條件列出，選對公式後一步步算。',

  // ─── 商業包 ───
  compare:           '👉 先畫兩條同長線段，分別標出兩個分數，大−小就是差多少。記得對應單位。',
  original:          '👉 已知部分求原量：列式 已知 = 原量×分數 → 原量 = 已知÷分數 = 已知×倒數。',
  part_to_total:     '👉 部分佔全部的幾分之幾？列出部分÷全部，化成最簡分數。',
  remain:            '👉 剩下 = 全部 × (1−用掉的分數)。一步步算好括號再乘。',
  remain_multi:      '👉 多次剩餘：每一步都乘以「1−用掉的分數」。注意每一步的基準量。',
};
const L3_FALLBACK = '👉 按照前面提示的觀念和列式，一步步仔細計算。算完後問自己：單位寫對了嗎？答案大小合理嗎？用估算再確認一次。';

/* ════════════════════════════════════════════════════════════════════
   PHASE B: Kind-Specific Common Mistakes Templates
   ════════════════════════════════════════════════════════════════════ */
const CM = {
  // ─── 體積 ───
  volume_rect_prism: ['忘記單位是「立方公分(cm³)」而非「平方公分(cm²)」。', '三個維度少乘了一個，只算了底面積。'],
  base_area_h:       ['把底面積和高搞混（底面積的單位是 cm²，高的單位是 cm）。', '答案寫成平方而非立方。'],
  composite:         ['拆解形體時重複計算了共用部分。', '漏掉其中一個子形體的體積沒加到。'],
  composite3:        ['拆解方式錯誤，切割線位置不對。', '各部分體積加總時算錯。'],
  cube_cm3:          ['邊長×邊長只算了面積，忘了再×邊長。', '把立方和平方搞混。'],
  cube_find_edge:    ['把體積直接開根號（√）而不是開立方根（∛）。', '試的數字不對，沒找到正確的邊長。'],
  rect_cm3:          ['少乘一個維度（只算長×寬，忘了×高）。', '把面積公式當成體積公式。'],
  rect_find_height:  ['用高÷體積（除反了）。', '忘記先算底面積，直接用長÷體積。'],
  decimal_dims:      ['小數點位數數錯（應將各因數小數位加起來）。', '小數乘法後忘了放小數點。'],
  mixed_units:       ['混用 cm 和 m，沒有先統一單位就開始算。', '換算倍率搞錯（如 1m=100cm 但面積是 10000cm²）。'],
  cm3_to_m3:         ['把 cm³→m³ 的倍率記成 100 或 1000（正確是 1000000）。', '小數點移動方向搞反。'],
  m3_to_cm3:         ['把 1m³ 誤記成 1000cm³（正確是 1000000 cm³）。', '小數點右移位數不對。'],
  cm3_to_ml:         ['以為 cm³ 和 mL 的轉換需要乘以什麼（其實 1cm³=1mL）。', '跟公升搞混（1L=1000mL）。'],

  // ─── 分數 ───
  fraction_mul:      ['乘法時分子分母各自加而不是各自乘。', '約分漏掉，答案不是最簡分數。'],
  fraction_addsub:   ['不同分母直接加減分子（忘了先通分）。', '通分時只變了分母沒變分子。'],
  fraction_add_unlike:['直接分子相加（忘記通分）。', '通分後分子的倍率算錯。'],
  fraction_sub_mixed: ['整數部分減了但分數部分計算錯誤。', '帶分數化假分數時分子算錯（應是整數×分母+分子）。'],
  fraction_times_fraction: ['分子乘分子、分母乘分母但忘了約分。', '把乘法和加法搞混，分母通分後才乘。'],
  fraction_of_fraction: ['把「的」翻成加法而不是乘法。', '基準量搞錯，第二個分數的分母弄錯了。'],
  fraction_of_quantity: ['整數÷分子而不是÷分母（除反了）。', '忘記約分，答案不是最簡。'],
  int_times_fraction:   ['整數÷分母再×分子的順序搞混。', '把分數的倒數拿來乘。'],
  fraction_remaining:   ['用掉的和剩下的搞反（用 1−剩下 而不是 1−用掉）。', '基準量搞錯，把「剩下」當全部算第二次。'],
  remaining_by_fraction:['兩次分數的基準量都用「全部」（第二次應該用「剩下」）。', '減法做反了（剩下−用掉）。'],
  remain_then_fraction: ['第二步的基準量用全部而不是用剩下。', '先乘後減的順序搞反了。'],
  reverse_fraction:     ['除以分數忘了要變成乘以倒數。', '倒數算錯（分子分母對調要注意帶分數先變假分數）。'],
  add_like:          ['同分母加法對但帶分數的整數部分忘了加。', '分子加完超過分母但沒有進位。'],
  sub_like:          ['分子不夠減時忘了從整數借 1。', '借位後帶分數的分子算錯。'],
  add_unlike:        ['通分的公倍數找錯了。', '分子沒有跟著乘上對應的倍數。'],
  sub_unlike:        ['通分後分子相減算錯。', '忘了約分，答案不是最簡分數。'],
  simplify:          ['約分時找的不是最大公因數，只約了一次還可以繼續約。', '分子分母除以不同的數。'],
  equivalent:        ['分子乘了倍數但分母忘了乘（或反過來）。', '把等值分數和約分搞混。'],
  mixed_convert:     ['帶分數→假分數時，分子算成 整數+分子（正確是 整數×分母+分子）。', '假分數→帶分數的餘數算錯。'],
  mul:               ['分數乘法用了加法的規則（通分再加）。', '沒有先約分導致數字太大算錯。'],
  mul_int:           ['整數×分數時把分母也乘了（只有分子×整數）。', '假分數忘了化成帶分數。'],
  reciprocal:        ['帶分數直接分子分母對調（應該先化成假分數再對調）。', '以為 0 有倒數。'],

  // ─── 小數 ───
  decimal_mul:       ['小數位數數錯，小數點放錯位置。', '兩數相乘後忘了放小數點。'],
  decimal_div:       ['商的小數點位置對錯了。', '不夠除時忘了在商上補 0。'],
  decimal_times_decimal: ['小數位數沒有兩數加起來。', '乘完忘了數小數位數。'],
  decimal_times_integer: ['把整數也算有小數位（整數的小數位是 0）。', '乘完忘了放小數點。'],
  d_mul_int:         ['忘了放回小數點。', '小數位數數多了或數少了。'],
  int_mul_d:         ['把整數的「0位小數」也加進去數。', '小數乘法和加法搞混，先對齊再加。'],
  d_mul_d:           ['小數位數只數了一個數的。', '乘積後面的 0 被省掉導致位數數錯。'],
  d_div_int:         ['商的小數點沒對齊被除數的小數點。', '不夠除時忘了在商寫 0。'],
  int_div_int_to_decimal: ['忘了在被除數後面補 0 繼續除。', '商的小數點位置放錯。'],
  x10_shift:         ['×10 和 ÷10 的方向搞反（乘往右、除往左）。', '移位後補 0 的個數弄錯。'],

  // ─── 單位換算 ───
  unit_convert:      ['換算倍率記錯。', '乘除方向弄反（大→小要乘、小→大要除）。'],
  are_to_m2:         ['把 1 公畝記成 10 或 1000 平方公尺（正確是 100）。', '平方公尺和公尺搞混。'],
  ha_to_m2:          ['把 1 公頃記成 1000 平方公尺（正確是 10000）。', '公頃和公畝的倍率弄混。'],
  km2_to_ha:         ['把 1 km² 記成 10 公頃（正確是 100）。', '跟 km→m 的 1000 搞混。'],

  // ─── 時間 ───
  time_add:          ['分鐘超過 60 但沒有進位到小時。', '進位後分鐘忘了減 60。'],
  time_add_cross_day:['小時超過 24 但忘了減 24。', '日期沒有加 1。'],
  time_sub_cross_day:['分鐘不夠減時忘了從小時借 60。', '跨日相減不知道要加 24 小時。'],
  time_multiply:     ['分鐘×倍數後忘了除以 60 進位到小時。', '進位後的分鐘還是用原來的值。'],

  // ─── 百分率 ───
  percent_of:        ['百分率忘了÷100 就直接乘。', '答案比全體還大但百分率沒超過 100%（不合理）。'],
  percent_find_part: ['百分率÷100 這步漏掉了。', '部分的值算出來比全體還大。'],
  percent_find_percent: ['部分和全體弄反了。', '忘了×100，答案寫成小數而非百分率。'],
  percent_find_whole:   ['部分乘以百分率（應該是除以）。', '忘記÷100 或 ×100 的步驟。'],
  percent_discount:  ['折扣率和實付率搞反（打 7 折 = 付 70%）。', '「打折」以為是減去折數（打 7 折不是減 7）。'],
  percent_meaning:   ['把百分率當分母 100 的分數忘了約分。', '百分率>100% 時以為不可能（其實可以）。'],
  percent_increase_decrease: ['增加和減少的公式搞混。', '算完忘了乘以原量。'],
  percent_interest:  ['利率沒有÷100。', '忘了乘以存放期數。'],
  percent_tax_service: ['稅率加在原價上而不是乘以原價。', '含稅價搞成原價+稅率數字（如加 5 而非加 5%）。'],
  percent_to_decimal: ['小數點移錯方向。', '÷100 和 ×100 搞反了。'],
  decimal_to_percent: ['×100 方向搞反成 ÷100。', '小數點移了一位而不是兩位。'],
  fraction_to_percent: ['分數→百分率：分子分母搞混了。', '÷完忘了 ×100。'],
  find_percent:       ['部分和全體弄反（分數上下反了）。', '忘了乘 100 轉成百分率。'],

  // ─── 比率 ───
  ratio_part_total:   ['部分和全體反了。', '答案應是小數卻寫成百分率。'],
  ratio_remaining:    ['忘了先算剩下 = 全體 − 部分。', '比率分子分母弄反。'],
  ratio_missing_to_1: ['忘了所有比率加起來=1。', '減法算錯了。'],
  ratio_unit_rate:    ['不知道要先求每一份。', '單位量和總量搞混。'],
  ratio_add_decimal:  ['小數點沒對齊就加。', '加完忘了檢查是否合理（≤1）。'],
  ratio_sub_decimal:  ['大小減反了。', '借位做錯。'],

  // ─── 生活應用題 ───
  buy_many:           ['單價和數量搞混。', '小數相乘小數點位數算錯。'],
  unit_price:         ['用數量÷總價（除反了）。', '直式除法小數點沒對齊。'],
  discount:           ['折扣率和實付率搞反了。', '打折後忘了再計算零錢。'],
  make_change:        ['減法做反（付的−花的才是找零）。', '借位算錯。'],
  shopping_two_step:  ['漏掉其中一項的小計。', '加總後忘了扣折價券。'],
  table_stats:        ['加法粗心漏掉一個數字。', '加到其他欄位的數字了。'],
  area_tiling:        ['沒有先統一單位就開始算。', '只算了一個方向的磁磚數量。'],
  proportional_split: ['忘了先算總份數。', '每份量算錯導致全部錯。'],
  temperature_change: ['正負號搞錯（下降應該是減）。', '溫度為負數時加減方向弄反。'],
  perimeter_fence:    ['用面積公式而不是周長公式。', '長方形只加了一次長+寬（忘了×2）。'],

  // ─── u1–u10 ───
  u1_avg_fraction:    ['把÷n 誤寫成×n（人越多反而變大）。', '忘記約分或分母算錯。'],
  u2_frac_addsub_life:['不同分母直接加減分子。', '通分的公倍數找錯了。'],
  u3_frac_times_int:  ['整數也乘到分母了（只乘分子就好）。', '忘記約分，答案不是最簡。'],
  u4_money_decimal_addsub: ['小數點沒對齊就開始加減。', '借位做錯。'],
  u5_decimal_muldiv_price: ['小數乘法小數位數數錯。', '除法小數點沒抬上去。'],
  u6_frac_dec_convert:     ['小數位數對應的分母弄錯。', '約分沒有約到最簡。'],
  u7_discount_percent:     ['打折以為是減去折數。', '打 8 折誤算成 ×8 而非 ×0.8。'],
  u8_ratio_recipe:         ['忘了先求總份數。', '每份量算錯。'],
  u9_unit_convert_decimal: ['換算倍率記錯。', '乘除方向搞反。'],
  u10_rate_time_distance:  ['速率公式三個量搞混。', '時間和距離的單位沒統一。'],

  // ─── 國中段考/國家題庫特殊 ───
  area_difference:       ['兩個面積的單位沒統一就直接相減。', '減法做反了（大−小才對）。'],
  division_application:  ['被除數和除數搞反了。', '餘數比除數大（應該再除一次）。'],
  decimal_multiplication:['小數位數數錯，小數點放錯位置。', '忘了數小數位數。'],
  volume_calculation:    ['長方體體積少乘一個維度。', '單位寫錯（應是立方不是平方）。'],
  large_numbers_comparison: ['位數不同沒先比位數。', '同位數時從最高位開始比但比錯了。'],
  national_bank_source:  ['題意理解錯誤，條件看漏。', '計算粗心或單位搞錯。'],

  // ─── 折線圖/位值補充 ───
  line_omit_rule:        ['省略符號「〰」的刻度起始點看錯了。', '被省略的範圍誤以為和其他格距一樣。'],
  place_value_digit:     ['十分位和百分位的位置搞混了。', '小數點後第一位是十分位不是個位。'],
  place_value_truncate:  ['無條件捨去和四捨五入搞混了。', '捨去後忘了該位後面的全部歸零。'],
  place_value_yi_wan:    ['億位和萬位的零的個數弄錯。', '要四捨五入的那一位看錯了。'],
  percent_to_ppm:        ['百分率(%)和千分率(‰)的換算倍率搞錯。', '×10 和 ÷10 的方向搞反了。'],

  // ─── 其他 ───
  general:            ['計算粗心。', '單位或標記寫錯。'],
  gcd_word:           ['找成最小公因數（應該是最大）。', '用列舉法漏掉一個因數。'],
  lcm_word:           ['找成最大公倍數（應該是最小）。', '短除法忘了乘底下剩的數。'],
  prime_or_composite: ['把 1 當成質數（1 不是質數也不是合數）。', '忘了檢查 2 和 3 以外的質數。'],
  solve_ax:           ['移項時加減乘除的方向搞反。', '只移了一半，沒有兩邊同時操作。'],
  solve_x_plus_a:     ['把加號變成加（應該做反向操作：減）。', '兩邊操作不一致。'],
  solve_x_div_d:      ['把除法反向操作搞成除而非乘。', '移項後忘了化簡。'],
  clock_angle:        ['每小時的角度記成 60°（正確是 30°）。', '忘了分針每分鐘也走 0.5°。'],
  area_parallelogram: ['用底×斜邊而不是底×高。', '底和高沒有對應（要用同一組）。'],
  area_trapezoid:     ['忘了÷2。', '上底和下底弄反或加錯。'],
  area_triangle:      ['忘了÷2。', '底和高不對應。'],
  surface_area_cube:  ['寫成邊長³（那是體積）而不是 6×邊長²。', '只算了一面忘了×6。'],
  surface_area_rect_prism: ['只算了三面忘了×2。', '三對面中有一對算漏了。'],
  surface_area_contact_removed: ['接觸面只扣了一次（應扣兩次，上下各一面）。', '接觸面的面積算錯。'],
  symmetry_axes:      ['忘了正方形有 4 條對稱軸。', '把旋轉軸和對稱軸搞混。'],
  cheng_increase:     ['盈虧問題的差額算錯。', '多分少分的量搞反了。'],
  displacement:       ['把容器的體積當成物體的體積。', '忘了排水量 = 物體體積。'],
  sector_central_angle: ['忘了整圓是 360°。', '比例算錯了。'],
  average_division:    ['只加了部分數字。', '除以的個數數錯了。'],

  // ─── 分數文字題（補充） ───
  remaining_after_fraction: ['基準量搞錯，第二次的「全部」應該用「剩下的」。', '兩步驟的分數誰先誰後搞反了。'],
  generic_fraction_word:    ['讀題時把「的」翻成加法而不是乘法。', '基準量（分母的「全部」）搞錯了。'],

  // ─── 折線圖/統計（補充） ───
  line_max_month:     ['看錯最高點對應的月份。', '兩個月份的值接近時沒仔細比較。'],
  line_trend:         ['把上升和下降趨勢搞反了。', '只看頭尾沒注意中間的走勢變化。'],

  // ─── 面積/幾何（補充） ───
  area_congruent_tile: ['忘記全等圖形面積相同。', '拼排時多算或少算了一塊。'],

  // ─── 體積/容量（補充） ───
  volume_fill:        ['容積和體積搞混（容積是內部空間）。', '長寬高少了壁厚但只減了一邊（應減兩邊）。'],
  liter_to_ml:        ['1L=1000mL 但誤記為 100mL。', '升和毫升的乘除方向搞反了。'],

  // ─── 垂直平分線 ───
  perp_bisector_property:  ['垂直平分線上的點到兩端等距這個性質搞反了。', '「垂直」和「平分」只記了一個條件。'],
  perp_bisector_converse:  ['不知道到兩端等距的點一定在垂直平分線上。', '搞混了「逆敘述」的條件和結論。'],

  // ─── 測試/雜項 ───
  '20260302Test':     ['計算粗心，數字看錯或抄錯。', '題意理解不完整，漏看條件。'],
};

/* ════════════════════════════════════════════════════════════════════
   Module definitions
   ════════════════════════════════════════════════════════════════════ */
const MODULES = [
  // JS banks with window.VAR
  ['exam-sprint',                         'EXAM_SPRINT_BANK',            'bank.js'],
  ['interactive-g5-empire',               'INTERACTIVE_G5_EMPIRE_BANK',  'bank.js'],
  ['life-applications-g5',                'LIFE_APPLICATIONS_G5_BANK',   'bank.js'],
  ['interactive-g5-life-pack2plus-empire', 'G5_LIFE_PACK2PLUS_BANK',     'bank.js'],
  ['interactive-decimal-g5',              'INTERACTIVE_DECIMAL_G5_BANK', 'bank.js'],
  ['interactive-g5-life-pack1plus-empire', 'G5_LIFE_PACK1PLUS_BANK',     'bank.js'],
  ['interactive-g5-life-pack1-empire',    'G5_LIFE_PACK1_BANK',          'bank.js'],
  ['interactive-g5-life-pack2-empire',    'G5_LIFE_PACK2_BANK',          'bank.js'],
  ['ratio-percent-g5',                    'RATIO_PERCENT_G5_BANK',       'bank.js'],
  ['volume-g5',                           'VOLUME_G5_BANK',              'bank.js'],
  ['fraction-g5',                         'FRACTION_G5_BANK',            'bank.js'],
  ['decimal-unit4',                       'DECIMAL_UNIT4_BANK',          'bank.js'],
  ['offline-math',                        'OFFLINE_MATH_BANK',           'bank.js'],
  ['g5-grand-slam',                       'G5_GRAND_SLAM_BANK',          'bank.js'],
  ['fraction-word-g5',                    'FRACTION_WORD_G5_BANK',       'bank.js'],
  ['interactive-g5-midterm1',             'FRACTION_WORD_G5_BANK',       'bank.js'],
  ['interactive-g5-national-bank',        'FRACTION_WORD_G5_BANK',       'bank.js'],
];
const JSON_MODULES = [
  ['interactive-g56-core-foundation',     'g56_core_foundation.json'],
];

/* ════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════ */
function isBoilerplate(s) {
  if (!s) return true;
  const t = s.trim();
  return t.length < 30
    || t.includes('請依前面步驟完成計算')
    || t.includes('自行檢查單位並寫出答案')
    || t.includes('自行檢查單位並寫出')
    || t.includes('依上面列式計算')
    || t.includes('最後請自行寫出答案')
    || t.includes('請自行完成計算')
    || t.includes('依照前面提示完成');
}

function containsAnswer(text, answer) {
  if (!text || answer == null) return false;
  const a = String(answer).trim();
  if (!a || a.length <= 1) return false;
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
  // Use function replacement to avoid $ pattern issues
  return hint.replace(new RegExp('=\\s*' + escaped + '(?![\\d/])', 'g'), () => '= ？？');
}

/* ── Safe file write using substring concatenation (no $ corruption) ── */
function writeBank(bankPath, src, matchObj, gvar, bank) {
  const bankStr = JSON.stringify(bank, null, 2);
  const before = src.substring(0, matchObj.index);
  const after = src.substring(matchObj.index + matchObj[0].length);
  const newSrc = before + 'window.' + gvar + ' = ' + bankStr + ';' + after;
  fs.writeFileSync(bankPath, newSrc, 'utf8');
  return newSrc;
}

/* ════════════════════════════════════════════════════════════════════
   Process a single module
   ════════════════════════════════════════════════════════════════════ */
function processModule(dir, gvar, filename) {
  const bankPath = path.join(DOCS, dir, filename);
  const distPath = path.join(DIST, dir, filename);
  if (!fs.existsSync(bankPath)) { return null; }

  const src = fs.readFileSync(bankPath, 'utf8');
  const re = new RegExp('window\\.' + gvar + '\\s*=\\s*(\\[[\\s\\S]*?\\]);');
  const m = src.match(re);
  if (!m) { console.log(`  ⚠ ${dir}: cannot parse ${gvar}`); return null; }

  const bank = eval(m[1]);
  let l3Fixed = 0, cmAdded = 0, leaksFixed = 0;

  bank.forEach(q => {
    const kind = q.kind || q.type || 'unknown';
    const hints = q.hints || [];

    // ── Phase B: Add common_mistakes if missing (works for all banks) ──
    if (!q.common_mistakes || !q.common_mistakes.length) {
      const cmTmpl = CM[kind];
      if (cmTmpl) {
        q.common_mistakes = [...cmTmpl];
        cmAdded++;
      }
    }

    if (!hints.length) return;

    // ── Phase A: Fix boilerplate L3/L4 ──
    const lastIdx = hints.length - 1;
    if (isBoilerplate(hints[lastIdx])) {
      const tmpl = L3[kind] || L3_FALLBACK;
      hints[lastIdx] = tmpl;
      l3Fixed++;
    }
    // Also fix second-to-last for 4-level hints
    if (hints.length >= 4 && isBoilerplate(hints[lastIdx - 1])) {
      const tmpl = L3[kind] || L3_FALLBACK;
      hints[lastIdx - 1] = tmpl;
      l3Fixed++;
    }

    // ── Phase C: Answer-leak guard ──
    hints.forEach((h, i) => {
      if (containsAnswer(h, q.answer)) {
        hints[i] = sanitizeLeak(h, q.answer);
        leaksFixed++;
      }
    });
  });

  if (apply && (l3Fixed || cmAdded || leaksFixed)) {
    writeBank(bankPath, src, m, gvar, bank);
    // Also write to dist if exists
    if (fs.existsSync(path.dirname(distPath))) {
      const distSrc = fs.readFileSync(distPath, 'utf8');
      const distM = distSrc.match(re);
      if (distM) {
        writeBank(distPath, distSrc, distM, gvar, bank);
      }
    }
  }

  return { dir, total: bank.length, l3Fixed, cmAdded, leaksFixed };
}

function processJsonModule(dir, filename) {
  const jsonPath = path.join(DOCS, dir, filename);
  const distPath = path.join(DIST, dir, filename);
  if (!fs.existsSync(jsonPath)) { return null; }

  const src = fs.readFileSync(jsonPath, 'utf8');
  const bank = JSON.parse(src);
  let l3Fixed = 0, cmAdded = 0, leaksFixed = 0;

  bank.forEach(q => {
    const kind = q.kind || q.type || 'unknown';
    const hints = q.hints || [];

    if (!q.common_mistakes || !q.common_mistakes.length) {
      const cmTmpl = CM[kind];
      if (cmTmpl) {
        q.common_mistakes = [...cmTmpl];
        cmAdded++;
      }
    }

    if (!hints.length) return;

    const lastIdx = hints.length - 1;
    if (isBoilerplate(hints[lastIdx])) {
      hints[lastIdx] = L3[kind] || L3_FALLBACK;
      l3Fixed++;
    }

    hints.forEach((h, i) => {
      if (containsAnswer(h, q.answer)) {
        hints[i] = sanitizeLeak(h, q.answer);
        leaksFixed++;
      }
    });
  });

  if (apply && (l3Fixed || cmAdded || leaksFixed)) {
    const newSrc = JSON.stringify(bank, null, 2);
    fs.writeFileSync(jsonPath, newSrc, 'utf8');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, newSrc, 'utf8');
    }
  }

  return { dir, total: bank.length, l3Fixed, cmAdded, leaksFixed };
}

/* ════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════ */
console.log('═══════════════════════════════════════════════');
console.log('  AUTO-ITERATE QUALITY OPTIMIZER');
console.log('  Mode:', apply ? '✅ APPLY (writing files)' : '🔍 DRY-RUN (preview)');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('Module'.padEnd(48), 'Qs'.padStart(6), 'L3fix'.padStart(7), 'CM+'.padStart(6), 'Leaks'.padStart(6));
console.log('─'.repeat(75));

let totals = { qs: 0, l3: 0, cm: 0, leaks: 0 };

MODULES.forEach(([dir, gvar, fn]) => {
  const r = processModule(dir, gvar, fn);
  if (!r) return;
  console.log(r.dir.padEnd(48), String(r.total).padStart(6), String(r.l3Fixed).padStart(7), String(r.cmAdded).padStart(6), String(r.leaksFixed).padStart(6));
  totals.qs += r.total; totals.l3 += r.l3Fixed; totals.cm += r.cmAdded; totals.leaks += r.leaksFixed;
});

JSON_MODULES.forEach(([dir, fn]) => {
  const r = processJsonModule(dir, fn);
  if (!r) return;
  console.log(r.dir.padEnd(48), String(r.total).padStart(6), String(r.l3Fixed).padStart(7), String(r.cmAdded).padStart(6), String(r.leaksFixed).padStart(6));
  totals.qs += r.total; totals.l3 += r.l3Fixed; totals.cm += r.cmAdded; totals.leaks += r.leaksFixed;
});

console.log('─'.repeat(75));
console.log('TOTAL'.padEnd(48), String(totals.qs).padStart(6), String(totals.l3).padStart(7), String(totals.cm).padStart(6), String(totals.leaks).padStart(6));
console.log('');

if (!apply) {
  console.log('👆 Dry-run only. To apply: node tools/auto_iterate_quality.cjs --apply');
} else {
  console.log('✅ All changes written to docs/ and dist_ai_math_web_pages/docs/');
  console.log('   Run validation: python tools/validate_all_elementary_banks.py');
}
