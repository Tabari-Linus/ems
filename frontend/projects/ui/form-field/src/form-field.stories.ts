import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Input } from '@ems/ui/input';
import { FormField } from './form-field';

interface FormFieldStoryArgs {
  label: string;
  hint: string;
  error: string;
  required: boolean;
}

const meta: Meta<FormFieldStoryArgs> = {
  title: 'Forms/Form field',
  component: FormField,
  decorators: [moduleMetadata({ imports: [FormField, Input] })],
  args: {
    label: 'Work email',
    hint: 'We send sign-in links to this address.',
    error: '',
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field [label]="label" [hint]="hint" [error]="error" [required]="required">
          <input uiInput type="email" autocomplete="email" placeholder="name@akwaabalabs.example" />
        </ui-form-field>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Label, hint, error and required marker around one control, with the ARIA wiring done: the control
gets the \`id\` the label points at, \`aria-describedby\` (hint or error), \`aria-invalid\` while an
error shows and \`aria-required\`.

- Pass \`error\` only after the user touched the control or submitted. An error that **appears**
  later is announced (\`role="alert"\`); one present on first render is not.
- The hint is replaced by the error while one is shown.
- \`uiFormFieldAside\` puts a link next to the label ("Forgot password?").
- Do: say what is wrong and how to fix it. Don't: use the placeholder as the label.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FormFieldStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Work email' });
    const hint = canvas.getByText('We send sign-in links to this address.');
    await expect(input).toHaveAttribute('aria-describedby', hint.id);
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('ama.mensah@akwaabalabs.example');
    await expect(input).toHaveValue('ama.mensah@akwaabalabs.example');
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /Work email/ });
    await expect(input).toHaveAttribute('aria-required', 'true');
  },
};

export const Invalid: Story = {
  args: { error: 'Enter a work email like name@akwaabalabs.example' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Work email' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(
      'Enter a work email like name@akwaabalabs.example',
    );
  },
};

export const WithAside: Story = {
  name: 'With aside link',
  render: () => ({
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field label="Password">
          <a uiFormFieldAside href="#reset" style="font-size: 0.8125rem">Forgot password?</a>
          <input uiInput type="password" autocomplete="current-password" />
        </ui-form-field>
      </div>
    `,
  }),
};
