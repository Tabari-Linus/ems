/*
 * Story-only building blocks for the composed pages (Patterns/*) and the App shell stories:
 * Akwaaba Labs demo data and the app chrome (brand, navigation, search, notifications, user menu)
 * built from the real components. Not part of any entry point.
 */
import { Icon } from '@ems/icons';
import { Avatar } from '@ems/ui/avatar';
import { AppShell } from '@ems/ui/app-shell';
import { Button } from '@ems/ui/button';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@ems/ui/menu';
import { NavItem } from '@ems/ui/nav-item';
import { SearchInput } from '@ems/ui/search-input';
import { Toaster } from '@ems/ui/toast';

export type DemoStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

export interface DemoPerson {
  name: string;
  position: string;
  department: string;
  office: string;
  employeeNo: string;
  status: DemoStatus;
  /** Department pastel (avatar tint 1-6). */
  tint: 1 | 2 | 3 | 4 | 5 | 6;
}

/** The nine people of the direction-d People screen, in its order. */
export const DEMO_PEOPLE: readonly DemoPerson[] = [
  {
    name: 'Ama Mensah',
    position: 'Engineering Manager',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0007',
    status: 'ACTIVE',
    tint: 1,
  },
  {
    name: 'Kwame Asante',
    position: 'Senior Backend Engineer',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0042',
    status: 'ACTIVE',
    tint: 1,
  },
  {
    name: 'Efua Boateng',
    position: 'Product Designer',
    department: 'Design',
    office: 'Accra',
    employeeNo: 'GH-ACC-0051',
    status: 'ACTIVE',
    tint: 2,
  },
  {
    name: 'Kofi Owusu',
    position: 'Data Analyst',
    department: 'Analytics',
    office: 'Kumasi',
    employeeNo: 'GH-KSI-0013',
    status: 'PENDING',
    tint: 3,
  },
  {
    name: 'Abena Darko',
    position: 'HR Business Partner',
    department: 'People Operations',
    office: 'Accra',
    employeeNo: 'GH-ACC-0019',
    status: 'ACTIVE',
    tint: 4,
  },
  {
    name: 'Yaw Appiah',
    position: 'QA Engineer',
    department: 'Quality Engineering',
    office: 'Takoradi',
    employeeNo: 'GH-TKD-0004',
    status: 'INACTIVE',
    tint: 5,
  },
  {
    name: 'Akosua Frimpong',
    position: 'Frontend Engineer',
    department: 'Platform Engineering',
    office: 'Kumasi',
    employeeNo: 'GH-KSI-0021',
    status: 'ACTIVE',
    tint: 1,
  },
  {
    name: 'Nana Agyeman',
    position: 'Finance Lead',
    department: 'Finance',
    office: 'Accra',
    employeeNo: 'GH-ACC-0003',
    status: 'ACTIVE',
    tint: 6,
  },
  {
    name: 'Esi Quaye',
    position: 'Intern, Engineering',
    department: 'Platform Engineering',
    office: 'Takoradi',
    employeeNo: 'GH-TKD-0011',
    status: 'PENDING',
    tint: 1,
  },
];

export const OFFICES = ['Accra', 'Kumasi', 'Takoradi'].map((o) => ({ value: o, label: o }));
export const DEPARTMENTS = [
  'Analytics',
  'Design',
  'Finance',
  'People Operations',
  'Platform Engineering',
  'Quality Engineering',
].map((d) => ({ value: d, label: d }));
export const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/** Components every composed page story imports. */
export const CHROME_IMPORTS = [
  AppShell,
  NavItem,
  Icon,
  Avatar,
  Button,
  SearchInput,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Toaster,
];

/** The Akwaaba Labs mark from direction-d (a rising sun over the horizon): a brand glyph. */
const MARK = `
  <span aria-hidden="true" style="display:grid;place-items:center;flex:none;inline-size:var(--ems-control-sm-height);block-size:var(--ems-control-sm-height);border-radius:var(--ems-radius-md);background:var(--ems-color-accent-solid);color:var(--ems-color-accent-on-solid)">
    <svg viewBox="0 0 24 24" style="inline-size:var(--ems-icon-size-md);block-size:var(--ems-icon-size-md)">
      <path d="M5.5 15.5a6.5 6.5 0 0 1 13 0z" fill="currentColor" />
      <path d="M4 18.5h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    </svg>
  </span>`;

