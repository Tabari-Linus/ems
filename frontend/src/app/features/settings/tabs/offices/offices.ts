import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { OfficeService } from '../../../../core/services/office.service';
import { CompanyService } from '../../../../core/services/company.service';
import { OfficeListItem } from '../../../../core/models/settings.models';

@Component({
  selector: 'app-settings-offices',
  imports: [FormField],
  templateUrl: './offices.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsOffices {
  private readonly officeService = inject(OfficeService);
  private readonly companyService = inject(CompanyService);

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly model = signal({
    companyId: '',
    officeName: '',
    officeEmail: '',
    officePhoneNumber: '',
    officeAddress: '',
  });

  protected readonly officeForm = form(this.model, (s) => {
    required(s.companyId, { message: 'Please select a company' });
    required(s.officeName, { message: 'Office name is required' });
    required(s.officeEmail, { message: 'Email is required' });
    email(s.officeEmail, { message: 'Enter a valid email address' });
  });

  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.officeService.getOffices()),
  });

  protected readonly companiesResource = resource({
    loader: () => firstValueFrom(this.companyService.getCompanies()),
  });

  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({
      companyId: '',
      officeName: '',
      officeEmail: '',
      officePhoneNumber: '',
      officeAddress: '',
    });
    this.showForm.update((v) => !v);
    this.formError.set('');
  }

  protected startEdit(item: OfficeListItem): void {
    this.editId.set(item.id);
    this.model.set({
      companyId: '',
      officeName: item.officeName,
      officeEmail: item.officeEmail ?? '',
      officePhoneNumber: item.officePhoneNumber ?? '',
      officeAddress: item.officeAddress ?? '',
    });
    this.showForm.set(true);
    this.formError.set('');
  }

  protected onSubmit(): void {
    submit(this.officeForm, async () => {
      this.saving.set(true);
      this.formError.set('');
      try {
        const m = this.model();
        const id = this.editId();
        if (id) {
          await firstValueFrom(
            this.officeService.updateOffice(id, {
              officeName: m.officeName,
              officeEmail: m.officeEmail,
              ...(m.officePhoneNumber && { officePhoneNumber: m.officePhoneNumber }),
              ...(m.officeAddress && { officeAddress: m.officeAddress }),
            }),
          );
        } else {
          await firstValueFrom(
            this.officeService.createOffice({
              companyId: m.companyId,
              officeName: m.officeName,
              officeEmail: m.officeEmail,
              ...(m.officePhoneNumber && { officePhoneNumber: m.officePhoneNumber }),
              ...(m.officeAddress && { officeAddress: m.officeAddress }),
            }),
          );
        }
        this.model.set({
          companyId: '',
          officeName: '',
          officeEmail: '',
          officePhoneNumber: '',
          officeAddress: '',
        });
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set((err as { message?: string })?.message ?? 'Failed to save office.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
