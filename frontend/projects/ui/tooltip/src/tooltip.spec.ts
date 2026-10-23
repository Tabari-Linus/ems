import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tooltip, type TooltipPosition } from './tooltip';
import { press } from '../../testing/keyboard';

@Component({
  imports: [Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      aria-label="Copy employee number"
      [uiTooltip]="text()"
      [uiTooltipPosition]="position()"
      uiTooltipShowDelay="300"
    >
      C
    </button>
  `,
})
class Host {
  readonly text = signal('Copy GH-ACC-0042');
  readonly position = signal<TooltipPosition>('above');
  readonly tooltip = viewChild.required(Tooltip);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
  vi.useFakeTimers();
  const render = async () => {
    fixture.detectChanges();
    TestBed.tick();
  };
  return { fixture, host: fixture.componentInstance, button, render };
}

const bubble = () => document.querySelector('ui-tooltip-panel');

describe('Tooltip', () => {
  afterEach(() => vi.useRealTimers());

  it('describes the host with the tooltip text even while hidden', async () => {
    const { button } = await setup();
    const id = button.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toBe('Copy GH-ACC-0042');
    expect(bubble()).toBeNull();
  });

  it('shows after the hover delay and hides after leaving', async () => {
    const { button, render } = await setup();
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(299);
    expect(bubble()).toBeNull();
    vi.advanceTimersByTime(1);
    await render();
    const panel = bubble() as HTMLElement;
    expect(panel.getAttribute('role')).toBe('tooltip');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.textContent).toBe('Copy GH-ACC-0042');

    // Moving onto the bubble keeps it open (WCAG 1.4.13 hoverable).
    button.dispatchEvent(new MouseEvent('mouseleave'));
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(500);
    expect(bubble()).not.toBeNull();
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(120);
    expect(bubble()).toBeNull();
  });

  it('shows at once on focus, hides on blur, and Escape dismisses it', async () => {
    const { button, host, render } = await setup();
    button.dispatchEvent(new FocusEvent('focusin'));
    await render();
    expect(host.tooltip().isOpen).toBe(true);
    button.dispatchEvent(new FocusEvent('focusout'));
    expect(bubble()).toBeNull();

    host.tooltip().show();
    host.tooltip().show();
    await render();
    press('Escape', document.body);
    expect(bubble()).toBeNull();
    // Escape is only consumed while the tooltip is open.
    press('Escape', document.body);
  });

  it.each<TooltipPosition>(['below', 'start', 'end'])('opens in position %s', async (position) => {
    const { host, render } = await setup();
    host.position.set(position);
    await render();
    host.tooltip().show(0);
    await render();
    expect(bubble()).not.toBeNull();
    host.tooltip().hide(50);
    vi.advanceTimersByTime(50);
    expect(bubble()).toBeNull();
  });

  it('updates the description; empty text disables the tooltip', async () => {
    const { button, host, render } = await setup();
    host.tooltip().show();
    await render();
    host.text.set('Copied');
    await render();
    expect(bubble()?.textContent).toBe('Copied');
    const id = button.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.textContent).toBe('Copied');

    host.text.set('');
    await render();
    expect(bubble()).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    host.tooltip().show();
    expect(bubble()).toBeNull();
  });

  it('cleans up on destroy', async () => {
    const { fixture, host, button, render } = await setup();
    host.tooltip().show();
    await render();
    fixture.destroy();
    expect(bubble()).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});
