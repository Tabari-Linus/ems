import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, type ButtonSize, type ButtonVariant } from './button';

@Component({
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      uiButton
      type="button"
      [variant]="variant()"
      [size]="size()"
      [loading]="loading()"
      [disabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
    >
      Save
    </button>
    <a
      uiButton
      href="#target"
      [loading]="loading()"
      [disabled]="disabled()"
      (click)="linkClicks.set(linkClicks() + 1)"
      >Go</a
    >
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly clicks = signal(0);
  readonly linkClicks = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const button = root.querySelector('button') as HTMLButtonElement;
  const link = root.querySelector('a') as HTMLAnchorElement;
  const update = async (change: (host: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, button, link, update };
}

describe('Button', () => {
  it('defaults to the primary, medium button and renders projected content', async () => {
    const { button } = await setup();

    expect(button.classList).toContain('ui-button');
    expect(button.dataset['variant']).toBe('primary');
    expect(button.dataset['size']).toBe('md');
    expect(button.textContent?.trim()).toBe('Save');
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.querySelector('.ui-button__spinner')).toBeNull();
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'ghost', 'danger'])(
    'reflects variant %s on data-variant',
    async (variant) => {
      const { button, update } = await setup();
      await update((h) => h.variant.set(variant));
      expect(button.getAttribute('data-variant')).toBe(variant);
    },
  );

  it.each<ButtonSize>(['sm', 'md', 'lg'])('reflects size %s on data-size', async (size) => {
    const { button, update } = await setup();
    await update((h) => h.size.set(size));
    expect(button.getAttribute('data-size')).toBe(size);
  });

  it('activates on click when idle', async () => {
    const { button, host } = await setup();
    button.click();
    expect(host.clicks()).toBe(1);
  });

  it('while loading: shows a spinner, sets aria-busy/aria-disabled, keeps focusable, blocks clicks', async () => {
    const { button, host, update } = await setup();
    await update((h) => h.loading.set(true));

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('data-loading')).toBe(true);
    expect(button.disabled).toBe(false);
    expect(button.querySelector('.ui-button__spinner')?.getAttribute('aria-hidden')).toBe('true');
    // The label stays in the DOM so the accessible name does not change.
    expect(button.textContent?.trim()).toBe('Save');

    button.click();
    expect(host.clicks()).toBe(0);

    await update((h) => h.loading.set(false));
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.querySelector('.ui-button__spinner')).toBeNull();
    button.click();
    expect(host.clicks()).toBe(1);
  });

  it('disabled on a native button sets the disabled attribute, not aria-disabled', async () => {
    const { button, update } = await setup();
    await update((h) => h.disabled.set(true));

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('tabindex')).toBe(false);
  });

  it('works on an anchor: disabled sets aria-disabled, removes it from tab order and blocks activation', async () => {
    const { link, host, update } = await setup();
    expect(link.classList).toContain('ui-button');
    expect(link.hasAttribute('disabled')).toBe(false);

    const idle = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);
    expect(host.linkClicks()).toBe(1);

    await update((h) => h.disabled.set(true));
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.hasAttribute('disabled')).toBe(false);

    const blocked = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBe(true);
    expect(host.linkClicks()).toBe(1);
  });

  it('loading on an anchor keeps it in the tab order', async () => {
    const { link, update } = await setup();
    await update((h) => h.loading.set(true));

    expect(link.getAttribute('aria-busy')).toBe('true');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('accepts boolean attributes without bindings', async () => {
    @Component({
      imports: [Button],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<button uiButton type="button" loading disabled>Wait</button>`,
    })
    class StaticHost {}

    const fixture = TestBed.createComponent(StaticHost);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.getAttribute('aria-busy')).toBe('true');
    expect(button?.disabled).toBe(true);
  });
});
