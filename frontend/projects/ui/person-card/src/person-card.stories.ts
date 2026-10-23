import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { PersonCard } from './person-card';

/** Stand-in for the status pill from the feedback package (dot shape + label). */
const STATUS = (label: string, tone: 'active' | 'pending' | 'inactive') =>
  `<span uiPersonCardStatus style="display:inline-flex;align-items:center;gap:6px;block-size:24px;padding-inline:8px 10px;border-radius:999px;font-size:12px;font-weight:600;background:var(--ems-color-employee-status-${tone}-bg);color:var(--ems-color-employee-status-${tone}-text)"><span aria-hidden="true" style="inline-size:8px;block-size:8px;border-radius:50%;border:1.5px solid currentColor;${tone === 'active' ? 'background:currentColor' : ''}"></span>${label}</span>`;

interface PersonCardArgs {
  name: string;
  position: string;
  department: string;
  office: string;
  employeeNo: string;
  open: (event: Event) => void;
}

const meta: Meta<PersonCardArgs> = {
  title: 'Identity/Person card',
  component: PersonCard,
  decorators: [moduleMetadata({ imports: [PersonCard] })],
  args: {
    name: 'Kwame Asante',
    position: 'Senior Backend Engineer',
    department: 'Platform Engineering',
    office: 'Accra',
    employeeNo: 'GH-ACC-0042',
    open: fn(),
  },
  argTypes: { open: { action: 'open', table: { disable: true } } },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size:min(320px, 100%)">
        <a uiPersonCard href="#people/GH-ACC-0042" (click)="$event.preventDefault(); open($event)"
          [name]="name" [position]="position" [department]="department" [office]="office"
          [employeeNo]="employeeNo">${STATUS('Active', 'active')}</a>
      </div>`,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`a[uiPersonCard]\`: a directory card that is one link (one tab stop, one focus ring) to the person's
profile. Its accessible name is its visible text, name first. Use with \`routerLink\`.

- Slots \`[uiPersonCardStatus]\` (status pill) and \`[uiPersonCardReportsTo]\` (text). Both sit inside a
  link: no buttons or links in them.
- The avatar tint comes from the department (stable hash) unless \`avatarTint\` is set.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PersonCardArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const card = canvas.getByRole('link', { name: /^Kwame Asante\s+Senior Backend Engineer/ });
    await expect(card).toHaveAccessibleName(/Platform Engineering\s+Accra/);
    await expect(card).toHaveAccessibleName(/Employee no\.\s*GH-ACC-0042/);
    await userEvent.tab();
    await expect(card).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.open).toHaveBeenCalledTimes(1);
  },
};

export const ReportsTo: Story = {
  name: 'With reports to',
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size:min(320px, 100%)">
        <a uiPersonCard href="#people/GH-KSI-0013" name="Kofi Owusu" position="Data Analyst"
          department="Analytics" office="Kumasi" employeeNo="GH-KSI-0013">
          <span uiPersonCardReportsTo>Reports to Ama Mensah</span>
          ${STATUS('Pending', 'pending')}
        </a>
      </div>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /^Kofi Owusu/ })).toHaveAccessibleName(
      /Reports to Ama Mensah/,
    );
  },
};

export const LongText: Story = {
  name: 'Long text truncates',
  args: {
    name: 'Nana Akua Agyeman-Boateng Mensah',
    position: 'Head of Finance, Treasury and Procurement Operations',
    department: 'Finance and Procurement',
    office: 'Takoradi',
    employeeNo: 'GH-TKD-0004',
  },
};

export const Grid: Story = {
  name: 'Directory grid',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      people: [
        ['Ama Mensah', 'Engineering Manager', 'Platform Engineering', 'Accra', 'GH-ACC-0007'],
        ['Kwame Asante', 'Senior Backend Engineer', 'Platform Engineering', 'Accra', 'GH-ACC-0042'],
        ['Efua Boateng', 'Product Designer', 'Design', 'Accra', 'GH-ACC-0051'],
        ['Kofi Owusu', 'Data Analyst', 'Analytics', 'Kumasi', 'GH-KSI-0013'],
        ['Abena Darko', 'HR Business Partner', 'People Operations', 'Accra', 'GH-ACC-0019'],
        ['Yaw Appiah', 'QA Engineer', 'Quality Engineering', 'Takoradi', 'GH-TKD-0004'],
      ],
    },
    template: `
      <ul style="list-style:none;margin:0;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">
        @for (p of people; track p[4]) {
          <li style="display:grid">
            <a uiPersonCard [href]="'#people/' + p[4]" [name]="p[0]" [position]="p[1]"
              [department]="p[2]" [office]="p[3]" [employeeNo]="p[4]">${STATUS('Active', 'active')}</a>
          </li>
        }
      </ul>`,
  }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('link')).toHaveLength(6);
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: /^Kwame Asante/ })).toHaveFocus();
  },
};
