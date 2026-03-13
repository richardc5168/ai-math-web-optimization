#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');

var DOCS = path.join(__dirname, '..', 'docs', 'life-applications-g5', 'bank.js');
var DIST = path.join(__dirname, '..', 'dist_ai_math_web_pages', 'docs', 'life-applications-g5', 'bank.js');

function dp(s) { return (String(s).split('.')[1] || '').length; }
function ips(v, p) {
  if (p === 0) return String(v);
  var s = String(Math.abs(v)).padStart(p + 1, '0');
  var ip = s.slice(0, s.length - p);
  var d2 = s.slice(s.length - p).replace(/0+$/, '');
  return (v < 0 ? '-' : '') + (d2 ? ip + '.' + d2 : ip);
}
function mulS(a, b) {
  var ap = dp(String(a)), bp = dp(String(b));
  var ai = Math.round(Number(a) * Math.pow(10, ap));
  var bi = Math.round(Number(b) * Math.pow(10, bp));
  return ips(ai * bi, ap + bp);
}
function pad3(n) { return String(n).padStart(3, '0'); }
function pad2(n) { return String(n).padStart(2, '0'); }
function addMins(s, m) {
  var p = s.split(':'); var h = parseInt(p[0]), mm = parseInt(p[1]);
  mm += m; while (mm >= 60) { h++; mm -= 60; } while (h >= 24) h -= 24;
  return pad2(h) + ':' + pad2(mm);
}

var src = fs.readFileSync(DOCS, 'utf8');
var w = {};
new Function('window', src)(w);
var bank = w.LIFE_APPLICATIONS_G5_BANK;
console.log('Before:', bank.length);
if (bank.length !== 300) { console.error('Expected 300'); process.exit(1); }

var topics = {};
bank.forEach(function(q) { if (!topics[q.kind]) topics[q.kind] = q.topic; });
var g = 301;

function mkQ(id, kind, diff, question, answer, mode, hints, steps, meta, expl, cm) {
  return { id: id, kind: kind, topic: topics[kind] || '小五生活應用', difficulty: diff,
    question: question, answer: answer, answer_mode: mode, hints: hints, steps: steps,
    meta: meta, explanation: expl, common_mistakes: cm };
}

// ===== buy_many +7 (301-307) =====
var bmItems = ['蘋果','牛奶','餅乾','蛋糕','果汁','麵包','巧克力'];
var bmUnits = ['顆','瓶','包','個','杯','條','盒'];
[[4.5,8],[12.5,6],[8.75,4],[15.5,3],[6.25,9],[3.8,7],[22.5,4]].forEach(function(d, i) {
  var price = d[0], qty = d[1], ans = mulS(d[0], d[1]);
  bank.push(mkQ('la5_buy_' + pad3(g), 'buy_many', 'easy',
    '（買多份）' + bmItems[i] + ' 每' + bmUnits[i] + ' ' + price + ' 元，買 ' + qty + ' ' + bmUnits[i] + '，一共多少元？（可寫小數）',
    ans, 'money2',
    ['⭐ 觀念提醒\n總價 = 單價 × 數量。',
     '📊 ' + price + ' × ' + qty + ' = ?',
     '📐 一步步算：\n① 列式：' + price + ' × ' + qty + '\n② 去掉小數點做整數乘法\n③ 放回小數點\n④ 估算檢查\n算完記得回頭檢查喔！✅',
     '👉 小數 × 整數：先去小數點，做完乘法再放回。'],
    [price + ' × ' + qty, '做整數乘法', '放回小數點', '= ' + ans + ' 元'],
    { unit: '元' }, price + ' × ' + qty + ' = ' + ans + ' 元。',
    ['忘了放回小數點。', '乘法計算粗心。']
  ));
  g++;
});

