const fs = require('fs');
const path = require('path');

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeJsonl(filePath, rows) {
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body ? `${body}\n` : '', 'utf8');
}

function firstLine(text) {
  if (!text || typeof text !== 'string') return '';
  return text.split(/\r?\n/).map((v) => v.trim()).find(Boolean) || '';
}

function addIncident(list, item) {
  if (!item || !item.source || !item.code || !item.fingerprint) return;
  list.push(item);
}

const cwd = process.cwd();
const policyPath = path.join(cwd, 'golden', 'auto_optimization_policy.json');
const policy = readJson(policyPath, {});

const memoryPath = path.join(cwd, policy?.error_memory?.store || 'golden/error_memory.jsonl');
const summaryPath = path.join(cwd, policy?.error_memory?.summary_output || 'artifacts/error_memory_summary.json');

const gates = policy?.gates || {};
const nowIso = new Date().toISOString();
const runTag = process.env.GITHUB_RUN_ID ? `gh-${process.env.GITHUB_RUN_ID}` : `local-${Date.now()}`;

const scorecard = readJson(path.join(cwd, 'artifacts', 'scorecard.json'), null);
const e2e = readJson(path.join(cwd, 'artifacts', 'e2e_results.json'), null);
const improvement = readJson(path.join(cwd, 'artifacts', 'improvement_check.json'), null);

const incidents = [];

if (scorecard) {
  const checks = [
    {
      ok: scorecard?.tests?.pass === true,
      code: 'gate.tests.pass',
      fingerprint: 'tests.pass=false',
      severity: 'critical',
    },
    {
      ok: Number(scorecard?.axe?.critical ?? 999) <= Number(gates.axe_critical_max ?? 0),
      code: 'gate.axe.critical',
      fingerprint: `axe.critical>${gates.axe_critical_max ?? 0}`,
      severity: 'high',
    },
    {
      ok: Number(scorecard?.lighthouse?.accessibility ?? 0) >= Number(gates.lighthouse_accessibility_min ?? 90),
      code: 'gate.lighthouse.accessibility',
      fingerprint: `lighthouse.accessibility<${gates.lighthouse_accessibility_min ?? 90}`,
      severity: 'high',
    },
    {
      ok: Number(scorecard?.lighthouse?.performance ?? 0) >= Number(gates.lighthouse_performance_min ?? 85),
      code: 'gate.lighthouse.performance',
      fingerprint: `lighthouse.performance<${gates.lighthouse_performance_min ?? 85}`,
      severity: 'medium',
    },
    {
      ok: Number(scorecard?.hint_rubric?.avg ?? 0) >= Number(gates.hint_rubric_avg_min ?? 7),
      code: 'gate.hint.avg',
      fingerprint: `hint.avg<${gates.hint_rubric_avg_min ?? 7}`,
      severity: 'high',
    },
    {
      ok: Number(scorecard?.golden?.correct_rate ?? 0) >= Number(gates.golden_correct_rate_min ?? 1),
      code: 'gate.golden.correct_rate',
      fingerprint: `golden.correct_rate<${gates.golden_correct_rate_min ?? 1}`,
      severity: 'critical',
    },
    {
      ok: Number(scorecard?.e2e?.flaky_rate ?? 1) <= Number(gates.e2e_flaky_rate_max ?? 0.02),
      code: 'gate.e2e.flaky_rate',
      fingerprint: `e2e.flaky_rate>${gates.e2e_flaky_rate_max ?? 0.02}`,
      severity: 'medium',
    },
  ];

  for (const check of checks) {
    if (!check.ok) {
      addIncident(incidents, {
        source: 'scorecard',
        code: check.code,
        fingerprint: check.fingerprint,
        severity: check.severity,
        detail: 'scorecard gate failed',
      });
    }
  }
}

if (e2e && e2e.pass === false) {
  addIncident(incidents, {
    source: 'e2e',
    code: 'e2e.run.failed',
    fingerprint: firstLine(e2e?.run?.stderr || e2e?.run?.stdout || 'e2e failed') || 'e2e failed',
    severity: 'high',
    detail: 'playwright run returned non-zero',
  });
}

if (improvement && improvement.non_regression === false) {
  addIncident(incidents, {
    source: 'improvement',
    code: 'improvement.non_regression.failed',
    fingerprint: 'non_regression=false',
    severity: 'high',
    detail: `mode=${improvement.mode || 'unknown'}`,
  });
}

if (improvement && improvement.mode === 'require-improvement' && improvement.improved === false) {
  addIncident(incidents, {
    source: 'improvement',
    code: 'improvement.required_not_met',
    fingerprint: 'require-improvement but improved=false',
    severity: 'medium',
    detail: 'no measurable delta over baseline',
  });
}

const existing = readJsonl(memoryPath);
const keyFields = Array.isArray(policy?.error_memory?.dedupe_key)
  ? policy.error_memory.dedupe_key
  : ['source', 'code', 'fingerprint'];

const map = new Map();
for (const row of existing) {
  const key = keyFields.map((k) => String(row?.[k] ?? '')).join('|');
  map.set(key, row);
}

let added = 0;
let updated = 0;

for (const incident of incidents) {
  const key = keyFields.map((k) => String(incident?.[k] ?? '')).join('|');
  const prev = map.get(key);
  if (!prev) {
    map.set(key, {
      source: incident.source,
      code: incident.code,
      fingerprint: incident.fingerprint,
      severity: incident.severity,
      status: 'open',
      first_seen: nowIso,
      last_seen: nowIso,
      count: 1,
      last_run: runTag,
      last_detail: incident.detail || '',
    });
    added += 1;
    continue;
  }
  prev.last_seen = nowIso;
  prev.count = Number(prev.count || 0) + 1;
  prev.last_run = runTag;
  prev.last_detail = incident.detail || prev.last_detail || '';
  prev.severity = incident.severity || prev.severity || 'medium';
  if (!prev.status) prev.status = 'open';
  if (!prev.first_seen) prev.first_seen = nowIso;
  updated += 1;
}

const nextRows = [...map.values()].sort((a, b) => {
  if (String(a.source).localeCompare(String(b.source)) !== 0) {
    return String(a.source).localeCompare(String(b.source));
  }
  if (String(a.code).localeCompare(String(b.code)) !== 0) {
    return String(a.code).localeCompare(String(b.code));
  }
  return String(a.fingerprint).localeCompare(String(b.fingerprint));
});

fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
writeJsonl(memoryPath, nextRows);

const summary = {
  generated_at: nowIso,
  run: runTag,
  detected_incidents: incidents.length,
  newly_added: added,
  updated_existing: updated,
  total_known_errors: nextRows.length,
  open_errors: nextRows.filter((row) => String(row.status || 'open') !== 'resolved').length,
  latest: incidents,
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(summary, null, 2));
