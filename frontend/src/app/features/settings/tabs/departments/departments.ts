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
import { DepartmentService } from '../../../../core/services/department.service';
import { OfficeService } from '../../../../core/services/office.service';
import { DepartmentListItem } from '../../../../core/models/settings.models';
import { SETTINGS_TAB_IMPORTS } from '../../shared/settings-imports';
import { bindFormDrawer, countLabel, fieldError, statusPillValue } from '../../shared/settings-ui';

@Component({
  selector: 'app-settings-departments',
  imports: [FormField, ...SETTINGS_TAB_IMPORTS],
  templateUrl: './departments.html',
  styleUrl: '../../shared/settings-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDepartments {
  private readonly departmentService = inject(DepartmentService);
  private readonly officeService = inject(OfficeService);
  private readonly toast = inject(ToastService);

  protected readonly fieldError = fieldError;
  protected readonly statusPillValue = statusPillValue;
  protected readonly trackById = (_: number, row: DepartmentListItem) => row.id;
  private readonly formTemplate = viewChild<TemplateRef<unknown>>('formTpl');

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly model = signal({
    officeId: '',
    departmentName: '',
    departmentEmail: '',
    departmentPhoneNumber: '',
    departmentAddress: '',
  });

  protected readonly deptForm = form(this.model, (s) => {
    required(s.officeId, { message: 'Please select an office' });
    required(s.departmentName, { message: 'Department name is required' });
    required(s.departmentEmail, { message: 'Email is required' });
    email(s.departmentEmail, { message: 'Enter a valid email address' });
  });

  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.departmentService.getDepartments()),
  });

  protected readonly rows = computed(() =>
    this.listResource.hasValue() ? this.listResource.value().data : [],
  );
  protected readonly count = computed(() =>
    this.listResource.hasValue()
      ? countLabel(
          this.listResource.value().totalElements ?? this.rows().length,
          'department',
          'departments',
        )
      : null,
  );

  constructor() {
    bindFormDrawer(this.showForm, this.formTemplate, {
      autoFocus: '#departments-dept-form-department-name',
    });
  }

  protected readonly officesResource = resource({
    loader: () => firstValueFrom(this.officeService.getOffices()),
  });

  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({
      officeId: '',
      departmentName: '',
      departmentEmail: '',
      departmentPhoneNumber: '',
      departmentAddress: '',
    });
    this.showForm.update((v) => !v);
    this.formError.set('');
  }

  protected startEdit(item: DepartmentListItem): void {
    this.editId.set(item.id);
    this.model.set({
      officeId: '',
      departmentName: item.departmentName,
      departmentEmail: item.departmentEmail ?? '',
      departmentPhoneNumber: item.departmentPhoneNumber ?? '',
      departmentAddress: item.departmentAddress ?? '',
    });
    this.showForm.set(true);
    this.formError.set('');
  }

  protected onSubmit(): void {
    submit(this.deptForm, async () => {
      this.saving.set(true);
      this.formError.set('');
      try {
        const m = this.model();
        const id = this.editId();
        if (id) {
          await firstValueFrom(
            this.departmentService.updateDepartment(id, {
              departmentName: m.departmentName,
              departmentEmail: m.departmentEmail,
              ...(m.departmentPhoneNumber && { departmentPhoneNumber: m.departmentPhoneNumber }),
              ...(m.departmentAddress && { departmentAddress: m.departmentAddress }),
            }),
          );
        } else {
          await firstValueFrom(
            this.departmentService.createDepartment({
              officeId: m.officeId,
              departmentName: m.departmentName,
              departmentEmail: m.departmentEmail,
              ...(m.departmentPhoneNumber && { departmentPhoneNumber: m.departmentPhoneNumber }),
              ...(m.departmentAddress && { departmentAddress: m.departmentAddress }),
            }),
          );
        }
        this.toast.success(id ? 'Department updated' : 'Department added');
        this.model.set({
          officeId: '',
          departmentName: '',
          departmentEmail: '',
          departmentPhoneNumber: '',
          departmentAddress: '',
        });
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set((err as { message?: string })?.message ?? 'Failed to save department.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
