import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '@ems/ui/toast';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { EmployeeDetail } from '../../core/models/employee.model';
import { Permission } from '../../core/models/permission.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeSelfService } from '../../core/services/employee-self.service';
import { MyProfile } from './my-profile';

const PROFILE: EmployeeDetail = {
  id: 'e1',
  firstName: 'Ama',
  lastName: 'Mensah',
  workEmail: 'ama.mensah@akwaabalabs.example',
  status: 'ACTIVE',
  createdDate: '2023-03-14T09:00:00Z',
  position: { id: 'p1', positionName: 'People Partner', level: 'SENIOR' },
  department: { id: 'd1', departmentName: 'People Operations', departmentCode: 'PPL' },
  accessLevel: { id: 'a1', accessLevelName: 'HR manager' },
  bio: { fullName: 'Ama Serwaa Mensah', nationality: 'Ghanaian', gender: 'FEMALE' },
  contact: { phoneNumbers: ['+233 24 555 0142'], personalEmails: [] },
  addresses: [
    {
      id: 'addr1',
      street: '14 Oxford St',
      city: 'Accra',
      country: 'Ghana',
      digitalAddress: 'GA-123-4567',
      isCurrentAddress: true,
    },
  ],
  identifications: [
    { id: 'id1', identificationNumber: 'GHA-7123-4', identificationType: 'PASSPORT' },
  ],
};

type SelfMock = Record<keyof EmployeeSelfService, ReturnType<typeof vi.fn>>;

