import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card } from './card';

@Component({
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-card
    [title]="title()"
    [count]="count()"
    [level]="level()"
    [flush]="flush()"
    [radius]="radius()"
  >
    <a uiCardActions href="#all">All requests</a>
    <p>Body</p>
    <span uiCardFooter>Footer</span>
  </ui-card>`,
})
class Host {
  readonly title = signal<string | null>('Needs your attention');
  readonly count = signal<string | number | null>(2);
  readonly level = signal<unknown>(2);
  readonly flush = signal(false);
  readonly radius = signal<'lg' | 'xl'>('xl');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-card') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { el, update };
}

describe('Card', () => {
  it('is a section labelled by its h2 title with a count and slots', async () => {
    const { el } = await setup();
    const section = el.querySelector('section') as HTMLElement;
    const heading = el.querySelector('h2') as HTMLElement;
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toContain('Needs your attention');
    expect(el.querySelector('.ui-card__count')?.textContent?.trim()).toBe('2');
    expect(el.querySelector('.ui-card__actions a')).not.toBeNull();
    expect(el.querySelector('.ui-card__body p')?.textContent).toBe('Body');
    expect(el.querySelector('.ui-card__footer')?.textContent).toBe('Footer');
    expect(el.dataset['radius']).toBe('xl');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it.each([
    [3, 'h3'],
    [4, 'h4'],
    ['9', 'h2'],
  ])('level %s renders %s', async (level, tag) => {
    const { el, update } = await setup();
    await update((h) => h.level.set(level));
    expect(el.querySelector(tag)).not.toBeNull();
  });

  it('hides the count when null and supports flush and lg radius', async () => {
    const { el, update } = await setup();
    await update((h) => {
      h.count.set(null);
      h.flush.set(true);
      h.radius.set('lg');
    });
    expect(el.querySelector('.ui-card__count')).toBeNull();
    expect(el.hasAttribute('data-flush')).toBe(true);
    expect(el.dataset['radius']).toBe('lg');
  });

  it('without a title has no heading and no accessible name', async () => {
    const { el, update } = await setup();
    await update((h) => h.title.set(null));
    expect(el.querySelector('h2')).toBeNull();
    expect(el.querySelector('section')?.hasAttribute('aria-labelledby')).toBe(false);
  });
});
