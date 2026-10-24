import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '@ems/icons';
import { Avatar } from '@ems/ui/avatar';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { Skeleton } from '@ems/ui/skeleton';
import { StatusPill } from '@ems/ui/status-pill';
import { firstValueFrom } from 'rxjs';
import { EmployeeDetail, EmployeeListItem } from '../../core/models/employee.model';
import { Permission } from '../../core/models/permission.model';
import { EmployeeSelfService } from '../../core/services/employee-self.service';
import { EmployeeService } from '../../core/services/employee.service';
import { GraphqlService } from '../../core/services/graphql.service';
import { SessionStore } from '../../core/services/session.store';

interface DashboardSummary {
  getDashboardSummary: {
    companyCount: number;
    officeCount: number;
    departmentCount: number;
    activeEmployeeCount: number;
    headcountTrend: { trend: string } | null;
  };
}

/** Unchanged from the former dashboard. */
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

/** One row of "Needs your attention". */
export interface AttentionItem {
  readonly id: string;
  readonly kind: 'pending-person' | 'own-profile';
  readonly name: string;
  readonly text: string;
  readonly meta: string;
  readonly link: string;
  readonly action: string;
  readonly tintKey: string | null;
}

/** Parts of the own profile that Home nudges people to fill in. */
export function missingProfileParts(profile: EmployeeDetail | null | undefined): string[] {
  if (!profile) return [];
  const missing: string[] = [];
  if (!profile.contact?.phoneNumbers?.length) missing.push('phone number');
  if (!profile.addresses?.length) missing.push('home address');
  if (!profile.bio?.dateOfBirth) missing.push('date of birth');
  return missing;
}

/** "a", "a and b", "a, b and c". */
export function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const PENDING_PREVIEW = 5;
const TEAM_PREVIEW = 8;

/**
 * Home (direction-d, screen 2): the greeting, what needs the user today, their team and quick
 * links; HR figures in a quiet row for those who can see them. Built from data the app already
 * loads (`me`, getMyProfile, getEmployees, getDashboardSummary).
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, Avatar, Button, Card, Skeleton, StatusPill],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly gql = inject(GraphqlService);
  private readonly employees = inject(EmployeeService);
  private readonly self = inject(EmployeeSelfService);
  protected readonly session = inject(SessionStore);

  private readonly now = new Date();
  protected readonly today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(this.now);
  protected readonly todayIso = this.now.toISOString().slice(0, 10);
  protected readonly greeting = computed(() => {
    const name = this.session.firstName();
    return name ? `${greetingFor(this.now)}, ${name}` : greetingFor(this.now);
  });

  protected readonly canViewSelf = computed(() =>
    this.session.hasAnyPermission([Permission.VIEW_SELF, Permission.MANAGE_SELF]),
  );
  protected readonly canViewPeople = computed(() =>
    this.session.hasPermission(Permission.VIEW_EMPLOYEE),
  );
  protected readonly canManagePeople = computed(() =>
    this.session.hasPermission(Permission.MANAGE_EMPLOYEE),
  );
  protected readonly canViewStats = computed(() =>
    this.session.hasPermission(Permission.VIEW_DASHBOARD),
  );

  protected readonly profile = resource({
    params: () => (this.canViewSelf() ? true : undefined),
    loader: () => firstValueFrom(this.self.getMyProfile()),
  });

  protected readonly pending = resource({
    params: () => (this.canManagePeople() ? true : undefined),
    loader: () =>
      firstValueFrom(this.employees.getEmployees({ status: 'PENDING' }, 0, PENDING_PREVIEW)),
  });

  protected readonly department = computed(() => this.session.employee()?.department ?? null);

  protected readonly team = resource({
    params: () => {
      const departmentId = this.department()?.id;
      return this.canViewPeople() && departmentId ? { departmentId } : undefined;
    },
    loader: ({ params }) =>
      firstValueFrom(this.employees.getEmployees(params, 0, TEAM_PREVIEW + 1)),
  });

  protected readonly stats = resource({
    params: () => (this.canViewStats() ? true : undefined),
    loader: () => firstValueFrom(this.gql.request<DashboardSummary>(DASHBOARD_SUMMARY)),
  });

  /** Colleagues in the user's department, without the user. */
  protected readonly teammates = computed<EmployeeListItem[]>(() => {
    const ownId = this.session.employee()?.id;
    return (this.team.value()?.data ?? [])
      .filter((p) => p.id !== ownId)
      .slice(0, TEAM_PREVIEW);
  });
  protected readonly teamCount = computed(() => {
    const total = this.team.value()?.totalElements ?? 0;
    const includesSelf = (this.team.value()?.data ?? []).some(
      (p) => p.id === this.session.employee()?.id,
    );
    return Math.max(0, includesSelf ? total - 1 : total);
  });

  protected readonly attention = computed<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const missing = missingProfileParts(this.profile.value());
    if (missing.length) {
      items.push({
        id: 'own-profile',
        kind: 'own-profile',
        name: this.session.displayName(),
        text: `Your profile has no ${joinWords(missing)}`,
        meta: 'HR uses these details for payroll and emergencies',
        link: '/my-profile',
        action: 'Complete profile',
        tintKey: this.department()?.id ?? null,
      });
    }
    for (const person of this.pending.value()?.data ?? []) {
      items.push({
        id: person.id,
        kind: 'pending-person',
        name: `${person.firstName} ${person.lastName}`,
        text: `${person.firstName} ${person.lastName} has not set a password yet`,
        meta: [person.jobTitle, person.department].filter(Boolean).join(' · ') || 'Pending',
        link: `/people/${person.id}`,
        action: 'Review profile',
        tintKey: person.department ?? null,
      });
    }
    return items;
  });

  /** Pending people beyond the preview. */
  protected readonly morePending = computed(() => {
    const page = this.pending.value();
    return page ? Math.max(0, page.totalElements - page.data.length) : 0;
  });

  protected readonly attentionLoading = computed(
    () => this.profile.isLoading() || this.pending.isLoading(),
  );

  protected readonly summary = computed(() => {
    if (this.attentionLoading()) return '';
    const count = this.attention().length;
    if (count === 0) return 'Nothing needs you today.';
    return count === 1 ? 'One thing needs you today.' : `${count} things need you today.`;
  });

  protected readonly figures = computed(() => {
    const s = this.stats.value()?.getDashboardSummary;
    if (!s) return [];
    return [
      { label: 'Active people', value: s.activeEmployeeCount },
      { label: 'Departments', value: s.departmentCount },
      { label: 'Offices', value: s.officeCount },
      { label: 'Companies', value: s.companyCount },
    ];
  });
  protected readonly trend = computed(() => {
    const trend = this.stats.value()?.getDashboardSummary.headcountTrend?.trend;
    if (trend === 'INCREASE') return 'New hires are up on last period';
    if (trend === 'DECREASE') return 'New hires are down on last period';
    if (trend) return 'New hires are level with last period';
    return null;
  });

  protected readonly links = computed(() => {
    const links: { label: string; url: string; icon: IconName; count: number | null }[] = [];
    if (this.canViewSelf()) {
      links.push({ label: 'My profile', url: '/my-profile', icon: 'user', count: null });
    }
    links.push({
      label: 'People',
      url: '/people',
      icon: 'users',
      count: this.stats.value()?.getDashboardSummary.activeEmployeeCount ?? null,
    });
    links.push({ label: 'Change password', url: '/change-password', icon: 'key', count: null });
    return links;
  });
}
