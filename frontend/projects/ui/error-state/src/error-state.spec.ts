import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ERROR_STATE_COPY, ErrorState, type ErrorStateKind } from './error-state';

@Component({
  imports: [ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-error-state
      [kind]="kind()"
      [heading]="heading()"
      [description]="description()"
      [actionLabel]="actionLabel()"
      [showAction]="showAction()"
      [headingLevel]="level()"
      (action)="actions.set(actions() + 1)"
    >
      <a uiErrorStateActions href="#hr">Contact HR</a>
    </ui-error-state>
  `,
})
class Host {
  readonly kind = signal<ErrorStateKind>('server');
  readonly heading = signal<string | undefined>(undefined);
  readonly description = signal<string | undefined>(undefined);
  readonly actionLabel = signal<string | undefined>(undefined);
  readonly showAction = signal(true);
  readonly level = signal<1 | 2 | 3>(2);
  readonly actions = signal(0);
  readonly state = viewChild.required(ErrorState);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('ui-error-state') as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { el, host: fixture.componentInstance, update };
}

describe('ErrorState', () => {
  it.each<ErrorStateKind>(['forbidden', 'not-found', 'server', 'network'])(
    'renders the default copy for %s',
    async (kind) => {
      const { el, update } = await setup();
      await update((h) => h.kind.set(kind));
      const copy = ERROR_STATE_COPY[kind];

      expect(el.dataset['kind']).toBe(kind);
      expect(el.querySelector('[role="heading"]')?.textContent?.trim()).toBe(copy.heading);
      expect(el.querySelector('.ui-error-state__description')?.textContent).toBe(copy.description);
      expect(el.querySelector('button')?.textContent?.trim()).toBe(copy.actionLabel);
      const code = el.querySelector('.ui-error-state__code');
      if (copy.code) {
        expect(code?.textContent).toBe(`Error ${copy.code}`);
      } else {
        expect(code).toBeNull();
      }
      expect(el.querySelector('svg')?.childElementCount).toBeGreaterThan(0);
    },
  );

  it('heading has the requested level and is a programmatic focus target', async () => {
    const { el, host, update } = await setup();
    await update((h) => h.level.set(1));
    const heading = el.querySelector('[role="heading"]') as HTMLElement;
    expect(heading.getAttribute('aria-level')).toBe('1');
    expect(heading.getAttribute('tabindex')).toBe('-1');

    host.state().focus();
    expect(document.activeElement).toBe(heading);
  });

  it('emits action from the recovery button and keeps extra actions', async () => {
    const { el, host } = await setup();
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(host.actions()).toBe(1);
    expect(el.querySelector('.ui-error-state__actions a')?.textContent).toBe('Contact HR');
  });

  it('copy overrides win; showAction=false hides the button', async () => {
    const { el, update } = await setup();
    await update((h) => {
      h.heading.set('This person was archived');
      h.description.set('Restore Kwame Asante from Archived people to view the profile.');
      h.actionLabel.set('Open archived people');
    });
    expect(el.querySelector('[role="heading"]')?.textContent?.trim()).toBe(
      'This person was archived',
    );
    expect(el.querySelector('.ui-error-state__description')?.textContent).toContain('Restore');
    expect(el.querySelector('button')?.textContent?.trim()).toBe('Open archived people');

    await update((h) => h.showAction.set(false));
    expect(el.querySelector('button')).toBeNull();
  });
});
