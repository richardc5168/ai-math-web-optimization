/* ============================================================
   Game Motion — Animation Utilities (vanilla JS · iOS-safe)
   ai-GAME · No arrow functions · No optional chaining
   ============================================================ */
(function () {
  'use strict';

  /* ── countUp: animate a number from → to ─────────────────── */
  function countUp(el, from, to, duration, cb) {
    if (!el) return;
    var d = duration || 600;
    var start = null;
    var diff = to - from;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / d, 1);
      var ease = 1 - Math.pow(1 - p, 3);          // easeOutCubic
      el.textContent = Math.round(from + diff * ease);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = to;
        if (cb) cb();
      }
    }
    requestAnimationFrame(step);
  }

  /* ── flash: briefly highlight a number change ────────────── */
  function flash(el) {
    if (!el) return;
    el.classList.remove('gm-flash');
    /* force reflow so re-adding works */
    void el.offsetWidth;
    el.classList.add('gm-flash');
    setTimeout(function () { el.classList.remove('gm-flash'); }, 400);
  }

  /* ── shake: wrong-answer shake ───────────────────────────── */
  function shake(el) {
    if (!el) return;
    el.classList.remove('gm-shake');
    void el.offsetWidth;
    el.classList.add('gm-shake');
    setTimeout(function () { el.classList.remove('gm-shake'); }, 600);
  }

  /* ── pop: correct-answer / badge pop ─────────────────────── */
  function pop(el) {
    if (!el) return;
    el.classList.remove('gm-pop');
    void el.offsetWidth;
    el.classList.add('gm-pop');
    setTimeout(function () { el.classList.remove('gm-pop'); }, 600);
  }

  /* ── pulse: draw attention to a CTA ──────────────────────── */
  function pulse(el) {
    if (!el) return;
    el.classList.add('gm-pulse');
  }
  function unpulse(el) {
    if (!el) return;
    el.classList.remove('gm-pulse');
  }

  /* ── burst: particle burst around element ────────────────── */
  function burst(el, count, colors) {
    if (!el) return;
    var n = count || 12;
    var c = colors || ['#ffd700', '#58a6ff', '#2ea043', '#a78bfa', '#fb923c'];
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var dot = document.createElement('div');
      var angle = (360 / n) * i;
      var rad = angle * Math.PI / 180;
      var dist = 30 + Math.random() * 30;
      var bx = Math.cos(rad) * dist;
      var by = Math.sin(rad) * dist;
      dot.style.cssText =
        'position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:10000;'
        + 'left:' + cx + 'px;top:' + cy + 'px;'
        + 'background:' + c[i % c.length] + ';'
        + '--gm-bx:' + bx + 'px;--gm-by:' + by + 'px;'
        + 'animation:gmBurstParticle 0.6s ease-out forwards;';
      frag.appendChild(dot);
    }
    document.body.appendChild(frag);
    setTimeout(function () {
      var ps = document.querySelectorAll('[style*="gmBurstParticle"]');
      for (var j = 0; j < ps.length; j++) {
        if (ps[j].parentNode) ps[j].parentNode.removeChild(ps[j]);
      }
    }, 700);
  }

  /* ── stagger: reveal a list of elements one-by-one ───────── */
  function stagger(els, className, baseDelay) {
    if (!els || !els.length) return;
    var cls = className || 'gm-slide-up';
    var d = baseDelay || 100;
    for (var i = 0; i < els.length; i++) {
      (function (el, idx) {
        el.style.animationDelay = (idx * d) + 'ms';
        el.classList.add(cls);
      })(els[i], i);
    }
  }

  /* ── progressRing: create / update SVG progress ring ─────── */
  function createRing(size, strokeWidth) {
    var s = size || 48;
    var sw = strokeWidth || 4;
    var r = (s - sw) / 2;
    var circ = 2 * Math.PI * r;
    var wrap = document.createElement('div');
    wrap.className = 'gm-ring-wrap';
    wrap.innerHTML =
      '<svg width="' + s + '" height="' + s + '">'
      + '<circle class="gm-ring-bg" cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '"/>'
      + '<circle class="gm-ring-fg" cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + r + '"'
      + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + circ + '"/>'
      + '</svg>'
      + '<span class="gm-ring-label">0%</span>';
    wrap._circ = circ;
    wrap._fg = wrap.querySelector('.gm-ring-fg');
    wrap._label = wrap.querySelector('.gm-ring-label');
    return wrap;
  }
  function updateRing(wrap, pct) {
    if (!wrap || !wrap._fg) return;
    var offset = wrap._circ * (1 - pct / 100);
    wrap._fg.style.strokeDashoffset = offset;
    wrap._label.textContent = Math.round(pct) + '%';
  }

  /* ── Expose API ──────────────────────────────────────────── */
  window.GameMotion = {
    countUp:    countUp,
    flash:      flash,
    shake:      shake,
    pop:        pop,
    pulse:      pulse,
    unpulse:    unpulse,
    burst:      burst,
    stagger:    stagger,
    createRing: createRing,
    updateRing: updateRing
  };
})();
