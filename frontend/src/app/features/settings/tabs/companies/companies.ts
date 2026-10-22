import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanyListItem } from '../../../../core/models/settings.models';

@Component({
  selector: 'app-settings-companies',
  imports: [FormField],
  templateUrl: './companies.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCompanies {
  private readonly companyService = inject(CompanyService);

  protected readonly showForm  = signal(false);
  protected readonly editId    = signal<string | null>(null);
  protected readonly saving    = signal(false);
  protected readonly formError = signal('');

  protected readonly model = signal({
    companyName: '',
    companyCode: '',
    companyEmail: '',
    companyPhoneNumber: '',
    companyAddress: '',
  });

  protected readonly companyForm = form(this.model, s => {
    required(s.companyName,  { message: 'Company name is required' });
    required(s.companyCode,  { message: 'Company code is required' });
    required(s.companyEmail, { message: 'Email is required' });
    email(s.companyEmail,    { message: 'Enter a valid email address' });
  });

  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.companyService.getCompanies()),
  });

  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({ companyName: '', companyCode: '', companyEmail: '', companyPhoneNumber: '', companyAddress: '' });
    this.showForm.update(v => !v);
    this.formError.set('');
  }

  protected startEdit(item: CompanyListItem): void {
    this.editId.set(item.id);
    this.model.set({
      companyName:        item.companyName,
      companyCode:        item.companyCode,
      companyEmail:       item.companyEmail       ?? '',
      companyPhoneNumber: item.companyPhoneNumber ?? '',
      companyAddress:     item.companyAddress     ?? '',
    });
    this.showForm.set(true);
    this.formError.set('');
  }

  protected onSubmit(): void {
    submit(this.companyForm, async () => {
      this.saving.set(true);
      this.formError.set('');
      try {
        const m = this.model();
        const id = this.editId();
        if (id) {
          await firstValueFrom(
            this.companyService.updateCompany(id, {
              companyName:        m.companyName,
              companyCode:        m.companyCode,
              companyEmail:       m.companyEmail,
              ...(m.companyPhoneNumber && { companyPhoneNumber: m.companyPhoneNumber }),
              ...(m.companyAddress     && { companyAddress:     m.companyAddress }),
            }),
          );
        } else {
          await firstValueFrom(
            this.companyService.createCompany({
              companyName:  m.companyName,
              companyCode:  m.companyCode,
              companyEmail: m.companyEmail,
              ...(m.companyPhoneNumber && { companyPhoneNumber: m.companyPhoneNumber }),
              ...(m.companyAddress     && { companyAddress:     m.companyAddress }),
            }),
          );
        }
        this.model.set({ companyName: '', companyCode: '', companyEmail: '', companyPhoneNumber: '', companyAddress: '' });
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set((err as { message?: string })?.message ?? 'Failed to save company.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
