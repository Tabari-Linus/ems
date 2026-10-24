import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Switch, type SwitchLabelPosition } from './switch';

interface SwitchStoryArgs {
  checked: boolean;
  disabled: boolean;
  labelPosition: SwitchLabelPosition;
  label: string;
  onChange: (checked: boolean) => void;
}

const meta: Meta<SwitchStoryArgs> = {
  title: 'Actions & inputs/Switch',
  component: Switch,
  decorators: [moduleMetadata({ imports: [Switch] })],
  args: {
    checked: false,
    disabled: false,
    labelPosition: 'after',
    label: 'Email me a weekly summary',
    onChange: fn(),
  },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    labelPosition: { control: 'inline-radio', options: ['before', 'after'] },
    label: { control: 'text' },
    onChange: { action: 'checkedChange', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-switch [checked]="checked" [disabled]="disabled" [labelPosition]="labelPosition"
        (checkedChange)="onChange($event)">{{ label }}</ui-switch>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Native checkbox with \`role="switch"\` (APG *Switch*): Space toggles, state is announced as on/off.
Use for settings that take effect immediately. Works with \`[(checked)]\`, \`[formField]\`,
\`formControl\` and \`ngModel\`.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SwitchStoryArgs>;

export const Off: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const toggle = canvas.getByRole('switch', { name: 'Email me a weekly summary' });
    await expect(toggle).not.toBeChecked();
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const On: Story = { args: { checked: true } };

export const Disabled: Story = {
  args: { disabled: true, checked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch')).toBeDisabled();
  },
};

export const LabelBefore: Story = {
  name: 'Label before (settings row)',
  args: { labelPosition: 'before', label: 'Show my birthday to colleagues' },
};
