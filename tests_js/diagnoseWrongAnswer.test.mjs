import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

const diagnosisPath = path.resolve('docs/exam-sprint/diagnosis.js');
const code = fs.readFileSync(diagnosisPath, 'utf8');
const sandbox = { globalThis: {} };
sandbox.window = sandbox.globalThis;
sandbox.global = sandbox.globalThis;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const diagnoseWrongAnswer = sandbox.globalThis.diagnoseWrongAnswer;

test('fraction average mistake should diagnose concept/calculation and provide 3 hints', () => {
  const q = {
    kind: 'u1_avg_fraction',
    question: '有 1 個緞帶，平均分給 7 人，每人多少？',
    answer_unit: 'fraction',
    answer: '1/7',
  };
  const out = diagnoseWrongAnswer(q, '7');
  assert.equal(Array.isArray(out.remediation_hints), true);
  assert.equal(out.remediation_hints.length >= 3, true);
  assert.equal(typeof out.error_detail, 'string');
});

test('decimal small mismatch should tend to rounding_error', () => {
  const q = {
    kind: 'u5_decimal_muldiv_price',
    question: '單價計算（小數）',
    answer_unit: 'number',
    answer: '3.26',
  };
  const out = diagnoseWrongAnswer(q, '3.2');
  assert.equal(['rounding_error', 'calculation_error'].includes(out.error_type), true);
});

test('unit conversion style wrong answer with unit text should detect unit_error or misunderstanding', () => {
  const q = {
    kind: 'u9_unit_convert_decimal',
    question: '把 1.5 公尺換成公分',
    answer_unit: 'number',
    answer: '150',
  };
  const out = diagnoseWrongAnswer(q, '150公分');
  assert.equal(['unit_error', 'misunderstanding', 'other'].includes(out.error_type), true);
});

test('sign opposite should detect sign_error', () => {
  const q = {
    kind: 'u2_frac_addsub_life',
    question: '原本有 3/4 公升，用掉 1/2 公升，還剩多少？',
    answer_unit: 'fraction',
    answer: '1/4',
  };
  const out = diagnoseWrongAnswer(q, '-1/4');
  assert.equal(['sign_error', 'calculation_error'].includes(out.error_type), true);
});

test('percent format parse issue should return misunderstanding and hints', () => {
  const q = {
    kind: 'u7_discount_percent',
    question: '打 8 折等於幾 %？',
    answer_unit: 'percent',
    answer: '80',
  };
  const out = diagnoseWrongAnswer(q, '八十趴');
  assert.equal(out.error_type, 'misunderstanding');
  assert.equal(out.remediation_hints.length >= 3, true);
});

test('first hint should describe operation decision for average/share question', () => {
  const q = {
    kind: 'u1_avg_fraction',
    question: '平均分給 6 人',
    answer_unit: 'fraction',
    answer: '1/6',
  };
  const out = diagnoseWrongAnswer(q, '6');
  assert.match(out.remediation_hints[0], /平均|÷|除/);
});
