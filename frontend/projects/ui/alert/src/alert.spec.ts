import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert, type AlertLive, type AlertTone } from './alert';

@Component({
  imports: [Alert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-alert
      [tone]="tone()"
      [heading]="heading()"
      [meta]="meta()"
      [live]="live()"
      [dismissible]="dismissible()"
      (dismissed)="dismissals.set(dismissals() + 1)"
    >
      Approving sends Kwame a link to set a new password.
      <button uiAlertAction type="button">Approve</button>
    </ui-alert>
    <ui-alert id="custom-icon"><span uiAlertIcon class="custom">K</span></ui-alert>
  `,
})
class Host {
  readonly tone = signal<AlertTone>('info');
  readonly heading = signal<string | undefined>('Password reset requested');
  readonly meta = signal<string | undefined>('2h ago');
  readonly live = signal<AlertLive>('auto');
  readonly dismissible = signal(false);
  readonly dismissals = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const alert = root.querySelector('ui-alert') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { root, alert, host: fixture.componentInstance, update };
}

describe('Alert', () => {
  it('renders heading, meta, body and actions', async () => {
    const { alert } = await setup();
    expect(alert.querySelector('.ui-alert__title')?.textContent).toBe('Password reset requested');
    expect(alert.querySelector('.ui-alert__meta')?.textContent).toContain('2h ago');
    expect(alert.querySelector('.ui-alert__body')?.textContent).toContain('Approving sends Kwame');
    expect(alert.querySelector('.ui-alert__actions button')?.textContent).toBe('Approve');
    expect(alert.querySelector('.ui-alert__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(alert.querySelector('.ui-alert__dismiss')).toBeNull();
  });

  it.each<[AlertTone, string]>([
    ['neutral', 'status'],
    ['info', 'status'],
    ['success', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ])('tone %s gets role="%s" by default and a tone icon', async (tone, role) => {
    const { alert, update } = await setup();
    await update((h) => h.tone.set(tone));
    expect(alert.dataset['tone']).toBe(tone);
    expect(alert.getAttribute('role')).toBe(role);
    expect(alert.querySelector('.ui-alert__icon svg')).not.toBeNull();
  });

  it.each<[AlertLive, string | null]>([
    ['polite', 'status'],
    ['assertive', 'alert'],
    ['off', null],
  ])('live=%s sets role %s', async (live, role) => {
    const { alert, update } = await setup();
    await update((h) => h.live.set(live));
    expect(alert.getAttribute('role')).toBe(role);
  });

  it('omits heading and meta when not given', async () => {
    const { alert, update } = await setup();
    await update((h) => h.meta.set(undefined));
    expect(alert.querySelector('.ui-alert__meta')).toBeNull();
    await update((h) => h.heading.set(undefined));
    expect(alert.querySelector('.ui-alert__heading')).toBeNull();
  });

  it('dismiss button hides the alert and emits dismissed', async () => {
    const { alert, host, update } = await setup();
    await update((h) => h.dismissible.set(true));
    const button = alert.querySelector('.ui-alert__dismiss') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Dismiss');
    button.click();
    await update(() => undefined);
    expect(host.dismissals()).toBe(1);
    expect(alert.hidden).toBe(true);
  });

  it('a projected [uiAlertIcon] replaces the tone icon', async () => {
    const { root } = await setup();
    const custom = root.querySelector('#custom-icon') as HTMLElement;
    expect(custom.querySelector('.ui-alert__icon .custom')).not.toBeNull();
    expect(custom.querySelector('.ui-alert__icon svg')).toBeNull();
  });
});
