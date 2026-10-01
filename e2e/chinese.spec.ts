import { expect, test } from '@playwright/test';

test('Chinese is the only language, including with a saved English preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('inner-melody-language', 'en'));
  await page.goto('./#/course');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page).toHaveTitle('从心中旋律到钢琴');
  await expect(page.getByRole('button', { name: /English|切换为英文|Switch to Simplified Chinese/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '课程', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '课程' })).toBeVisible();

  await page.getByLabel('搜索').fill('级进');
  await expect(page.getByRole('link', { name: '同音、级进与跳进' })).toBeVisible();
  await page.getByRole('link', { name: '同音、级进与跳进' }).click();
  await expect(page.getByRole('heading', { name: '同音、级进与跳进' })).toBeVisible();
  await expect(page.getByText(/第 1 单元 — 把心中的声音带到琴键上/)).toBeVisible();
  await expect(page.getByText('先听出旋律的走向，之后再学习准确的音程名称。过早命名反而会妨碍聆听。')).toBeVisible();
  await expect(page.getByText('独立完成').first()).toBeVisible();
  await expect(page.getByText('三种回答都不会妨碍你继续学习。', { exact: false }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '同音、级进与跳进' })).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Repeats, steps, and leaps' })).toHaveCount(0);

  await page.goto('./#/studies/s04');
  await expect(page.getByText('只提供适合 3/4 拍的伴奏型，不会自动改动其他伴奏型来凑拍数。')).toBeVisible();
  await page.goto('./#/studies/s04?key=Am');
  await expect(page.getByText('这首练习曲是大调，可以移到其他大调。改变调式会改变音乐本身，不属于单纯移调。')).toBeVisible();
});
