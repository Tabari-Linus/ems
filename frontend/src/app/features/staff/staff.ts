import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/services/auth.service';
import { Permission } from '../../core/models/permission.model';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { RouterLink } from '@angular/router';
import { EmployeeListItem } from '../../core/models/employee.model';

const AVATAR_COLORS = [
  '#667eea', '#764ba2', '#f97316', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
  '#84cc16', '#f59e0b',
];

@Component({
  selector: 'app-staff',
  imports: [FormField, RouterLink],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Staff implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly positionService = inject(PositionService);
  private readonly deptService     = inject(DepartmentService);
  private readonly accessService   = inject(AccessLevelService);

  protected readonly canManage = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  // ── List state ────────────────────────────────────────────────
  protected readonly employees     = signal<EmployeeListItem[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly hasNext       = signal(false);
  protected readonly loading       = signal(false);
  protected readonly loadError     = signal('');
  private page = 0;

  // ── Filter state ──────────────────────────────────────────────
  protected readonly searchValue = signal('');

  // ── Modal state ───────────────────────────────────────────────
  protected readonly selectedEmployee = signal<EmployeeListItem | null>(null);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.selectedEmployee.set(null);
  }

  // ── Add Employee form ─────────────────────────────────────────
  protected readonly showAddForm = signal(false);
  protected readonly saving      = signal(false);
  protected readonly addError    = signal('');

  protected readonly addModel = signal({
    firstName:     '',
    lastName:      '',
    workEmail:     '',
    positionId:    '',
    departmentId:  '',
    accessLevelId: '',
  });

  protected readonly addForm = form(this.addModel, s => {
    required(s.firstName,  { message: 'First name is required' });
    required(s.lastName,   { message: 'Last name is required' });
    required(s.workEmail,  { message: 'Work email is required' });
    email(s.workEmail,     { message: 'Enter a valid work email address' });
  });

  // ── Dropdown resources ────────────────────────────────────────
  protected readonly positionsResource = resource({
    loader: () => firstValueFrom(this.positionService.getPositions()),
  });
  protected readonly departmentsResource = resource({
    loader: () => firstValueFrom(this.deptService.getDepartments()),
  });
  protected readonly accessLevelsResource = resource({
    loader: () => firstValueFrom(this.accessService.getAccessLevels()),
  });

  // ── Skeleton placeholder rows ─────────────────────────────────
  protected readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  ngOnInit(): void {
    this.fetch(true);
  }

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.fetch(true), 400);
  }

  protected loadMore(): void {
    this.fetch(false);
  }

  private fetch(reset: boolean): void {
    if (reset) {
      this.page = 0;
      this.employees.set([]);
    }
    this.loading.set(true);
    this.loadError.set('');

    firstValueFrom(
      this.employeeService.getEmployees(
        { search: this.searchValue() || undefined },
        this.page,
      ),
    )
      .then(result => {
        this.employees.update(prev => reset ? result.data : [...prev, ...result.data]);
        this.totalElements.set(result.totalElements);
        this.hasNext.set(result.hasNext);
        this.page = result.currentPage + 1;
      })
      .catch((err: unknown) => {
        this.loadError.set(
          (err as { message?: string })?.message ?? 'Failed to load employees.',
        );
      })
      .finally(() => this.loading.set(false));
  }

  protected toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    this.addError.set('');
  }

  protected onAddSubmit(): void {
    submit(this.addForm, async () => {
      this.saving.set(true);
      this.addError.set('');
      try {
        const m = this.addModel();
        await firstValueFrom(
          this.employeeService.createEmployee({
            firstName: m.firstName,
            lastName:  m.lastName,
            workEmail: m.workEmail,
            ...(m.positionId    && { positionId:    m.positionId }),
            ...(m.departmentId  && { departmentId:  m.departmentId }),
            ...(m.accessLevelId && { accessLevelId: m.accessLevelId }),
          }),
        );
        this.addModel.set({
          firstName: '', lastName: '', workEmail: '',
          positionId: '', departmentId: '', accessLevelId: '',
        });
        this.showAddForm.set(false);
        this.fetch(true);
      } catch (err: unknown) {
        this.addError.set(
          (err as { message?: string })?.message ?? 'Failed to add employee.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }

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
}
