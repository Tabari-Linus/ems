import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TOAST_CONFIG, ToastService } from './toast.service';
import { Toaster } from './toaster';

@Component({
  imports: [Toaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button id="outside" type="button">Outside</button><ui-toaster />`,
})
class Host {}

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function service(config = {}) {
    TestBed.configureTestingModule({ providers: [{ provide: TOAST_CONFIG, useValue: config }] });
    return TestBed.inject(ToastService);
  }

  it('applies tone defaults and auto-dismisses after the duration', async () => {
    const toasts = service({ duration: 1000, actionDuration: 3000 });
    const plain = toasts.success('Kwame Asante was added');
    const withAction = toasts.info('Kofi Owusu was archived', {
      action: { label: 'Undo', run: () => undefined },
    });
    const error = toasts.error("Couldn't archive Esi Quaye. Try again.");
    toasts.warning('Profile incomplete', { duration: 500 });

    expect(toasts.visible().map((t) => [t.tone, t.duration])).toEqual([
      ['success', 1000],
      ['info', 3000],
      ['danger', 0],
    ]);
    expect(toasts.queued()).toBe(1);

    vi.advanceTimersByTime(1000);
    await expect(plain.afterDismissed).resolves.toBe('timeout');
    // The queued warning moved up and started its own timer.
    expect(toasts.visible().map((t) => t.tone)).toEqual(['info', 'danger', 'warning']);
    vi.advanceTimersByTime(500);
    expect(toasts.visible().map((t) => t.tone)).toEqual(['info', 'danger']);
    vi.advanceTimersByTime(1500);
    await expect(withAction.afterDismissed).resolves.toBe('timeout');

    vi.advanceTimersByTime(60_000);
    expect(toasts.visible()).toHaveLength(1);
    error.dismiss();
    await expect(error.afterDismissed).resolves.toBe('dismiss');
    expect(toasts.visible()).toHaveLength(0);
  });

  it('pause keeps the remaining time; resume continues it', () => {
    const toasts = service({ duration: 1000 });
    toasts.show({ message: 'Saved' });
    vi.advanceTimersByTime(600);
    toasts.pause();
    toasts.pause();
    vi.advanceTimersByTime(5000);
    expect(toasts.visible()).toHaveLength(1);
    toasts.resume();
    toasts.resume();
    vi.advanceTimersByTime(399);
    expect(toasts.visible()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toasts.visible()).toHaveLength(0);
  });

  it('runAction runs the callback and closes with reason action; dismissAll clears everything', async () => {
    const toasts = service();
    const run = vi.fn();
    const ref = toasts.show({ message: 'Kofi Owusu was archived', action: { label: 'Undo', run } });
    toasts.runAction(ref.id);
    expect(run).toHaveBeenCalledTimes(1);
    await expect(ref.afterDismissed).resolves.toBe('action');

    toasts.show({ message: 'Plain' });
    toasts.runAction(999);
    toasts.dismiss(999);
    for (let i = 0; i < 5; i++) toasts.show({ message: `Toast ${i}` });
    toasts.dismissAll();
    expect(toasts.visible()).toHaveLength(0);
    expect(toasts.queued()).toBe(0);
  });

  it('runAction ignores toasts without an action', () => {
    const toasts = service();
    const ref = toasts.show({ message: 'No action' });
    toasts.runAction(ref.id);
    expect(toasts.visible()).toHaveLength(1);
    toasts.ngOnDestroy();
  });
});

describe('Toaster', () => {
  afterEach(() => vi.useRealTimers());

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    const toasts = TestBed.inject(ToastService);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const toaster = root.querySelector('ui-toaster') as HTMLElement;
    // Fake timers only after the first render: whenStable() itself waits on real timers.
    vi.useFakeTimers();
    const render = async () => {
      fixture.detectChanges();
    };
    return { fixture, toasts, root, toaster, render };
  }

  it('is a labelled region with a polite live list', async () => {
    const { toaster } = await setup();
    expect(toaster.getAttribute('role')).toBe('region');
    expect(toaster.getAttribute('aria-label')).toBe('Notifications');
    expect(toaster.querySelector('ol')?.getAttribute('aria-live')).toBe('polite');
  });

  it('renders toasts with tone, action and close buttons', async () => {
    const { toasts, toaster, render } = await setup();
    const run = vi.fn();
    toasts.success('Kwame Asante was added');
    toasts.info('Kofi Owusu was archived', { action: { label: 'Undo', run } });
    toasts.warning('Profile incomplete');
    toasts.error("Couldn't save");
    await render();

    const items = toaster.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(Array.from(items).map((i) => i.dataset['tone'])).toEqual(['success', 'info', 'warning']);
    const undo = items[1].querySelector('.ui-toast__action') as HTMLButtonElement;
    expect(undo.textContent?.trim()).toBe('Undo');
    undo.click();
    await render();
    expect(run).toHaveBeenCalled();

    const close = toaster.querySelector('.ui-toast__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Dismiss notification');
    close.click();
    await render();
    expect(Array.from(toaster.querySelectorAll('li')).map((i) => i.dataset['tone'])).toEqual([
      'warning',
      'danger',
    ]);
  });

  it('Escape on a toast closes it', async () => {
    const { toasts, toaster, render } = await setup();
    toasts.show({ message: 'Saved' });
    await render();
    toaster.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toaster.querySelectorAll('li')).toHaveLength(1);
    const li = toaster.querySelector('li') as HTMLElement;
    li.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await render();
    expect(toaster.querySelectorAll('li')).toHaveLength(0);
  });

  it('pauses while hovered or focused and resumes when both leave', async () => {
    const { toasts, toaster, root, render } = await setup();
    toasts.show({ message: 'Saved', duration: 1000 });
    await render();

    toaster.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(toasts.visible()).toHaveLength(1);

    const close = toaster.querySelector('.ui-toast__close') as HTMLButtonElement;
    close.focus();
    close.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    toaster.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(5000);
    expect(toasts.visible()).toHaveLength(1);

    // Focus moving within the toaster keeps it paused.
    close.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: close }));
    vi.advanceTimersByTime(5000);
    expect(toasts.visible()).toHaveLength(1);

    const outside = root.querySelector('#outside') as HTMLButtonElement;
    outside.focus();
    close.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
    vi.advanceTimersByTime(1000);
    expect(toasts.visible()).toHaveLength(0);
  });
});
