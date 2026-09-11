import { expect, test } from '@playwright/test';

test('the print course view renders all 48 lessons without navigation', async ({ page }) => {
  await page.goto('./#/print/course');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);

  const text = await page.locator('body').textContent();
  for (const id of ['m01-l01', 'm06-l03', 'm12-l04']) expect(text).toContain(id);
  const headings = await page.locator('h3').count();
  expect(headings).toBe(48);

  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Print this course' })).toBeHidden();
});

test('a lesson page prints without controls and keeps its note data', async ({ page }) => {
  await page.goto('./#/lesson/m04-l04');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
  await expect(page.getByRole('button', { name: /Play/ }).first()).toBeHidden();
  await expect(page.getByRole('heading', { name: 'What you will be able to do' })).toBeVisible();
  await expect(page.locator('table').first()).toBeVisible();
});
