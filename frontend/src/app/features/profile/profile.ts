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
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { Permission } from '../../core/models/permission.model';

const AVATAR_COLORS = [
  '#fe7f2d',
  '#619b8a',
  '#fcca46',
  '#a1c181',
  '#5e7a8a',
  '#e07070',
  '#233d4d',
  '#2e4e60',
];

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
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

  protected readonly employeeId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly canManage = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  protected readonly profileResource = resource({
    loader: () => firstValueFrom(this.employeeService.getEmployee(this.employeeId)),
  });

  // ── Status actions ────────────────────────────────────────────
  protected readonly actionError = signal('');
  protected readonly activating = signal(false);
  protected readonly deactivating = signal(false);
  protected readonly archiving = signal(false);

  protected async onActivate(): Promise<void> {
    this.activating.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.activateEmployee(this.employeeId));
      this.profileResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'Failed to activate employee.',
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
        (err as { message?: string })?.message ?? 'Failed to deactivate employee.',
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
      this.actionError.set((err as { message?: string })?.message ?? 'Failed to archive employee.');
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
  protected readonly positionsResource = resource({
    loader: () => {
      if (!this.positionsEnabled()) return Promise.resolve(null);
      return firstValueFrom(this.positionService.getPositions());
    },
  });

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
        (err as { message?: string })?.message ?? 'Failed to assign position.',
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
    loader: () => {
      if (!this.departmentsEnabled()) return Promise.resolve(null);
      return firstValueFrom(this.departmentService.getDepartments());
    },
  });

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
        (err as { message?: string })?.message ?? 'Failed to assign department.',
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
    loader: () => {
      if (!this.accessLevelsEnabled()) return Promise.resolve(null);
      return firstValueFrom(this.accessLevelService.getAccessLevels());
    },
  });

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
        (err as { message?: string })?.message ?? 'Failed to assign access level.',
      );
    } finally {
      this.savingAccessLevel.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
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
}
