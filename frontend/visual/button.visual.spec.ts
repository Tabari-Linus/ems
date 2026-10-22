import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }>;
}

// Stories are discovered from the built Storybook, so a new Button story gets a baseline
// (and an axe run) without touching this file.
const index = JSON.parse(
  readFileSync(join(process.cwd(), 'storybook-static', 'index.json'), 'utf8'),
) as StoryIndex;
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && entry.id.startsWith('components-button--'),
);
const themes = ['light', 'dark'] as const;

test('the built Storybook contains Button stories', () => {
  expect(stories.length).toBeGreaterThan(0);
});

for (const theme of themes) {
  test.describe(`Button (${theme})`, () => {
    for (const story of stories) {
      test(story.name, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
        await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
        const root = page.locator('#storybook-root');
        await expect(root.locator('.ui-button').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        // Wait until the story, including its play function, has completed: the end state
        // (e.g. a focused button) is part of the baseline.
        await page.waitForFunction(() => {
          const preview = (
            window as unknown as {
              __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
            }
          ).__STORYBOOK_PREVIEW__;
          return preview?.currentRender?.phase === 'finished';
        });

        await expect(page).toHaveScreenshot(`${story.id}-${theme}.png`, { fullPage: true });

        const axe = await new AxeBuilder({ page }).include('#storybook-root').analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }
  });
}
