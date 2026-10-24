import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@ems/ui/toast';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanyListItem } from '../../../../core/models/settings.models';
import { SETTINGS_TAB_IMPORTS } from '../../shared/settings-imports';
import { bindFormDrawer, countLabel, fieldError, statusPillValue } from '../../shared/settings-ui';

@Component({
  selector: 'app-settings-companies',
  imports: [FormField, ...SETTINGS_TAB_IMPORTS],
  templateUrl: './companies.html',
  styleUrl: '../../shared/settings-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCompanies {
  private readonly companyService = inject(CompanyService);
  private readonly toast = inject(ToastService);

  protected readonly fieldError = fieldError;
  protected readonly statusPillValue = statusPillValue;
  protected readonly trackById = (_: number, row: CompanyListItem) => row.id;
  private readonly formTemplate = viewChild<TemplateRef<unknown>>('formTpl');

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly model = signal({
    companyName: '',
    companyCode: '',
    companyEmail: '',
    companyPhoneNumber: '',
    companyAddress: '',
  });

  protected readonly companyForm = form(this.model, (s) => {
    required(s.companyName, { message: 'Company name is required' });
    required(s.companyCode, { message: 'Company code is required' });
    required(s.companyEmail, { message: 'Email is required' });
    email(s.companyEmail, { message: 'Enter a valid email address' });
  });

  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.companyService.getCompanies()),
  });

  protected readonly rows = computed(() =>
    this.listResource.hasValue() ? this.listResource.value().data : [],
  );
  protected readonly count = computed(() =>
    this.listResource.hasValue()
      ? countLabel(
          this.listResource.value().totalElements ?? this.rows().length,
          'company',
          'companies',
        )
      : null,
  );

  constructor() {
    bindFormDrawer(this.showForm, this.formTemplate, {
      autoFocus: '#companies-company-form-company-name',
    });
  }

  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({
      companyName: '',
      companyCode: '',
      companyEmail: '',
      companyPhoneNumber: '',
      companyAddress: '',
    });
    this.showForm.update((v) => !v);
    this.formError.set('');
  }

  protected startEdit(item: CompanyListItem): void {
    this.editId.set(item.id);
    this.model.set({
      companyName: item.companyName,
      companyCode: item.companyCode,
      companyEmail: item.companyEmail ?? '',
      companyPhoneNumber: item.companyPhoneNumber ?? '',
      companyAddress: item.companyAddress ?? '',
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
              companyName: m.companyName,
              companyCode: m.companyCode,
              companyEmail: m.companyEmail,
              ...(m.companyPhoneNumber && { companyPhoneNumber: m.companyPhoneNumber }),
              ...(m.companyAddress && { companyAddress: m.companyAddress }),
            }),
          );
        } else {
          await firstValueFrom(
            this.companyService.createCompany({
              companyName: m.companyName,
              companyCode: m.companyCode,
              companyEmail: m.companyEmail,
              ...(m.companyPhoneNumber && { companyPhoneNumber: m.companyPhoneNumber }),
              ...(m.companyAddress && { companyAddress: m.companyAddress }),
            }),
          );
        }
        this.toast.success(id ? 'Company updated' : 'Company added');
        this.model.set({
          companyName: '',
          companyCode: '',
          companyEmail: '',
          companyPhoneNumber: '',
          companyAddress: '',
        });
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
