import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EmployeeDetail } from '../../core/models/employee.model';
import { EmployeeSelfService } from '../../core/services/employee-self.service';
import { EmployeeService } from '../../core/services/employee.service';
import { GraphqlService } from '../../core/services/graphql.service';
import { SessionStore } from '../../core/services/session.store';
import { meWith, provideMe } from '../../testing/session';
import { greetingFor, Home, joinWords, missingProfileParts } from './home';

const page = (data: unknown[], totalElements = data.length) => ({
  data,
  totalElements,
  currentPage: 0,
  totalPages: 1,
  pageSize: 12,
  hasNext: false,
  hasPrevious: false,
});
const person = (id: string, first: string, status = 'ACTIVE') => ({
  id,
  firstName: first,
  lastName: 'Test',
  jobTitle: 'Engineer',
  department: 'Platform Engineering',
  status,
});
const incomplete = {
  contact: { phoneNumbers: [] },
  addresses: [],
  bio: {},
} as unknown as EmployeeDetail;
const complete = {
  contact: { phoneNumbers: ['+233'] },
  addresses: [{ id: 'a' }],
  bio: { dateOfBirth: '1990-01-01' },
} as unknown as EmployeeDetail;

describe('Home', () => {
  let getEmployees: ReturnType<typeof vi.fn>;
  let request: ReturnType<typeof vi.fn>;
  let getMyProfile: ReturnType<typeof vi.fn>;

  async function render(
    permissions: string[],
    profile: EmployeeDetail | null = complete,
    failTeam = false,
  ) {
    getEmployees = vi.fn((filter: { status?: string }) =>
      failTeam
        ? throwError(() => new Error('offline'))
        : of(
            filter.status === 'PENDING'
              ? page([person('p1', 'Kofi', 'PENDING')], 7)
              : page([person('e-1', 'Ama'), person('t1', 'Kwame'), person('t2', 'Efua')], 3),
          ),
    );
    request = vi.fn(() =>
      of({
        getDashboardSummary: {
          companyCount: 1,
          officeCount: 3,
          departmentCount: 6,
          activeEmployeeCount: 42,
          headcountTrend: { trend: 'INCREASE' },
        },
      }),
    );
    getMyProfile = vi.fn(() => of(profile));
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideMe(meWith(permissions)),
        { provide: EmployeeService, useValue: { getEmployees } },
        { provide: GraphqlService, useValue: { request } },
        { provide: EmployeeSelfService, useValue: { getMyProfile } },
      ],
    });
    await TestBed.inject(SessionStore).load();
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('greets the user by first name with the date', async () => {
    const { el } = await render([]);
    expect(el.querySelector('h1')?.textContent).toMatch(/^Good (morning|afternoon|evening), Ama$/);
    expect(el.querySelector('time')?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('loads only what the permissions allow', async () => {
    await render([]);
    expect(getMyProfile).not.toHaveBeenCalled();
    expect(getEmployees).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('is calm when nothing needs the user', async () => {
    const { el } = await render(['VIEW_SELF']);
    expect(el.textContent).toContain('Nothing needs you today.');
    expect(el.textContent).toContain('You are all caught up.');
  });

  it('asks the user to complete their own profile', async () => {
    const { el } = await render(['VIEW_SELF'], incomplete);
    expect(el.textContent).toContain('One thing needs you today.');
    const row = el.querySelector('.home-attention__row')!;
    expect(row.textContent).toContain(
      'Your profile has no phone number, home address and date of birth',
    );
    expect(row.querySelector('a')?.getAttribute('href')).toBe('/my-profile');
  });

  it('lists people who have not set a password for people managers, with the rest counted', async () => {
    const { el } = await render(['MANAGE_EMPLOYEE']);
    expect(getEmployees).toHaveBeenCalledWith({ status: 'PENDING' }, 0, 5);
    expect(el.textContent).toContain('Kofi Test has not set a password yet');
    expect(el.querySelector('.home-attention__row a')?.getAttribute('href')).toBe('/people/p1');
    expect(el.textContent).toMatch(/6 more people have\s+not\s+set a password yet/);
  });

  it('shows the team from the same department, without the user', async () => {
    const { el } = await render(['VIEW_EMPLOYEE']);
    expect(getEmployees).toHaveBeenCalledWith({ departmentId: 'd-1' }, 0, 9);
    const names = Array.from(el.querySelectorAll('.home-person__name')).map((n) => n.textContent);
    expect(names).toEqual(['Kwame Test', 'Efua Test']);
    expect(el.querySelector('#team-heading')?.textContent).toContain(
      '2 people in Platform Engineering',
    );
  });

  it('shows HR figures in a quiet row for VIEW_DASHBOARD', async () => {
    const { el } = await render(['VIEW_DASHBOARD']);
    const figures = Array.from(el.querySelectorAll('.home-figures__item')).map(
      (f) => `${f.querySelector('dt')?.textContent} ${f.querySelector('dd')?.textContent}`,
    );
    expect(figures).toEqual(['Active people 42', 'Departments 6', 'Offices 3', 'Companies 1']);
    expect(el.textContent).toContain('New hires are up on last period');
    expect(el.querySelector('.home-links__count')?.textContent).toContain('42');
  });

  it('hides the team when the query fails', async () => {
    const { el } = await render(['VIEW_EMPLOYEE'], complete, true);
    expect(el.querySelector('.home-team')).toBeNull();
  });
});

describe('home helpers', () => {
  it('missingProfileParts', () => {
    expect(missingProfileParts(null)).toEqual([]);
    expect(missingProfileParts(complete)).toEqual([]);
    expect(missingProfileParts(incomplete)).toEqual([
      'phone number',
      'home address',
      'date of birth',
    ]);
  });

  it('joinWords', () => {
    expect(joinWords([])).toBe('');
    expect(joinWords(['a'])).toBe('a');
    expect(joinWords(['a', 'b'])).toBe('a and b');
    expect(joinWords(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('greetingFor', () => {
    expect(greetingFor(new Date('2026-10-22T08:00:00'))).toBe('Good morning');
    expect(greetingFor(new Date('2026-10-22T13:00:00'))).toBe('Good afternoon');
    expect(greetingFor(new Date('2026-10-22T20:00:00'))).toBe('Good evening');
  });
});
