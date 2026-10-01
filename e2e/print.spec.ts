import { expect, test } from '@playwright/test';

test('the print course view renders all 48 lessons without navigation', async ({ page }) => {
  await page.goto('./#/print/course');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);

  const text = await page.locator('body').textContent();
  for (const id of ['m01-l01', 'm06-l03', 'm12-l04']) expect(text).toContain(id);
  const headings = await page.locator('h3').count();
  expect(headings).toBe(48);
  expect(text).toContain('完整课程共 12 个单元、48 节课。');
  expect(text).toContain('级进模仿：C–D–C · C 大调');
  expect(text).not.toContain('The complete written course');
  expect(text).toContain('这节课练习把声音对应到琴键。');
  expect(text).toContain('再看弱起：它是第一个完整小节之前的一个或几个音');
  for (const mistranslation of ['拾音器', '补品', '脉搏', '四根打开的杆']) {
    expect(text).not.toContain(mistranslation);
  }

  await expect(page.getByRole('navigation', { name: '主导航', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: '打印本课程' })).toBeHidden();
});

test('a lesson page prints without controls and keeps its note data', async ({ page }) => {
  await page.goto('./#/lesson/m04-l04');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);
  await expect(page.getByRole('navigation', { name: '主导航', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: /播放/ }).first()).toBeHidden();
  await expect(page.getByRole('heading', { name: '课程目标' })).toBeVisible();
  await expect(page.locator('table').first()).toBeVisible();
});