// ===== unit_price +7 (308-314) =====
var upItems = ['蘋果','飲料','餅乾','巧克力','蛋糕','橘子','麵包'];
var upUnits = ['個','瓶','包','盒','份','個','條'];
[['36',8],['42.5',5],['31',4],['57',6],['43.5',3],['49.5',9],['24.5',7]].forEach(function(d, i) {
  var total = d[0], qty = d[1];
  // Find smallest decimal places where division is exact
  var tp = dp(total), ti, ans;
  for (var pp = tp; pp < tp + 4; pp++) {
    ti = Math.round(Number(total) * Math.pow(10, pp));
    if (ti % qty === 0) { ans = ips(ti / qty, pp); break; }
  }
  if (!ans) { console.error('NOT EXACT:', total, qty); process.exit(1); }
  bank.push(mkQ('la5_unit_' + pad3(g), 'unit_price', 'easy',
    '（單價）買 ' + qty + ' ' + upUnits[i] + upItems[i] + ' 一共 ' + total + ' 元，平均每' + upUnits[i] + '多少元？',
    ans, 'money2',
    ['⭐ 觀念提醒\n單價 = 總價 ÷ 數量。',
     '📊 ' + total + ' ÷ ' + qty + ' = ?',
     '📐 一步步算：\n① 列式：' + total + ' ÷ ' + qty + '\n② 做除法\n③ 注意小數點\n④ 驗算\n算完記得回頭檢查喔！✅',
     '👉 總價 ÷ 數量 = 每個的單價。'],
    [total + ' ÷ ' + qty, '做除法', '= ' + ans, '驗算 ✓'],
    { unit: '元/每' + upUnits[i] }, total + ' ÷ ' + qty + ' = ' + ans + ' 元。',
    ['除法算錯。', '小數點位置放錯。']
  ));
  g++;
});

// ===== discount +7 (315-321) =====
var dcItems = ['外套','鞋子','書包','帽子','手錶','T恤','背包'];
[[120,25],[80,50],[150,20],[200,35],[160,10],[90,30],[240,60]].forEach(function(d, i) {
  var orig = d[0], pOff = d[1];
  var payPct = 100 - pOff;
  var ans = String(orig * payPct / 100);
  bank.push(mkQ('la5_disc_' + pad3(g), 'discount', 'medium',
    '（打折）一個' + dcItems[i] + '原價 ' + orig + ' 元，打 ' + pOff + '% 折扣，折扣後要付多少元？（可寫小數）',
    ans, 'money2',
    ['⭐ 觀念提醒\n打折後價格 = 原價 × (100% - 折扣%)。',
     '📊 ' + orig + ' × ' + payPct + '% = ?',
     '📐 一步步算：\n① 折扣 ' + pOff + '%，要付 ' + payPct + '%\n② 列式：' + orig + ' × ' + payPct + '/100\n③ 算出答案\n④ 答案應比原價小\n算完記得回頭檢查喔！✅',
     '👉 打折 = 原價 × (1 - 折扣率)。'],
    ['折扣 ' + pOff + '%，付 ' + payPct + '%', orig + ' × ' + payPct + '/100', '= ' + ans, '比原價小 ✓'],
    { unit: '元' }, orig + ' × ' + payPct + '% = ' + ans + ' 元。',
    ['折扣率和付款率搞混。', '百分比計算錯誤。']
  ));
  g++;
});

// ===== make_change +7 (322-328) =====
var mcItems = ['文具','書','飲料','零食','水果','點心','日用品'];
[[47,100],[83.5,100],[126,200],[58.75,100],[215,500],[39.5,50],[142,200]].forEach(function(d, i) {
  var spent = d[0], paid = d[1];
  var sp = dp(String(spent));
  var si = Math.round(spent * Math.pow(10, sp));
  var pi = Math.round(paid * Math.pow(10, sp));
  var ans = ips(pi - si, sp);
  bank.push(mkQ('la5_chg_' + pad3(g), 'make_change', 'easy',
    '（找零/湊整）買' + mcItems[i] + '花了 ' + spent + ' 元，用 ' + paid + ' 元付款，找回多少元？（可寫小數）',
    ans, 'money2',
    ['⭐ 觀念提醒\n找零 = 付款金額 - 消費金額。',
     '📊 ' + paid + ' - ' + spent + ' = ?',
     '📐 一步步算：\n① 列式：' + paid + ' - ' + spent + '\n② 小數點對齊\n③ 逐位相減\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 付款 - 花費 = 找零金額。'],
    [paid + ' - ' + spent, '做減法', '= ' + ans, '找零 ' + ans + ' 元'],
    { unit: '元' }, paid + ' - ' + spent + ' = ' + ans + ' 元。',
    ['減法借位算錯。', '小數點沒對齊。']
  ));
  g++;
});

