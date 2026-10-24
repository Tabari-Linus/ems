import { vi } from 'vitest';
import { type Provider } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { AccessLevelService } from '../../../core/services/access-level.service';
import { CompanyService } from '../../../core/services/company.service';
import { DepartmentService } from '../../../core/services/department.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { OfficeService } from '../../../core/services/office.service';
import { PositionService } from '../../../core/services/position.service';
import type {
  AccessLevelListItem,
  CompanyListItem,
  DepartmentListItem,
  OfficeListItem,
  PageResult,
  PositionListItem,
} from '../../../core/models/settings.models';

/** Test-only page wrapper with the fields the settings tabs read. */
export function page<T>(data: T[]): PageResult<T> {
  return {
    data,
    currentPage: 0,
    totalPages: 1,
    totalElements: data.length,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  };
}

export const COMPANIES: CompanyListItem[] = [
  {
    id: 'c1',
    companyName: 'Akwaaba Labs',
    companyCode: 'AKL',
    companyEmail: 'hello@akwaabalabs.example',
    companyPhoneNumber: '+233 30 255 0100',
    companyStatus: 'ACTIVE',
  },
  {
    id: 'c2',
    companyName: 'Akwaaba Ventures',
    companyCode: 'AKV',
    companyEmail: 'ventures@akwaabalabs.example',
    companyStatus: 'PENDING',
  },
];

export const OFFICES: OfficeListItem[] = [
  {
    id: 'o1',
    officeName: 'Accra',
    officeCode: 'ACC',
    officeEmail: 'accra@akwaabalabs.example',
    officeStatus: 'ACTIVE',
  },
];

export const DEPARTMENTS: DepartmentListItem[] = [
  {
    id: 'd1',
    departmentName: 'Platform Engineering',
    departmentCode: 'PLT',
    departmentEmail: 'platform@akwaabalabs.example',
    departmentStatus: 'ACTIVE',
  },
];

export const POSITIONS: PositionListItem[] = [
  {
    id: 'p1',
    positionName: 'Backend Engineer',
    level: 'SENIOR',
    description: 'Builds the services behind EMS.',
    status: 'ACTIVE',
  },
];

export const ACCESS_LEVELS: AccessLevelListItem[] = [
  { id: 'a1', accessLevelName: 'HR manager', description: 'People and requests', status: 'ACTIVE' },
];

export interface SettingsServiceMocks {
  companies: { getCompanies: () => Observable<unknown>; [k: string]: unknown };
  offices: { getOffices: () => Observable<unknown>; [k: string]: unknown };
  departments: { getDepartments: () => Observable<unknown>; [k: string]: unknown };
  positions: { getPositions: () => Observable<unknown>; [k: string]: unknown };
  accessLevels: { getAccessLevels: () => Observable<unknown>; [k: string]: unknown };
  employees: { getEmployees: () => Observable<unknown> };
}

/** Service doubles for every settings tab, with demo data; override fields per test. */
export function settingsServiceMocks(): SettingsServiceMocks {
  const ok = () => of({ id: 'new', name: 'ok' });
  return {
    companies: {
      getCompanies: vi.fn(() => of(page(COMPANIES))),
      createCompany: vi.fn(() => of({ success: true })),
      updateCompany: vi.fn(() => of({ success: true })),
    },
    offices: {
      getOffices: vi.fn(() => of(page(OFFICES))),
      createOffice: vi.fn(() => of({ success: true })),
      updateOffice: vi.fn(() => of({ success: true })),
    },
    departments: {
      getDepartments: vi.fn(() => of(page(DEPARTMENTS))),
      createDepartment: vi.fn(() => of({ success: true })),
      updateDepartment: vi.fn(() => of({ success: true })),
    },
    positions: {
      getPositions: vi.fn(() => of(page(POSITIONS))),
      createPosition: vi.fn(ok),
      updatePosition: vi.fn(ok),
    },
    accessLevels: {
      getAccessLevels: vi.fn(() => of(page(ACCESS_LEVELS))),
      getAccessLevel: vi.fn(() =>
        of({ ...ACCESS_LEVELS[0], permissions: ['VIEW_SELF'], employees: [] }),
      ),
      createAccessLevel: vi.fn(ok),
      updateAccessLevel: vi.fn(ok),
    },
    employees: { getEmployees: vi.fn(() => of(page([]))) },
  };
}

export function provideSettingsServiceMocks(mocks: SettingsServiceMocks): Provider[] {
  return [
    { provide: CompanyService, useValue: mocks.companies },
    { provide: OfficeService, useValue: mocks.offices },
    { provide: DepartmentService, useValue: mocks.departments },
    { provide: PositionService, useValue: mocks.positions },
    { provide: AccessLevelService, useValue: mocks.accessLevels },
    { provide: EmployeeService, useValue: mocks.employees },
  ];
}
