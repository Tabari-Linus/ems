import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, screen, waitFor } from 'storybook/test';
import type { SelectOption } from '@ems/ui/select';
import { FilterPill } from './filter-pill';
import { press } from '../../testing/keyboard';

const OFFICES: SelectOption<string>[] = [
  { value: 'ACC', label: 'Accra' },
  { value: 'KUM', label: 'Kumasi' },
  { value: 'TAK', label: 'Takoradi' },
];

const DEPARTMENTS: SelectOption<string>[] = [
  { value: 'eng', label: 'Engineering' },
  { value: 'des', label: 'Design' },
  { value: 'ppl', label: 'People' },
  { value: 'fin', label: 'Finance' },
];

interface FilterPillStoryArgs {
  value: string | null;
  values: string[];
  disabled: boolean;
  onChanged: (value: unknown) => void;
}

const meta: Meta<FilterPillStoryArgs> = {
  title: 'Actions & inputs/Filter pill',
  component: FilterPill,
  decorators: [moduleMetadata({ imports: [FilterPill] })],
  args: { value: null, values: [], disabled: false, onChanged: fn() },
  argTypes: {
    value: { control: 'inline-radio', options: [null, 'ACC', 'KUM', 'TAK'] },
    values: { control: 'object' },
    disabled: { control: 'boolean' },
    onChanged: { action: 'changed', table: { disable: true } },
  },
  render: (args) => ({
    props: { ...args, offices: OFFICES },
    template: `
      <div style="min-block-size: 14rem">
        <ui-filter-pill label="Office" [options]="offices" [value]="value" [disabled]="disabled"
          (changed)="onChanged($event)" />
      </div>
    `,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Filter for list pages: a pill reading "Office · All" that opens a listbox (CDK listbox + overlay).
The first row, "All", clears the filter. While a filter applies the pill takes the soft indigo tint.

- Single (default, \`[(value)]\`): choosing closes the list.
- \`multiple\` (\`[(values)]\`): choosing toggles and keeps the list open; several values read
  "2 selected".
- Keyboard: Enter/Space/ArrowDown open; arrows, Home/End, type-ahead; Enter/Space choose; Escape or
  Tab close; focus returns to the pill. Name: "Office: All".
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FilterPillStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const pill = canvas.getByRole('button', { name: 'Office: All' });
    await userEvent.tab();
    await expect(pill).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox', { name: 'Office' });
    await waitFor(() => expect(screen.getByRole('option', { name: 'All' })).toHaveFocus());
    press('ArrowDown');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Accra' })).toHaveFocus());
    press('ArrowDown');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Kumasi' })).toHaveFocus());
    press('Enter');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(args.onChanged).toHaveBeenCalledWith('KUM');
    await expect(pill).toHaveFocus();
    await expect(pill).toHaveAccessibleName('Office: Kumasi');
  },
};

export const Filtered: Story = {
  args: { value: 'ACC' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Office: Accra' })).toHaveAttribute(
      'data-active',
    );
  },
};

export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => ({
    props: { ...args, departments: DEPARTMENTS },
    template: `
      <div style="min-block-size: 16rem">
        <ui-filter-pill label="Department" multiple [options]="departments"
          [values]="['eng']" (changed)="onChanged($event)" />
      </div>
    `,
  }),
  play: async ({ canvas, userEvent, args }) => {
    const pill = canvas.getByRole('button', { name: 'Department: Engineering' });
    await userEvent.click(pill);
    const listbox = await screen.findByRole('listbox', { name: 'Department' });
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'People' }));
    await expect(args.onChanged).toHaveBeenLastCalledWith(['eng', 'ppl']);
    await expect(pill).toHaveAccessibleName('Department: 2 selected');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(listbox).not.toBeInTheDocument());
    await expect(pill).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Office: All' })).toBeDisabled();
  },
};

export const FilterBar: Story = {
  name: 'Filter bar (People directory)',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      offices: OFFICES,
      departments: DEPARTMENTS,
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 0.625rem">
        <ui-filter-pill label="Office" [options]="offices" />
        <ui-filter-pill label="Department" multiple [options]="departments" [values]="['eng', 'des']" />
        <ui-filter-pill label="Status" [options]="statuses" value="active" />
      </div>
    `,
  }),
};