// ===== shopping_two_step +7 (329-335) =====
var s2Items = [['牛奶','蛋糕'],['果汁','餅乾'],['咖啡','麵包'],['巧克力','果凍'],['茶','糖果'],['飲料','筆記本'],['文具','尺']];
// [price1, qty1, price2, qty2, coupon]
[[3.5,2,12,3,5],[8,3,5.5,4,10],[6.5,2,4,5,3],[15,2,2.5,6,8],[4.5,4,8,3,7],[9,3,5,4,6],[7.5,2,3,3,4]].forEach(function(d, i) {
  var p1 = d[0], q1 = d[1], p2 = d[2], q2 = d[3], cpn = d[4];
  var sub1 = mulS(p1, q1), sub2 = mulS(p2, q2);
  var totalBefore = Number(sub1) + Number(sub2);
  var ans = String(totalBefore - cpn);
  bank.push(mkQ('la5_shop_' + pad3(g), 'shopping_two_step', 'medium',
    '（兩段式購物）' + s2Items[i][0] + ' 每個 ' + p1 + ' 元，買 ' + q1 + ' 個；' + s2Items[i][1] + ' 每個 ' + p2 + ' 元，買 ' + q2 + ' 個。結帳時用了 ' + cpn + ' 元折價券，實付多少元？（可寫小數）',
    ans, 'money2',
    ['⭐ 觀念提醒\n先算兩項總價，再扣折價券。',
     '📊 ' + p1 + '×' + q1 + ' + ' + p2 + '×' + q2 + ' - ' + cpn + ' = ?',
     '📐 一步步算：\n① 第一項：' + p1 + '×' + q1 + '\n② 第二項：' + p2 + '×' + q2 + '\n③ 加起來再扣折價券 ' + cpn + ' 元\n④ 算出實付\n算完記得回頭檢查喔！✅',
     '👉 先分別算各項小計，加總後減折價券。'],
    [p1 + '×' + q1 + '=' + sub1, p2 + '×' + q2 + '=' + sub2, '小計 ' + totalBefore, '扣券 → ' + ans + ' 元'],
    { unit: '元' }, sub1 + ' + ' + sub2 + ' - ' + cpn + ' = ' + ans + ' 元。',
    ['折價券忘了扣。', '乘法算錯。']
  ));
  g++;
});

// ===== table_stats +7 (336-342) =====
[
  [['蘋果',12],['香蕉',8],['橘子',15],['芒果',10],'合計','個',45],
  [['紅色',5],['藍色',9],['綠色',7],['黃色',11],'最多最少差','個',6],
  [['甲班',25],['乙班',30],['丙班',22],['丁班',28],'合計','人',105],
  [['語文',85],['數學',92],['英語',78],['自然',88],'最高最低差','分',14],
  [['蘋果',20],['水梨',15],['葡萄',18],['芭樂',12],'合計','個',65],
  [['第一天',35],['第二天',42],['第三天',28],'合計','題',105],
  [['鉛筆',8],['橡皮擦',12],['尺',6],['膠帶',9],'合計','個',35]
].forEach(function(d, i) {
  var items = d.slice(0, d.length - 3);
  var mode = d[d.length - 3], unit = d[d.length - 2], ans = d[d.length - 1];
  var tableText = items.map(function(it) { return it[0] + '：' + it[1] + ' ' + unit; }).join('\n');
  var qText, expText;
  if (mode === '合計') {
    qText = '（表格統計）數量如下：\n' + tableText + '\n一共多少' + unit + '？（只寫數字）';
    expText = items.map(function(it) { return it[1]; }).join(' + ') + ' = ' + ans + '。';
  } else {
    var vals = items.map(function(it) { return it[1]; });
    qText = '（表格統計）數量如下：\n' + tableText + '\n最多和最少差多少' + unit + '？（只寫數字）';
    expText = Math.max.apply(null, vals) + ' - ' + Math.min.apply(null, vals) + ' = ' + ans + '。';
  }
  bank.push(mkQ('la5_stat_' + pad3(g), 'table_stats', 'easy', qText, String(ans), 'number',
    ['⭐ 觀念提醒\n' + (mode === '合計' ? '把所有數量加起來。' : '最大值 - 最小值 = 差。'),
     '📊 ' + (mode === '合計' ? '全部加起來' : '找出最大和最小') + '。',
     '📐 一步步算：\n① 讀出每項數量\n② ' + (mode === '合計' ? '全部相加' : '找最大最小，相減') + '\n③ 自己算出答案\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 仔細看表格數據再計算。'],
    ['讀取數據', (mode === '合計' ? '相加' : '最大-最小'), '= ' + ans, '檢查 ✓'],
    { unit: unit }, expText,
    ['數字看錯。', '加法/減法算錯。']
  ));
  g++;
});

