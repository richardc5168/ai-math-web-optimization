const { runCommand } = require('./_runner.cjs');

const steps = [
  { label: 'lint', command: 'npm', args: ['run', 'lint'] },
  { label: 'test:unit', command: 'npm', args: ['run', 'test:unit'] },
  { label: 'test:contract', command: 'npm', args: ['run', 'test:contract'] },
  { label: 'test:property', command: 'npm', args: ['run', 'test:property'] },
  { label: 'test:e2e', command: 'npm', args: ['run', 'test:e2e'] },
  { label: 'test:axe', command: 'npm', args: ['run', 'test:axe'] },
  { label: 'test:lighthouse', command: 'npm', args: ['run', 'test:lighthouse'] },
  { label: 'test:visual', command: 'npm', args: ['run', 'test:visual'] },
  { label: 'judge:hints', command: 'npm', args: ['run', 'judge:hints'] },
  { label: 'golden:check', command: 'npm', args: ['run', 'golden:check'] },
  { label: 'scorecard', command: 'npm', args: ['run', 'scorecard'] },
  { label: 'gate:scorecard', command: 'npm', args: ['run', 'gate:scorecard'] },
  { label: 'seed:analytics', command: 'npm', args: ['run', 'seed:analytics'] },
  {
    label: 'summary:business',
    command: 'node',
    args: ['tools/build_business_funnel_summary.cjs', '--in', 'artifacts/analytics_seed_events.json']
  },
  {
    label: 'gate:business',
    command: 'node',
    args: ['tools/build_business_funnel_summary.cjs', '--in', 'artifacts/analytics_seed_events.json', '--gate']
  },
];

for (const step of steps) {
  console.log(`\n==> ${step.label}`);
  const res = runCommand(step.command, step.args);
  if (res.stdout) console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  if (!res.pass) {
    console.error(`verify:all failed at step ${step.label}`);
    process.exit(1);
  }
}

console.log('\nverify:all passed');
