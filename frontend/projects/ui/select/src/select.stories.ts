import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, fn, screen, waitFor } from 'storybook/test';
import { FormField } from '@ems/ui/form-field';
import { NativeSelect } from './native-select';
import { Select, type SelectOption } from './select';

const OFFICES: SelectOption<string>[] = [
  { value: 'ACC', label: 'Accra' },
  { value: 'KUM', label: 'Kumasi' },
  { value: 'TAK', label: 'Takoradi' },
  { value: 'TAM', label: 'Tamale', disabled: true },
];

interface SelectStoryArgs {
  value: string | null;
  clearable: boolean;
  disabled: boolean;
  error: string;
  onChange: (value: string | null) => void;
}

const meta: Meta<SelectStoryArgs> = {
  title: 'Forms/Select',
  component: Select,
  decorators: [moduleMetadata({ imports: [Select, NativeSelect, FormField] })],
  args: { value: null, clearable: false, disabled: false, error: '', onChange: fn() },
  argTypes: {
    value: { control: 'inline-radio', options: [null, 'ACC', 'KUM', 'TAK'] },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    onChange: { action: 'valueChange', table: { disable: true } },
  },
  render: (args) => ({
    props: { ...args, offices: OFFICES },
    template: `
      <div style="inline-size: 20rem; min-block-size: 16rem">
        <ui-form-field label="Office" [error]="error">
          <ui-select placeholder="Choose an office" [options]="offices" [value]="value"
            [clearable]="clearable" [disabled]="disabled" (valueChange)="onChange($event)" />
        </ui-form-field>
      </div>
    `,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`ui-select\`: a trigger button opening a listbox in an overlay (APG *Listbox*, CDK listbox +
overlay). Keyboard: Enter, Space, ArrowDown or ArrowUp open; arrows, Home/End and type-ahead move;
Enter/Space choose; Escape closes; Tab closes and moves on. Focus returns to the trigger.
Disabled options are skipped. \`clearable\` adds a separate "Clear selection" button.

\`select[uiSelect]\` styles the native select for short, static lists in plain forms.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SelectStoryArgs>;

/**
 * CDK key managers read `KeyboardEvent.keyCode`, which real browsers set but user-event does not,
 * so keys inside the open list are dispatched with it.
 */
const KEY_CODES = { End: 35, Home: 36, Enter: 13, k: 75 } as const;
function press(key: keyof typeof KEY_CODES): void {
  fireEvent.keyDown(document.activeElement as Element, { key, keyCode: KEY_CODES[key] });
}

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Office Choose an office' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const listbox = await screen.findByRole('listbox', { name: 'Office' });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Accra' })).toHaveFocus());
    // Type-ahead jumps to Kumasi; Enter chooses and closes.
    press('k');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Kumasi' })).toHaveFocus());
    press('Enter');
    await waitFor(() => expect(listbox).not.toBeInTheDocument());
    await expect(args.onChange).toHaveBeenCalledWith('KUM');
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAccessibleName('Office Kumasi');
  },
};

export const Filled: Story = {
  args: { value: 'TAK', clearable: true },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Office Takoradi' });
    await userEvent.click(trigger);
    await screen.findByRole('listbox');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Takoradi' })).toHaveFocus());
    // Home then End: End skips the disabled Tamale; Escape closes without choosing.
    press('Home');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Accra' })).toHaveFocus());
    press('End');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Takoradi' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }));
    await expect(args.onChange).toHaveBeenCalledWith(null);
  },
};

export const Invalid: Story = {
  args: { error: 'Choose the office you work from' },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /Office/ });
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Choose the office you work from');
  },
};

export const Disabled: Story = {
  args: { value: 'ACC', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Office Accra' })).toBeDisabled();
  },
};

export const Native: Story = {
  name: 'Native (select[uiSelect])',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="inline-size: 20rem">
        <ui-form-field label="Department" hint="Where this person reports.">
          <select uiSelect>
            <option value="">Choose a department</option>
            <option value="eng">Engineering</option>
            <option value="ppl">People</option>
            <option value="fin">Finance</option>
          </select>
        </ui-form-field>
      </div>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole('combobox', { name: 'Department' });
    await userEvent.selectOptions(select, 'ppl');
    await expect(select).toHaveValue('ppl');
  },
};
