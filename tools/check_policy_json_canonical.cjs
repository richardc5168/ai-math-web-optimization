const fs = require('fs');
const path = require('path');

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

const policyPath = path.join(process.cwd(), 'golden', 'auto_optimization_policy.json');
const source = fs.readFileSync(policyPath, 'utf8');
const parsed = JSON.parse(source);
const canonical = `${JSON.stringify(normalize(parsed), null, 2)}\n`;

if (source !== canonical) {
  console.error(`policy json is not canonical: ${policyPath}`);
  process.exit(1);
}

console.log(`policy json canonical: ${policyPath}`);