// ===== area_tiling +7 (343-349) =====
// [roomL_m, roomW_m, tile_cm]
[[8,6,40],[5,4,50],[10,6,25],[6,3,20],[8,5,25],[4,4,40],[12,5,50]].forEach(function(d, i) {
  var l = d[0], ww = d[1], t = d[2];
  var tilesL = l * 100 / t, tilesW = ww * 100 / t;
  var ans = tilesL * tilesW;
  bank.push(mkQ('la5_tile_' + pad3(g), 'area_tiling', 'medium',
    '（面積鋪地磚）房間長 ' + l + ' 公尺、寬 ' + ww + ' 公尺，要鋪 ' + t + ' 公分×' + t + ' 公分的正方形地磚，至少需要幾塊？（只寫數字）',
    String(ans), 'number',
    ['⭐ 觀念提醒\n先把公尺化為公分，再算長寬各需幾塊。',
     '📊 長 ' + l + ' 公尺 = ' + (l * 100) + ' 公分，寬 ' + ww + ' 公尺 = ' + (ww * 100) + ' 公分。',
     '📐 一步步算：\n① 換算成公分\n② 長需 ' + (l * 100) + '÷' + t + ' = ' + tilesL + ' 塊\n③ 寬需 ' + (ww * 100) + '÷' + t + ' = ' + tilesW + ' 塊\n④ 自己算出總塊數\n算完記得回頭檢查喔！✅',
     '👉 總塊數 = 長方向塊數 × 寬方向塊數。'],
    ['換算公分', '長需 ' + tilesL + ' 塊', '寬需 ' + tilesW + ' 塊', '共 ' + ans + ' 塊'],
    { unit: '塊' }, tilesL + ' × ' + tilesW + ' = ' + ans + ' 塊。',
    ['公尺沒換公分。', '乘法算錯。']
  ));
  g++;
});

// ===== proportional_split +7 (350-356) =====
// [total, ratios[], ask_index, names[]]
[
  [60,[1,2,3],1,['甲','乙','丙']],
  [84,[2,3,2],1,['甲','乙','丙']],
  [45,[3,2,4],2,['甲','乙','丙']],
  [72,[1,3,5],1,['甲','乙','丙']],
  [90,[2,3,4],2,['甲','乙','丙']],
  [55,[3,2,6],0,['甲','乙','丙']],
  [48,[3,1,4],0,['甲','乙','丙']]
].forEach(function(d, i) {
  var total = d[0], ratios = d[1], ask = d[2], names = d[3];
  var sum = ratios.reduce(function(a, b) { return a + b; }, 0);
  var each = total / sum;
  var ans = each * ratios[ask];
  var ratioStr = names.map(function(n, j) { return n; }).join(':') + ' = ' + ratios.join(':');
  bank.push(mkQ('la5_prop_' + pad3(g), 'proportional_split', 'medium',
    '（比例分配）把 ' + total + ' 顆糖按 ' + ratioStr + ' 分配，' + names[ask] + ' 分到幾顆？（只寫數字）',
    String(ans), 'number',
    ['⭐ 觀念提醒\n比例分配：先算總份數，再算每份多少。',
     '📊 總份數 = ' + ratios.join('+') + ' = ' + sum + '，每份 = ' + total + '÷' + sum + ' = ' + each + '。',
     '📐 一步步算：\n① 總份 = ' + sum + '\n② 每份 = ' + total + ' ÷ ' + sum + '\n③ ' + names[ask] + ' 佔 ' + ratios[ask] + ' 份\n④ 自己算出答案\n算完記得回頭檢查喔！✅',
     '👉 先算每份多少，再乘上該角色的份數。'],
    ['總份 = ' + sum, '每份 = ' + each, names[ask] + ' = ' + ratios[ask] + ' 份', '= ' + ans + ' 顆'],
    { unit: '顆' }, names[ask] + ' = ' + ratios[ask] + ' × ' + each + ' = ' + ans + ' 顆。',
    ['總份數算錯。', '乘錯份數。']
  ));
  g++;
});

