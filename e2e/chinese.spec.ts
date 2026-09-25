import { expect, test } from '@playwright/test';

test('Chinese language covers navigation, lessons, search, and survives reload', async ({ page }) => {
  await page.goto('./#/course');
  await page.getByRole('button', { name: 'Switch to Simplified Chinese' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('link', { name: '课程', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '课程' })).toBeVisible();

  await page.getByLabel('搜索').fill('级进');
  await expect(page.getByRole('link', { name: '同音、级进与跳进' })).toBeVisible();
  await page.getByRole('link', { name: '同音、级进与跳进' }).click();
  await expect(page.getByRole('heading', { name: '同音、级进与跳进' })).toBeVisible();
  await expect(page.getByText(/第 1 单元 — 把心中的声音带到琴键上/)).toBeVisible();
  await expect(page.getByText('先听出旋律的走向，之后再学习准确的音程名称。过早命名反而会妨碍聆听。')).toBeVisible();
  await expect(page.getByText('独立完成').first()).toBeVisible();
  await expect(page.getByText('所有三个答案都让你继续。', { exact: false }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '同音、级进与跳进' })).toBeVisible();

  await page.getByRole('button', { name: '切换为英文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Repeats, steps, and leaps' })).toBeVisible();
});
