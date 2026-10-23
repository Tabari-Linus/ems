import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { StatusPill, type EmployeeStatus, type StatusTone } from './status-pill';

interface StatusPillArgs {
  status: EmployeeStatus;
}

const meta: Meta<StatusPillArgs> = {
  title: 'Components/Status pill',
  component: StatusPill,
  decorators: [moduleMetadata({ imports: [StatusPill] })],
  args: { status: 'ACTIVE' },
  argTypes: {
    status: { control: 'inline-radio', options: ['ACTIVE', 'PENDING', 'INACTIVE', 'ARCHIVED'] },
  },
  render: (args) => ({ props: args, template: `<ui-status-pill [status]="status" />` }),
  parameters: {
    docs: {
      description: {
        component: `
Shows a status as a soft pill: tinted background, a dot and a label. The dot **shape** encodes the
status (Active = filled, Pending = half, Inactive = ring, Archived = square), so the status never
depends on colour alone (WCAG 1.4.1). The label is plain text; the dot is \`aria-hidden\`.

- \`status\` takes the API's employee status and uses the \`employee-status\` tokens.
- \`tone\` (success, warning, danger, info, neutral) is for anything else; put the label in the content.
- Do: keep labels to one or two words. Don't: make the pill interactive; use a filter pill or a menu.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<StatusPillArgs>;

export const Active: Story = {
  play: async ({ canvas }) => {
    const pill = canvas.getByText('Active').closest('ui-status-pill');
    await expect(pill).toHaveAttribute('data-shape', 'filled');
    await expect(pill?.querySelector('.ui-status-pill__dot')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  },
};

export const Pending: Story = { args: { status: 'PENDING' } };
export const Inactive: Story = { args: { status: 'INACTIVE' } };
export const Archived: Story = { args: { status: 'ARCHIVED' } };

export const EmployeeStatuses: Story = {
  name: 'All employee statuses',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { statuses: ['ACTIVE', 'PENDING', 'INACTIVE', 'ARCHIVED'] satisfies EmployeeStatus[] },
    template: `
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        @for (s of statuses; track s) { <ui-status-pill [status]="s" /> }
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    for (const [label, shape] of [
      ['Active', 'filled'],
      ['Pending', 'half'],
      ['Inactive', 'ring'],
      ['Archived', 'square'],
    ]) {
      await expect(canvas.getByText(label).closest('ui-status-pill')).toHaveAttribute(
        'data-shape',
        shape,
      );
    }
  },
};

export const Tones: Story = {
  name: 'Generic tones',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      tones: [
        ['success', 'Approved'],
        ['warning', 'Awaiting review'],
        ['danger', 'Declined'],
        ['info', 'In progress'],
        ['neutral', 'Draft'],
      ] satisfies [StatusTone, string][],
    },
    template: `
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        @for (t of tones; track t[0]) { <ui-status-pill [tone]="t[0]">{{ t[1] }}</ui-status-pill> }
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Declined').closest('ui-status-pill')).toHaveAttribute(
      'data-tone',
      'danger',
    );
  },
};