// ===== volume_fill +7 (357-363) =====
[[8,5500],[5,3200],[12,8750],[6,1400],[15,9800],[3,750],[20,13600]].forEach(function(d, i) {
  var cap = d[0], cur = d[1];
  var ans = cap * 1000 - cur;
  bank.push(mkQ('la5_vol_' + pad3(g), 'volume_fill', 'easy',
    '（容積/容量）一個水箱最多裝 ' + cap + ' 公升水，現在裡面有 ' + cur + ' 毫升水，還要再加多少毫升才會裝滿？（只寫數字）',
    String(ans), 'number',
    ['⭐ 觀念提醒\n1 公升 = 1000 毫升。先把容量換算成毫升。',
     '📊 ' + cap + ' 公升 = ' + (cap * 1000) + ' 毫升。',
     '📐 一步步算：\n① 換算：' + cap + ' 公升 = ' + (cap * 1000) + ' 毫升\n② 再減 ' + cur + ' 毫升\n③ 算出差額\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 滿容量 - 現有 = 還需要加的量。'],
    [cap + ' 公升 = ' + (cap * 1000) + ' 毫升', (cap * 1000) + ' - ' + cur, '= ' + ans + ' 毫升', '檢查 ✓'],
    { unit: '毫升' }, (cap * 1000) + ' - ' + cur + ' = ' + ans + ' 毫升。',
    ['公升換毫升忘了 ×1000。', '減法算錯。']
  ));
  g++;
});

// ===== temperature_change +7 (364-370) =====
var tcLoc = ['教室','操場','冰箱','山頂','房間','水池','花園'];
[[25,-8],[32,4],[-5,12],[8,-15],[20,5],[18,-10],[30,-7]].forEach(function(d, i) {
  var start = d[0], change = d[1];
  var ans = start + change;
  var dir = change > 0 ? '上升' : '下降';
  var absC = Math.abs(change);
  bank.push(mkQ('la5_temp_' + pad3(g), 'temperature_change', 'easy',
    '（溫度變化）' + tcLoc[i] + '一開始是 ' + start + '°C，過了一會兒' + dir + '了 ' + absC + '°C，現在是多少°C？（只寫數字）',
    String(ans), 'number',
    ['⭐ 觀念提醒\n上升就加，下降就減。',
     '📊 ' + start + ' ' + (change > 0 ? '+' : '-') + ' ' + absC + ' = ?',
     '📐 一步步算：\n① 原溫 ' + start + '°C\n② ' + dir + ' ' + absC + '°C\n③ 自己算出現在溫度\n④ 注意正負號\n算完記得回頭檢查喔！✅',
     '👉 溫度' + dir + '就是' + (change > 0 ? '加' : '減') + '。注意負數。'],
    [start + '°C', dir + ' ' + absC + '°C', '= ' + ans + '°C', '檢查 ✓'],
    { unit: '°C' }, start + (change > 0 ? ' + ' : ' - ') + absC + ' = ' + ans + '°C。',
    ['正負號搞錯。', '加減法算錯。']
  ));
  g++;
});

