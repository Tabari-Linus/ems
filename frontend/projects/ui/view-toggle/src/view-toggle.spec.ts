import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewToggle, type ViewToggleValue } from './view-toggle';
import { press } from '../../testing/keyboard';

@Component({
  imports: [ViewToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-view-toggle [(view)]="view" [iconOnly]="iconOnly()" label="Directory view" />`,
})
class Host {
  readonly view = signal<ViewToggleValue>('grid');
  readonly iconOnly = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-view-toggle') as HTMLElement;
  const radios = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: HTMLElement, k: string) => {
    press(k, target);
    await settle();
  };
  return { el, radios, settle, key, host: fixture.componentInstance };
}

describe('ViewToggle', () => {
  it('is a labelled radiogroup with the checked option as the tab stop', async () => {
    const { el, radios } = await setup();
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Directory view');
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    expect(radios().map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1']);
  });

  it('selects on click', async () => {
    const { radios, settle, host } = await setup();
    radios()[1].click();
    await settle();
    expect(host.view()).toBe('list');
    expect(radios()[1].getAttribute('tabindex')).toBe('0');
  });

  it('moves and selects with arrow keys (wrapping) and ignores other keys', async () => {
    const { radios, key, host } = await setup();
    await key(radios()[0], 'ArrowDown');
    expect(host.view()).toBe('list');
    expect(document.activeElement).toBe(radios()[1]);
    await key(radios()[1], 'ArrowRight');
    expect(host.view()).toBe('grid');
    await key(radios()[0], 'ArrowUp');
    expect(host.view()).toBe('list');
    await key(radios()[1], 'ArrowLeft');
    expect(host.view()).toBe('grid');
    await key(radios()[0], 'Enter');
    expect(host.view()).toBe('grid');
  });

  it('hides labels visually in icon-only mode', async () => {
    const { el, settle, host } = await setup();
    host.iconOnly.set(true);
    await settle();
    expect(el.hasAttribute('data-icon-only')).toBe(true);
    expect(el.querySelector('span.ui-visually-hidden')?.textContent).toBe('Grid');
  });
});
