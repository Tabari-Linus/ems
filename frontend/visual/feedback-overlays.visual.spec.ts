import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }>;
}

// Phase A2 feedback and overlay components. Stories are discovered from the built Storybook, so a
// new story gets a baseline (and an axe run in both themes) without touching this file.
const PREFIXES = [
  'alert',
  'toast',
  'spinner',
  'skeleton',
  'empty-state',
  'error-state',
  'status-pill',
  'tag',
  'dialog',
  'drawer',
  'menu',
  'tooltip',
].map((name) => `components-${name}--`);

const index = JSON.parse(
  readFileSync(join(process.cwd(), 'storybook-static', 'index.json'), 'utf8'),
) as StoryIndex;
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && PREFIXES.some((prefix) => entry.id.startsWith(prefix)),
);
const themes = ['light', 'dark'] as const;

test('the built Storybook contains the feedback and overlay stories', () => {
  for (const prefix of PREFIXES) {
    expect(
      stories.some((s) => s.id.startsWith(prefix)),
      prefix,
    ).toBe(true);
  }
});

for (const theme of themes) {
  test.describe(`Feedback and overlays (${theme})`, () => {
    test.describe.configure({ timeout: 60_000 });
    for (const story of stories) {
      test(`${story.title} / ${story.name}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
        await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
        // The end state of the play function (an open dialog, a focused item) is part of the
        // baseline, so wait until it has finished.
        await page.waitForFunction(
          () => {
            const preview = (
              window as unknown as {
                __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
              }
            ).__STORYBOOK_PREVIEW__;
            return preview?.currentRender?.phase === 'finished';
          },
          null,
          { timeout: 30_000 },
        );
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        await expect(page).toHaveScreenshot(`${story.id}-${theme}.png`, { fullPage: true });

        // Overlays render outside #storybook-root, in the CDK overlay container.
        const builder = new AxeBuilder({ page }).include('#storybook-root');
        if ((await page.locator('.cdk-overlay-container').count()) > 0) {
          builder.include('.cdk-overlay-container');
        }
        const axe = await builder.analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }
  });
}
