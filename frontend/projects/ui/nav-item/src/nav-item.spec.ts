import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavItem } from './nav-item';

@Component({
  imports: [NavItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a uiNavItem href="#requests" [badge]="badge()" [badgeMax]="max()"
    ><svg uiNavIcon></svg>Requests</a
  >`,
})
class Host {
  readonly badge = signal<unknown>(null);
  readonly max = signal(99);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const link = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { link, update };
}

describe('NavItem', () => {
  it('stays a native link with the icon slot and label', async () => {
    const { link } = await setup();
    expect(link.classList).toContain('ui-nav-item');
    expect(link.querySelector('.ui-nav-item__icon svg')).not.toBeNull();
    expect(link.querySelector('.ui-nav-item__label')?.textContent?.trim()).toBe('Requests');
    expect(link.querySelector('.ui-nav-item__badge')).toBeNull();
    expect(link.hasAttribute('data-has-badge')).toBe(false);
  });

  it('shows a badge with accessible text', async () => {
    const { link, update } = await setup();
    await update((h) => h.badge.set(2));
    expect(link.querySelector('.ui-nav-item__badge')?.textContent?.trim()).toBe('2');
    expect(link.querySelector('.ui-nav-item__badge')?.getAttribute('aria-hidden')).toBe('true');
    expect(link.querySelector('.ui-visually-hidden')?.textContent).toBe(', 2 pending');
    expect(link.hasAttribute('data-has-badge')).toBe(true);
  });

  it('caps the visible count and accepts string counts', async () => {
    const { link, update } = await setup();
    await update((h) => h.badge.set('140'));
    expect(link.querySelector('.ui-nav-item__badge')?.textContent?.trim()).toBe('99+');
    expect(link.querySelector('.ui-visually-hidden')?.textContent).toBe(', 140 pending');
  });

  it.each([0, '', 'abc', undefined])('hides the badge for %s', async (value) => {
    const { link, update } = await setup();
    await update((h) => h.badge.set(value));
    expect(link.querySelector('.ui-nav-item__badge')).toBeNull();
  });
});
