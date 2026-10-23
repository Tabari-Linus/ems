import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }>;
}

/**
 * Visual regression + axe (light and dark) for the layout & identity components (Phase A3):
 * app shell, nav item, page header, card, description list, data table, pagination, tabs,
 * avatar, person card, view toggle. Stories are discovered from the built Storybook.
 *
 * Composed app-shell stories are also captured at a phone width (390px) to guard the
 * off-canvas drawer and card-mode table layouts.
 */
const PREFIXES = [
  'layout-app-shell--',
  'layout-nav-item--',
  'layout-page-header--',
  'layout-card--',
  'layout-description-list--',
  'layout-data-table--',
  'layout-pagination--',
  'layout-tabs--',
  'layout-view-toggle--',
  'components-avatar--',
  'identity-person-card--',
];

const index = JSON.parse(
  readFileSync(join(process.cwd(), 'storybook-static', 'index.json'), 'utf8'),
) as StoryIndex;
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && PREFIXES.some((prefix) => entry.id.startsWith(prefix)),
);
const themes = ['light', 'dark'] as const;

test('the built Storybook contains the layout stories', () => {
  expect(stories.length).toBeGreaterThan(30);
});

for (const theme of themes) {
  test.describe(`Layout & identity (${theme})`, () => {
    for (const story of stories) {
      const viewports = story.id.startsWith('layout-app-shell--')
        ? [
            { name: 'desktop', width: 1440, height: 900 },
            { name: 'phone', width: 390, height: 844 },
          ]
        : [{ name: 'default', width: 800, height: 600 }];

      for (const viewport of viewports) {
        test(`${story.title} / ${story.name} (${viewport.name})`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
          await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
          await page.waitForFunction(() => {
            const preview = (
              window as unknown as {
                __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
              }
            ).__STORYBOOK_PREVIEW__;
            return preview?.currentRender?.phase === 'finished';
          });
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

          // No horizontal page scroll at any width.
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow).toBeLessThanOrEqual(0);

          await expect(page).toHaveScreenshot(`${story.id}-${viewport.name}-${theme}.png`, {
            fullPage: true,
          });

          const axe = await new AxeBuilder({ page }).include('#storybook-root').analyze();
          expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
        });
      }
    }
  });
}
