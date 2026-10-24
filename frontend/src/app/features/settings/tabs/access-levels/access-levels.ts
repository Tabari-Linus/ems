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
import { form, FormField, required, submit } from '@angular/forms/signals';
import {
  AccessLevelService,
  AccessLevelEmployee,
} from '../../../../core/services/access-level.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Permission } from '../../../../core/models/permission.model';
import { AccessLevelListItem } from '../../../../core/models/settings.models';
import { SETTINGS_TAB_IMPORTS } from '../../shared/settings-imports';
import { bindFormDrawer, countLabel, fieldError, statusPillValue } from '../../shared/settings-ui';
import { EmployeeListItem } from '../../../../core/models/employee.model';
import { Avatar } from '@ems/ui/avatar';
import { Checkbox } from '@ems/ui/checkbox';
import { Spinner } from '@ems/ui/spinner';
import { Tag } from '@ems/ui/tag';
import { PERMISSION_AREA_GROUPS } from './permission-areas';

@Component({
  selector: 'app-settings-access-levels',
  imports: [FormField, ...SETTINGS_TAB_IMPORTS, Avatar, Checkbox, Spinner, Tag],
  templateUrl: './access-levels.html',
  styleUrls: ['../../shared/settings-tab.css', './access-levels.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAccessLevels {
  private readonly accessLevelService = inject(AccessLevelService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);

  protected readonly fieldError = fieldError;
  protected readonly statusPillValue = statusPillValue;
  protected readonly trackById = (_: number, row: AccessLevelListItem) => row.id;
  private readonly formTemplate = viewChild<TemplateRef<unknown>>('formTpl');

  protected readonly VIEW_PERMISSIONS = Object.values(Permission).filter((p) =>
    p.startsWith('VIEW_'),
  );
  protected readonly MANAGE_PERMISSIONS = Object.values(Permission).filter((p) =>
    p.startsWith('MANAGE_'),
  );

  /** Permission matrix rows: one per area (VIEW_x / MANAGE_x), grouped for scanning. */
  protected readonly areaGroups = PERMISSION_AREA_GROUPS;

  // ── Form state ────────────────────────────────────────────────
  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly loadingPerms = signal(false);
  protected readonly formError = signal('');
  protected readonly permError = signal('');
  protected readonly selectedPerms = signal<string[]>([]);

  protected readonly model = signal({ accessLevelName: '', description: '' });

  protected readonly accessLevelForm = form(this.model, (s) => {
    required(s.accessLevelName, { message: 'Access level name is required' });
  });

  // ── Employee selector ─────────────────────────────────────────
  protected readonly employeeSearch = signal('');
  protected readonly selectedEmployees = signal<AccessLevelEmployee[]>([]);
  protected readonly searchResults = signal<EmployeeListItem[] | null>(null);
  protected readonly searchLoading = signal(false);
  private originalEmployeeIds = new Set<string>();
  private searchVersion = 0;

  protected async onSearchInput(value: string): Promise<void> {
    this.employeeSearch.set(value);
    const q = value.trim();
    if (q.length < 2) {
      this.searchResults.set(null);
      this.searchLoading.set(false);
      return;
    }
    const version = ++this.searchVersion;
    this.searchLoading.set(true);
    try {
      const page = await firstValueFrom(this.employeeService.getEmployees({ search: q }, 0, 8));
      if (version !== this.searchVersion) return;
      this.searchResults.set(page.data);
    } catch {
      if (version !== this.searchVersion) return;
      this.searchResults.set([]);
    } finally {
      if (version === this.searchVersion) this.searchLoading.set(false);
    }
  }

  protected addEmployee(emp: EmployeeListItem): void {
    if (this.selectedEmployees().some((e) => e.id === emp.id)) return;
    this.selectedEmployees.update((arr) => [
      ...arr,
      { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, status: emp.status ?? '' },
    ]);
    this.employeeSearch.set('');
    this.searchResults.set(null);
  }

  protected removeEmployee(empId: string): void {
    this.selectedEmployees.update((arr) => arr.filter((e) => e.id !== empId));
  }

  // ── List ──────────────────────────────────────────────────────
  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.accessLevelService.getAccessLevels()),
  });

  protected readonly rows = computed(() =>
    this.listResource.hasValue() ? this.listResource.value().data : [],
  );
  protected readonly count = computed(() =>
    this.listResource.hasValue()
      ? countLabel(
          this.listResource.value().totalElements ?? this.rows().length,
          'access level',
          'access levels',
        )
      : null,
  );

  constructor() {
    bindFormDrawer(this.showForm, this.formTemplate, {
      autoFocus: '#access-levels-access-level-form-access-level-name',
    });
  }

  // ── Form open / close ─────────────────────────────────────────
  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({ accessLevelName: '', description: '' });
    this.selectedPerms.set([]);
    this.selectedEmployees.set([]);
    this.employeeSearch.set('');
    this.searchResults.set(null);
    this.originalEmployeeIds = new Set();
    this.showForm.update((v) => !v);
    this.formError.set('');
    this.permError.set('');
  }

  protected async startEdit(item: AccessLevelListItem): Promise<void> {
    this.editId.set(item.id);
    this.model.set({ accessLevelName: item.accessLevelName, description: item.description ?? '' });
    this.selectedPerms.set([]);
    this.selectedEmployees.set([]);
    this.employeeSearch.set('');
    this.searchResults.set(null);
    this.originalEmployeeIds = new Set();
    this.showForm.set(true);
    this.formError.set('');
    this.permError.set('');

    this.loadingPerms.set(true);
    try {
      const detail = await firstValueFrom(this.accessLevelService.getAccessLevel(item.id));
      this.selectedPerms.set(detail?.permissions ?? []);
      const emps = detail?.employees ?? [];
      this.selectedEmployees.set(emps);
      this.originalEmployeeIds = new Set(emps.map((e) => e.id));
    } catch {
      // non-critical
    } finally {
      this.loadingPerms.set(false);
    }
  }

  // ── Permission helpers ────────────────────────────────────────
  protected togglePerm(perm: string): void {
    this.selectedPerms.update((perms) =>
      perms.includes(perm) ? perms.filter((p) => p !== perm) : [...perms, perm],
    );
    this.permError.set('');
  }

  protected selectAll(group: string[]): void {
    this.selectedPerms.update((perms) => [...new Set([...perms, ...group])]);
    this.permError.set('');
  }

  protected deselectAll(group: string[]): void {
    this.selectedPerms.update((perms) => perms.filter((p) => !group.includes(p)));
  }

  protected isPermSelected(perm: string): boolean {
    return this.selectedPerms().includes(perm);
  }

  /** Every permission of the group is selected (column header checkbox). */
  protected allSelected(group: string[]): boolean {
    const selected = this.selectedPerms();
    return group.length > 0 && group.every((p) => selected.includes(p));
  }

  /** Some, but not all, of the group is selected (indeterminate header checkbox). */
  protected someSelected(group: string[]): boolean {
    const selected = this.selectedPerms();
    return group.some((p) => selected.includes(p)) && !this.allSelected(group);
  }

  protected setGroup(group: string[], checked: boolean): void {
    if (checked) this.selectAll(group);
    else this.deselectAll(group);
  }

  protected isAdded(empId: string): boolean {
    return this.selectedEmployees().some((e) => e.id === empId);
  }

  protected formatPerm(perm: string): string {
    return perm
      .replace(/^(VIEW_|MANAGE_)/, '')
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  // ── Submit ────────────────────────────────────────────────────
  protected onSubmit(): void {
    submit(this.accessLevelForm, async () => {
      const id = this.editId();
      if (!id && !this.selectedPerms().length) {
        this.permError.set('Select at least one permission.');
        return;
      }
      this.saving.set(true);
      this.formError.set('');
      try {
        const m = this.model();
        if (id) {
          const currentIds = new Set(this.selectedEmployees().map((e) => e.id));
          const addIds = [...currentIds].filter((eid) => !this.originalEmployeeIds.has(eid));
          const removeIds = [...this.originalEmployeeIds].filter((eid) => !currentIds.has(eid));
          await firstValueFrom(
            this.accessLevelService.updateAccessLevel(id, {
              accessLevelName: m.accessLevelName,
              ...(m.description && { description: m.description }),
              ...(addIds.length && { addEmployeeIds: addIds }),
              ...(removeIds.length && { removeEmployeeIds: removeIds }),
            }),
          );
        } else {
          const empIds = this.selectedEmployees().map((e) => e.id);
          await firstValueFrom(
            this.accessLevelService.createAccessLevel({
              accessLevelName: m.accessLevelName,
              ...(m.description && { description: m.description }),
              permissions: this.selectedPerms(),
              ...(empIds.length && { employeeIds: empIds }),
            }),
          );
        }
        this.toast.success(id ? 'Access level updated' : 'Access level added');
        this.model.set({ accessLevelName: '', description: '' });
        this.selectedPerms.set([]);
        this.selectedEmployees.set([]);
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set(
          (err as { message?: string })?.message ?? 'Failed to save access level.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }
}
