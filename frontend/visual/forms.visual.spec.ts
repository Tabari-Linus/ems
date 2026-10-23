import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }>;
}

// Every story under "Forms/" (form field, input, select, checkbox, switch, password, search,
// filter pill), discovered from the built Storybook: light + dark screenshot and an axe pass.
const index = JSON.parse(
  readFileSync(join(process.cwd(), 'storybook-static', 'index.json'), 'utf8'),
) as StoryIndex;
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && entry.id.startsWith('forms-'),
);
const themes = ['light', 'dark'] as const;

test('the built Storybook contains Forms stories', () => {
  expect(stories.length).toBeGreaterThan(0);
});

for (const theme of themes) {
  test.describe(`Forms (${theme})`, () => {
    for (const story of stories) {
      test(`${story.title} / ${story.name}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
        await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
        await expect(page.locator('#storybook-root > *').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        // Wait for the play function: its end state (focus, open list, typed text) is captured.
        await page.waitForFunction(() => {
          const preview = (
            window as unknown as {
              __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
            }
          ).__STORYBOOK_PREVIEW__;
          return preview?.currentRender?.phase === 'finished';
        });

        await expect(page).toHaveScreenshot(`${story.id}-${theme}.png`, { fullPage: true });

        // Include the CDK overlay container so an open listbox is checked too.
        const axe = await new AxeBuilder({ page })
          .include('#storybook-root')
          .include('.cdk-overlay-container')
          .analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }
  });
}
