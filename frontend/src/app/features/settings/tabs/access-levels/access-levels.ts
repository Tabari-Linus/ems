import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { AccessLevelService, AccessLevelEmployee } from '../../../../core/services/access-level.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Permission } from '../../../../core/models/permission.model';
import { AccessLevelListItem } from '../../../../core/models/settings.models';
import { EmployeeListItem } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-settings-access-levels',
  imports: [FormField],
  templateUrl: './access-levels.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAccessLevels {
  private readonly accessLevelService = inject(AccessLevelService);
  private readonly employeeService    = inject(EmployeeService);

  protected readonly VIEW_PERMISSIONS   = Object.values(Permission).filter(p => p.startsWith('VIEW_'));
  protected readonly MANAGE_PERMISSIONS = Object.values(Permission).filter(p => p.startsWith('MANAGE_'));

  // ── Form state ────────────────────────────────────────────────
  protected readonly showForm      = signal(false);
  protected readonly editId        = signal<string | null>(null);
  protected readonly saving        = signal(false);
  protected readonly loadingPerms  = signal(false);
  protected readonly formError     = signal('');
  protected readonly permError     = signal('');
  protected readonly selectedPerms = signal<string[]>([]);

  protected readonly model = signal({ accessLevelName: '', description: '' });

  protected readonly accessLevelForm = form(this.model, s => {
    required(s.accessLevelName, { message: 'Access level name is required' });
  });

  // ── Employee selector ─────────────────────────────────────────
  protected readonly employeeSearch    = signal('');
  protected readonly selectedEmployees = signal<AccessLevelEmployee[]>([]);
  protected readonly searchResults     = signal<EmployeeListItem[] | null>(null);
  protected readonly searchLoading     = signal(false);
  private originalEmployeeIds          = new Set<string>();
  private searchVersion                = 0;

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
      const page = await firstValueFrom(
        this.employeeService.getEmployees({ search: q }, 0, 8),
      );
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
    if (this.selectedEmployees().some(e => e.id === emp.id)) return;
    this.selectedEmployees.update(arr => [
      ...arr,
      { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, status: emp.status ?? '' },
    ]);
    this.employeeSearch.set('');
    this.searchResults.set(null);
  }

  protected removeEmployee(empId: string): void {
    this.selectedEmployees.update(arr => arr.filter(e => e.id !== empId));
  }

  // ── List ──────────────────────────────────────────────────────
  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.accessLevelService.getAccessLevels()),
  });

  // ── Form open / close ─────────────────────────────────────────
  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({ accessLevelName: '', description: '' });
    this.selectedPerms.set([]);
    this.selectedEmployees.set([]);
    this.employeeSearch.set('');
    this.searchResults.set(null);
    this.originalEmployeeIds = new Set();
    this.showForm.update(v => !v);
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
      this.originalEmployeeIds = new Set(emps.map(e => e.id));
    } catch {
      // non-critical
    } finally {
      this.loadingPerms.set(false);
    }
  }

  // ── Permission helpers ────────────────────────────────────────
  protected togglePerm(perm: string): void {
    this.selectedPerms.update(perms =>
      perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm],
    );
    this.permError.set('');
  }

  protected selectAll(group: string[]): void {
    this.selectedPerms.update(perms => [...new Set([...perms, ...group])]);
    this.permError.set('');
  }

  protected deselectAll(group: string[]): void {
    this.selectedPerms.update(perms => perms.filter(p => !group.includes(p)));
  }

  protected isPermSelected(perm: string): boolean {
    return this.selectedPerms().includes(perm);
  }

  protected formatPerm(perm: string): string {
    return perm.replace(/^(VIEW_|MANAGE_)/, '').split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
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
          const currentIds = new Set(this.selectedEmployees().map(e => e.id));
          const addIds     = [...currentIds].filter(eid => !this.originalEmployeeIds.has(eid));
          const removeIds  = [...this.originalEmployeeIds].filter(eid => !currentIds.has(eid));
          await firstValueFrom(
            this.accessLevelService.updateAccessLevel(id, {
              accessLevelName: m.accessLevelName,
              ...(m.description   && { description: m.description }),
              ...(addIds.length   && { addEmployeeIds: addIds }),
              ...(removeIds.length && { removeEmployeeIds: removeIds }),
            }),
          );
        } else {
          const empIds = this.selectedEmployees().map(e => e.id);
          await firstValueFrom(
            this.accessLevelService.createAccessLevel({
              accessLevelName: m.accessLevelName,
              ...(m.description && { description: m.description }),
              permissions: this.selectedPerms(),
              ...(empIds.length && { employeeIds: empIds }),
            }),
          );
        }
        this.model.set({ accessLevelName: '', description: '' });
        this.selectedPerms.set([]);
        this.selectedEmployees.set([]);
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set((err as { message?: string })?.message ?? 'Failed to save access level.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