// ===== time_add +7 (371-377) =====
var taAct = ['寫作業','看書','跑步','畫畫','練琴','打掃','做實驗'];
[['07:30',45],['14:15',70],['09:50',35],['16:40',85],['11:25',50],['20:30',55],['08:45',95]].forEach(function(d, i) {
  var start = d[0], mins = d[1];
  var end = addMins(start, mins);
  bank.push(mkQ('la5_time_' + pad3(g), 'time_add', 'easy',
    '（時間）小明在 ' + start + ' 開始' + taAct[i] + '，' + taAct[i] + '了 ' + mins + ' 分鐘，幾點完成？（用 HH:MM）',
    end, 'hhmm',
    ['⭐ 觀念提醒\n時間加法：分鐘超過 60 要進位。',
     '📊 ' + start + ' + ' + mins + ' 分 = ?',
     '📐 一步步算：\n① 先加分鐘\n② 超過 60 就進位\n③ 寫出最終時間\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 分鐘滿 60 進位成 1 小時。'],
    [start + ' + ' + mins + ' 分', '進位', '= ' + end, '檢查 ✓'],
    { unit: '時間' }, start + ' + ' + mins + ' 分 = ' + end + '。',
    ['分鐘進位算錯。', '超過 120 分時只進了 1 小時。']
  ));
  g++;
});

// ===== unit_convert +7 (378-384) =====
// [value, fromUnit, toUnit, multiplier]
[['3.5','公升','毫升',1000],['1.2','公尺','公分',100],['0.8','公斤','公克',1000],
 ['4.25','公升','毫升',1000],['2.6','公尺','公分',100],['0.45','公斤','公克',1000],
 ['6.8','公升','毫升',1000]].forEach(function(d, i) {
  var val = d[0], from = d[1], to = d[2], mul = d[3];
  var vp = dp(val);
  var vi = Math.round(Number(val) * Math.pow(10, vp));
  var ansI = vi * mul;
  var ans = ips(ansI, vp);
  bank.push(mkQ('la5_conv_' + pad3(g), 'unit_convert', 'easy',
    '（單位換算）' + val + ' ' + from + ' = 多少' + to + '？（只寫數字）',
    ans, 'number',
    ['⭐ 觀念提醒\n1 ' + from + ' = ' + mul + ' ' + to + '。',
     '📊 ' + val + ' × ' + mul + ' = ?',
     '📐 一步步算：\n① ' + val + ' ' + from + ' = ' + val + ' × ' + mul + ' ' + to + '\n② 做乘法\n③ 自己算出答案\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 大單位 → 小單位要 ×' + mul + '。'],
    [val + ' × ' + mul, '做乘法', '= ' + ans + ' ' + to, '檢查 ✓'],
    { unit: to }, val + ' ' + from + ' = ' + ans + ' ' + to + '。',
    ['換算倍率記錯。', '乘法算錯。']
  ));
  g++;
});

// ===== fraction_remaining +7 (385-391) =====
// [total_m, fracN, fracD] → remaining = total × (1 - fracN/fracD)
[[60,1,4],[80,3,8],[45,2,5],[90,1,3],[72,5,6],[100,3,10],[56,3,7]].forEach(function(d, i) {
  var total = d[0], fN = d[1], fD = d[2];
  var remaining = total * (fD - fN) / fD;
  if (!Number.isInteger(remaining)) { console.error('NOT INT:', total, fN, fD); process.exit(1); }
  bank.push(mkQ('la5_frac_' + pad3(g), 'fraction_remaining', 'medium',
    '（分數應用）一條長 ' + total + ' 公尺的繩子，用掉了 ' + fN + '/' + fD + '，還剩多少公尺？',
    String(remaining), 'number',
    ['⭐ 觀念提醒\n用掉 a/b，剩下 (1 - a/b) = (b-a)/b。',
     '📊 剩下 ' + (fD - fN) + '/' + fD + '，再乘以總長。',
     '📐 一步步算：\n① 用掉 ' + fN + '/' + fD + '，剩 ' + (fD - fN) + '/' + fD + '\n② ' + total + ' × ' + (fD - fN) + '/' + fD + '\n③ 自己算出答案\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 剩餘 = 總量 × (1 - 已用分數)。'],
    ['剩 ' + (fD - fN) + '/' + fD, total + ' × ' + (fD - fN) + '/' + fD, '= ' + remaining + ' 公尺', '檢查 ✓'],
    { unit: '公尺' }, total + ' × ' + (fD - fN) + '/' + fD + ' = ' + remaining + ' 公尺。',
    ['分數運算錯。', '忘了用「剩下的比例」而不是「用掉的比例」。']
  ));
  g++;
});

