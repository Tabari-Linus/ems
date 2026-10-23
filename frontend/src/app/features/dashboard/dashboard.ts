import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { GraphqlService } from '../../core/services/graphql.service';
import { Permission } from '../../core/models/permission.model';
import { EmployeeListItem } from '../../core/models/employee.model';

interface DashboardSummary {
  getDashboardSummary: {
    companyCount: number;
    officeCount: number;
    departmentCount: number;
    activeEmployeeCount: number;
    headcountTrend: { trend: string } | null;
  };
}

const DASHBOARD_SUMMARY = `
  query GetDashboardSummary {
    getDashboardSummary {
      companyCount
      officeCount
      departmentCount
      activeEmployeeCount
      headcountTrend { trend }
    }
  }
`;

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
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly gql = inject(GraphqlService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);

  protected readonly canManageEmployees = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  protected readonly statsResource = resource({
    loader: () => firstValueFrom(this.gql.request<DashboardSummary>(DASHBOARD_SUMMARY)),
  });

  protected readonly recentStatusFilter = signal('');

  protected readonly recentResource = resource({
    loader: () => {
      const status = this.recentStatusFilter();
      return firstValueFrom(this.employeeService.getEmployees(status ? { status } : {}, 0, 8));
    },
  });

  protected readonly statCards = computed(() => {
    const s = this.statsResource.value()?.getDashboardSummary;
    const trend = s?.headcountTrend?.trend ?? null;
    return [
      {
        iconKey: 'employees',
        value: s?.activeEmployeeCount ?? null,
        label: 'Active Employees',
        colorVar: '--ps',
        trend,
      },
      {
        iconKey: 'departments',
        value: s?.departmentCount ?? null,
        label: 'Departments',
        colorVar: '--sg',
        trend: null,
      },
      {
        iconKey: 'offices',
        value: s?.officeCount ?? null,
        label: 'Offices',
        colorVar: '--gp',
        trend: null,
      },
      {
        iconKey: 'companies',
        value: s?.companyCount ?? null,
        label: 'Companies',
        colorVar: '--mo',
        trend: null,
      },
    ];
  });

  protected readonly statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Archived', value: 'ARCHIVE' },
  ];

  // ── Quick-action menu ─────────────────────────────────────────
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly actionError = signal('');

  @HostListener('document:click')
  protected closeMenu(): void {
    this.openMenuId.set(null);
  }

  protected toggleMenu(empId: string): void {
    this.openMenuId.update((id) => (id === empId ? null : empId));
  }

  protected async onActivate(emp: EmployeeListItem): Promise<void> {
    this.openMenuId.set(null);
    this.busyId.set(emp.id);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.activateEmployee(emp.id));
      this.recentResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'Failed to activate employee.',
      );
    } finally {
      this.busyId.set(null);
    }
  }

  protected async onDeactivate(emp: EmployeeListItem): Promise<void> {
    this.openMenuId.set(null);
    this.busyId.set(emp.id);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.deactivateEmployee(emp.id));
      this.recentResource.reload();
    } catch (err: unknown) {
      this.actionError.set(
        (err as { message?: string })?.message ?? 'Failed to deactivate employee.',
      );
    } finally {
      this.busyId.set(null);
    }
  }

  protected async onArchive(emp: EmployeeListItem): Promise<void> {
    this.openMenuId.set(null);
    this.busyId.set(emp.id);
    this.actionError.set('');
    try {
      await firstValueFrom(this.employeeService.archiveEmployee(emp.id));
      this.recentResource.reload();
    } catch (err: unknown) {
      this.actionError.set((err as { message?: string })?.message ?? 'Failed to archive employee.');
    } finally {
      this.busyId.set(null);
    }
  }

  protected readonly today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  protected readonly skeletons = [1, 2, 3, 4];
  protected readonly rowSkeletons = [1, 2, 3, 4, 5, 6];

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
