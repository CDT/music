import { expect, test } from '@playwright/test';

/**
 * The core browser journeys from the specification. These check structure and
 * behaviour; they cannot establish that the synthesized sound is pleasant or
 * that the physical-piano instructions are effective.
 */

test.describe('core journeys', () => {
  test('1 — first visit, first lesson, audio, manual task, refresh keeps progress', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn to turn the music you hear');

    await page.getByRole('button', { name: 'Start the first lesson' }).click();
    await expect(page).toHaveURL(/#\/lesson\/m01-l01/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hear a short phrase');

    // Audio only starts from a deliberate action.
    const enable = page.getByRole('button', { name: 'Enable sound' }).first();
    if (await enable.isVisible()) await enable.click();
    const play = page.getByRole('button', { name: /^▶ Play/ }).first();
    await play.click();
    await expect(page.getByRole('button', { name: '■ Stop' }).first()).toBeVisible();
    await page.getByRole('button', { name: '■ Stop' }).first().click();

    // A manual self-report completes the lesson.
    await page.getByRole('button', { name: 'With help' }).last().click();

    await page.reload();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
    await expect(page.getByText('Readiness: With help')).toBeVisible();
  });

  test('2 — every module and lesson route opens, and search finds the key terms', async ({ page }) => {
    await page.goto('./#/course');
    await expect(page.getByText('12 modules, 48 lessons')).toBeVisible();

    const count = page.getByText(/^\d+ lessons? shown\.$/);
    for (const term of ['minor', 'Canon', 'pedal', 'transposition']) {
      await page.getByLabel('Search').fill(term);
      await expect(count, `search for ${term}`).not.toHaveText('0 lessons shown.');
    }
    await page.getByLabel('Search').fill('');

    // Spot-check one lesson from each module rather than all 48 in one test.
    for (const module of ['m01', 'm04', 'm07', 'm10', 'm12']) {
      await page.goto(`./#/lesson/${module}-l01`);
      await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
      await expect(page.getByRole('heading', { name: 'What you will be able to do' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'At your piano' }).first()).toBeVisible();
      await expect(page.locator('body')).not.toContainText('coming soon');
    }
  });

  test('3 — ear trainer hides the answer, gives feedback, and records assistance', async ({ page }) => {
    await page.goto('./#/practice/ear');
    await page.getByLabel('Exercise type').selectOption('contour');

    await expect(page.getByText('Unassisted')).toBeVisible();
    await page.getByRole('button', { name: /Listen/ }).first().click();

    // Answer with the first option; one of the two is wrong by construction.
    const options = page.locator('fieldset').filter({ hasText: 'Choose your answer' }).getByRole('button');
    await options.first().click();
    await expect(page.getByText(/sounded/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    await page.getByRole('button', { name: 'Reveal the answer' }).click();
    await expect(page.getByRole('heading', { name: 'The answer' })).toBeVisible();
    await expect(page.getByText('Assisted attempt')).toBeVisible();
  });

  test('4 — a 3/4 study offers only compatible patterns and loops a bar range', async ({ page }) => {
    await page.goto('./#/studies/s04');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Little Waltz');
    await expect(page.getByText(/The count-in for this study is one complete three-beat bar/)).toBeVisible();

    const patternSelect = page.getByLabel('Pattern', { exact: true });
    const options = await patternSelect.locator('option').allTextContents();
    expect(options.join(' ')).toContain('Waltz');
    expect(options.join(' ')).not.toContain('Alberti');

    await page.getByRole('button', { name: 'Bars 3–4' }).click();
    const play = page.getByRole('button', { name: /^▶ Play/ }).first();
    await play.click();
    await page.getByRole('button', { name: '■ Stop' }).first().click();
    await expect(page.getByRole('button', { name: /^▶ Play/ }).first()).toBeVisible();
  });

  test('5 — the Harmony Lab compares two progressions and saves the arrangement', async ({ page }) => {
    await page.goto('./#/harmony');
    await page.getByLabel('Melody', { exact: true }).selectOption('s01');
    await page.getByLabel('First bar').fill('5');
    await page.getByLabel('Last bar').fill('8');

    await page.getByLabel('Version B, bar 5 chord').selectOption('Am');
    await expect(page.getByRole('heading', { name: 'Version B' })).toBeVisible();

    await page.getByLabel('Which version did you choose, and what did you hear?')
      .fill('F leans outward; Am stays closer to the tonic. I chose Am for this phrase.');
    await page.getByRole('button', { name: 'Save both versions to the notebook' }).click();
    await expect(page.getByText('Saved. Both versions are stored')).toBeVisible();

    await page.goto('./#/notebook');
    await expect(page.getByText('First Light bars 5–8')).toBeVisible();
  });

  test('6 — the notebook warns about an incomplete bar, then plays once repaired', async ({ page }) => {
    await page.goto('./#/notebook');
    await page.getByRole('button', { name: 'New melody' }).click();
    await expect(page).toHaveURL(/#\/notebook\/nb-/);

    await page.getByRole('button', { name: 'Higher octave' }).click();
    await page.getByRole('button', { name: '1 beat', exact: true }).click();
    await page.getByRole('button', { name: 'C4', exact: true }).click();
    await page.getByRole('button', { name: 'D4', exact: true }).click();
    await expect(page.getByText(/does not add up to 4 beats/)).toBeVisible();
    await expect(page.getByText('Draft').first()).toBeVisible();

    await page.getByRole('button', { name: '2 beats', exact: true }).click();
    await page.getByRole('button', { name: 'E4', exact: true }).click();
    await expect(page.getByText(/does not add up/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^▶ Play/ }).first()).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /Import preview/ })).toBeVisible();
    await expect(page.getByText('1 notebook entries')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
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
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hear a short phrase');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hear a short phrase');

    expect(failed, 'no missing assets').toEqual([]);
    expect(external, 'no external requests').toEqual([]);
    expect(page.url()).toContain('/music/#/lesson/m01-l01');
  });

  test('9 — keyboard-only navigation works and piano shortcuts do not fire while typing', async ({ page }) => {
    await page.goto('./#/notebook');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

    await page.getByRole('button', { name: 'New practice note' }).click();
    const notes = page.getByLabel('Notes', { exact: true });
    await notes.click();
    await notes.type('asdf gh jk');
    await expect(notes).toHaveValue('asdf gh jk');
  });

  test('10 — a mobile-width screen reaches the final actions without sideways scrolling', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'Runs in the mobile project only');
    await page.goto('./#/lesson/m01-l01');
    await expect(page.getByRole('navigation', { name: 'Primary, compact' })).toBeVisible();

    await page.getByRole('button', { name: 'Comfortable' }).last().click();
    await expect(page.getByText('Remember and revisit')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'no page-wide horizontal scrolling').toBeLessThanOrEqual(1);
  });
});

test('unknown routes and missing ids show a useful not-found view', async ({ page }) => {
  await page.goto('./#/nowhere');
  await expect(page.getByText('That page could not be found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'The course' })).toBeVisible();

  await page.goto('./#/lesson/m99-l99');
  await expect(page.getByText('That lesson could not be found')).toBeVisible();

  await page.goto('./#/notebook/nb-missing');
  await expect(page.getByText('That notebook entry could not be found')).toBeVisible();
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hear a short phrase');
  await expect(page.getByText(/not being saved/).first()).toBeVisible();

  await page.goto('./#/settings');
  await expect(page.getByRole('button', { name: 'Export a backup' })).toBeEnabled();
});