describe('MyProfile', () => {
  let self: SelfMock;
  let permissions: Permission[];
  let fixture: ComponentFixture<MyProfile>;

  async function render({ settle = true } = {}): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [MyProfile],
      providers: [
        { provide: EmployeeSelfService, useValue: self },
        {
          provide: AuthService,
          useValue: { hasPermission: (p: Permission) => permissions.includes(p) },
        },
      ],
    });
    fixture = TestBed.createComponent(MyProfile);
    if (settle) await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const buttonNamed = (root: ParentNode, name: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name,
    );
  const card = (el: HTMLElement, title: string) =>
    [...el.querySelectorAll<HTMLElement>('ui-card')].find((c) =>
      c.querySelector('.ui-card__title')?.textContent?.trim().startsWith(title),
    )!;

  beforeEach(() => {
    const ok = (): Observable<unknown> => of({ id: 'x', name: 'ok' });
    self = {
      getMyProfile: vi.fn(() => of(PROFILE)),
      updateMyBio: vi.fn(ok),
      updateMyContact: vi.fn(ok),
      addMyAddress: vi.fn(ok),
      updateMyAddress: vi.fn(ok),
      removeMyAddress: vi.fn(ok),
      addMyIdentification: vi.fn(ok),
      removeMyIdentification: vi.fn(ok),
    } as unknown as SelfMock;
    permissions = [Permission.VIEW_SELF, Permission.MANAGE_SELF];
  });

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('shows the profile header: avatar, name, status, role and codes', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Ama Serwaa Mensah');
    expect(el.querySelector('ui-avatar')).toBeTruthy();
    expect(el.querySelector('.mp-name-row ui-status-pill')?.textContent).toContain('Active');
    expect(el.querySelector('.mp-position')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'People Partner · People Operations',
    );
    const mono = [...el.querySelectorAll('.mp-meta .mp-mono')].map((m) => m.textContent?.trim());
    expect(mono[0]).toBe('Department code PPL');
    expect(mono[1]).toBe('14 Mar 2023');
  });

  it('shows a skeleton while loading and an actionable error on failure', async () => {
    self.getMyProfile = vi.fn(() => NEVER);
    let el = await render({ settle: false });
    expect(el.querySelector('[aria-busy="true"] ui-skeleton')).toBeTruthy();
    expect(el.textContent).toContain('Loading your profile');
    fixture.destroy();
    TestBed.resetTestingModule();

    self.getMyProfile = vi.fn(() => throwError(() => new Error('offline')));
    el = await render();
    expect(el.querySelector('ui-error-state [role="heading"]')?.textContent?.trim()).toBe(
      "We couldn't load your profile",
    );
    expect(el.querySelector('ui-error-state button')?.textContent?.trim()).toBe('Try again');
  });

  it('marks missing details and lists contacts, addresses and IDs', async () => {
    const el = await render();
    const personal = card(el, 'Personal details');
    expect(personal.textContent).toContain('Female');
    expect(personal.querySelectorAll('.mp-empty').length).toBeGreaterThan(0);
    expect(card(el, 'Contact').querySelector('ui-tag')?.textContent).toContain('+233 24 555 0142');
    const addresses = card(el, 'Addresses');
    expect(addresses.textContent).toContain('14 Oxford St, Accra, Ghana');
    expect(addresses.querySelector('ui-tag')?.textContent).toContain('Current');
    expect(card(el, 'ID documents').querySelector('.mp-mono')?.textContent?.trim()).toBe(
      'GHA-7123-4',
    );
  });

  it('hides every edit action without the manage-self permission', async () => {
    permissions = [Permission.VIEW_SELF];
    const el = await render();
    expect(buttonNamed(el, 'Edit personal details')).toBeUndefined();
    expect(buttonNamed(el, 'Add address')).toBeUndefined();
    expect(el.querySelectorAll('button[aria-label^="Remove"]')).toHaveLength(0);
  });

  it('edits personal details and confirms with a toast', async () => {
    const el = await render();
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');
    buttonNamed(el, 'Edit personal details')!.click();
    fixture.detectChanges();

    const name = el.querySelector<HTMLInputElement>('#my-profile-bio-form-full-name')!;
    expect(name.value).toBe('Ama Serwaa Mensah');
    expect(name.closest('ui-form-field')?.querySelector('label')?.textContent?.trim()).toBe(
      'Full name',
    );
    name.value = 'Ama S. Mensah';
    name.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(self.updateMyBio).toHaveBeenCalledWith({
      fullName: 'Ama S. Mensah',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
    });
    expect(success).toHaveBeenCalledWith('Personal details saved');
    expect(el.querySelector('form')).toBeNull();
  });

  it('keeps the form open and explains a failed save', async () => {
    self.updateMyBio = vi.fn(() => throwError(() => new Error('Date of birth is in the future.')));
    const el = await render();
    buttonNamed(el, 'Edit personal details')!.click();
    fixture.detectChanges();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();
    const alert = el.querySelector('form ui-alert');
    expect(alert?.textContent).toContain("We couldn't save your personal details");
    expect(alert?.textContent).toContain('Date of birth is in the future.');
    expect(alert?.textContent).toContain('Check the details and try again.');
  });

  it('adds and removes contact chips before saving', async () => {
    const el = await render();
    buttonNamed(el, 'Edit contact details')!.click();
    fixture.detectChanges();

    const phone = el.querySelector<HTMLInputElement>('#my-profile-new-phone')!;
    phone.value = '+233 20 111 2222';
    phone.dispatchEvent(new Event('input'));
    phone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    const tags = [...card(el, 'Contact').querySelectorAll('ui-tag')].map((t) =>
      t.textContent?.trim(),
    );
    expect(tags).toEqual(['+233 24 555 0142', '+233 20 111 2222']);

    buttonNamed(el, 'Remove +233 24 555 0142')!.click();
    fixture.detectChanges();
    buttonNamed(card(el, 'Contact'), 'Save changes')!.click();
    await settle();
    expect(self.updateMyContact).toHaveBeenCalledWith({
      phoneNumbers: ['+233 20 111 2222'],
      personalEmails: [],
    });
  });

  it('asks before removing an address', async () => {
    const el = await render();
    buttonNamed(el, 'Remove 14 Oxford St, Accra, Ghana')!.click();
    await settle();
    let dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain('Remove this address?');

    buttonNamed(dialog, 'Cancel')!.click();
    await settle();
    expect(self.removeMyAddress).not.toHaveBeenCalled();

    buttonNamed(el, 'Remove 14 Oxford St, Accra, Ghana')!.click();
    await settle();
    dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
    buttonNamed(dialog, 'Remove address')!.click();
    await vi.waitFor(() => expect(self.removeMyAddress).toHaveBeenCalledWith('addr1'));
  });

  it('asks before removing an ID document', async () => {
    const el = await render();
    buttonNamed(el, 'Remove Passport')!.click();
    await settle();
    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain('Remove your Passport?');
    buttonNamed(dialog, 'Remove document')!.click();
    await vi.waitFor(() => expect(self.removeMyIdentification).toHaveBeenCalledWith('id1'));
  });

  it('adds an address with the current-address checkbox', async () => {
    const el = await render();
    buttonNamed(el, 'Add address')!.click();
    fixture.detectChanges();
    const type = (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('my-profile-address-form-city', 'Kumasi');
    type('my-profile-address-form-country', 'Ghana');
    card(el, 'Addresses').querySelector<HTMLInputElement>('ui-checkbox input')!.click();
    fixture.detectChanges();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();
    expect(self.addMyAddress).toHaveBeenCalledWith({
      city: 'Kumasi',
      country: 'Ghana',
      isCurrentAddress: true,
    });
  });
});
