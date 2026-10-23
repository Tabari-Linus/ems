import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar } from '../../avatar/src/public-api';
import { Button } from '../../button/src/public-api';
import { Card } from '../../card/src/public-api';
import { DATA_TABLE } from '../../data-table/src/public-api';
import { NavItem } from '../../nav-item/src/public-api';
import { PageHeader } from '../../page-header/src/public-api';
import { Pagination } from '../../pagination/src/public-api';
import { PersonCard } from '../../person-card/src/public-api';
import { ViewToggle } from '../../view-toggle/src/public-api';
import { AppShell } from './app-shell';

/*
 * Placeholders below stand in for components from other packages (search input, user menu,
 * status pill) until they merge; they use contract tokens only.
 */

const icon = (paths: string, attrs = '') =>
  `<svg ${attrs} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  people:
    '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  requests: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
};

const navIcon = (paths: string) => icon(paths, 'uiNavIcon');

/** Brand, nav and footer slots, with `current` marking the page. */
const sidebar = (current: 'home' | 'people') => `
  <a uiShellBrand href="#home" style="display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none;min-inline-size:0">
    <span aria-hidden="true" style="display:grid;place-items:center;inline-size:32px;block-size:32px;flex:none;border-radius:10px;background:var(--ems-color-accent-solid);color:var(--ems-color-accent-on-solid);font-weight:800;font-size:13px">E</span>
    <span uiShellHideCollapsed style="display:grid;line-height:1.15">
      <b style="font-weight:800;font-size:16px;letter-spacing:-0.02em">EMS</b>
      <small style="font-size:12px;color:var(--ems-color-text-muted)">Akwaaba Labs</small>
    </span>
  </a>
  <ng-container uiShellNav>
    <a uiNavItem href="#home" ${current === 'home' ? 'aria-current="page"' : ''}>${navIcon(ICONS.home)} Home</a>
    <a uiNavItem href="#people" ${current === 'people' ? 'aria-current="page"' : ''}>${navIcon(ICONS.people)} People</a>
    <a uiNavItem href="#requests" [badge]="2">${navIcon(ICONS.requests)} Requests</a>
    <a uiNavItem href="#my-profile">${navIcon(ICONS.profile)} My profile</a>
  </ng-container>
  <nav uiShellFooter aria-label="Workspace" style="display:grid">
    <a uiNavItem href="#settings">${navIcon(ICONS.settings)} Settings</a>
  </nav>`;

/** Top bar: search placeholder (forms package) and user menu placeholder (overlays package). */
const topbar = `
  <label uiShellSearch style="display:flex;align-items:center;gap:10px;block-size:40px;padding-inline:14px 8px;border-radius:999px;background:var(--ems-color-bg-surface);box-shadow:inset 0 0 0 1px var(--ems-color-border-default);color:var(--ems-color-text-muted)">
    ${icon(ICONS.search)}
    <span class="ui-visually-hidden">Search people</span>
    <input type="search" placeholder="Search" style="flex:1;min-inline-size:0;border:0;outline:0;background:transparent;color:var(--ems-color-text-primary);font:inherit;font-size:14px" />
  </label>
  <button uiShellUser type="button" aria-haspopup="menu" style="display:flex;align-items:center;gap:9px;block-size:40px;padding-inline:5px 10px;border:0;border-radius:999px;background:var(--ems-color-bg-surface);box-shadow:var(--ems-elevation-card);color:inherit;font:inherit;font-weight:600;font-size:14px;cursor:pointer">
    <ui-avatar name="Ama Mensah" size="sm" [tint]="1" decorative />
    <span><span class="ui-visually-hidden">Account menu, </span>Ama Mensah</span>
    ${icon(ICONS.chevron, 'width="14" height="14" style="color:var(--ems-color-text-muted)"')}
  </button>`;

/** Status pill placeholder (feedback package): dot shape + label. */
const statusPill = (label: string, tone: 'active' | 'pending' | 'inactive', attr = '') =>
  `<span ${attr} style="display:inline-flex;align-items:center;gap:6px;block-size:24px;padding-inline:8px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;background:var(--ems-color-employee-status-${tone}-bg);color:var(--ems-color-employee-status-${tone}-text)"><span aria-hidden="true" style="inline-size:8px;block-size:8px;border-radius:50%;border:1.5px solid currentColor;${tone === 'active' ? 'background:currentColor' : tone === 'pending' ? 'background:linear-gradient(90deg,currentColor 50%,transparent 50%)' : ''}"></span>${label}</span>`;

interface DemoPerson {
  name: string;
  position: string;
  department: string;
  office: string;
  employeeNo: string;
  status: 'Active' | 'Pending' | 'Inactive';
  tint: 1 | 2 | 3 | 4 | 5 | 6;
}

const DEMO_PEOPLE: DemoPerson[] = [
  {
    name: 'Ama Mensah',
    position: 'Engineering Manager',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0007',
    status: 'Active',
    tint: 1,
  },
  {
    name: 'Kwame Asante',
    position: 'Senior Backend Engineer',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0042',
    status: 'Active',
    tint: 1,
  },
  {
    name: 'Efua Boateng',
    position: 'Product Designer',
    department: 'Design',
    office: 'Accra',
    employeeNo: 'GH-ACC-0051',
    status: 'Active',
    tint: 2,
  },
  {
    name: 'Kofi Owusu',
    position: 'Data Analyst',
    department: 'Analytics',
    office: 'Kumasi',
    employeeNo: 'GH-KSI-0013',
    status: 'Pending',
    tint: 3,
  },
  {
    name: 'Abena Darko',
    position: 'HR Business Partner',
    department: 'People Operations',
    office: 'Accra',
    employeeNo: 'GH-ACC-0019',
    status: 'Active',
    tint: 4,
  },
  {
    name: 'Yaw Appiah',
    position: 'QA Engineer',
    department: 'Quality Engineering',
    office: 'Takoradi',
    employeeNo: 'GH-TKD-0004',
    status: 'Inactive',
    tint: 5,
  },
  {
    name: 'Akosua Frimpong',
    position: 'Frontend Engineer',
    department: 'Platform Engineering',
    office: 'Kumasi',
    employeeNo: 'GH-KSI-0021',
    status: 'Active',
    tint: 1,
  },
  {
    name: 'Nana Agyeman',
    position: 'Finance Lead',
    department: 'Finance',
    office: 'Accra',
    employeeNo: 'GH-ACC-0003',
    status: 'Active',
    tint: 6,
  },
  {
    name: 'Esi Quaye',
    position: 'Intern, Engineering',
    department: 'Platform Engineering',
    office: 'Takoradi',
    employeeNo: 'GH-TKD-0011',
    status: 'Pending',
    tint: 1,
  },
];

const STATUS_SWITCH = (attr = '') => `
  @switch (p.status) {
    @case ('Pending') { ${statusPill('Pending', 'pending', attr)} }
    @case ('Inactive') { ${statusPill('Inactive', 'inactive', attr)} }
    @default { ${statusPill('Active', 'active', attr)} }
  }`;

const HOME = `
  <ui-app-shell>
    ${sidebar('home')}
    ${topbar}
    <div style="display:grid;gap:24px;max-inline-size:1120px">
      <div style="padding-block:8px 4px">
        <p style="margin:0;color:var(--ems-color-text-muted);font-weight:600;font-size:14px">Thursday, 22 October</p>
        <h1 style="margin:8px 0 10px;font-size:clamp(2rem, 6vw, var(--ems-type-display-size));font-weight:var(--ems-type-display-weight);line-height:var(--ems-type-display-line-height);letter-spacing:var(--ems-type-display-letter-spacing)">Good morning, Ama</h1>
        <p style="margin:0;color:var(--ems-color-text-secondary)">Two things need you today. The rest of your team is set.</p>
      </div>
      <div style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,272px),1fr));align-items:start">
        <ui-card title="Needs your attention" [count]="2" flush style="grid-column:1 / -1">
          <a uiCardActions href="#requests" style="font-weight:600;color:var(--ems-color-text-link)">All requests</a>
          <ul style="list-style:none;margin:0;padding:4px 8px 8px">
            <li style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:14px 12px">
              <ui-avatar name="Kwame Asante" [tint]="1" decorative />
              <div style="flex:1;min-inline-size:12rem">
                <p style="margin:0;color:var(--ems-color-text-secondary)">Password reset for <b style="color:var(--ems-color-text-primary)">Kwame Asante</b></p>
                <p style="margin:4px 0 0;color:var(--ems-color-text-muted);font-size:13px">Requested today, 08:12</p>
              </div>
              <div style="display:flex;gap:8px">
                <button uiButton size="sm" type="button">Approve</button>
                <button uiButton size="sm" variant="secondary" type="button">Decline</button>
              </div>
            </li>
            <li style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:14px 12px;border-block-start:1px solid var(--ems-color-border-subtle)">
              <ui-avatar name="Kofi Owusu" [tint]="3" decorative />
              <div style="flex:1;min-inline-size:12rem">
                <p style="margin:0;color:var(--ems-color-text-secondary)"><b style="color:var(--ems-color-text-primary)">Kofi Owusu</b>’s profile is incomplete</p>
                <p style="margin:4px 0 0;color:var(--ems-color-text-muted);font-size:13px">Pending activation · Analytics, Kumasi</p>
              </div>
              <button uiButton size="sm" variant="secondary" type="button">Review profile</button>
            </li>
          </ul>
        </ui-card>
      </div>
      <section aria-labelledby="team-heading" style="display:grid;gap:12px">
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:12px">
          <h2 id="team-heading" style="margin:0;font-size:var(--ems-type-headline-size);font-weight:var(--ems-type-headline-weight)">Your team <span style="font-weight:500;color:var(--ems-color-text-muted);margin-inline-start:6px">4 direct reports</span></h2>
          <a href="#people" style="font-weight:600;font-size:14px;color:var(--ems-color-text-link)">View team</a>
        </div>
        <ul style="list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))">
          @for (p of team; track p.employeeNo) {
            <li style="display:grid">
              <a uiPersonCard [href]="'#people/' + p.employeeNo" [name]="p.name" [position]="p.position"
                [department]="p.department" [office]="p.office" [employeeNo]="p.employeeNo" [avatarTint]="p.tint">
                ${STATUS_SWITCH('uiPersonCardStatus')}
              </a>
            </li>
          }
        </ul>
      </section>
      <ui-card title="Recently joined" flush>
        <a uiCardActions href="#people" style="font-weight:600;color:var(--ems-color-text-link)">All people</a>
        <ui-data-table caption="Recently joined" [rows]="recent" activatable>
          <ng-container uiColumn="name" header="Name" primary>
            <ng-template uiCell let-p>
              <span style="display:inline-flex;align-items:center;gap:10px;font-weight:600">
                <ui-avatar [name]="p.name" [tint]="p.tint" size="sm" decorative />{{ p.name }}
              </span>
            </ng-template>
          </ng-container>
          <ng-container uiColumn="department" header="Department">
            <ng-template uiCell let-p>{{ p.department }} · {{ p.office }}</ng-template>
          </ng-container>
          <ng-container uiColumn="employeeNo" header="Employee no.">
            <ng-template uiCell let-p><span style="font-family:var(--ems-font-family-mono);color:var(--ems-color-text-secondary)">{{ p.employeeNo }}</span></ng-template>
          </ng-container>
          <ng-container uiColumn="status" header="Status" align="end">
            <ng-template uiCell let-p>${STATUS_SWITCH()}</ng-template>
          </ng-container>
        </ui-data-table>
      </ui-card>
    </div>
  </ui-app-shell>`;

const PEOPLE_TABLE = `
  <ui-data-table caption="People" [rows]="people" activatable [sort]="{ column: 'name', direction: 'asc' }">
    <ng-container uiColumn="name" header="Name" sortable primary>
      <ng-template uiCell let-p>
        <span style="display:inline-flex;align-items:center;gap:10px;font-weight:600">
          <ui-avatar [name]="p.name" [tint]="p.tint" size="sm" decorative />{{ p.name }}
        </span>
      </ng-template>
    </ng-container>
    <ng-container uiColumn="position" header="Position">
      <ng-template uiCell let-p>{{ p.position }}</ng-template>
    </ng-container>
    <ng-container uiColumn="department" header="Department" sortable>
      <ng-template uiCell let-p>{{ p.department }} · {{ p.office }}</ng-template>
    </ng-container>
    <ng-container uiColumn="employeeNo" header="Employee no.">
      <ng-template uiCell let-p><span style="font-family:var(--ems-font-family-mono);color:var(--ems-color-text-secondary)">{{ p.employeeNo }}</span></ng-template>
    </ng-container>
    <ng-container uiColumn="status" header="Status">
      <ng-template uiCell let-p>${STATUS_SWITCH()}</ng-template>
    </ng-container>
  </ui-data-table>`;

const DIRECTORY = `
  <ui-app-shell>
    ${sidebar('people')}
    ${topbar}
    <ui-page-header title="People" count="9 people">
      <ui-view-toggle uiPageHeaderActions [(view)]="view" />
      <button uiPageHeaderActions uiButton type="button">Add person</button>
    </ui-page-header>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-block-end:20px">
      <label style="display:flex;align-items:center;gap:8px;flex:1 1 16rem;max-inline-size:20rem;block-size:40px;padding-inline:14px;border-radius:999px;background:var(--ems-color-bg-surface);box-shadow:inset 0 0 0 1px var(--ems-color-border-default);color:var(--ems-color-text-muted)">
        <span class="ui-visually-hidden">Search people</span>
        <input type="search" placeholder="Search by name or employee no." style="flex:1;min-inline-size:0;border:0;outline:0;background:transparent;color:var(--ems-color-text-primary);font:inherit;font-size:14px" />
      </label>
      <button type="button" style="display:inline-flex;align-items:center;gap:6px;block-size:40px;padding-inline:16px 14px;border:0;border-radius:999px;background:var(--ems-color-bg-surface);box-shadow:inset 0 0 0 1px var(--ems-color-border-default);color:var(--ems-color-text-secondary);font:inherit;font-size:14px;cursor:pointer">Office <b style="color:var(--ems-color-text-primary)">All</b></button>
    </div>
    @if (view === 'grid') {
      <ul aria-label="People" style="list-style:none;margin:0;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">
        @for (p of people; track p.employeeNo) {
          <li style="display:grid">
            <a uiPersonCard [href]="'#people/' + p.employeeNo" [name]="p.name" [position]="p.position"
              [department]="p.department" [office]="p.office" [employeeNo]="p.employeeNo" [avatarTint]="p.tint">
              ${STATUS_SWITCH('uiPersonCardStatus')}
            </a>
          </li>
        }
      </ul>
      <ui-pagination [page]="1" [pageSize]="20" [total]="9" itemLabel="people" />
    } @else {
      <ui-card flush>
        ${PEOPLE_TABLE}
        <ui-pagination uiCardFooter [page]="1" [pageSize]="20" [total]="9" itemLabel="people" />
      </ui-card>
    }
  </ui-app-shell>`;

const PLACEHOLDER = `
  <ui-page-header title="People" count="9 people" />
  <ui-card title="Page content">
    <p style="margin:0">Pages render inside the main landmark. Narrow the window below 900px for the drawer.</p>
  </ui-card>`;

const SHELL = `<ui-app-shell>${sidebar('people')}${topbar}${PLACEHOLDER}</ui-app-shell>`;

const meta: Meta<AppShell> = {
  title: 'Layout/App shell',
  component: AppShell,
  decorators: [
    moduleMetadata({
      imports: [
        AppShell,
        NavItem,
        Avatar,
        Button,
        Card,
        PageHeader,
        PersonCard,
        Pagination,
        ViewToggle,
        ...DATA_TABLE,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Application frame: light sidebar (\`[uiShellBrand]\`, \`[uiShellNav]\` inside \`<nav aria-label="Main">\`,
\`[uiShellFooter]\`), top bar \`<header>\` (\`[uiShellSearch]\`, \`[uiShellActions]\`, \`[uiShellUser]\`) and
\`<main id="main-content">\` for the page.

- "Skip to content" is the first tab stop and moves focus to \`<main>\`.
- Desktop: the sidebar collapses to icons (\`[(collapsed)]\`); mark text that should hide then with \`uiShellHideCollapsed\`.
- Below 900px: an off-canvas drawer (\`role="dialog"\`, \`aria-modal\`) opened by the menu button; the rest
  of the page is \`inert\`; Escape, the scrim or following a link closes it and focus returns to the menu button.
- Do: keep the nav to the five main destinations. Don't: put the page's primary action in the top bar.

The composed *Home* and *People directory* stories use placeholders for the search input, user menu and
status pill (other packages).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AppShell>;

export const Default: Story = {
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(canvas.getByRole('banner')).toBeVisible();
    await expect(canvas.getByRole('main')).toBeVisible();

    // Skip link: first tab stop; Enter moves focus to <main>.
    await userEvent.tab();
    const skip = canvas.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};

export const Collapsed: Story = {
  name: 'Collapsed sidebar',
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Collapse sidebar' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    const expand = await canvas.findByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect(expand).toHaveFocus();
    // Labels are hidden visually but still name the links.
    await expect(
      canvas.getByRole('link', { name: /^Requests\s*, 2 pending$/ }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'People' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const MobileDrawer: Story = {
  name: 'Mobile drawer',
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    const menu = await canvas.findByRole('button', { name: 'Open navigation' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    // Closed drawer: its links are inert, so not exposed.
    await expect(canvas.queryByRole('link', { name: 'Home' })).toBeNull();

    menu.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await canvas.findByRole('dialog', { name: 'Main' });
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    await expect(menu).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

export const Home: Story = {
  name: 'Home (composed)',
  render: () => ({
    props: {
      team: [DEMO_PEOPLE[1], DEMO_PEOPLE[2], DEMO_PEOPLE[6], DEMO_PEOPLE[8]],
      recent: [DEMO_PEOPLE[3], DEMO_PEOPLE[8], DEMO_PEOPLE[2]],
    },
    template: HOME,
  }),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Good morning, Ama' }),
    ).toBeVisible();
    await expect(canvas.getByRole('region', { name: /Needs your attention/ })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const PeopleDirectory: Story = {
  name: 'People directory (composed)',
  render: () => ({ props: { people: DEMO_PEOPLE, view: 'grid' }, template: DIRECTORY }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: /^Kwame Asante/ })).toBeVisible();

    // Switch to the list view with the keyboard.
    canvas.getByRole('radio', { name: 'Grid' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('table', { name: 'People' })).toBeVisible());
  },
};

export const PeopleDirectoryList: Story = {
  name: 'People directory, list (composed)',
  render: () => ({ props: { people: DEMO_PEOPLE, view: 'list' }, template: DIRECTORY }),
};
