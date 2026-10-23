import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { FormField } from '@ems/ui/form-field';
import { Input, InputGroup, type InputSize } from './input';

interface InputStoryArgs {
  size: InputSize;
  value: string;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  error: string;
}

const meta: Meta<InputStoryArgs> = {
  title: 'Forms/Input',
  component: Input,
  decorators: [moduleMetadata({ imports: [Input, InputGroup, FormField] })],
  args: {
    size: 'md',
    value: '',
    placeholder: 'name@akwaabalabs.example',
    disabled: false,
    readonly: false,
    error: '',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    error: { control: 'text' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field label="Work email" [error]="error">
          <input uiInput type="email" autocomplete="email" [size]="size" [value]="value"
            [placeholder]="placeholder" [disabled]="disabled" [readOnly]="readonly" />
        </ui-form-field>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
\`input[uiInput]\` and \`textarea[uiInput]\` style the native element (semantics, autofill and form
bindings come for free: \`[formField]\`, \`formControl\`, \`ngModel\`). Two sizes (sm 32px, md 40px).
Focus shows the indigo border and soft ring; invalid uses the danger border plus the field's error
text, never colour alone.

\`ui-input-group\` frames an input with \`uiInputLeading\` / \`uiInputTrailing\` content: icons
(\`.ui-input-group__icon\`, decorative) or small buttons (\`.ui-input-group__button\`, which need
an accessible name).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<InputStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Work email' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('kofi.boateng@akwaabalabs.example');
    await expect(input).toHaveValue('kofi.boateng@akwaabalabs.example');
  },
};

export const Filled: Story = { args: { value: 'esi.owusu@akwaabalabs.example' } };

export const Invalid: Story = {
  args: { value: 'esi.owusu@', error: 'Enter a work email like name@akwaabalabs.example' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Work email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const Disabled: Story = {
  args: { value: 'esi.owusu@akwaabalabs.example', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Work email' })).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  name: 'Read-only',
  args: { value: 'esi.owusu@akwaabalabs.example', readonly: true },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Work email' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('x');
    await expect(input).toHaveValue('esi.owusu@akwaabalabs.example');
  },
};

export const Small: Story = { args: { size: 'sm' } };

export const Textarea: Story = {
  render: () => ({
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field label="Note for HR" hint="Visible to People team only.">
          <textarea uiInput rows="3"></textarea>
        </ui-form-field>
      </div>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Note for HR' });
    await userEvent.click(textarea);
    await userEvent.keyboard('Starting in the Kumasi office on Monday.');
    await expect(textarea).toHaveValue('Starting in the Kumasi office on Monday.');
  },
};

export const WithSlots: Story = {
  name: 'With leading and trailing slots',
  render: () => ({
    template: `
      <div style="inline-size: 22rem">
        <ui-form-field label="Personal phone">
          <ui-input-group>
            <span uiInputLeading style="font-variant-numeric: tabular-nums">+233</span>
            <input uiInput type="tel" autocomplete="tel-national" value="24 555 0142" />
          </ui-input-group>
        </ui-form-field>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Personal phone' })).toHaveValue(
      '24 555 0142',
    );
  },
};
