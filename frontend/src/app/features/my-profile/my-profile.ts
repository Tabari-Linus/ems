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
import { EmployeeAddressInput } from '../../core/services/employee-self.service';
import { EmployeeAddress, EmployeeIdentification } from '../../core/models/employee.model';
import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Avatar } from '@ems/ui/avatar';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { Checkbox } from '@ems/ui/checkbox';
import { DescriptionItem, DescriptionList } from '@ems/ui/description-list';
import { DialogService } from '@ems/ui/dialog';
import { ErrorState } from '@ems/ui/error-state';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { Input } from '@ems/ui/input';
import { NativeSelect } from '@ems/ui/select';
import { Skeleton } from '@ems/ui/skeleton';
import { StatusPill } from '@ems/ui/status-pill';
import { Tag } from '@ems/ui/tag';
import { ToastService } from '@ems/ui/toast';
import { fieldError, sentenceCase, statusPillValue } from '../settings/shared/settings-ui';

const ID_TYPES = [
  'NATIONAL_ID_CARD',
  'DRIVING_LICENCE',
  'PASSPORT',
  'VOTERS_ID_CARD',
  'NATIONAL_HEALTH_ID_CARD',
] as const;

const ID_TYPE_LABELS: Readonly<Record<string, string>> = {
  NATIONAL_ID_CARD: 'National ID card',
  DRIVING_LICENCE: 'Driving licence',
  PASSPORT: 'Passport',
  VOTERS_ID_CARD: "Voter's ID card",
  NATIONAL_HEALTH_ID_CARD: 'National health ID card',
};