// ===== perimeter_fence +9 (392-400) =====
// mix of squares and rectangles
[
  ['sq',15,0],['rect',12,8],['sq',25,0],['rect',18,6],['sq',9,0],
  ['rect',15,10],['sq',22,0],['rect',20,7],['sq',13,0]
].forEach(function(d, i) {
  var type = d[0], a = d[1], b = d[2];
  var ans, qText;
  if (type === 'sq') {
    ans = 4 * a;
    qText = '（圍籬/周長）一個正方形花圃邊長 ' + a + ' 公尺，要用圍籬把四周圍起來，需要多少公尺圍籬？（只寫數字）';
  } else {
    ans = 2 * (a + b);
    qText = '（圍籬/周長）一個長方形花圃長 ' + a + ' 公尺、寬 ' + b + ' 公尺，要用圍籬把四周圍起來，需要多少公尺圍籬？（只寫數字）';
  }
  bank.push(mkQ('la5_peri_' + pad3(g), 'perimeter_fence', 'easy', qText, String(ans), 'number',
    ['⭐ 觀念提醒\n' + (type === 'sq' ? '正方形周長 = 邊長 × 4。' : '長方形周長 = (長+寬) × 2。'),
     '📊 ' + (type === 'sq' ? a + ' × 4' : '(' + a + '+' + b + ') × 2') + ' = ?',
     '📐 一步步算：\n① ' + (type === 'sq' ? '邊長 ' + a : '長 ' + a + '、寬 ' + b) + '\n② ' + (type === 'sq' ? a + ' × 4' : '(' + a + '+' + b + ') × 2') + '\n③ 自己算出答案\n④ 檢查\n算完記得回頭檢查喔！✅',
     '👉 周長就是繞一圈的總長度。'],
    [type === 'sq' ? '邊長 × 4' : '(長+寬) × 2', type === 'sq' ? a + ' × 4' : '(' + a + '+' + b + ') × 2', '= ' + ans + ' 公尺', '檢查 ✓'],
    { unit: '公尺' }, (type === 'sq' ? a + ' × 4' : '(' + a + '+' + b + ') × 2') + ' = ' + ans + ' 公尺。',
    ['周長公式記錯。', '乘法算錯。']
  ));
  g++;
});

// ---- Verify ----
console.log('After:', bank.length);
if (bank.length !== 400) { console.error('EXPECTED 400, got', bank.length); process.exit(1); }
var ids = {};
for (var qi = 0; qi < bank.length; qi++) {
  if (ids[bank[qi].id]) { console.error('DUPLICATE ID:', bank[qi].id); process.exit(1); }
  ids[bank[qi].id] = true;
}
for (var ni = 300; ni < 400; ni++) {
  var q = bank[ni];
  if (!q.answer || q.answer === 'undefined') { console.error('BAD ANSWER:', q.id); process.exit(1); }
  if (q.hints[2].indexOf(q.answer) !== -1 && q.answer.length > 1) {
    console.error('L3 HINT LEAK:', q.id, 'answer=' + q.answer); process.exit(1);
  }
}
console.log('All 100 new questions verified.');

var out = '/* eslint-disable */\nwindow.LIFE_APPLICATIONS_G5_BANK = ' + JSON.stringify(bank, null, 2) + ';\n';
fs.writeFileSync(DOCS, out, 'utf8');
fs.writeFileSync(DIST, out, 'utf8');
console.log('Done. 300 → 400. Written to docs/ and dist/.');
