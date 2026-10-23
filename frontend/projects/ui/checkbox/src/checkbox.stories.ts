import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Checkbox } from './checkbox';

interface CheckboxStoryArgs {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  invalid: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const meta: Meta<CheckboxStoryArgs> = {
  title: 'Actions & inputs/Checkbox',
  component: Checkbox,
  decorators: [moduleMetadata({ imports: [Checkbox] })],
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    invalid: false,
    label: 'Keep me signed in on this device',
    onChange: fn(),
  },
  argTypes: {
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    label: { control: 'text' },
    onChange: { action: 'checkedChange', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-checkbox [checked]="checked" [indeterminate]="indeterminate" [disabled]="disabled"
        [invalid]="invalid" (checkedChange)="onChange($event)">{{ label }}</ui-checkbox>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Native \`<input type="checkbox">\` (APG *Checkbox*): Space toggles, clicking the label toggles.
\`indeterminate\` shows a dash and is exposed as mixed; the next toggle clears it. Works with
\`[(checked)]\`, \`[formField]\`, \`formControl\` and \`ngModel\`. \`checked\` is a model, so bind it
(\`[checked]="true"\`); a bare \`checked\` attribute is an empty string, not \`true\`.

Do: use for choices submitted with a form. Don't: use for settings that apply immediately (use a switch).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CheckboxStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const box = canvas.getByRole('checkbox', { name: 'Keep me signed in on this device' });
    await userEvent.tab();
    await expect(box).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const Checked: Story = { args: { checked: true } };

export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'Select all people in Accra' },
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole('checkbox', { name: 'Select all people in Accra' });
    await expect(box).toBePartiallyChecked();
    await userEvent.click(box);
    await expect(box).not.toBePartiallyChecked();
    await expect(box).toBeChecked();
  },
};

export const Invalid: Story = {
  args: { invalid: true, label: 'I have read the leave policy' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true, checked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toBeDisabled();
  },
};

export const Group: Story = {
  name: 'Group (offices)',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <fieldset style="border: 0; margin: 0; padding: 0; display: grid; gap: 0.5rem">
        <legend style="font-weight: 600; margin-block-end: 0.5rem">Offices</legend>
        <ui-checkbox [checked]="true">Accra</ui-checkbox>
        <ui-checkbox>Kumasi</ui-checkbox>
        <ui-checkbox>Takoradi</ui-checkbox>
      </fieldset>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('checkbox', { name: 'Accra' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard(' ');
    await expect(canvas.getByRole('checkbox', { name: 'Kumasi' })).toBeChecked();
  },
};