@Component({
  selector: 'app-my-profile',
  imports: [
    FormField,
    Alert,
    Avatar,
    Button,
    Card,
    Checkbox,
    DescriptionItem,
    DescriptionList,
    ErrorState,
    Icon,
    Input,
    NativeSelect,
    Skeleton,
    StatusPill,
    Tag,
    UiFormField,
  ],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfile {
  private readonly selfService = inject(EmployeeSelfService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly fieldError = fieldError;
  protected readonly statusPillValue = statusPillValue;
  protected readonly sentenceCase = sentenceCase;

  protected readonly canEdit = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_SELF),
  );

  protected readonly profileResource = resource({
    loader: () => firstValueFrom(this.selfService.getMyProfile()),
  });

  // ── Section open/saving state ─────────────────────────────────────
  protected readonly editSection = signal<'bio' | 'contact' | 'address' | 'id' | null>(null);
  protected readonly saving = signal(false);
  protected readonly sectionError = signal('');

  // ── Bio form ──────────────────────────────────────────────────────
  protected readonly bioModel = signal({
    fullName: '',
    otherName: '',
    gender: '',
    nationality: '',
    maritalStatus: '',
    dateOfBirth: '',
    placeOfBirth: '',
    isExpert: '',
  });
  protected readonly bioForm = form(this.bioModel, (_s) => {
    /* all optional */
  });

  protected openBioEdit(): void {
    const bio = this.profileResource.value()?.bio;
    this.bioModel.set({
      fullName: bio?.fullName ?? '',
      otherName: bio?.otherName ?? '',
      gender: bio?.gender ?? '',
      nationality: bio?.nationality ?? '',
      maritalStatus: bio?.maritalStatus ?? '',
      dateOfBirth: bio?.dateOfBirth ?? '',
      placeOfBirth: bio?.placeOfBirth ?? '',
      isExpert: bio?.isExpert ?? '',
    });
    this.editSection.set('bio');
    this.sectionError.set('');
  }

  protected async saveBio(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      const m = this.bioModel();
      await firstValueFrom(
        this.selfService.updateMyBio({
          ...(m.fullName && { fullName: m.fullName }),
          ...(m.otherName && { otherName: m.otherName }),
          ...(m.gender && { gender: m.gender }),
          ...(m.nationality && { nationality: m.nationality }),
          ...(m.maritalStatus && { maritalStatus: m.maritalStatus }),
          ...(m.dateOfBirth && { dateOfBirth: m.dateOfBirth }),
          ...(m.placeOfBirth && { placeOfBirth: m.placeOfBirth }),
          ...(m.isExpert && { isExpert: m.isExpert }),
        }),
      );
      this.editSection.set(null);
      this.profileResource.reload();
      this.toast.success('Personal details saved');
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to update bio.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Contact form ──────────────────────────────────────────────────
  protected readonly phoneNumbers = signal<string[]>([]);
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
      this.phoneNumbers.update((arr) => [...arr, v]);
    }
    this.newPhone.set('');
  }

  protected removePhone(phone: string): void {
    this.phoneNumbers.update((arr) => arr.filter((p) => p !== phone));
  }

  protected addEmail(): void {
    const v = this.newEmail().trim();
    if (v && !this.personalEmails().includes(v)) {
      this.personalEmails.update((arr) => [...arr, v]);
    }
    this.newEmail.set('');
  }

  protected removeEmail(email: string): void {
    this.personalEmails.update((arr) => arr.filter((e) => e !== email));
  }

  protected async saveContact(): Promise<void> {
    this.saving.set(true);
    this.sectionError.set('');
    try {
      await firstValueFrom(
        this.selfService.updateMyContact({
          phoneNumbers: this.phoneNumbers(),
          personalEmails: this.personalEmails(),
        }),
      );
      this.editSection.set(null);
      this.profileResource.reload();
      this.toast.success('Contact details saved');
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
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    digitalAddress: '',
    isCurrentAddress: false,
  });
  protected readonly addressForm = form(this.addressModel, (s) => {
    required(s.city, { message: 'City is required' });
    required(s.country, { message: 'Country is required' });
  });

  protected openAddAddress(): void {
    this.editAddressId.set(null);
    this.addressModel.set({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      digitalAddress: '',
      isCurrentAddress: false,
    });
    this.editSection.set('address');
    this.sectionError.set('');
  }

  protected openEditAddress(addr: EmployeeAddress): void {
    this.editAddressId.set(addr.id);
    this.addressModel.set({
      street: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      zipCode: addr.zipCode ?? '',
      country: addr.country ?? '',
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
      const m = this.addressModel();
      const id = this.editAddressId();
      const input: EmployeeAddressInput = {
        ...(m.street && { street: m.street }),
        ...(m.city && { city: m.city }),
        ...(m.state && { state: m.state }),
        ...(m.zipCode && { zipCode: m.zipCode }),
        ...(m.country && { country: m.country }),
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
      this.toast.success(id ? 'Address updated' : 'Address added');
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
      this.toast.success('Address removed');
    } catch (err: unknown) {
      this.sectionError.set((err as { message?: string })?.message ?? 'Failed to remove address.');
    }
  }

  // ── Identification form ───────────────────────────────────────────
  protected readonly idModel = signal({
    identificationNumber: '',
    identificationType: 'NATIONAL_ID_CARD',
  });
  protected readonly idForm = form(this.idModel, (s) => {
    required(s.identificationNumber, { message: 'ID number is required' });
    required(s.identificationType, { message: 'ID type is required' });
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
      await firstValueFrom(
        this.selfService.addMyIdentification({
          identificationNumber: m.identificationNumber,
          identificationType: m.identificationType,
        }),
      );
      this.editSection.set(null);
      this.profileResource.reload();
      this.toast.success('ID document added');
    } catch (err: unknown) {
      this.sectionError.set(
        (err as { message?: string })?.message ?? 'Failed to save identification.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected async removeId(identificationId: string): Promise<void> {
    this.sectionError.set('');
    try {
      await firstValueFrom(this.selfService.removeMyIdentification(identificationId));
      this.profileResource.reload();
      this.toast.success('ID document removed');
    } catch (err: unknown) {
      this.sectionError.set(
        (err as { message?: string })?.message ?? 'Failed to remove identification.',
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  /** Asks before removing an address; removal cannot be undone. */
  protected async confirmRemoveAddress(addr: EmployeeAddress): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      heading: 'Remove this address?',
      description: `${this.addressLine(addr) || 'This address'} will be removed from your profile. You can add it again later.`,
      confirmLabel: 'Remove address',
      destructive: true,
    });
    if (confirmed) await this.removeAddress(addr.id);
  }

  /** Asks before removing an ID document; removal cannot be undone. */
  protected async confirmRemoveId(doc: EmployeeIdentification): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      heading: `Remove your ${this.formatIdType(doc.identificationType)}?`,
      description:
        'The document number will be removed from your profile. You can add it again later.',
      confirmLabel: 'Remove document',
      destructive: true,
    });
    if (confirmed) await this.removeId(doc.id);
  }

  protected formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  protected formatIdType(raw: string): string {
    return ID_TYPE_LABELS[raw] ?? raw.replace(/_/g, ' ');
  }

  protected cancelEdit(): void {
    this.editSection.set(null);
    this.editAddressId.set(null);
    this.sectionError.set('');
  }

  protected addressLine(addr: EmployeeAddress): string {
    return [addr.street, addr.city, addr.state, addr.country, addr.zipCode]
      .filter((v) => !!v)
      .join(', ');
  }

  protected trackAddr(index: number, addr: EmployeeAddress): string {
    return addr.id;
  }
  protected trackId(index: number, id: EmployeeIdentification): string {
    return id.id;
  }
}
