import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeSelfService } from '../../core/services/employee-self.service';
import { Permission } from '../../core/models/permission.model';
import {
  EmployeeAddressInput,
  EmployeeIdentificationInput,
} from '../../core/services/employee-self.service';
import { EmployeeAddress, EmployeeIdentification } from '../../core/models/employee.model';

const ID_TYPES = [
  'NATIONAL_ID_CARD', 'DRIVING_LICENCE', 'PASSPORT',
  'VOTERS_ID_CARD', 'NATIONAL_HEALTH_ID_CARD',
] as const;

const AVATAR_COLORS = [
  '#fe7f2d', '#619b8a', '#fcca46', '#a1c181',
  '#5e7a8a', '#e07070', '#233d4d', '#2e4e60',
];

@Component({
  selector: 'app-my-profile',
  imports: [FormField],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfile {
  private readonly selfService = inject(EmployeeSelfService);
  private readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_SELF),
  );

  protected readonly profileResource = resource({
    loader: () => firstValueFrom(this.selfService.getMyProfile()),
  });

  // ── Section open/saving state ─────────────────────────────────────
  protected readonly editSection = signal<'bio' | 'contact' | 'address' | 'id' | null>(null);
  protected readonly saving      = signal(false);
  protected readonly sectionError = signal('');

  // ── Bio form ──────────────────────────────────────────────────────
  protected readonly bioModel = signal({
    fullName: '', otherName: '', gender: '', nationality: '',
    maritalStatus: '', dateOfBirth: '', placeOfBirth: '', isExpert: '',
  });
  protected readonly bioForm = form(this.bioModel, _s => { /* all optional */ });

  protected openBioEdit(): void {
    const bio = this.profileResource.value()?.bio;
    this.bioModel.set({
      fullName:     bio?.fullName     ?? '',
      otherName:    bio?.otherName    ?? '',
      gender:       bio?.gender       ?? '',
      nationality:  bio?.nationality  ?? '',
      maritalStatus: bio?.maritalStatus ?? '',
      dateOfBirth:  bio?.dateOfBirth  ?? '',
      placeOfBirth: bio?.placeOfBirth ?? '',
      isExpert:     bio?.isExpert     ?? '',
    });
    this.editSection.set('bio');
    this.sectionError.set('');
  }

  protected async saveBio(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      const m = this.bioModel();
      await firstValueFrom(this.selfService.updateMyBio({
        ...(m.fullName     && { fullName:     m.fullName }),
        ...(m.otherName    && { otherName:    m.otherName }),
        ...(m.gender       && { gender:       m.gender }),
        ...(m.nationality  && { nationality:  m.nationality }),
        ...(m.maritalStatus && { maritalStatus: m.maritalStatus }),
        ...(m.dateOfBirth  && { dateOfBirth:  m.dateOfBirth }),
        ...(m.placeOfBirth && { placeOfBirth: m.placeOfBirth }),
        ...(m.isExpert     && { isExpert:     m.isExpert }),
      }));
      this.editSection.set(null);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to update bio.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Contact form ──────────────────────────────────────────────────
  protected readonly phoneNumbers   = signal<string[]>([]);
  protected readonly personalEmails = signal<string[]>([]);
  protected readonly newPhone = signal('');
  protected readonly newEmail = signal('');

  protected openContactEdit(): void {
    const c = this.profileResource.value()?.contact;
    this.phoneNumbers.set([...(c?.phoneNumbers ?? [])]);
    this.personalEmails.set([...(c?.personalEmails ?? [])]);
    this.newPhone.set('');
    this.newEmail.set('');
    this.editSection.set('contact');
    this.sectionError.set('');
  }

  protected addPhone(): void {
    const v = this.newPhone().trim();
    if (v && !this.phoneNumbers().includes(v)) {
      this.phoneNumbers.update(arr => [...arr, v]);
    }
    this.newPhone.set('');
  }

  protected removePhone(phone: string): void {
    this.phoneNumbers.update(arr => arr.filter(p => p !== phone));
  }

  protected addEmail(): void {
    const v = this.newEmail().trim();
    if (v && !this.personalEmails().includes(v)) {
      this.personalEmails.update(arr => [...arr, v]);
    }
    this.newEmail.set('');
  }

  protected removeEmail(email: string): void {
    this.personalEmails.update(arr => arr.filter(e => e !== email));
  }

  protected async saveContact(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      await firstValueFrom(this.selfService.updateMyContact({
        phoneNumbers:   this.phoneNumbers(),
        personalEmails: this.personalEmails(),
      }));
      this.editSection.set(null);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to update contact.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Address form ──────────────────────────────────────────────────
  protected readonly ID_TYPES = ID_TYPES;
  protected readonly editAddressId = signal<string | null>(null);

  protected readonly addressModel = signal({
    street: '', city: '', state: '', zipCode: '',
    country: '', digitalAddress: '', isCurrentAddress: false,
  });
  protected readonly addressForm = form(this.addressModel, s => {
    required(s.city,    { message: 'City is required' });
    required(s.country, { message: 'Country is required' });
  });

  protected openAddAddress(): void {
    this.editAddressId.set(null);
    this.addressModel.set({
      street: '', city: '', state: '', zipCode: '',
      country: '', digitalAddress: '', isCurrentAddress: false,
    });
    this.editSection.set('address');
    this.sectionError.set('');
  }

  protected openEditAddress(addr: EmployeeAddress): void {
    this.editAddressId.set(addr.id);
    this.addressModel.set({
      street:         addr.street         ?? '',
      city:           addr.city           ?? '',
      state:          addr.state          ?? '',
      zipCode:        addr.zipCode        ?? '',
      country:        addr.country        ?? '',
      digitalAddress: addr.digitalAddress ?? '',
      isCurrentAddress: addr.isCurrentAddress ?? false,
    });
    this.editSection.set('address');
    this.sectionError.set('');
  }

  protected async saveAddress(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      const m    = this.addressModel();
      const id   = this.editAddressId();
      const input: EmployeeAddressInput = {
        ...(m.street         && { street:         m.street }),
        ...(m.city           && { city:           m.city }),
        ...(m.state          && { state:          m.state }),
        ...(m.zipCode        && { zipCode:        m.zipCode }),
        ...(m.country        && { country:        m.country }),
        ...(m.digitalAddress && { digitalAddress: m.digitalAddress }),
        isCurrentAddress: m.isCurrentAddress,
      };
      if (id) {
        await firstValueFrom(this.selfService.updateMyAddress(id, input));
      } else {
        await firstValueFrom(this.selfService.addMyAddress(input));
      }
      this.editSection.set(null);
      this.editAddressId.set(null);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to save address.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async removeAddress(addressId: string): Promise<void> {
    this.sectionError.set('');
    try {
      await firstValueFrom(this.selfService.removeMyAddress(addressId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to remove address.');
    }
  }

  // ── Identification form ───────────────────────────────────────────
  protected readonly idModel = signal({
    identificationNumber: '',
    identificationType:   'NATIONAL_ID_CARD',
  });
  protected readonly idForm = form(this.idModel, s => {
    required(s.identificationNumber, { message: 'ID number is required' });
    required(s.identificationType,   { message: 'ID type is required' });
  });

  protected openAddId(): void {
    this.idModel.set({ identificationNumber: '', identificationType: 'NATIONAL_ID_CARD' });
    this.editSection.set('id');
    this.sectionError.set('');
  }

  protected async saveId(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      const m = this.idModel();
      await firstValueFrom(this.selfService.addMyIdentification({
        identificationNumber: m.identificationNumber,
        identificationType:   m.identificationType,
      }));
      this.editSection.set(null);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to save identification.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async removeId(identificationId: string): Promise<void> {
    this.sectionError.set('');
    try {
      await firstValueFrom(this.selfService.removeMyIdentification(identificationId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to remove identification.');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  protected getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  protected getAvatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  protected formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  protected formatIdType(raw: string): string {
    return raw.replace(/_/g, ' ');
  }

  protected cancelEdit(): void {
    this.editSection.set(null);
    this.editAddressId.set(null);
    this.sectionError.set('');
  }

  protected addressLine(addr: EmployeeAddress): string {
    return [addr.street, addr.city, addr.state, addr.country, addr.zipCode]
      .filter(v => !!v)
      .join(', ');
  }

  protected trackAddr(index: number, addr: EmployeeAddress): string { return addr.id; }
  protected trackId(index: number, id: EmployeeIdentification): string { return id.id; }
}
