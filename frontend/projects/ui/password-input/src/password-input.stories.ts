import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { FormField } from '@ems/ui/form-field';
import { PasswordInput } from './password-input';

interface PasswordStoryArgs {
  value: string;
  showStrength: boolean;
  disabled: boolean;
  error: string;
  autocomplete: 'current-password' | 'new-password';
}

const meta: Meta<PasswordStoryArgs> = {
  title: 'Forms/Password input',
  component: PasswordInput,
  decorators: [moduleMetadata({ imports: [PasswordInput, FormField] })],
  args: {
    value: '',
    showStrength: false,
    disabled: false,
    error: '',
    autocomplete: 'current-password',
  },
  argTypes: {
    value: { control: 'text' },
    showStrength: { control: 'boolean' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    autocomplete: { control: 'inline-radio', options: ['current-password', 'new-password'] },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field label="Password" [error]="error">
          <ui-password-input [value]="value" [showStrength]="showStrength" [disabled]="disabled"
            [autocomplete]="autocomplete" />
        </ui-form-field>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Password field with a reveal toggle (a real button named "Show password" with \`aria-pressed\`, so
its name never changes) and an optional four-step strength meter for new passwords. The meter
always has a text label ("Strength: Good") in a polite live region; colour is never the only cue.

Use \`autocomplete="current-password"\` on sign-in and \`"new-password"\` when setting one.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PasswordStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByLabelText('Password', { selector: 'input' });
    const toggle = canvas.getByRole('button', { name: 'Show password' });
    await expect(field).toHaveAttribute('type', 'password');
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.keyboard('akwaaba2026');
    // Tab to the toggle and press it with the keyboard.
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(field).toHaveAttribute('type', 'text');
  },
};

export const Filled: Story = { args: { value: 'akwaaba2026' } };

export const Invalid: Story = {
  args: { value: 'akwaaba', error: 'That password is not right. Check it, or reset it.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Password', { selector: 'input' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const Disabled: Story = {
  args: { value: 'akwaaba2026', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Password', { selector: 'input' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Show password' })).toBeDisabled();
  },
};

export const WithStrength: Story = {
  name: 'New password with strength',
  args: { showStrength: true, autocomplete: 'new-password' },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByLabelText('Password', { selector: 'input' });
    await userEvent.click(field);
    await userEvent.keyboard('akwaaba');
    await expect(canvas.getByText('Weak')).toBeVisible();
    await userEvent.keyboard('-Labs-2026');
    await expect(canvas.getByText('Strong')).toBeVisible();
  },
};
