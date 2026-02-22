const fs = require('fs');
const path = require('path');

function readJson(fileName, fallback = null) {
  const filePath = path.join(process.cwd(), 'artifacts', fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(fileName, value) {
  const outPath = path.join(process.cwd(), 'artifacts', fileName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  return outPath;
}

function writeText(fileName, text) {
  const outPath = path.join(process.cwd(), 'artifacts', fileName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, text, 'utf8');
  return outPath;
}

function compact(v) {
  return (v || '').toString().trim();
}

const scorecard = readJson('scorecard.json', null);
const e2e = readJson('e2e_results.json', null);
const errorSummary = readJson('error_memory_summary.json', null);
const improvement = readJson('improvement_check.json', null);

const checks = [];
if (scorecard?.tests) {
  checks.push({ name: 'tests.pass', ok: !!scorecard.tests.pass, value: scorecard.tests.pass });
}
if (scorecard?.axe) {
  checks.push({ name: 'axe.critical==0', ok: Number(scorecard.axe.critical || 0) === 0, value: scorecard.axe.critical });
}
if (scorecard?.lighthouse) {
  checks.push({
    name: 'lighthouse.accessibility>=90',
    ok: Number(scorecard.lighthouse.accessibility || 0) >= 90,
    value: scorecard.lighthouse.accessibility,
  });
  checks.push({
    name: 'lighthouse.performance>=85',
    ok: Number(scorecard.lighthouse.performance || 0) >= 85,
    value: scorecard.lighthouse.performance,
  });
}
if (scorecard?.hint_rubric) {
  checks.push({ name: 'hint_rubric.avg>=7', ok: Number(scorecard.hint_rubric.avg || 0) >= 7, value: scorecard.hint_rubric.avg });
}
if (scorecard?.golden) {
  checks.push({ name: 'golden.correct_rate>=1', ok: Number(scorecard.golden.correct_rate || 0) >= 1, value: scorecard.golden.correct_rate });
}
if (scorecard?.e2e) {
  checks.push({ name: 'e2e.flaky_rate<=0.02', ok: Number(scorecard.e2e.flaky_rate ?? 1) <= 0.02, value: scorecard.e2e.flaky_rate });
}

const failedChecks = checks.filter((c) => !c.ok);

let likelyRootCause = 'unknown';
if (e2e && e2e.pass === false) {
  likelyRootCause = 'e2e_failure';
} else if (e2e?.flaky_recovered === true) {
  likelyRootCause = 'e2e_flaky_recovered';
} else if (failedChecks.length > 0) {
  likelyRootCause = `scorecard_gate:${failedChecks[0].name}`;
} else if (improvement?.non_regression === false) {
  likelyRootCause = 'improvement_non_regression_failed';
} else if (improvement?.mode === 'require-improvement' && improvement?.improved === false) {
  likelyRootCause = 'improvement_required_not_met';
} else if (errorSummary?.detected_incidents > 0) {
  likelyRootCause = 'error_memory_incidents_detected';
} else if (scorecard?.tests?.pass === true) {
  likelyRootCause = 'all_green';
}

const evidence = [];
if (e2e?.run) {
  evidence.push({
    source: 'e2e_results.run',
    status: e2e.run.status,
    stderr_first_line: compact(e2e.run.stderr).split(/\r?\n/)[0] || '',
    stdout_first_line: compact(e2e.run.stdout).split(/\r?\n/)[0] || '',
  });
}
if (Array.isArray(e2e?.runs)) {
  evidence.push({
    source: 'e2e_results.runs',
    attempt_count: Number(e2e.attempt_count || e2e.runs.length || 0),
    statuses: e2e.runs.map((r) => r.status),
  });
}
if (failedChecks.length > 0) {
  evidence.push({ source: 'scorecard.failed_checks', failed_checks: failedChecks });
}
if (errorSummary?.latest) {
  evidence.push({ source: 'error_memory_summary.latest', latest: errorSummary.latest.slice(0, 5) });
}

const nextCommands = [
  'npm run test:e2e',
  'npm run verify:all',
  'node tools/build_agent_triage_report.cjs',
  'C:/Users/Richard/Documents/RAGWEB/.venv/Scripts/python.exe tools/validate_all_elementary_banks.py',
];

const report = {
  generated_at: new Date().toISOString(),
  likely_root_cause: likelyRootCause,
  failed_checks: failedChecks,
  e2e: {
    pass: e2e?.pass,
    flaky_recovered: e2e?.flaky_recovered,
    flaky_rate: e2e?.flaky_rate,
    attempt_count: e2e?.attempt_count,
  },
  improvement: improvement || null,
  error_memory: {
    detected_incidents: Number(errorSummary?.detected_incidents || 0),
    open_errors: Number(errorSummary?.open_errors || 0),
  },
  evidence,
  next_commands: nextCommands,
};

const md = [
  '# Agent Triage Report',
  '',
  `- generated_at: ${report.generated_at}`,
  `- likely_root_cause: ${report.likely_root_cause}`,
  '',
  '## Failed Checks',
  ...(failedChecks.length
    ? failedChecks.map((c) => `- ${c.name} (value=${JSON.stringify(c.value)})`)
    : ['- none']),
  '',
  '## E2E',
  `- pass: ${report.e2e.pass}`,
  `- flaky_recovered: ${report.e2e.flaky_recovered}`,
  `- flaky_rate: ${report.e2e.flaky_rate}`,
  `- attempt_count: ${report.e2e.attempt_count}`,
  '',
  '## Next Commands',
  ...nextCommands.map((cmd) => `- ${cmd}`),
  '',
].join('\n');

writeJson('agent_triage.json', report);
writeText('agent_triage.md', md);
console.log(JSON.stringify({ likely_root_cause: report.likely_root_cause, failed_checks: failedChecks.length }, null, 2));
