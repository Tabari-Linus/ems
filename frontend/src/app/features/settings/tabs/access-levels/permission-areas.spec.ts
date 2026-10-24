import { Permission } from '../../../../core/models/permission.model';
import { buildPermissionAreas, PERMISSION_AREA_GROUPS } from './permission-areas';

describe('permission areas', () => {
  it('puts every permission in exactly one matrix cell', () => {
    const cells = PERMISSION_AREA_GROUPS.flatMap((g) =>
      g.areas.flatMap((a) => [a.view, a.manage]),
    ).filter((p) => p !== null);
    expect([...cells].sort()).toEqual(Object.values(Permission).sort());
  });

  it('groups areas for scanning, in a fixed order', () => {
    expect(PERMISSION_AREA_GROUPS.map((g) => g.label)).toEqual([
      'Organisation',
      'People',
      'Access',
      'Role tiers',
      'Reporting',
    ]);
    const access = PERMISSION_AREA_GROUPS.find((g) => g.label === 'Access')!;
    expect(access.areas.map((a) => a.label)).toEqual(['Access level', 'Role']);
  });

  it('pairs view and manage per area and names areas from the employee side', () => {
    const people = PERMISSION_AREA_GROUPS.find((g) => g.label === 'People')!;
    expect(people.areas).toEqual([
      {
        key: 'EMPLOYEE',
        label: 'People',
        view: Permission.VIEW_EMPLOYEE,
        manage: Permission.MANAGE_EMPLOYEE,
      },
      {
        key: 'SELF',
        label: 'Own profile',
        view: Permission.VIEW_SELF,
        manage: Permission.MANAGE_SELF,
      },
    ]);
  });

  it('keeps unknown areas and one-sided permissions in an "Other" group', () => {
    const groups = buildPermissionAreas(['VIEW_PAYROLL', 'MANAGE_COMPANY', 'NOT_A_PERMISSION']);
    expect(groups).toEqual([
      {
        label: 'Organisation',
        areas: [{ key: 'COMPANY', label: 'Company', view: null, manage: 'MANAGE_COMPANY' }],
      },
      {
        label: 'Other',
        areas: [{ key: 'PAYROLL', label: 'Payroll', view: 'VIEW_PAYROLL', manage: null }],
      },
    ]);
  });
});
