/**
 * tools/seed_analytics_events.cjs
 * Generate realistic seed analytics events for testing the business funnel pipeline.
 * Output: artifacts/analytics_events_latest.json
 *
 * Usage: node tools/seed_analytics_events.cjs [--days 7] [--users 5]
 */
const fs = require('fs');
const path = require('path');

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

const DAYS = Number(argValue('--days', 7));
const USERS = Number(argValue('--users', 5));

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

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

const events = [];
const now = Date.now();
const DAY = 86400000;

// Create user profiles
const users = Array.from({ length: USERS }, (_, i) => `student_${i + 1}`);

for (let d = DAYS; d >= 0; d--) {
  const dayBase = now - d * DAY;

  for (const uid of users) {
    const sessionsToday = randomBetween(1, 3);
    const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;

    for (let s = 0; s < sessionsToday; s++) {
      const sessionStart = dayBase + randomBetween(28800000, 72000000); // 8am-8pm

      // Question activity
      const questions = randomBetween(3, 15);
      for (let q = 0; q < questions; q++) {
        const ts = sessionStart + q * randomBetween(15000, 120000);
        const mod = randomItem(MODULES);
        const correct = Math.random() > 0.3;
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

      // Task center visit (50% chance)
      if (Math.random() > 0.5) {
        events.push({
          event: 'task_center_open',
          ts: sessionStart + randomBetween(1000, 5000),
          user_id: uid, session_id: sid,
          page: '/docs/task-center/', role: 'student', data: {}
        });
      }
    }

    // Parent checks report (30% chance per day)
    if (Math.random() > 0.7) {
      events.push({
        event: 'report_open',
        ts: dayBase + randomBetween(64800000, 79200000), // evening
        user_id: uid + '_parent', session_id: `s_parent_${d}`,
        page: '/docs/parent-report/', role: 'parent', data: { context: 'parent-report' }
      });
      // Copy report text (60% of report viewers)
      if (Math.random() > 0.4) {
        events.push({
          event: 'weekly_report_copy',
          ts: dayBase + randomBetween(64800000, 79200000) + 10000,
          user_id: uid + '_parent', session_id: `s_parent_${d}`,
          page: '/docs/parent-report/', role: 'parent', data: { context: 'parent-report' }
        });
      }
    }

    // Pricing view (15% chance per user per day)
    if (Math.random() > 0.85) {
      events.push({
        event: 'pricing_view',
        ts: dayBase + randomBetween(36000000, 72000000),
        user_id: uid, session_id: sid,
        page: '/docs/pricing/', role: 'student', data: {}
      });

      // Upgrade click (40% of pricing viewers)
      if (Math.random() > 0.6) {
        events.push({
          event: 'upgrade_click',
          ts: dayBase + randomBetween(36000000, 72000000) + 5000,
          user_id: uid, session_id: sid,
          page: '/docs/pricing/', role: 'student',
          data: { cta_source: 'pricing_standard_trial' }
        });

        // Trial start (60% of upgrade clicks)
        if (Math.random() > 0.4) {
          events.push({
            event: 'trial_start',
            ts: dayBase + randomBetween(36000000, 72000000) + 10000,
            user_id: uid, session_id: sid,
            page: '/docs/pricing/', role: 'student',
            data: { plan_type: 'standard' }
          });
        }
      }
    }
  }
}

// Sort by timestamp
events.sort((a, b) => a.ts - b.ts);

// Write output
fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
const outPath = path.join(process.cwd(), 'artifacts', 'analytics_events_latest.json');
fs.writeFileSync(outPath, JSON.stringify(events, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  summary: 'seed analytics events generated',
  output: 'artifacts/analytics_events_latest.json',
  total_events: events.length,
  users: USERS,
  days: DAYS,
  event_types: [...new Set(events.map(e => e.event))]
}, null, 2));
