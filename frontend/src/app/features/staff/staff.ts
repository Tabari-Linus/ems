import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  computed,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import type { DialogRef } from '@angular/cdk/dialog';
import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Avatar } from '@ems/ui/avatar';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { DATA_TABLE, type DataTableRowEvent } from '@ems/ui/data-table';
import { DrawerLayout, DrawerService } from '@ems/ui/drawer';
import { EmptyState } from '@ems/ui/empty-state';
import { ErrorState } from '@ems/ui/error-state';
import { FilterPill } from '@ems/ui/filter-pill';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { Input } from '@ems/ui/input';
import { PageHeader } from '@ems/ui/page-header';
import { Pagination } from '@ems/ui/pagination';
import { PersonCard } from '@ems/ui/person-card';
import { SearchInput } from '@ems/ui/search-input';
import { NativeSelect, type SelectOption } from '@ems/ui/select';
import { Skeleton } from '@ems/ui/skeleton';
import { StatusPill, type EmployeeStatus } from '@ems/ui/status-pill';
import { ViewToggle, type ViewToggleValue } from '@ems/ui/view-toggle';
import { AuthService } from '../../core/services/auth.service';
import { Permission } from '../../core/models/permission.model';
import { EmployeeService } from '../../core/services/employee.service';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { AccessLevelService } from '../../core/services/access-level.service';
import { EmployeeListItem } from '../../core/models/employee.model';

/** Page size of the existing `getEmployees` call (`EmployeeService.getEmployees` default). */
const PAGE_SIZE = 12;

const STATUS_OPTIONS: readonly SelectOption<EmployeeStatus>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const EMPLOYEE_STATUSES: readonly string[] = STATUS_OPTIONS.map((o) => o.value);

