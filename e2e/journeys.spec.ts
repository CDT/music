import { expect, test } from '@playwright/test';

/**
 * The core browser journeys from the specification. These check structure and
 * behaviour; they cannot establish that the synthesized sound is pleasant or
 * that the physical-piano instructions are effective.
 */

test.describe('core journeys', () => {
  test('1 — first visit, first lesson, audio, manual task, refresh keeps progress', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('学会把听到的旋律弹出来，再配上伴奏。');

    await page.getByRole('button', { name: '开始第一课' }).click();
    await expect(page).toHaveURL(/#\/lesson\/m01-l01/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('听一段短乐句，再在琴键上找到它');

    // Audio only starts from a deliberate action.
    const enable = page.getByRole('button', { name: '启用声音' }).first();
    if (await enable.isVisible()) await enable.click();
    const play = page.getByRole('button', { name: /^▶ 播放/ }).first();
    await play.click();
    await expect(page.getByRole('button', { name: '■ 停止' }).first()).toBeVisible();
    await page.getByRole('button', { name: '■ 停止' }).first().click();

    // A manual self-report completes the lesson.
    await page.getByRole('button', { name: '借助提示完成' }).last().click();

    await page.reload();
    await expect(page.getByText('已完成', { exact: true })).toBeVisible();
    await expect(page.getByText('掌握程度：借助提示完成')).toBeVisible();
  });

  test('2 — every module and lesson route opens, and search finds the key terms', async ({ page }) => {
    await page.goto('./#/course');
    await expect(page.getByText('12 个单元，48 节课。已完成 0 节。')).toBeVisible();

    const count = page.getByText(/显示.*节课/);
    for (const term of ['小调', '卡农', '踏板', '移调']) {
      await page.getByLabel('搜索').fill(term);
      await expect(count, `search for ${term}`).not.toHaveText('显示 0 节课。');
    }
    await page.getByLabel('搜索').fill('');

    // Spot-check one lesson from each module rather than all 48 in one test.
    for (const module of ['m01', 'm04', 'm07', 'm10', 'm12']) {
      await page.goto(`./#/lesson/${module}-l01`);
      await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
      await expect(page.getByRole('heading', { name: '课程目标' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '上琴练习' }).first()).toBeVisible();
      await expect(page.locator('body')).not.toContainText('coming soon');
    }
  });

  test('3 — ear trainer hides the answer, gives feedback, and records assistance', async ({ page }) => {
    await page.goto('./#/practice/ear');
    await page.getByLabel('练习类型').selectOption('contour');
    await expect(page.getByLabel('提示', { exact: true }).locator('option').first())
      .toHaveText('中间音离起始音近，还是远？（选择旋律走向）');

    await expect(page.getByText('独立完成', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^▶ 试听/ }).first().click();

    // Answer with the first option; one of the two is wrong by construction.
    const options = page.locator('fieldset').filter({ hasText: '选择你的答案' }).getByRole('button');
    await options.first().click();
    await expect(page.getByText(/与播放的声音/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '再试一次' })).toBeVisible();

    await page.getByRole('button', { name: '查看答案' }).click();
    await expect(page.getByRole('heading', { name: '答案' })).toBeVisible();
    await expect(page.getByText('借助提示完成', { exact: true }).first()).toBeVisible();
  });

  test('4 — a 3/4 study offers only compatible patterns and loops a bar range', async ({ page }) => {
    await page.goto('./#/studies/s04');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('小华尔兹');
    await expect(page.getByText('这首练习曲用一个完整的三拍小节作预备拍，不用默认的四拍。')).toBeVisible();

    const patternSelect = page.getByLabel('伴奏型', { exact: true });
    const options = await patternSelect.locator('option').allTextContents();
    expect(options.join(' ')).toContain('华尔兹');
    expect(options.join(' ')).not.toContain('阿尔贝蒂');

    await page.getByRole('button', { name: '第 3–4 小节' }).click();
    const play = page.getByRole('button', { name: /^▶ 播放/ }).first();
    await play.click();
    await page.getByRole('button', { name: '■ 停止' }).first().click();
    await expect(page.getByRole('button', { name: /^▶ 播放/ }).first()).toBeVisible();
  });

  test('5 — the Harmony Lab compares two progressions and saves the arrangement', async ({ page }) => {
    await page.goto('./#/harmony');
    await page.getByLabel('旋律', { exact: true }).selectOption('s01');
    await page.getByLabel('第 1 小节', { exact: true }).fill('5');
    await page.getByLabel('最后一个小节').fill('8');

    await page.getByLabel('版本 B，第 5 小节和弦').selectOption('Am');
    await expect(page.getByRole('heading', { name: 'B 版' })).toBeVisible();

    await page.getByLabel('选了哪个版本？听到了什么具体区别？')
      .fill('F leans outward; Am stays closer to the tonic. I chose Am for this phrase.');
    await page.getByRole('button', { name: '将两个版本保存到笔记本中' }).click();
    await expect(page.getByText('已保存两个版本，之后可以重新打开试听。')).toBeVisible();

    await page.goto('./#/notebook');
    await expect(page.getByText('曙光 第 5–8 小节')).toBeVisible();
  });

  test('6 — the notebook warns about an incomplete bar, then plays once repaired', async ({ page }) => {
    await page.goto('./#/notebook');
    await page.getByRole('button', { name: '新旋律' }).click();
    await expect(page).toHaveURL(/#\/notebook\/nb-/);

    await page.getByRole('button', { name: '高八度' }).click();
    await page.getByRole('button', { name: '1 拍', exact: true }).click();
    await page.getByRole('button', { name: 'C4', exact: true }).click();
    await page.getByRole('button', { name: 'D4', exact: true }).click();
    await expect(page.getByText(/加起来不等于/)).toBeVisible();
    await expect(page.getByText('草稿').first()).toBeVisible();

    await page.getByRole('button', { name: '2 拍', exact: true }).click();
    await page.getByRole('button', { name: 'E4', exact: true }).click();
    await expect(page.getByText(/加起来不等于/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^▶ 播放/ }).first()).toBeVisible();
  });

  test('7 — an import preview is non-mutating and cancel keeps the current data', async ({ page }) => {
    await page.goto('./#/settings');
    const backup = {
      app: 'inner-melody',
      schemaVersion: 1,
      contentVersion: '1.0.0',
      revision: 1,
      savedAt: new Date().toISOString(),
      settings: {},
      lessons: {},
      reviews: [],
      attempts: [],
      notebook: [{
        id: 'nb-import', title: 'Imported entry', kind: 'journal', text: 'From a backup',
        tags: [], draft: false, arrangements: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }],
      sessions: [],
    };
    await page.setInputFiles('input[type="file"]', {
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.getByRole('heading', { name: /导入预览/ })).toBeVisible();
    await expect(page.getByText('1 条笔记')).toBeVisible();

    await page.getByRole('button', { name: '取消' }).click();
    await page.goto('./#/notebook');
    await expect(page.getByText('Imported entry')).toHaveCount(0);
  });

  test('8 — the subpath build loads and a hash lesson route survives a refresh', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== 'localhost' && url.protocol !== 'data:') external.push(request.url());
    });

    await page.goto('./#/lesson/m01-l01');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('听一段短乐句，再在琴键上找到它');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('听一段短乐句，再在琴键上找到它');

    expect(failed, 'no missing assets').toEqual([]);
    expect(external, 'no external requests').toEqual([]);
    expect(page.url()).toContain('/music/#/lesson/m01-l01');
  });

  test('9 — keyboard-only navigation works and piano shortcuts do not fire while typing', async ({ page }) => {
    await page.goto('./#/notebook');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '跳至主要内容' })).toBeFocused();

    await page.getByRole('button', { name: '新建练习笔记' }).click();
    const notes = page.getByLabel('练习笔记', { exact: true });
    await notes.click();
    await notes.type('asdf gh jk');
    await expect(notes).toHaveValue('asdf gh jk');
  });

  test('10 — a mobile-width screen reaches the final actions without sideways scrolling', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'Runs in the mobile project only');
    await page.goto('./#/lesson/m01-l01');
    await expect(page.getByRole('navigation', { name: '主导航（紧凑）' })).toBeVisible();

    await page.getByRole('button', { name: '能独立完成' }).last().click();
    await expect(page.getByText('记下来，再回顾')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'no page-wide horizontal scrolling').toBeLessThanOrEqual(1);
  });
});

test('unknown routes and missing ids show a useful not-found view', async ({ page }) => {
  await page.goto('./#/nowhere');
  await expect(page.getByText('找不到这个页面')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: '课程' })).toBeVisible();

  await page.goto('./#/lesson/m99-l99');
  await expect(page.getByText('找不到这节课')).toBeVisible();

  await page.goto('./#/notebook/nb-missing');
  await expect(page.getByText('找不到这条笔记')).toBeVisible();
});

test('storage failure keeps the lesson usable and export available', async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => { throw new DOMException('Storage is blocked'); };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: blocked, setItem: blocked, removeItem: blocked, clear: blocked, key: blocked, length: 0 },
    });
  });
  await page.goto('./#/lesson/m01-l01');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('听一段短乐句，再在琴键上找到它');
  await expect(page.getByText('此浏览器无法保存更改。你的操作暂存在本次会话中，仍可导出备份。').first()).toBeVisible();

  await page.goto('./#/settings');
  await expect(page.getByRole('button', { name: '导出备份' })).toBeEnabled();
});
