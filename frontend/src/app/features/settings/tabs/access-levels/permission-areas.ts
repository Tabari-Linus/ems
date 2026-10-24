import { Permission } from '../../../../core/models/permission.model';
import { sentenceCase } from '../../shared/settings-ui';

/** One row of the permission matrix: an area with its view and manage permission (if any). */
export interface PermissionArea {
  /** Area key, the permission without its prefix: `ACCESS_LEVEL`. */
  key: string;
  /** Sentence-case label: "Access level". */
  label: string;
  view: Permission | null;
  manage: Permission | null;
}

export interface PermissionAreaGroup {
  label: string;
  areas: PermissionArea[];
}

/** How areas are grouped in the matrix. Areas not listed land in "Other". */
const GROUPS: readonly { label: string; keys: readonly string[] }[] = [
  { label: 'Organisation', keys: ['COMPANY', 'OFFICE', 'DEPARTMENT', 'POSITION'] },
  { label: 'People', keys: ['EMPLOYEE', 'SELF'] },
  { label: 'Access', keys: ['ACCESS_LEVEL', 'ROLE'] },
  { label: 'Role tiers', keys: ['ADMIN', 'DIRECTOR', 'MANAGER'] },
  { label: 'Reporting', keys: ['DASHBOARD'] },
];

const AREA_LABELS: Readonly<Record<string, string>> = {
  SELF: 'Own profile',
  EMPLOYEE: 'People directory',
};

/** Builds the matrix rows from the permission list, so a new permission is never left out. */
export function buildPermissionAreas(
  permissions: readonly string[] = Object.values(Permission),
): PermissionAreaGroup[] {
  const areas = new Map<string, PermissionArea>();
  for (const perm of permissions) {
    const match = /^(VIEW|MANAGE)_(.+)$/.exec(perm);
    if (!match) continue;
    const [, verb, key] = match;
    const area = areas.get(key) ?? {
      key,
      label: AREA_LABELS[key] ?? sentenceCase(key),
      view: null,
      manage: null,
    };
    if (verb === 'VIEW') area.view = perm as Permission;
    else area.manage = perm as Permission;
    areas.set(key, area);
  }

  const groups: PermissionAreaGroup[] = [];
  for (const group of GROUPS) {
    const rows = group.keys.flatMap((key) => {
      const area = areas.get(key);
      areas.delete(key);
      return area ? [area] : [];
    });
    if (rows.length) groups.push({ label: group.label, areas: rows });
  }
  if (areas.size) groups.push({ label: 'Other', areas: [...areas.values()] });
  return groups;
}

export const PERMISSION_AREA_GROUPS = buildPermissionAreas();
