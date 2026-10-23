import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { avatarTintFor, type AvatarTint } from '@ems/ui/avatar';
import { PersonCard } from './person-card';

@Component({
  imports: [PersonCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a
    uiPersonCard
    href="#people/GH-ACC-0042"
    name="Kwame Asante"
    [position]="position()"
    [department]="department()"
    [office]="office()"
    [employeeNo]="employeeNo()"
    [avatarTint]="tint()"
    [tintKey]="tintKey()"
  >
    <span uiPersonCardStatus>Active</span>
    <span uiPersonCardReportsTo>Reports to Ama Mensah</span>
  </a>`,
})
class Host {
  readonly position = signal<string | null>('Senior Backend Engineer');
  readonly department = signal<string | null>('Platform Engineering');
  readonly office = signal<string | null>('Accra');
  readonly employeeNo = signal<string | null>('GH-ACC-0042');
  readonly tint = signal<AvatarTint | null>(null);
  readonly tintKey = signal<string | null>(null);
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

describe('PersonCard', () => {
  it('is one link with name first, details, number and slots', async () => {
    const { link } = await setup();
    expect(link.classList).toContain('ui-person-card');
    expect(link.querySelectorAll('a, button')).toHaveLength(0);
    expect(link.querySelector('.ui-person-card__name')?.textContent).toBe('Kwame Asante');
    expect(link.querySelector('.ui-person-card__position')?.textContent).toBe(
      'Senior Backend Engineer',
    );
    expect(link.querySelector('.ui-person-card__department')?.textContent).toBe(
      'Platform Engineering',
    );
    expect(link.querySelector('.ui-person-card__office')?.textContent).toBe('Accra');
    expect(link.querySelector('.ui-person-card__number')?.textContent).toContain('GH-ACC-0042');
    expect(link.querySelector('.ui-person-card__status')?.textContent).toBe('Active');
    expect(link.querySelector('.ui-person-card__reports')?.textContent).toBe(
      'Reports to Ama Mensah',
    );
    expect(link.querySelector('ui-avatar')?.getAttribute('aria-hidden')).toBe('true');
    expect(link.querySelector('ui-avatar')?.getAttribute('data-tint')).toBe(
      String(avatarTintFor('Platform Engineering')),
    );
  });

  it('uses the explicit tint, then the tint key', async () => {
    const { link, update } = await setup();
    await update((h) => h.tintKey.set('eng'));
    expect(link.querySelector('ui-avatar')?.getAttribute('data-tint')).toBe(
      String(avatarTintFor('eng')),
    );
    await update((h) => h.tint.set(6));
    expect(link.querySelector('ui-avatar')?.getAttribute('data-tint')).toBe('6');
    expect(link.querySelector('ui-avatar')?.getAttribute('data-tint')).toBe('6');
  });

  it('leaves out missing details', async () => {
    const { link, update } = await setup();
    await update((h) => {
      h.position.set(null);
      h.department.set(null);
      h.employeeNo.set(null);
    });
    expect(link.querySelector('.ui-person-card__position')).toBeNull();
    expect(link.querySelector('.ui-person-card__department')).toBeNull();
    expect(link.querySelector('.ui-person-card__sep')).toBeNull();
    expect(link.querySelector('.ui-person-card__office')).not.toBeNull();
    expect(link.querySelector('.ui-person-card__number')).toBeNull();
    expect(link.querySelector('ui-avatar')?.getAttribute('data-tint')).toBe(
      String(avatarTintFor('Kwame Asante')),
    );

    await update((h) => h.office.set(null));
    expect(link.querySelector('.ui-person-card__place')).toBeNull();
  });
});
