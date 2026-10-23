import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StatusPill,
  type EmployeeStatus,
  type StatusDotShape,
  type StatusTone,
} from './status-pill';

@Component({
  imports: [StatusPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-status-pill id="employee" [status]="status()" [label]="label()" [shape]="shape()" />
    <ui-status-pill id="tone" [tone]="tone()">Declined</ui-status-pill>
  `,
})
class Host {
  readonly status = signal<EmployeeStatus | undefined>('ACTIVE');
  readonly tone = signal<StatusTone>('danger');
  readonly label = signal<string | undefined>(undefined);
  readonly shape = signal<StatusDotShape | undefined>(undefined);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const update = async (change: (h: Host) => void) => {
    change(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return {
    employee: root.querySelector('#employee') as HTMLElement,
    tone: root.querySelector('#tone') as HTMLElement,
    update,
  };
}

describe('StatusPill', () => {
  it.each<[EmployeeStatus, string, StatusDotShape]>([
    ['ACTIVE', 'Active', 'filled'],
    ['PENDING', 'Pending', 'half'],
    ['INACTIVE', 'Inactive', 'ring'],
    ['ARCHIVED', 'Archived', 'square'],
  ])('renders %s as "%s" with a %s dot', async (status, label, shape) => {
    const { employee, update } = await setup();
    await update((h) => h.status.set(status));

    expect(employee.textContent?.trim()).toBe(label);
    expect(employee.dataset['status']).toBe(status);
    expect(employee.dataset['shape']).toBe(shape);
    expect(employee.hasAttribute('data-tone')).toBe(false);
    expect(employee.querySelector('.ui-status-pill__dot')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it.each<[StatusTone, StatusDotShape]>([
    ['success', 'filled'],
    ['warning', 'half'],
    ['danger', 'square'],
    ['info', 'ring'],
    ['neutral', 'ring'],
  ])('tone %s uses a %s dot and the projected label', async (tone, shape) => {
    const { tone: pill, update } = await setup();
    await update((h) => h.tone.set(tone));

    expect(pill.dataset['tone']).toBe(tone);
    expect(pill.dataset['shape']).toBe(shape);
    expect(pill.hasAttribute('data-status')).toBe(false);
    expect(pill.textContent?.trim()).toBe('Declined');
  });

  it('label and shape inputs override the defaults', async () => {
    const { employee, update } = await setup();
    await update((h) => {
      h.label.set('Actif');
      h.shape.set('ring');
    });
    expect(employee.textContent?.trim()).toBe('Actif');
    expect(employee.dataset['shape']).toBe('ring');
  });

  it('falls back to the tone when no status is given', async () => {
    const { employee, update } = await setup();
    await update((h) => h.status.set(undefined));
    expect(employee.dataset['tone']).toBe('neutral');
    expect(employee.textContent?.trim()).toBe('');
  });
});
