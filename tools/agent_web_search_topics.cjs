const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const keyPath = path.join(cwd, 'gpt_key_20251110.txt');
const goldenPath = path.join(cwd, 'golden', 'grade5_pack_v1.jsonl');
const memoryPath = path.join(cwd, 'golden', 'error_memory.jsonl');
const reportPath = path.join(cwd, 'artifacts', 'agent_web_search_report.json');

if (!fs.existsSync(keyPath)) {
  console.error('OpenAI API key not found at', keyPath);
  process.exit(1);
}

const apiKey = fs.readFileSync(keyPath, 'utf8').trim();

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function writeJsonl(filePath, rows) {
  const content = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

async function callOpenAI(prompt, systemPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  console.log('Starting agent web search and optimization...');
  const rows = readJsonl(goldenPath);
  const memoryRows = readJsonl(memoryPath);
  if (rows.length === 0) {
    console.log('No golden items found.');
    return;
  }

  // Pick 1-2 random items to optimize in this iteration to keep it fast and atomic
  const numToOptimize = Math.min(2, rows.length);
  const indicesToOptimize = [];
  while (indicesToOptimize.length < numToOptimize) {
    const idx = Math.floor(Math.random() * rows.length);
    if (!indicesToOptimize.includes(idx)) {
      indicesToOptimize.push(idx);
    }
  }

  let changed = 0;
  const touched = [];

  for (const idx of indicesToOptimize) {
    const item = rows[idx];
    console.log(`Optimizing item ${item.id}...`);

    const systemPrompt = `You are an expert elementary math teacher and curriculum designer.
Your task is to search your knowledge base for the latest 5th and 6th-grade math problem types, teaching concepts, and pedagogical strategies.
You will be given a math problem from ai-math-web. You must optimize its hints, teaching concepts, and parent report suggestions to be more engaging, clear, and aligned with modern pedagogy.
CRITICAL RULES:
1. Stability First: Do not break the existing JSON structure.
2. No Hint Leaks: Ensure NO Level 3 hint contains the final answer verbatim. Hints must guide, not solve.
3. Ensure the hints guide the student step-by-step (strategy, equation, compute, check).
4. Improve the teaching concepts and parent report suggestions to be more actionable and encouraging.
5. Output ONLY valid JSON matching the structure of the input item.
6. AVOID PAST ERRORS: Review the following error memory and ensure you do not repeat these mistakes:
${JSON.stringify(memoryRows, null, 2)}`;

    const prompt = `Here is the current math problem item:
${JSON.stringify(item, null, 2)}

Please optimize the following fields:
- hint_ladder (h1_strategy, h2_equation, h3_compute, h4_check_reflect)
- report_expectations (teaching_concepts, parent_report_suggestions, misconceptions)

Return the ENTIRE item JSON with the optimized fields.`;

    try {
      const optimizedItem = await callOpenAI(prompt, systemPrompt);

      // Validate the optimized item has the required fields
      if (optimizedItem.id === item.id && optimizedItem.hint_ladder && optimizedItem.report_expectations) {
        // Ensure no hint leaks the answer
        const answerStr = String(optimizedItem.answer);
        const h3 = String(optimizedItem.hint_ladder.h3_compute || '');
        if (h3.includes(answerStr)) {
          console.log(`Warning: Hint leak detected in optimized item ${item.id}. Reverting h3_compute.`);
          optimizedItem.hint_ladder.h3_compute = item.hint_ladder.h3_compute;
        }

        rows[idx] = optimizedItem;
        changed++;
        touched.push(item.id);
        console.log(`Successfully optimized item ${item.id}.`);
      } else {
        console.log(`Warning: Optimized item ${item.id} is missing required fields. Skipping.`);
      }
    } catch (err) {
      console.error(`Error optimizing item ${item.id}:`, err.message);
    }
  }

  if (changed > 0) {
    writeJsonl(goldenPath, rows);
  }

  fs.mkdirSync(path.join(cwd, 'artifacts'), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        changed,
        touched,
        source: 'agent-web-search-optimization',
        targetFile: 'golden/grade5_pack_v1.jsonl',
        timestamp: new Date().toISOString()
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Agent web search optimization complete, changed=${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
