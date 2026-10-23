import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from './menu';

@Component({
  imports: [Menu, MenuItem, MenuSeparator, MenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [uiMenuTrigger]="actions" (menuOpened)="opened.set(true)">
      More actions
    </button>
    <ng-template #actions>
      <ui-menu>
        <button uiMenuItem (triggered)="picked.set('edit')">Edit profile</button>
        <button uiMenuItem disabled>Reset password</button>
        <ui-menu-separator />
        <button uiMenuItem variant="danger" (triggered)="picked.set('archive')">Archive</button>
      </ui-menu>
    </ng-template>
  `,
})
class Host {
  readonly picked = signal('');
  readonly opened = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const trigger = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, trigger, render };
}

describe('Menu', () => {
  it('trigger is a menu button that opens a role=menu panel', async () => {
    const { trigger, host, render } = await setup();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.classList).toContain('ui-menu-trigger');

    trigger.click();
    await render();
    expect(host.opened()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const menu = document.querySelector('ui-menu') as HTMLElement;
    expect(menu.getAttribute('role')).toBe('menu');
    const items = Array.from(menu.querySelectorAll('button'));
    expect(items.map((i) => i.getAttribute('role'))).toEqual(['menuitem', 'menuitem', 'menuitem']);
    expect(items.every((i) => i.getAttribute('type') === 'button')).toBe(true);
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(items[1].hasAttribute('disabled')).toBe(false);
    expect(items[2].dataset['variant']).toBe('danger');
    expect(items[0].dataset['variant']).toBe('default');
    expect(menu.querySelector('ui-menu-separator')?.getAttribute('role')).toBe('separator');
  });

  it('activating an item emits triggered and closes the menu', async () => {
    const { trigger, host, render } = await setup();
    trigger.click();
    await render();
    const archive = Array.from(document.querySelectorAll('ui-menu button')).find(
      (b) => b.textContent?.trim() === 'Archive',
    ) as HTMLButtonElement;
    archive.click();
    await render();
    expect(host.picked()).toBe('archive');
    expect(document.querySelector('ui-menu')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
