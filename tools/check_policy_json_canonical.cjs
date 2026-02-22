const fs = require('fs');
const path = require('path');

const targets = [
  path.join(process.cwd(), 'golden', 'auto_optimization_policy.json'),
  path.join(process.cwd(), 'golden', 'improvement_baseline.json'),
  path.join(process.cwd(), 'schemas', 'scorecard.schema.json'),
];

const writeMode = process.argv.includes('--write');
let invalidCount = 0;

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    console.error(`missing required file: ${filePath}`);
    invalidCount += 1;
    continue;
  }

  const source = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const parsed = JSON.parse(source);
  const canonical = `${JSON.stringify(parsed, null, 2)}\n`;

  if (source !== canonical) {
    if (writeMode) {
      fs.writeFileSync(filePath, canonical, 'utf8');
      console.log(`rewrote canonical json: ${filePath}`);
    } else {
      console.error(`json is not canonical: ${filePath}`);
      invalidCount += 1;
    }
    continue;
  }

  console.log(`json canonical: ${filePath}`);
}

if (invalidCount > 0) {
  process.exit(1);
}
