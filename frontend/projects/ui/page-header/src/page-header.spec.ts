import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-page-header
    title="People"
    [count]="count()"
    [description]="description()"
    [level]="level()"
  >
    <button uiPageHeaderActions type="button">Add person</button>
  </ui-page-header>`,
})
class Host {
  readonly count = signal<string | number | null>('9 people');
  readonly description = signal<string | null>(null);
  readonly level = signal<unknown>(1);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-page-header') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { el, update };
}

describe('PageHeader', () => {
  it('renders an h1 title, count and actions, without a native tooltip', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('People');
    expect(el.querySelector('.ui-page-header__count')?.textContent).toBe('9 people');
    expect(el.querySelector('.ui-page-header__actions button')).not.toBeNull();
    expect(el.querySelector('.ui-page-header__description')).toBeNull();
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('renders a description and hides an empty count', async () => {
    const { el, update } = await setup();
    await update((h) => {
      h.description.set('Everyone at Akwaaba Labs.');
      h.count.set('');
    });
    expect(el.querySelector('.ui-page-header__description')?.textContent).toBe(
      'Everyone at Akwaaba Labs.',
    );
    expect(el.querySelector('.ui-page-header__count')).toBeNull();
  });

  it('renders an h2 at level 2 and falls back to h1 otherwise', async () => {
    const { el, update } = await setup();
    await update((h) => h.level.set('2'));
    expect(el.querySelector('h2')).not.toBeNull();
    await update((h) => h.level.set(7));
    expect(el.querySelector('h1')).not.toBeNull();
  });
});
