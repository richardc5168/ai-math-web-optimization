(function(){
  'use strict';

  const ENABLE_KEY = 'aimath.uxEnhancer.enabled';
  const LAST_MODULE_KEY = 'aimath.lastModule';
  const PROGRESS_KEY = 'aimath.moduleProgress';

  function isEnabledByDefault(){
    const qs = new URLSearchParams(window.location.search || '');
    const q = (qs.get('ux_enhancer') || '').toLowerCase();
    if (q === 'off' || q === '0' || q === 'false') return false;
    return true;
  }

  function isEnabled(){
    const v = localStorage.getItem(ENABLE_KEY);
    if (v === null) return isEnabledByDefault();
    return v !== '0' && v !== 'false' && v !== 'off';
  }

  function setEnabled(v){
    localStorage.setItem(ENABLE_KEY, v ? '1' : '0');
  }

  function $(id){ return document.getElementById(id); }
  function create(tag, cls, text){
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function injectStyle(){
    if (document.getElementById('uxEnhancerStyle')) return;
    const st = document.createElement('style');
    st.id = 'uxEnhancerStyle';
    st.textContent = [
      '.ux-inline-note{font-size:12px;opacity:.9;margin-top:6px}',
      '.ux-inline-note.ok{color:#b7f5c9}',
      '.ux-inline-note.warn{color:#ffe3b0}',
      '.ux-inline-note.bad{color:#ffd2cf}',
      '.ux-hint-shortcuts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
      '.ux-hint-shortcuts .btn{padding:6px 10px;font-size:12px}',
      '.ux-resume{margin-top:10px;border:1px solid rgba(88,166,255,.35);background:rgba(88,166,255,.08);border-radius:12px;padding:8px 10px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.ux-resume a{color:inherit;text-decoration:underline}',
      '.ux-wrong-gate{margin-top:10px;border:1px solid rgba(248,81,73,.45);border-radius:12px;padding:10px;background:rgba(248,81,73,.08)}',
      '.ux-wrong-gate .title{font-weight:800;margin-bottom:6px;color:#ffd2cf}',
      '.ux-mobile-toggle{display:none;margin-top:8px}',
      '@media (max-width: 768px){ .ux-mobile-toggle{display:inline-block} .ux-secondary-collapsed{display:none !important;} }'
    ].join('');
    document.head.appendChild(st);
  }

  function inferAnswerPattern(questionText){
    const t = String(questionText || '').toLowerCase();
    if (/\b\d{1,2}:\d{2}\b|時間|分鐘|小時/.test(t)) return '時間格式：例如 09:35 或 2小時30分';
    if (/%|百分|折/.test(t)) return '百分率：例如 35% 或 0.35';
    if (/分數|\//.test(t)) return '分數：例如 3/4、2 1/3 或整數 12';
    return '數字格式：整數或小數（例：12、3.5）';
  }

  function classifyWrongFeedback(bannerText, qText){
    const b = String(bannerText || '');
    const q = String(qText || '');
    if (/單位|cm³|m³|公分|公尺|元|分鐘|小時/.test(b) || /單位|cm³|m³|公分|公尺|元|分鐘|小時/.test(q)) {
      return { tag: '單位錯', action: '先圈出「答案單位」，再檢查算式前後單位是否一致。' };
    }
    if (/通分|約分|進位|借位|小數點|計算|除法|乘法/.test(b)) {
      return { tag: '計算錯', action: '先做一行中間算式，再做估算檢查（大小是否合理）。' };
    }
    return { tag: '方向錯', action: '先判斷題型與基準量（全部/剩下/部分），再列式。' };
  }

  function bindLiveAnswerValidation(){
    const ans = $('answer') || $('ans') || $('gAnswer');
    if (!ans) return;
    if ($('uxAnswerNote')) return;

    const note = create('div', 'ux-inline-note warn', '');
    note.id = 'uxAnswerNote';
    const host = ans.parentElement || ans;
    host.appendChild(note);

    const update = () => {
      const qText = ($('qText') || $('gQ'))?.textContent || '';
      const msg = inferAnswerPattern(qText);
      const v = String(ans.value || '').trim();
      if (!v){
        note.className = 'ux-inline-note warn';
        note.textContent = `可接受格式：${msg}`;
        return;
      }
      let ok = true;
      if (/時間/.test(msg)) ok = /^(\d{1,2}:\d{2}|\d+\s*小時\s*\d*\s*分?)$/.test(v);
      else if (/百分率/.test(msg)) ok = /^-?\d+(\.\d+)?%?$/.test(v);
      else if (/分數/.test(msg)) ok = /^-?\d+(\s+\d+\s*\/\s*\d+|\s*\/\s*\d+)?$/.test(v);
      else ok = /^-?\d+(\.\d+)?$/.test(v);

      note.className = ok ? 'ux-inline-note ok' : 'ux-inline-note bad';
      note.textContent = ok ? '格式看起來正確，可以送出。' : `格式可能不對；${msg}`;
    };

    ans.addEventListener('input', update);
    ans.addEventListener('focus', update);
    update();
  }

  function addHintShortcuts(){
    const hintLevel = $('hintLevel');
    const btnHint = $('btnHint');
    if (!hintLevel || !btnHint || $('uxHintShortcuts')) return;
    const wrap = create('div', 'ux-hint-shortcuts');
    wrap.id = 'uxHintShortcuts';

    const maxLv = Math.min(4, Math.max(3, hintLevel.options?.length || 3));
    for (let lv = 1; lv <= maxLv; lv += 1){
      const b = create('button', 'btn');
      b.type = 'button';
      b.textContent = `提示 ${lv}`;
      b.addEventListener('click', () => {
        hintLevel.value = String(lv);
        btnHint.click();
      });
      wrap.appendChild(b);
    }

    const row = hintLevel.closest('.row') || hintLevel.parentElement;
    if (row && row.parentElement) row.parentElement.insertBefore(wrap, row.nextSibling);
  }

  function addWrongGateIfNeeded(){
    if ($('wrongGate') || $('uxWrongGate')) return;
    const btnCheck = $('btnCheck');
    const btnNew = $('btnNew');
    if (!btnCheck || !btnNew) return;

    const qHost = $('hints') || $('banner') || btnCheck.closest('.card') || btnCheck.parentElement;
    if (!qHost || !qHost.parentElement) return;

    const gate = create('div', 'ux-wrong-gate');
    gate.id = 'uxWrongGate';
    gate.style.display = 'none';
    const title = create('div', 'title', '錯誤診斷（先理解再下一題）');
    const body = create('div', 'body');
    const ack = create('button', 'btn primary', '我理解了，繼續下一題');
    ack.type = 'button';
    gate.appendChild(title);
    gate.appendChild(body);
    gate.appendChild(ack);
    qHost.parentElement.insertBefore(gate, qHost.nextSibling);

    let locked = false;
    const lock = (msg) => {
      locked = true;
      btnNew.disabled = true;
      body.textContent = msg;
      gate.style.display = 'block';
    };
    const unlock = () => {
      locked = false;
      btnNew.disabled = false;
      gate.style.display = 'none';
    };

    ack.addEventListener('click', unlock);

    btnNew.addEventListener('click', (ev) => {
      if (!locked) return;
      ev.preventDefault();
      ev.stopPropagation();
    }, true);

    btnCheck.addEventListener('click', () => {
      setTimeout(() => {
        const banner = $('banner');
        const text = String((banner && banner.textContent) || '').trim();
        const bad = (banner && /\bbad\b/.test(banner.className)) || /再想想|不對|錯誤|格式或輸入有誤|請先/.test(text);
        if (!bad) return;
        const qText = ($('qText') || $('gQ'))?.textContent || '';
        const cls = classifyWrongFeedback(text, qText);
        lock(`類別：${cls.tag}。下一步：${cls.action}`);
      }, 0);
    }, true);
  }

  function bindUnifiedKeyboard(){
    if (window.__aimathUnifiedKeysBound) return;
    window.__aimathUnifiedKeysBound = true;

    window.addEventListener('keydown', (ev) => {
      const target = ev.target;
      const inInput = !!(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'));
      const k = String(ev.key || '').toLowerCase();

      if (ev.key === 'Enter'){
        const check = $('btnCheck') || $('btnSubmit');
        if (check && (inInput || document.activeElement === $('answer') || document.activeElement === $('ans') || document.activeElement === $('gAnswer'))){
          check.click();
        }
        return;
      }

      if (inInput) return;
      if (k === 'n') { $('btnNew')?.click(); return; }
      if (k === 's') { $('btnShowSteps')?.click(); return; }
      if (/^[1-4]$/.test(k)){
        const lv = Number(k);
        const hintLevel = $('hintLevel');
        const btnHint = $('btnHint');
        const byBtn = $(`btnHint${lv}`);
        if (byBtn) byBtn.click();
        else if (hintLevel && btnHint){ hintLevel.value = String(lv); btnHint.click(); }
      }
    });
  }

  function applyMobileCollapse(){
    if ($('uxMobileToggle')) return;
    const width = window.innerWidth || 1200;
    const candidates = Array.from(document.querySelectorAll('aside.card, .workshop')).filter(Boolean);
    if (!candidates.length) return;

    const host = document.querySelector('main .card') || document.querySelector('main') || document.body;
    const btn = create('button', 'btn ux-mobile-toggle', '手機：顯示進階區塊');
    btn.id = 'uxMobileToggle';

    const setCollapsed = (collapsed) => {
      candidates.forEach((el) => el.classList.toggle('ux-secondary-collapsed', collapsed));
      btn.textContent = collapsed ? '手機：顯示進階區塊' : '手機：隱藏進階區塊';
    };

    let collapsed = width <= 768;
    setCollapsed(collapsed);
    btn.addEventListener('click', () => { collapsed = !collapsed; setCollapsed(collapsed); });
    host.insertAdjacentElement('afterbegin', btn);
  }

  function readProgress(moduleId){
    try {
      const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      return all[moduleId] || null;
    } catch { return null; }
  }

  function saveProgress(moduleId){
    if (!moduleId) return;
    const kind = ($('kind') || $('selType') || $('pack'))?.value || '';
    const topic = ($('topic') || $('selTopic'))?.value || '';
    const data = { moduleId, kind, topic, ts: Date.now(), title: document.title || moduleId, path: window.location.pathname };
    try {
      const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      all[moduleId] = data;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
    } catch {}
  }

  function addResumeBar(config){
    if ($('uxResumeBar')) return;
    const root = document.querySelector('header') || document.body;
    const wrap = create('div', 'ux-resume');
    wrap.id = 'uxResumeBar';

    const cur = { moduleId: config.moduleId || document.title, title: document.title || config.moduleId || '目前題型', path: window.location.pathname, ts: Date.now() };
    let prev = null;
    try { prev = JSON.parse(localStorage.getItem(LAST_MODULE_KEY) || 'null'); } catch {}
    localStorage.setItem(LAST_MODULE_KEY, JSON.stringify(cur));

    const progress = readProgress(config.moduleId || 'default');
    const p = create('span', '', progress ? `本題型上次進度：${progress.topic || '-'} / ${progress.kind || '-'}` : '本題型尚無進度紀錄');
    wrap.appendChild(p);

    if (prev && prev.path && prev.path !== cur.path){
      const a = create('a', '', `回到上一題型：${prev.title || prev.moduleId}`);
      a.href = prev.path;
      wrap.appendChild(a);
    }

    if (config.nextModulePath){
      const n = create('a', '', `下一個建議：${config.nextModuleLabel || '繼續練下一題型'}`);
      n.href = config.nextModulePath;
      wrap.appendChild(n);
    }

    root.appendChild(wrap);

    ['kind','topic','selType','selTopic','pack'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('change', () => saveProgress(config.moduleId || 'default'));
    });
    saveProgress(config.moduleId || 'default');
  }

  function init(config){
    if (!isEnabled()) return;
    injectStyle();
    bindLiveAnswerValidation();
    addHintShortcuts();
    addWrongGateIfNeeded();
    bindUnifiedKeyboard();
    applyMobileCollapse();
    addResumeBar(config || {});
  }

  window.AIMathUXEnhancer = {
    init,
    enable(){ setEnabled(true); },
    disable(){ setEnabled(false); },
    isEnabled
  };
})();
