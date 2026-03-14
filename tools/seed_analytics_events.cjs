/**
 * tools/seed_analytics_events.cjs
 * Generate deterministic seed analytics events for business funnel validation.
 * Output: artifacts/analytics_seed_events.json
 *
 * Usage: node tools/seed_analytics_events.cjs [--days 7] [--users 5] [--out path]
 */
const fs = require('fs');
const path = require('path');

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

const DAYS = Number(argValue('--days', 7));
const USERS = Number(argValue('--users', 5));
const OUTPUT = argValue('--out', 'artifacts/analytics_seed_events.json');

const MODULES = [
  'fraction-word-g5', 'fraction-g5', 'interactive-decimal-g5',
  'volume-g5', 'ratio-percent-g5', 'interactive-g5-empire',
  'commercial-pack1-fraction-sprint', 'life-applications-g5'
];

const PAGES = [
  '/docs/pricing/', '/docs/parent-report/', '/docs/task-center/',
  '/docs/fraction-word-g5/', '/docs/interactive-g5-empire/',
  '/docs/commercial-pack1-fraction-sprint/'
];

const events = [];
const now = Date.now();
const DAY = 86400000;

// Create user profiles
const users = Array.from({ length: USERS }, (_, i) => `student_${i + 1}`);

for (let d = DAYS; d >= 0; d--) {
  const dayBase = now - d * DAY;

  users.forEach((uid, userIndex) => {
    const sessionsToday = 2;

    for (let s = 0; s < sessionsToday; s++) {
      const sid = `seed_${uid}_d${d}_s${s + 1}`;
      const sessionStart = dayBase + 32400000 + (userIndex * 5400000) + (s * 8100000);
      const questions = 4 + ((d + userIndex + s) % 3);

      for (let q = 0; q < questions; q++) {
        const ts = sessionStart + q * 45000;
        const mod = MODULES[(d + userIndex + s + q) % MODULES.length];
        const correct = ((d + userIndex + s + q) % 5) !== 0;
        events.push({
          event: 'question_submit', ts, user_id: uid, session_id: sid,
          page: `/docs/${mod}/`, role: 'student',
          data: { module_id: mod, topic_id: mod }
        });
        if (correct) {
          events.push({
            event: 'question_correct', ts: ts + 500, user_id: uid, session_id: sid,
            page: `/docs/${mod}/`, role: 'student',
            data: { module_id: mod, topic_id: mod }
          });
        }
      }

      if (s === 0 || ((d + userIndex) % 2 === 0)) {
        events.push({
          event: 'task_center_open',
          ts: sessionStart + 3000,
          user_id: uid, session_id: sid,
          page: '/docs/task-center/', role: 'student', data: {}
        });
      }
    }

    if ((d + userIndex) % 2 === 0) {
      const reportTs = dayBase + 68400000 + (userIndex * 120000);
      events.push({
        event: 'report_open',
        ts: reportTs,
        user_id: uid + '_parent', session_id: `s_parent_${d}`,
        page: '/docs/parent-report/', role: 'parent', data: { context: 'parent-report' }
      });
      if ((d + userIndex) % 4 !== 1) {
        events.push({
          event: 'weekly_report_copy',
          ts: reportTs + 10000,
          user_id: uid + '_parent', session_id: `s_parent_${d}`,
          page: '/docs/parent-report/', role: 'parent', data: { context: 'parent-report' }
        });
      }
    }

    const pricingEligible = ((d + userIndex) % 3) !== 1;
    if (pricingEligible) {
      const pricingTs = dayBase + 46800000 + (userIndex * 180000);
      const sessionId = `seed_${uid}_pricing_d${d}`;
      events.push({
        event: 'pricing_view',
        ts: pricingTs,
        user_id: uid, session_id: sessionId,
        page: '/docs/pricing/', role: 'student', data: {}
      });

      const upgradeEligible = ((d + userIndex) % 4) !== 0;
      if (upgradeEligible) {
        events.push({
          event: 'upgrade_click',
          ts: pricingTs + 5000,
          user_id: uid, session_id: sessionId,
          page: '/docs/pricing/', role: 'student',
          data: { cta_source: 'pricing_standard_trial' }
        });

        const trialEligible = ((d + userIndex) % 5) !== 2;
        if (trialEligible) {
          events.push({
            event: 'trial_start',
            ts: pricingTs + 10000,
            user_id: uid, session_id: sessionId,
            page: '/docs/pricing/', role: 'student',
            data: { plan_type: 'standard' }
          });

          if ((d + userIndex) % 2 === 0) {
            events.push({
              event: 'redeem_success',
              ts: pricingTs + 14000,
              user_id: uid,
              session_id: sessionId,
              page: '/docs/pricing/',
              role: 'student',
              data: { plan_type: 'standard', channel: 'seed' }
            });
            events.push({
              event: 'paid_active',
              ts: pricingTs + 18000,
              user_id: uid,
              session_id: sessionId,
              page: '/docs/pricing/',
              role: 'student',
              data: { plan_type: 'standard', channel: 'seed' }
            });
          }
        }
      }
    }
    if (d <= 6 && userIndex % 2 === 0) {
      events.push({
        event: 'return_next_week',
        ts: dayBase + 75600000 + (userIndex * 60000),
        user_id: uid,
        session_id: `seed_${uid}_return_d${d}`,
        page: '/docs/task-center/',
        role: 'student',
        data: { source: 'seed' }
      });
    }
  });
}

// Sort by timestamp
events.sort((a, b) => a.ts - b.ts);

// Write output
fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
const outPath = path.join(process.cwd(), OUTPUT);
fs.writeFileSync(outPath, JSON.stringify(events, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  summary: 'seed analytics events generated',
  output: OUTPUT,
  total_events: events.length,
  users: USERS,
  days: DAYS,
  event_types: [...new Set(events.map(e => e.event))]
}, null, 2));
