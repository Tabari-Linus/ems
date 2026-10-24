import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Avatar } from '@ems/ui/avatar';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { DescriptionItem, DescriptionList } from '@ems/ui/description-list';
import { DialogService } from '@ems/ui/dialog';
import { ErrorState } from '@ems/ui/error-state';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@ems/ui/menu';
import { Select, type SelectOption } from '@ems/ui/select';
import { Skeleton } from '@ems/ui/skeleton';
import { StatusPill, type EmployeeStatus } from '@ems/ui/status-pill';
import { TabPanel, Tabs } from '@ems/ui/tabs';
import { Tag } from '@ems/ui/tag';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { Permission } from '../../core/models/permission.model';

const EMPLOYEE_STATUSES: readonly string[] = ['ACTIVE', 'PENDING', 'INACTIVE', 'ARCHIVED'];

/** A colleague's profile: header card, pill tabs, inline edits and lifecycle actions. */
@Component({
  selector: 'app-profile',
  imports: [
    RouterLink,
    Icon,
    Alert,
    Avatar,
    Button,
    Card,
    DescriptionItem,
    DescriptionList,
    ErrorState,
    Menu,
    MenuItem,
    MenuSeparator,
    MenuTrigger,
    Select,
    Skeleton,
    StatusPill,
    TabPanel,
    Tabs,
    Tag,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly employeeService = inject(EmployeeService);
  private readonly positionService = inject(PositionService);
  private readonly departmentService = inject(DepartmentService);
  private readonly accessLevelService = inject(AccessLevelService);
  private readonly authService = inject(AuthService);
  private readonly dialogs = inject(DialogService);

  protected readonly employeeId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly canManage = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  protected readonly profileResource = resource({
    loader: () => firstValueFrom(this.employeeService.getEmployee(this.employeeId)),
  });

  /** Selected profile tab (Overview first). */
  protected readonly tab = signal(0);

  // ── Status actions ────────────────────────────────────────────
  protected readonly actionError = signal('');
  protected readonly activating = signal(false);
  protected readonly deactivating = signal(false);
  protected readonly archiving = signal(false);
  protected readonly busy = computed(
    () => this.activating() || this.deactivating() || this.archiving(),
  );

  /** Lifecycle actions ask first (`confirm-dialog`), then run the existing mutation. */
  protected async confirmActivate(name: string): Promise<void> {
    const ok = await this.dialogs.confirm({
      heading: `Activate ${name}?`,
      description: 'They can sign in to EMS and show as active in the directory.',
      confirmLabel: 'Activate',
    });
    if (ok) await this.onActivate();
  }

  protected async confirmDeactivate(name: string): Promise<void> {
    const ok = await this.dialogs.confirm({
      heading: `Deactivate ${name}?`,
      description: 'They can no longer sign in. You can activate them again later.',
      confirmLabel: 'Deactivate',
      destructive: true,
    });
    if (ok) await this.onDeactivate();
  }

  protected async confirmArchive(name: string): Promise<void> {
    const ok = await this.dialogs.confirm({
      heading: `Archive ${name}?`,
      description: 'Their record is kept for reporting but leaves the active directory.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (ok) await this.onArchive();
  }

  protected async onActivate(): Promise<void> {
    this.activating.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.activateEmployee(this.employeeId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'They could not be activated. Try again.',
      );
    } finally {
      this.activating.set(false);
    }
  }

  protected async onDeactivate(): Promise<void> {
    this.deactivating.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.deactivateEmployee(this.employeeId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'They could not be deactivated. Try again.',
      );
    } finally {
      this.deactivating.set(false);
    }
  }

  protected async onArchive(): Promise<void> {
    this.archiving.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.archiveEmployee(this.employeeId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'They could not be archived. Try again.',
      );
    } finally {
      this.archiving.set(false);
    }
  }

  // ── Assign position ───────────────────────────────────────────
  protected readonly editingPosition = signal(false);
  protected readonly selectedPositionId = signal('');
  protected readonly savingPosition = signal(false);
  protected readonly positionError = signal('');

  private readonly positionsEnabled = signal(false);
  // Loaded on first edit. `params` is the reactive part of a resource; the loader is untracked,
  // so gating inside the loader (as before) never loaded the options.
  protected readonly positionsResource = resource({
    params: () => this.positionsEnabled() || undefined,
    loader: () => firstValueFrom(this.positionService.getPositions()),
  });

  protected readonly positionOptions = computed<readonly SelectOption<string>[]>(() => [
    { value: '', label: 'No position' },
    ...(this.positionsResource.value()?.data ?? []).map((p) => ({
      value: p.id,
      label: `${p.positionName} (${p.level})`,
    })),
  ]);

  protected startEditPosition(currentId?: string): void {
    this.selectedPositionId.set(currentId ?? '');
    this.positionError.set('');
    this.positionsEnabled.set(true);
    this.editingPosition.set(true);
  }

  protected cancelEditPosition(): void {
    this.editingPosition.set(false);
    this.positionError.set('');
  }

  protected async savePosition(): Promise<void> {
    this.savingPosition.set(true);
    this.positionError.set('');
    try {
      await firstValueFrom(
        this.employeeService.updateEmployee(this.employeeId, {
          positionId: this.selectedPositionId() || null,
        }),
      );
      this.editingPosition.set(false);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.positionError.set(
        (err as { message?: string })?.message ?? 'The position was not saved. Try again.',
      );
    } finally {
      this.savingPosition.set(false);
    }
  }

  // ── Assign department ─────────────────────────────────────────
  protected readonly editingDepartment = signal(false);
  protected readonly selectedDepartmentId = signal('');
  protected readonly savingDepartment = signal(false);
  protected readonly departmentError = signal('');

  private readonly departmentsEnabled = signal(false);
  protected readonly departmentsResource = resource({
    params: () => this.departmentsEnabled() || undefined,
    loader: () => firstValueFrom(this.departmentService.getDepartments()),
  });

  protected readonly departmentOptions = computed<readonly SelectOption<string>[]>(() => [
    { value: '', label: 'No department' },
    ...(this.departmentsResource.value()?.data ?? []).map((d) => ({
      value: d.id,
      label: d.departmentName,
    })),
  ]);

  protected startEditDepartment(currentId?: string): void {
    this.selectedDepartmentId.set(currentId ?? '');
    this.departmentError.set('');
    this.departmentsEnabled.set(true);
    this.editingDepartment.set(true);
  }

  protected cancelEditDepartment(): void {
    this.editingDepartment.set(false);
    this.departmentError.set('');
  }

  protected async saveDepartment(): Promise<void> {
    this.savingDepartment.set(true);
    this.departmentError.set('');
    try {
      await firstValueFrom(
        this.employeeService.updateEmployee(this.employeeId, {
          departmentId: this.selectedDepartmentId() || null,
        }),
      );
      this.editingDepartment.set(false);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.departmentError.set(
        (err as { message?: string })?.message ?? 'The department was not saved. Try again.',
      );
    } finally {
      this.savingDepartment.set(false);
    }
  }

  // ── Assign access level ───────────────────────────────────────
  protected readonly editingAccessLevel = signal(false);
  protected readonly selectedAccessLevelId = signal('');
  protected readonly savingAccessLevel = signal(false);
  protected readonly accessLevelError = signal('');

  private readonly accessLevelsEnabled = signal(false);
  protected readonly accessLevelsResource = resource({
    params: () => this.accessLevelsEnabled() || undefined,
    loader: () => firstValueFrom(this.accessLevelService.getAccessLevels()),
  });

  protected readonly accessLevelOptions = computed<readonly SelectOption<string>[]>(() => [
    { value: '', label: 'No access level' },
    ...(this.accessLevelsResource.value()?.data ?? []).map((a) => ({
      value: a.id,
      label: a.accessLevelName,
    })),
  ]);

  protected startEditAccessLevel(currentId?: string): void {
    this.selectedAccessLevelId.set(currentId ?? '');
    this.accessLevelError.set('');
    this.accessLevelsEnabled.set(true);
    this.editingAccessLevel.set(true);
  }

  protected cancelEditAccessLevel(): void {
    this.editingAccessLevel.set(false);
    this.accessLevelError.set('');
  }

  protected async saveAccessLevel(): Promise<void> {
    this.savingAccessLevel.set(true);
    this.accessLevelError.set('');
    try {
      await firstValueFrom(
        this.employeeService.updateEmployee(this.employeeId, {
          accessLevelId: this.selectedAccessLevelId() || null,
        }),
      );
      this.editingAccessLevel.set(false);
      this.profileResource.reload();
    } catch (err: unknown) {
      this.accessLevelError.set(
        (err as { message?: string })?.message ?? 'The access level was not saved. Try again.',
      );
    } finally {
      this.savingAccessLevel.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  protected fullName(emp: {
    firstName: string;
    lastName: string;
    bio?: { fullName?: string };
  }): string {
    return emp.bio?.fullName || `${emp.firstName} ${emp.lastName}`;
  }

  protected asStatus(status: string | null | undefined): EmployeeStatus {
    return status && EMPLOYEE_STATUSES.includes(status) ? (status as EmployeeStatus) : 'PENDING';
  }

  protected errorMessage(err: unknown): string {
    return (err as { message?: string })?.message ?? 'The server did not respond.';
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

  protected addressLine(addr: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }): string {
    return [addr.street, addr.city, addr.state, addr.country, addr.zipCode]
      .filter(Boolean)
      .join(', ');
  }

  protected idTypeLabel(type: string): string {
    const words = type.replace(/_/g, ' ').toLocaleLowerCase();
    return words.charAt(0).toLocaleUpperCase() + words.slice(1);
  }
}
