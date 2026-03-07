/* ============================================================
   Quiz Feedback — Gamified answer feedback + score HUD
   ai-GAME · Hooks into existing quiz pages
   Requires: game_motion.css, game_motion.js loaded first
   ============================================================ */
(function () {
  'use strict';
  if (!window.GameMotion) return;

  var GM = window.GameMotion;

  /* ── State ────────────────────────────────────────────────── */
  var score = { correct: 0, wrong: 0, streak: 0, best: 0 };
  var KEY = 'gm_quiz_score_';
  var unitId = '';

  /* ── Persist helpers ──────────────────────────────────────── */
  function save() {
    try { localStorage.setItem(KEY + unitId, JSON.stringify(score)); } catch (e) { /* ignore */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY + unitId);
      if (raw) {
        var s = JSON.parse(raw);
        score.correct = s.correct || 0;
        score.wrong = s.wrong || 0;
        score.streak = s.streak || 0;
        score.best = s.best || 0;
      }
    } catch (e) { /* ignore */ }
  }

  /* ── Build HUD ────────────────────────────────────────────── */
  var hud = null;
  var elCorrect = null;
  var elWrong = null;
  var elStreak = null;
  var elBest = null;
  var elStreakFill = null;
  var ring = null;

  function buildHUD() {
    hud = document.createElement('div');
    hud.className = 'gm-score-hud gm-slide-down';
    hud.innerHTML =
      '<div class="gm-score-item"><span class="gm-icon">✅</span><span class="gm-val" id="gmCorrect">0</span></div>'
      + '<div class="gm-score-item"><span class="gm-icon">❌</span><span class="gm-val" id="gmWrong">0</span></div>'
      + '<div class="gm-score-item"><span class="gm-icon">🔥</span><span class="gm-val" id="gmStreak">0</span></div>'
      + '<div class="gm-score-item"><span class="gm-icon">🏆</span><span class="gm-val" id="gmBest">0</span></div>'
      + '<div class="gm-streak-bar"><div class="gm-streak-fill" id="gmStreakFill"></div></div>';

    elCorrect = hud.querySelector('#gmCorrect');
    elWrong = hud.querySelector('#gmWrong');
    elStreak = hud.querySelector('#gmStreak');
    elBest = hud.querySelector('#gmBest');
    elStreakFill = hud.querySelector('#gmStreakFill');

    /* Progress ring */
    ring = GM.createRing(44, 4);
    hud.insertBefore(ring, hud.firstChild);
  }

  function refreshHUD() {
    if (!elCorrect) return;
    elCorrect.textContent = score.correct;
    elWrong.textContent = score.wrong;
    elStreak.textContent = score.streak;
    elBest.textContent = score.best;
    /* streak bar: max 10 for "full" */
    var pct = Math.min(score.streak / 10, 1) * 100;
    elStreakFill.style.width = pct + '%';
    /* ring */
    var total = score.correct + score.wrong;
    var accPct = total > 0 ? Math.round(score.correct / total * 100) : 0;
    GM.updateRing(ring, accPct);
  }

  /* ── Auto Next-question button ─────────────────────────── */
  function showAutoNext() {
    var existing = document.getElementById('gmAutoNext');
    if (existing) return;
    var btnNew = document.getElementById('btnNew');
    if (!btnNew) return;
    var btn = document.createElement('button');
    btn.id = 'gmAutoNext';
    btn.className = 'btn primary gm-pop gm-pulse';
    btn.textContent = '▶ 下一題';
    btn.style.cssText = 'margin-left:10px;font-size:1rem;';
    btn.addEventListener('click', function () {
      btnNew.click();
      var el = document.getElementById('gmAutoNext');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    btnNew.parentNode.insertBefore(btn, btnNew.nextSibling);
  }

  function removeAutoNext() {
    var el = document.getElementById('gmAutoNext');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /* ── Milestone check ──────────────────────────────────────── */
  function checkMilestones() {
    /* streak milestones: 3, 5, 10 */
    if (score.streak === 3 || score.streak === 5 || score.streak === 10) {
      showStreakToast(score.streak);
    }
    /* total correct milestones: 10, 25, 50, 100 */
    var m = [10, 25, 50, 100];
    for (var i = 0; i < m.length; i++) {
      if (score.correct === m[i]) {
        showMilestoneToast(score.correct);
        break;
      }
    }
  }

  function showStreakToast(n) {
    showToast('🔥 連續答對 ' + n + ' 題！', 'streak');
  }
  function showMilestoneToast(n) {
    showToast('🏆 累計答對 ' + n + ' 題！', 'milestone');
    if (window._showCelebration) {
      var total = score.correct + score.wrong;
      var acc = total > 0 ? Math.round(score.correct / total * 100) : 100;
      window._showCelebration(acc, total);
    }
  }

  function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'gm-toast gm-slide-up';
    t.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);'
      + 'background:' + (type === 'streak' ? 'rgba(251,146,60,0.95)' : 'rgba(167,139,250,0.95)') + ';'
      + 'color:#fff;padding:10px 20px;border-radius:10px;font-weight:700;font-size:1rem;'
      + 'z-index:9990;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,0.3);white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.4s';
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 500);
    }, 2500);
  }

  /* ── Hook into banner class changes ───────────────────────── */
  function hookBanner() {
    var banner = document.getElementById('banner');
    if (!banner) return;

    var observer = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName !== 'class') continue;
        var cls = banner.className;

        if (cls.indexOf('ok') !== -1) {
          onCorrect(banner);
        } else if (cls.indexOf('bad') !== -1) {
          onWrong(banner);
        }
      }
    });

    observer.observe(banner, { attributes: true, attributeFilter: ['class'] });
  }

  var lastBannerText = '';

  function onCorrect(banner) {
    /* Deduplicate: don't re-trigger if same banner text */
    if (banner.textContent === lastBannerText && lastBannerText !== '') return;
    lastBannerText = banner.textContent;

    score.correct++;
    score.streak++;
    if (score.streak > score.best) score.best = score.streak;
    save();

    /* Animations */
    GM.pop(banner);
    GM.burst(banner, 14, ['#ffd700', '#2ea043', '#58a6ff', '#a78bfa']);
    GM.flash(elCorrect);
    GM.flash(elStreak);
    if (score.streak > score.best - 1) GM.flash(elBest);
    refreshHUD();
    showAutoNext();
    checkMilestones();
  }

  function onWrong(banner) {
    if (banner.textContent === lastBannerText && lastBannerText !== '') return;
    lastBannerText = banner.textContent;

    score.wrong++;
    score.streak = 0;
    save();

    /* Animations */
    GM.shake(banner);
    GM.flash(elWrong);
    refreshHUD();

    /* Pulse the hint button to guide user */
    var btnHint = document.getElementById('btnHint');
    if (btnHint) GM.pulse(btnHint);
  }

  /* ── Reset on new question ────────────────────────────────── */
  function hookNewQuestion() {
    var btnNew = document.getElementById('btnNew');
    if (!btnNew) return;
    btnNew.addEventListener('click', function () {
      lastBannerText = '';
      removeAutoNext();
      var btnHint = document.getElementById('btnHint');
      if (btnHint) GM.unpulse(btnHint);
    });
  }

  /* ── Reset score button ───────────────────────────────────── */
  function addResetLink() {
    if (!hud) return;
    var link = document.createElement('span');
    link.textContent = '↺';
    link.title = '重置分數';
    link.style.cssText = 'cursor:pointer;color:var(--muted,#9aa4b2);font-size:1rem;margin-left:auto;';
    link.addEventListener('click', function () {
      score.correct = 0;
      score.wrong = 0;
      score.streak = 0;
      score.best = 0;
      save();
      refreshHUD();
    });
    hud.appendChild(link);
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    /* Derive unitId from URL path */
    var path = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    unitId = path.split('/').pop() || 'default';

    load();
    buildHUD();
    addResetLink();

    /* Insert HUD before the first .card h2 or at top of first .card */
    var card = document.querySelector('main .card');
    if (card) {
      var h2 = card.querySelector('h2');
      if (h2) {
        card.insertBefore(hud, h2.nextSibling);
      } else {
        card.insertBefore(hud, card.firstChild);
      }
    }

    refreshHUD();
    hookBanner();
    hookNewQuestion();
  }

  /* Run on DOMContentLoaded or immediately if already loaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
