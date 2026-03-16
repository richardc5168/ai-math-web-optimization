(function(){
  'use strict';

  var DAY_MS = 86400000;

  function toNumber(value, fallback){
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  /**
   * computeWoW - Compare current-week report stats vs prev-week telemetry.
   * @param {object} opts
   * @param {number} opts.currentTotal - This week's total attempts
   * @param {number} opts.currentCorrect - This week's correct attempts
   * @param {Array}  opts.prevAttempts - Raw attempt events from 8-14 days ago
   * @returns {{ rows: Array<{label,cur,prev,suffix}>, hasPrev: boolean }}
   */
  function computeWoW(opts){
    var curTotal = toNumber(opts && opts.currentTotal, 0);
    var curCorrect = toNumber(opts && opts.currentCorrect, 0);
    var curAcc = curTotal > 0 ? Math.round(curCorrect / curTotal * 100) : 0;

    var prev = Array.isArray(opts && opts.prevAttempts) ? opts.prevAttempts : [];
    var prevTotal = prev.length;
    var prevCorrect = prev.filter(function(a){ return a && a.is_correct; }).length;
    var prevAcc = prevTotal > 0 ? Math.round(prevCorrect / prevTotal * 100) : 0;

    return {
      rows: [
        { label: '作答題數', cur: curTotal, prev: prevTotal, suffix: '題' },
        { label: '正確率', cur: curAcc, prev: prevAcc, suffix: '%' },
        { label: '答對題數', cur: curCorrect, prev: prevCorrect, suffix: '題' }
      ],
      hasPrev: prevTotal > 0
    };
  }

  /**
   * formatDelta - Format the delta between cur and prev into a colored arrow.
   * @returns {string} HTML snippet
   */
  function formatDelta(cur, prev, suffix){
    if (!prev) return '<span style="color:#8b949e">— 上週無資料</span>';
    var diff = cur - prev;
    var arrow = diff > 0 ? '\u2191' : diff < 0 ? '\u2193' : '\u2192';
    var color = diff > 0 ? '#3fb950' : diff < 0 ? '#f85149' : '#8b949e';
    return '<span style="color:' + color + ';font-weight:700">' + arrow + ' ' + (diff > 0 ? '+' : '') + diff + suffix + '</span>';
  }

  /**
   * getPrevWeekAttempts - Extract prev-week attempts from telemetry.
   * @param {string} userId
   * @param {number} [nowMs] - current timestamp (default: Date.now())
   * @returns {Array} attempts from 8-14 days ago
   */
  function getPrevWeekAttempts(userId, nowMs){
    if (!userId || !window.AIMathAttemptTelemetry) return [];
    var now = toNumber(nowMs, Date.now());
    var allRecent = window.AIMathAttemptTelemetry.listAttempts(userId, { sinceMs: now - 14 * DAY_MS });
    var cutoff7 = now - 7 * DAY_MS;
    return allRecent.filter(function(a){ return a && toNumber(a.ts_end, 0) < cutoff7; });
  }

  window.AIMathWoWEngine = {
    computeWoW: computeWoW,
    formatDelta: formatDelta,
    getPrevWeekAttempts: getPrevWeekAttempts
  };
})();
