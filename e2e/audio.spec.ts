import { expect, test } from '@playwright/test';

/**
 * Structural checks on audio scheduling. Automation can confirm that voices are
 * created after a user gesture and released on Stop; it cannot establish that
 * the synthesized sound is pleasant. Audition the examples by hand as well.
 */

declare global {
  interface Window {
    __audio?: { started: number; stopped: number; contexts: number };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__audio = { started: 0, stopped: 0, contexts: 0 };
    const RealContext = window.AudioContext;
    class CountingContext extends RealContext {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        window.__audio!.contexts += 1;
      }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: CountingContext });

    const start = OscillatorNode.prototype.start;
    const stop = OscillatorNode.prototype.stop;
    OscillatorNode.prototype.start = function patchedStart(this: OscillatorNode, when?: number) {
      window.__audio!.started += 1;
      return start.call(this, when);
    };
    OscillatorNode.prototype.stop = function patchedStop(this: OscillatorNode, when?: number) {
      window.__audio!.stopped += 1;
      return stop.call(this, when);
    };
  });
});

test('no audio context is created before a deliberate user gesture', async ({ page }) => {
  await page.goto('./#/lesson/m01-l01');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => window.__audio!.contexts)).toBe(0);
  expect(await page.evaluate(() => window.__audio!.started)).toBe(0);
});

test('playing a score schedules voices, and one shared context is reused', async ({ page }) => {
  await page.goto('./#/studies/s01');
  await page.getByRole('button', { name: '启用声音' }).first().click();
  expect(await page.evaluate(() => window.__audio!.contexts)).toBe(1);

  await page.getByRole('button', { name: /^▶ 播放/ }).first().click();
  await expect.poll(() => page.evaluate(() => window.__audio!.started)).toBeGreaterThan(3);

  // Starting another example stops the previous one rather than layering it.
  await page.getByRole('button', { name: '■ 停止' }).first().click();
  await expect.poll(() => page.evaluate(() => window.__audio!.stopped)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__audio!.contexts)).toBe(1);
});

test('a route change stops scheduled playback', async ({ page }) => {
  await page.goto('./#/studies/s01');
  await page.getByRole('button', { name: '启用声音' }).first().click();
  await page.getByRole('button', { name: /^▶ 播放/ }).first().click();
  await expect.poll(() => page.evaluate(() => window.__audio!.started)).toBeGreaterThan(0);

  await page.getByRole('link', { name: '参考资料' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '参考资料' })).toBeVisible();
  const stopped = await page.evaluate(() => window.__audio!.stopped);
  expect(stopped).toBeGreaterThan(0);

  // Nothing keeps scheduling after the route changed.
  const before = await page.evaluate(() => window.__audio!.started);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__audio!.started)).toBe(before);
});

test('the settings diagnostic plays and stops without developer tools', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: '启用声音' }).click();
  await page.getByRole('button', { name: '弹奏三和弦' }).click();
  await expect.poll(() => page.evaluate(() => window.__audio!.started)).toBeGreaterThanOrEqual(3);
  await page.getByRole('button', { name: '停止全部声音' }).click();
  await expect.poll(() => page.evaluate(() => window.__audio!.stopped)).toBeGreaterThan(0);
});
