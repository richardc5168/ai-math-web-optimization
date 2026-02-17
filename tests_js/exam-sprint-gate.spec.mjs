import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pagePath = pathToFileURL(path.resolve('docs/exam-sprint/index.html')).href;

test('wrong answer enters diagnosis gate and Enter acknowledges', async ({ page }) => {
  await page.goto(pagePath);

  await page.getByTestId('next').click();
  await page.locator('#answer').fill('999999');
  await page.getByTestId('submit').click();

  await expect(page.getByTestId('wrong-diagnosis')).toBeVisible();
  await expect(page.getByTestId('remedial-hints')).toBeVisible();
  await expect(page.getByTestId('next')).toBeDisabled();

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('next')).toBeEnabled();

  const wrongSaved = await page.evaluate(() => {
    const raw = localStorage.getItem('examSprint.v1');
    if (!raw) return false;
    const obj = JSON.parse(raw);
    const attempts = Array.isArray(obj?.attempts) ? obj.attempts : [];
    const last = attempts[attempts.length - 1];
    return Boolean(last && last.is_correct === false && last.error_type && last.ack_time && last.ack_method === 'enter');
  });
  expect(wrongSaved).toBeTruthy();
});

test('correct answer enables next without gate', async ({ page }) => {
  await page.goto(pagePath);

  await page.getByTestId('next').click();

  const answer = await page.evaluate(() => {
    const text = document.getElementById('qText')?.textContent || '';
    const bank = Array.isArray(window.EXAM_SPRINT_BANK) ? window.EXAM_SPRINT_BANK : [];
    const q = bank.find((it) => String(it.question || '') === String(text));
    return q ? String(q.answer) : '';
  });

  await page.locator('#answer').fill(answer);
  await page.getByTestId('submit').click();

  await expect(page.getByTestId('next')).toBeEnabled();
  await expect(page.locator('#wrongGate')).toBeHidden();
});