/** Brand, main navigation and the Settings link, with `current` marking the page. */
export function sidebar(current: 'home' | 'people' | 'requests' | 'profile'): string {
  const page = (id: string) => (id === current ? 'aria-current="page"' : '');
  return `
    <a uiShellBrand href="#home" style="display:flex;align-items:center;gap:var(--ems-space-3);min-inline-size:0;color:inherit;text-decoration:none">
      ${MARK}
      <span uiShellHideCollapsed style="display:grid;line-height:var(--ems-type-headline-line-height)">
        <b style="font-size:var(--ems-type-headline-size);font-weight:var(--ems-type-title-weight);letter-spacing:var(--ems-type-headline-letter-spacing)">EMS</b>
        <small style="font-size:var(--ems-type-caption-size);color:var(--ems-color-text-muted)">Akwaaba Labs</small>
      </span>
    </a>
    <ng-container uiShellNav>
      <a uiNavItem href="#home" ${page('home')}><ui-icon uiNavIcon name="home" /> Home</a>
      <a uiNavItem href="#people" ${page('people')}><ui-icon uiNavIcon name="users" /> People</a>
      <a uiNavItem href="#requests" ${page('requests')} [badge]="2" badgeLabel="open"><ui-icon uiNavIcon name="inbox" /> Requests</a>
      <a uiNavItem href="#my-profile" ${page('profile')}><ui-icon uiNavIcon name="user" /> My profile</a>
    </ng-container>
    <nav uiShellFooter aria-label="Workspace" style="display:grid">
      <a uiNavItem href="#settings"><ui-icon uiNavIcon name="settings" /> Settings</a>
    </nav>`;
}

/**
 * Top bar: global search (⌘K), notifications and the user menu (CDK menu). The user menu trigger
 * and the notifications button are app chrome, composed from tokens around the real components.
 */
export const TOPBAR = `
  <ui-search-input uiShellSearch label="Search people, offices and requests" placeholder="Search people, offices, requests" shortcut platform="mac" />
  <button uiShellActions type="button" aria-label="Notifications, 2 new"
    style="position:relative;display:inline-grid;place-items:center;inline-size:var(--ems-control-md-height);block-size:var(--ems-control-md-height);padding:0;border:0;border-radius:var(--ems-radius-pill);background:transparent;color:var(--ems-color-text-secondary);cursor:pointer">
    <ui-icon name="bell" />
    <span aria-hidden="true" style="position:absolute;inset-block-start:var(--ems-space-2);inset-inline-end:var(--ems-space-2);inline-size:var(--ems-space-2);block-size:var(--ems-space-2);border-radius:var(--ems-radius-pill);background:var(--ems-color-accent-solid);box-shadow:0 0 0 var(--ems-border-width-thick) var(--ems-color-bg-canvas)"></span>
  </button>
  <button uiShellUser type="button" [uiMenuTrigger]="userMenu"
    style="display:flex;align-items:center;gap:var(--ems-space-2);block-size:var(--ems-control-md-height);padding-inline:var(--ems-space-1) var(--ems-space-3);border:0;border-radius:var(--ems-radius-pill);background:var(--ems-color-bg-surface);box-shadow:var(--ems-elevation-card);color:var(--ems-color-text-primary);font:inherit;font-size:var(--ems-type-label-size);font-weight:var(--ems-type-label-weight);cursor:pointer">
    <ui-avatar name="Ama Mensah" size="sm" [tint]="1" decorative />
    <span><span class="ui-visually-hidden">Account menu, </span><span class="demo-user-name">Ama Mensah</span></span>
    <ui-icon name="chevron-down" size="sm" style="color:var(--ems-color-text-muted)" />
  </button>
  <style>
    /* breakpoint.narrow: the avatar alone names the account on phones. */
    @media (max-width: 639.98px) {
      .demo-user-name { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    }
  </style>
  <ng-template #userMenu>
    <ui-menu>
      <button uiMenuItem><ui-icon uiMenuItemIcon name="user" size="sm" /> My profile</button>
      <button uiMenuItem><ui-icon uiMenuItemIcon name="settings" size="sm" /> Settings</button>
      <ui-menu-separator />
      <button uiMenuItem><ui-icon uiMenuItemIcon name="log-out" size="sm" /> Sign out</button>
    </ui-menu>
  </ng-template>`;

/** The page inside the shell, plus the toast host at the end of the tab order. */
/** Composed pages pass `collapsible: false`, like direction-d (no collapse toggle). */
export function shell(
  current: Parameters<typeof sidebar>[0],
  page: string,
  { collapsible = true } = {},
): string {
  return `
    <ui-app-shell [collapsible]="${collapsible}">
      ${sidebar(current)}
      ${TOPBAR}
      ${page}
    </ui-app-shell>
    <ui-toaster />`;
}
