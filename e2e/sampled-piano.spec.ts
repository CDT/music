import { expect, test } from '@playwright/test';

/**
 * The optional recorded piano: nothing is fetched until it is chosen, the
 * download is reused from Cache Storage on later visits, notes then come from
 * the recording, and deleting it puts the synthesized piano back.
 */

declare global {
  interface Window {
    __play?: { buffers: number; oscillators: number };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__play = { buffers: 0, oscillators: 0 };
    const bufferStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function patched(this: AudioBufferSourceNode, when?: number) {
      window.__play!.buffers += 1;
      return bufferStart.call(this, when);
    };
    const oscStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function patched(this: OscillatorNode, when?: number) {
      window.__play!.oscillators += 1;
      return oscStart.call(this, when);
    };
  });
});

test('the recorded piano is opt-in, cached, and removable', async ({ page }) => {
  const downloads: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/piano/')) downloads.push(request.url());
  });

  // Nothing is fetched by simply opening the app with sound running.
  await page.goto('./#/settings');
  await page.getByRole('button', { name: '启用声音' }).click();
  await page.getByRole('button', { name: '弹奏三和弦' }).click();
  await expect.poll(() => page.evaluate(() => window.__play!.oscillators)).toBeGreaterThan(0);
  expect(downloads).toEqual([]);

  // Choosing the recorded piano downloads it once.
  await page.getByRole('radio', { name: /钢琴录音/ }).check();
  await expect(page.getByText('已加载钢琴录音音色，正在使用。')).toBeVisible({ timeout: 60_000 });
  expect(downloads.length).toBeGreaterThan(20);

  // Notes now come from the recording rather than from oscillators.
  const oscillatorsBefore = await page.evaluate(() => window.__play!.oscillators);
  const buffersBefore = await page.evaluate(() => window.__play!.buffers);
  await page.getByRole('button', { name: '弹奏三和弦' }).click();
  await expect.poll(() => page.evaluate(() => window.__play!.buffers)).toBeGreaterThan(buffersBefore + 2);
  expect(await page.evaluate(() => window.__play!.oscillators)).toBe(oscillatorsBefore);

  // A later visit loads it from the browser cache without touching the network.
  downloads.length = 0;
  await page.reload();
  await page.getByRole('button', { name: '启用声音' }).click();
  await expect(page.getByText('已加载钢琴录音音色，正在使用。')).toBeVisible({ timeout: 60_000 });
  expect(downloads).toEqual([]);

  // Deleting it returns to the synthesized piano.
  await page.getByRole('button', { name: '删除已下载的音色' }).click();
  await expect(page.getByRole('radio', { name: /合成钢琴/ })).toBeChecked();
  const oscillatorsAfterDelete = await page.evaluate(() => window.__play!.oscillators);
  await page.getByRole('button', { name: '弹奏三和弦' }).click();
  await expect.poll(() => page.evaluate(() => window.__play!.oscillators))
    .toBeGreaterThan(oscillatorsAfterDelete);
});

test('a first visit can choose the recorded piano before the course starts', async ({ page }) => {
  await page.goto('./#/start');
  await expect(page.getByRole('radio', { name: /合成钢琴/ })).toBeChecked();
  await expect(page.getByText(/下载一次/)).toBeVisible();
});