/** The People directory: search, filters, grid or list, and "Add person" in a drawer. */
@Component({
  selector: 'app-staff',
  imports: [
    FormField,
    RouterLink,
    Icon,
    Alert,
    Avatar,
    Button,
    Card,
    ...DATA_TABLE,
    DrawerLayout,
    EmptyState,
    ErrorState,
    FilterPill,
    UiFormField,
    Input,
    NativeSelect,
    PageHeader,
    Pagination,
    PersonCard,
    SearchInput,
    Skeleton,
    StatusPill,
    ViewToggle,
  ],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Staff implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly positionService = inject(PositionService);
  private readonly deptService = inject(DepartmentService);
  private readonly accessService = inject(AccessLevelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly drawer = inject(DrawerService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly canManage = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  // ── List state ────────────────────────────────────────────────
  protected readonly employees = signal<EmployeeListItem[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  /** Pages loaded so far (1-based, for `ui-pagination`'s load-more variant). */
  protected readonly pagesLoaded = signal(0);
  protected readonly pageSize = PAGE_SIZE;
  private page = 0;

  // ── Filter / view state ───────────────────────────────────────
  protected readonly searchValue = signal('');
  protected readonly statusFilter = signal<EmployeeStatus | null>(null);
  protected readonly departmentFilter = signal<string | null>(null);
  protected readonly view = signal<ViewToggleValue>('grid');
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly hasFilters = computed(
    () => !!this.searchValue() || !!this.statusFilter() || !!this.departmentFilter(),
  );

  protected readonly countLabel = computed(() => {
    const n = this.totalElements();
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  });

  // ── Add person form ───────────────────────────────────────────
  protected readonly showAddForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly addError = signal('');
  private readonly addDrawer = viewChild.required<TemplateRef<unknown>>('addDrawer');
  private drawerRef: DialogRef<unknown, unknown> | null = null;

  protected readonly addModel = signal({
    firstName: '',
    lastName: '',
    workEmail: '',
    positionId: '',
    departmentId: '',
    accessLevelId: '',
  });

  protected readonly addForm = form(this.addModel, (s) => {
    required(s.firstName, { message: 'Enter their first name' });
    required(s.lastName, { message: 'Enter their last name' });
    required(s.workEmail, { message: 'Enter their work email' });
    email(s.workEmail, { message: 'Enter a work email like name@company.com' });
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

  protected readonly departmentOptions = computed<readonly SelectOption<string>[]>(() =>
    (this.departmentsResource.hasValue() ? (this.departmentsResource.value()?.data ?? []) : []).map(
      (d) => ({ value: d.id, label: d.departmentName }),
    ),
  );

  // ── Skeleton placeholder cards ────────────────────────────────
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    // The top-bar search navigates to /people?q=…; the first emission also does the first load.
    let first = true;
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const q = (params.get('q') ?? '').trim();
      if (first || q !== this.searchValue()) {
        first = false;
        this.searchValue.set(q);
        this.fetch(true);
      }
    });
  }

  /** Debounced text from `ui-search-input`: reload and keep `?q=` in the address bar. */
  protected onSearch(value: string): void {
    if (value === this.searchValue()) return;
    this.searchValue.set(value);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.fetch(true);
  }

  protected onStatusFilter(value: EmployeeStatus | null): void {
    this.statusFilter.set(value);
    this.fetch(true);
  }

  protected onDepartmentFilter(value: string | null): void {
    this.departmentFilter.set(value);
    this.fetch(true);
  }

  protected clearFilters(): void {
    this.statusFilter.set(null);
    this.departmentFilter.set(null);
    if (this.searchValue()) {
      this.onSearch('');
    } else {
      this.fetch(true);
    }
  }

  protected loadMore(): void {
    this.fetch(false);
  }

  protected retry(): void {
    this.fetch(this.employees().length === 0);
  }

  private fetch(reset: boolean): void {
    if (reset) {
      this.page = 0;
      this.employees.set([]);
      this.pagesLoaded.set(0);
    }
    this.loading.set(true);
    this.loadError.set('');

    firstValueFrom(
      this.employeeService.getEmployees(
        {
          search: this.searchValue() || undefined,
          status: this.statusFilter() ?? undefined,
          departmentId: this.departmentFilter() ?? undefined,
        },
        this.page,
      ),
    )
      .then((result) => {
        this.employees.update((prev) => (reset ? result.data : [...prev, ...result.data]));
        this.totalElements.set(result.totalElements);
        this.hasNext.set(result.hasNext);
        this.page = result.currentPage + 1;
        this.pagesLoaded.set(this.page);
      })
      .catch((err: unknown) => {
        this.loadError.set((err as { message?: string })?.message ?? 'The server did not respond.');
      })
      .finally(() => this.loading.set(false));
  }

  protected toggleAddForm(): void {
    if (this.drawerRef) {
      this.drawerRef.close();
      return;
    }
    this.addError.set('');
    this.showAddForm.set(true);
    this.drawerRef = this.drawer.open(this.addDrawer(), {
      viewContainerRef: this.viewContainerRef,
      autoFocus: '#staff-add-form-first-name',
    });
    this.drawerRef.closed.subscribe(() => {
      this.drawerRef = null;
      this.showAddForm.set(false);
      this.addError.set('');
    });
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
            lastName: m.lastName,
            workEmail: m.workEmail,
            ...(m.positionId && { positionId: m.positionId }),
            ...(m.departmentId && { departmentId: m.departmentId }),
            ...(m.accessLevelId && { accessLevelId: m.accessLevelId }),
          }),
        );
        this.addModel.set({
          firstName: '',
          lastName: '',
          workEmail: '',
          positionId: '',
          departmentId: '',
          accessLevelId: '',
        });
        this.addForm().reset();
        this.drawerRef?.close();
        this.showAddForm.set(false);
        this.fetch(true);
      } catch (err: unknown) {
        this.addError.set(
          (err as { message?: string })?.message ?? 'The person could not be added.',
        );
      } finally {
        this.saving.set(false);
      }
    });
  }

  /** Activating a list row (click, Enter, Space) opens that person's profile. */
  protected openProfile(event: DataTableRowEvent<EmployeeListItem>): void {
    void this.router.navigate(['/people', event.row.id]);
  }

  protected fullName(emp: EmployeeListItem): string {
    return `${emp.firstName} ${emp.lastName}`;
  }

  protected asStatus(status: string | null | undefined): EmployeeStatus {
    return status && EMPLOYEE_STATUSES.includes(status) ? (status as EmployeeStatus) : 'PENDING';
  }

  protected fieldError(field: { touched(): boolean; errors(): readonly { message?: string }[] }) {
    return field.touched() && field.errors().length ? field.errors()[0].message : null;
  }

  protected readonly trackById = (_: number, row: EmployeeListItem) => row.id;
}
