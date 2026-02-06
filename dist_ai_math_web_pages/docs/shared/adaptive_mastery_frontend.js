/*
  AIMathAdaptive (frontend)
  - Pure front-end mastery-based adaptive state machine.
  - Persists to localStorage.
  - Designed to be embedded in GitHub Pages static modules.
*/

(function(){
  'use strict';

  const STORAGE_KEY = 'aimath_adaptive_v1';
  const DEFAULT_APP_ID = 'unknown-app';

  const Stage = {
    BASIC: 'BASIC',
    LITERACY: 'LITERACY',
  };

  const ErrorCode = {
    CAL: 'CAL',
    CON: 'CON',
    READ: 'READ',
    CARE: 'CARE',
    TIME: 'TIME',
  };

  function nowMs(){ return Date.now(); }

  function safeJsonParse(s, fallback){
    try { return JSON.parse(s); } catch { return fallback; }
  }

  function loadDb(){
    const raw = localStorage.getItem(STORAGE_KEY);
    const db = raw ? safeJsonParse(raw, null) : null;
    if (db && typeof db === 'object' && db.version === 1 && db.students) return db;
    return { version: 1, students: {} };
  }

  function saveDb(db){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch {}
  }

  function ensureStudent(db, studentId){
    const sid = String(studentId || '').trim() || 'guest';
    db.students[sid] = db.students[sid] || { apps: {} };
    return { sid, student: db.students[sid] };
  }

  function ensureApp(student, appId){
    const aid = String(appId || DEFAULT_APP_ID).trim() || DEFAULT_APP_ID;
    student.apps[aid] = student.apps[aid] || { concepts: {}, attempts: {} };
    return { aid, app: student.apps[aid] };
  }

  function defaultConceptState(){
    return {
      stage: Stage.BASIC,
      answered: 0,
      correct: 0,
      consecutive_wrong: 0,
      hint_mode: false,
      micro_step_count: 0,
      teacher_flag: false,
      calm_mode: false,
      last_activity_ts: null,
      error_stats: {},
    };
  }

  function mastery(st){
    const a = Number(st?.answered || 0);
    const c = Number(st?.correct || 0);
    if (!a) return 0;
    return Math.max(0, Math.min(1, c / a));
  }

  function pushAttemptAndTrim(arr, item, maxN){
    const next = Array.isArray(arr) ? arr.slice() : [];
    next.push(item);
    const limit = Math.max(10, Number(maxN || 60));
    if (next.length > limit) next.splice(0, next.length - limit);
    return next;
  }

  function windowAccuracy(attempts, n){
    if (!Array.isArray(attempts) || !attempts.length) return null;
    const k = Math.max(1, Number(n || 4));
    const tail = attempts.slice(-k);
    const total = tail.length;
    const correct = tail.reduce((acc, x) => acc + (x && x.correct ? 1 : 0), 0);
    return total ? (correct / total) : null;
  }

  function avgTimeMs(attempts, n){
    if (!Array.isArray(attempts) || !attempts.length) return null;
    const k = Math.max(1, Number(n || 8));
    const tail = attempts.slice(-k);
    const vals = tail.map(x => Number(x?.duration_ms)).filter(v => Number.isFinite(v) && v >= 0);
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0) / vals.length;
  }

  function classifyErrorCode(evt){
    const meta = evt?.meta || {};
    if (meta && typeof meta.override_error_code === 'string'){
      const v = meta.override_error_code.trim().toUpperCase();
      if (ErrorCode[v]) return ErrorCode[v];
    }

    if (evt?.correct) return null;

    if (evt?.parse_error) return ErrorCode.CAL;

    const durationMs = Number(evt?.duration_ms);
    const usedHint = Number(evt?.hint_level || 0) > 0 || !!evt?.used_hint;
    const revealed = !!evt?.revealed_solution;

    if (Number.isFinite(durationMs) && durationMs > 45000) return ErrorCode.TIME;
    if (Number.isFinite(durationMs) && durationMs < 2000) return ErrorCode.CARE;

    if (revealed || usedHint) return ErrorCode.READ;

    return ErrorCode.CON;
  }

  function updateStateOnAttempt(prevState, evt, attemptsForConcept){
    const st = Object.assign(defaultConceptState(), prevState || {});

    st.answered = Number(st.answered || 0) + 1;
    if (evt.correct) {
      st.correct = Number(st.correct || 0) + 1;
      st.consecutive_wrong = 0;
    } else {
      st.consecutive_wrong = Number(st.consecutive_wrong || 0) + 1;
    }

    st.last_activity_ts = evt.ts;

    const m = mastery(st);

    // stage upgrade
    if (st.stage === Stage.BASIC && st.answered >= 10 && m >= 0.8){
      st.stage = Stage.LITERACY;
    }

    // calm mode
    const last4 = windowAccuracy(attemptsForConcept, 4);
    if (!evt.correct && st.consecutive_wrong >= 3){
      st.calm_mode = true;
    }
    if (st.calm_mode && last4 != null && last4 >= 0.75){
      st.calm_mode = false;
    }

    // stuck => hint/micro/teacher
    const stuck = (st.answered >= 6 && m < 0.6);
    let triggeredMicro = false;
    if (stuck){
      if (!st.hint_mode){
        st.hint_mode = true;
      } else {
        // micro-step only after hint_mode already active (avoid immediate jump)
        if (!evt.correct && st.consecutive_wrong >= 2 && st.micro_step_count < 2){
          st.micro_step_count = Number(st.micro_step_count || 0) + 1;
          triggeredMicro = true;
        } else if (!evt.correct && st.consecutive_wrong >= 2 && st.micro_step_count >= 2){
          st.teacher_flag = true;
        }
      }
    }

    // error stats
    const code = evt.error_code;
    if (code){
      st.error_stats = st.error_stats || {};
      st.error_stats[code] = Number(st.error_stats[code] || 0) + 1;
    }

    const actions = {
      mastery: m,
      stage: st.stage,
      stuck,
      calm_mode: !!st.calm_mode,
      hint_mode: !!st.hint_mode,
      triggered_micro_step: triggeredMicro,
      teacher_flag: !!st.teacher_flag,
      suggest_hint_level: null,
      suggest_next_step: false,
      ui_focus: null,
      message: null,
      error_code: code || null,
      last4_acc: last4,
      last8_time_ms: avgTimeMs(attemptsForConcept, 8),
    };

    if (actions.teacher_flag){
      actions.ui_focus = 'teacher';
      actions.message = '已連續卡關，建議請老師/家長一起看題目（可一起做 1~2 題）。';
    } else if (actions.calm_mode){
      actions.ui_focus = 'calm';
      actions.message = '先進入「冷靜模式」：慢一點、先估算/列式，再計算。';
    } else if (actions.stuck && actions.hint_mode){
      actions.ui_focus = 'hint';
      actions.suggest_hint_level = Math.min(3, Math.max(1, (evt.hint_level || 0) + 1 || 1));
      actions.suggest_next_step = true;
      actions.message = triggeredMicro
        ? '啟用微步驟：先完成「下一步」提示，再回來解題。'
        : '建議：看提示（逐步升級 Level），再按「下一步」。';
    }

    return { state: st, actions };
  }

  function getConceptState(opts){
    const studentId = opts?.studentId;
    const appId = opts?.appId;
    const conceptId = String(opts?.conceptId || '').trim() || 'unknown';

    const db = loadDb();
    const { student } = ensureStudent(db, studentId);
    const { aid, app } = ensureApp(student, appId);

    const st = app.concepts[conceptId] || defaultConceptState();
    const attempts = app.attempts[conceptId] || [];
    return { studentId: String(studentId||'guest'), appId: aid, conceptId, state: st, attempts };
  }

  function recordAttempt(opts){
    const studentId = opts?.studentId;
    const appId = opts?.appId;
    const conceptId = String(opts?.conceptId || '').trim() || 'unknown';

    const correct = !!opts?.correct;
    const duration_ms = Number(opts?.durationMs);
    const hint_level = Number(opts?.hintLevel || 0);

    const db = loadDb();
    const { student } = ensureStudent(db, studentId);
    const { aid, app } = ensureApp(student, appId);

    const prev = app.concepts[conceptId] || defaultConceptState();
    const prevAttempts = app.attempts[conceptId] || [];

    const evt = {
      ts: nowMs(),
      correct,
      duration_ms: Number.isFinite(duration_ms) ? Math.max(0, duration_ms) : null,
      hint_level: Number.isFinite(hint_level) ? Math.max(0, hint_level) : 0,
      used_hint: !!opts?.usedHint,
      revealed_solution: !!opts?.revealedSolution,
      parse_error: !!opts?.parseError,
      meta: opts?.meta || {},
    };

    evt.error_code = classifyErrorCode(evt);

    const nextAttempts = pushAttemptAndTrim(prevAttempts, evt, 80);
    const { state: nextState, actions } = updateStateOnAttempt(prev, evt, nextAttempts);

    app.attempts[conceptId] = nextAttempts;
    app.concepts[conceptId] = nextState;
    saveDb(db);

    return {
      studentId: String(studentId || 'guest'),
      appId: aid,
      conceptId,
      event: evt,
      state: nextState,
      actions,
    };
  }

  function listStudents(){
    const db = loadDb();
    return Object.keys(db.students || {});
  }

  function exportStudent(studentId){
    const db = loadDb();
    const sid = String(studentId || '').trim() || 'guest';
    return db.students?.[sid] || null;
  }

  function resetStudent(studentId){
    const db = loadDb();
    const sid = String(studentId || '').trim() || 'guest';
    if (db.students && db.students[sid]){
      delete db.students[sid];
      saveDb(db);
    }
  }

  function resetStudentApp(studentId, appId){
    const db = loadDb();
    const sid = String(studentId || '').trim() || 'guest';
    const aid = String(appId || DEFAULT_APP_ID).trim() || DEFAULT_APP_ID;
    if (db.students?.[sid]?.apps?.[aid]){
      delete db.students[sid].apps[aid];
      saveDb(db);
    }
  }

  window.AIMathAdaptive = {
    STORAGE_KEY,
    Stage,
    ErrorCode,
    loadDb,
    saveDb,
    listStudents,
    exportStudent,
    resetStudent,
    resetStudentApp,
    getConceptState,
    recordAttempt,
    windowAccuracy,
    avgTimeMs,
    mastery,
  };
})();
