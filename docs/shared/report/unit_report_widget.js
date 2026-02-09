(function(){
  'use strict';

  function pct(x){
    const v = Number(x);
    if (!Number.isFinite(v)) return '0%';
    return Math.round(v * 100) + '%';
  }

  function sec(ms){
    const v = Number(ms);
    if (!Number.isFinite(v)) return '0s';
    return Math.round(v / 1000) + 's';
  }

  function fmtTime(ts){
    const d = new Date(ts || 0);
    if (!Number.isFinite(d.getTime())) return '—';
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }

  function pickTopHint(hist){
    const h = hist || {};
    const order = ['none','L1','L2','L3','solution'];
    let best = 'none';
    let bestN = -1;
    for (const k of order){
      const v = Number(h[k] || 0);
      if (v > bestN){ bestN = v; best = k; }
    }
    if (best === 'none') return '無提示';
    if (best === 'solution') return '解答';
    return best;
  }

  function listAttempts(uid, unitId, days){
    const ms = (days && days < 99999) ? (Date.now() - days * 24 * 60 * 60 * 1000) : null;
    const opts = ms != null ? { sinceMs: ms } : {};
    const all = window.AIMathAttemptTelemetry?.listAttempts?.(uid, opts) || [];
    return all.filter(x => String(x?.unit_id || '') === String(unitId || ''));
  }

  function render(el, unitId, options){
    if (!el) return;
    const days = Number(options?.days || 7);
    const uid = window.AIMathCoachLog?.getOrCreateUserId?.() || 'guest';
    const attempts = listAttempts(uid, unitId, days);
    const agg = window.AIMathReportAggregate?.aggregate?.(attempts) || { overall:{n:0,correct:0,avg_time_ms:0,hint_level_hist:{}}, by_kind: [] };
    const overall = agg.overall || { n:0, correct:0, avg_time_ms:0, hint_level_hist:{} };
    const acc = overall.n ? Math.round(100 * (overall.correct || 0) / overall.n) : 0;
    const hintTop = pickTopHint(overall.hint_level_hist || {});

    const recent = Array.isArray(attempts) ? attempts.slice(-5).reverse() : [];
    const recentHtml = recent.length
      ? recent.map(evt => {
          const ok = evt?.is_correct ? '✅' : '❌';
          const ms = Math.max(0, Number(evt?.ts_end || 0) - Number(evt?.ts_start || 0));
          const hintLv = (evt?.hint?.shown_levels && evt.hint.shown_levels.length)
            ? `L${Math.max(...evt.hint.shown_levels)}`
            : '—';
          return `<div class="small" style="display:flex;justify-content:space-between;gap:8px"><span>${fmtTime(evt?.ts_end)}</span><span>${ok}</span><span>${sec(ms)}</span><span>${hintLv}</span></div>`;
        }).join('')
      : '<div class="small">（尚無作答紀錄）</div>';

    el.innerHTML = `
      <div class="small" style="font-weight:700">作答報告（最近 ${days} 天）</div>
      <div style="margin-top:6px; display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:6px">
        <div class="pill">題數：${overall.n || 0}</div>
        <div class="pill">正確率：${acc}%</div>
        <div class="pill">平均耗時：${sec(overall.avg_time_ms || 0)}</div>
        <div class="pill">提示偏好：${hintTop}</div>
      </div>
      <div class="small" style="margin-top:8px">最近 5 題</div>
      <div style="margin-top:4px">${recentHtml}</div>
      <div class="small" style="margin-top:6px"><a href="../report/index.html?unit=${encodeURIComponent(unitId || '')}&days=${days}">查看完整週報</a></div>
    `;
  }

  window.AIMathUnitReportWidget = { render };
})();
