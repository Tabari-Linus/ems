import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }>;
}

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface VisualSuite {
  /** Describe-block name, e.g. "Feedback and overlays". */
  name: string;
  /** Story id prefixes (sidebar group + component), e.g. 'overlays-' or 'actions-inputs-button--'. */
  include: readonly string[];
  /** Story ids (or prefixes) to leave out, e.g. stories whose end state is time-based. */
  exclude?: readonly string[];
  /** Viewports per story; default one 800x600 frame. */
  viewports?: (storyId: string) => readonly Viewport[] | undefined;
  /** Fail when the built Storybook has fewer matching stories (guards a renamed group). */
  minStories?: number;
}

const DEFAULT_VIEWPORT: Viewport = { name: 'default', width: 800, height: 600 };
export const DESKTOP: Viewport = { name: 'desktop', width: 1440, height: 900 };
export const PHONE: Viewport = { name: 'phone', width: 390, height: 844 };

const themes = ['light', 'dark'] as const;

/**
 * Light + dark screenshot and an axe pass (story root and CDK overlay container) for every story
 * of the built Storybook (`npm run storybook:build`) that matches the suite. New stories get a
 * baseline without touching the spec. Baselines: visual/baselines/<id>[-<viewport>]-<theme>-…png.
 */
export function visualSuite(suite: VisualSuite): void {
  const index = JSON.parse(
    readFileSync(join(process.cwd(), 'storybook-static', 'index.json'), 'utf8'),
  ) as StoryIndex;
  const stories = Object.values(index.entries).filter(
    (e) =>
      e.type === 'story' &&
      suite.include.some((p) => e.id.startsWith(p)) &&
      !suite.exclude?.some((p) => e.id.startsWith(p)),
  );

  test(`the built Storybook contains the ${suite.name} stories`, () => {
    expect(stories.length).toBeGreaterThanOrEqual(suite.minStories ?? 1);
    for (const prefix of suite.include) {
      expect(
        stories.some((s) => s.id.startsWith(prefix)),
        prefix,
      ).toBe(true);
    }
  });

  for (const theme of themes) {
    test.describe(`${suite.name} (${theme})`, () => {
      test.describe.configure({ timeout: 60_000 });
      for (const story of stories) {
        const viewports = suite.viewports?.(story.id) ?? [DEFAULT_VIEWPORT];
        for (const viewport of viewports) {
          const suffix = viewport === DEFAULT_VIEWPORT ? '' : ` (${viewport.name})`;
          test(`${story.title} / ${story.name}${suffix}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await openStory(page, story.id, theme);

            // No horizontal page scroll at any width.
            const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            );
            expect(overflow).toBeLessThanOrEqual(0);

            const file =
              viewport === DEFAULT_VIEWPORT
                ? `${story.id}-${theme}.png`
                : `${story.id}-${viewport.name}-${theme}.png`;
            await expect(page).toHaveScreenshot(file, { fullPage: true });

            const builder = new AxeBuilder({ page }).include('#storybook-root');
            if ((await page.locator('.cdk-overlay-container').count()) > 0) {
              builder.include('.cdk-overlay-container');
            }
            const axe = await builder.analyze();
            expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
          });
        }
      }
    });
  }
}

/** Opens a story in the given theme and waits for its play function (the end state is captured). */
export async function openStory(page: Page, id: string, theme: 'light' | 'dark'): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
        }
      ).__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished',
    null,
    { timeout: 30_000 },
  );
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(() => document.fonts.ready);
}
