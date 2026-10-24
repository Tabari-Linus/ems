import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  type FieldTree,
  form,
  FormField as SignalFormField,
  required,
  submit,
} from '@angular/forms/signals';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { Button } from '@ems/ui/button';
import { Input } from '@ems/ui/input';
import { PasswordInput } from '@ems/ui/password-input';
import { NativeSelect, Select, type SelectOption } from '@ems/ui/select';
import { FormField } from './form-field';

/**
 * Story harness: a signal form bound with `[formField]` only. `error` is the field's first
 * message with no touched check; the field and the control hold it back until the field is
 * touched (blur) or the form is submitted.
 */
@Component({
  selector: 'ui-form-field-signal-demo',
  imports: [FormField, SignalFormField, Input, PasswordInput, Select, NativeSelect, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      novalidate
      style="display: grid; gap: 1rem; inline-size: 22rem"
      (submit)="onSubmit($event)"
    >
      <ui-form-field label="Work email" required [error]="firstError(model.email)">
        <input uiInput type="email" autocomplete="off" [formField]="model.email" />
      </ui-form-field>
      <ui-form-field label="Password" required [error]="firstError(model.password)">
        <ui-password-input autocomplete="off" [formField]="model.password" />
      </ui-form-field>
      <!-- No required marker: the ui-select trigger is a button, which takes no aria-required. -->
      <ui-form-field label="Office" [error]="firstError(model.office)">
        <ui-select placeholder="Choose an office" [options]="offices" [formField]="model.office" />
      </ui-form-field>
      <ui-form-field label="Department" required [error]="firstError(model.department)">
        <select uiSelect [formField]="model.department">
          <option value="">Choose a department</option>
          <option value="eng">Engineering</option>
          <option value="ops">People Operations</option>
        </select>
      </ui-form-field>
      <div><button uiButton type="submit">Save</button></div>
      <p role="status">{{ saved() ? 'Saved' : '' }}</p>
    </form>
  `,
})
class SignalFormDemo {
  protected readonly offices: SelectOption<string>[] = [
    { value: 'acc', label: 'Accra' },
    { value: 'kum', label: 'Kumasi' },
  ];
  protected readonly model = form(
    signal({ email: '', password: '', office: null as string | null, department: '' }),
    (s) => {
      required(s.email, { message: 'Enter a work email.' });
      email(s.email, { message: 'Enter an email like name@akwaabalabs.example.' });
      required(s.password, { message: 'Enter a password.' });
      required(s.office, { message: 'Choose an office.' });
      required(s.department, { message: 'Choose a department.' });
    },
  );
  protected readonly saved = signal(false);

  protected firstError(field: FieldTree<unknown>): string | null {
    return field().errors()[0]?.message ?? null;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.model, async () => {
      this.saved.set(true);
    });
  }
}

interface FormFieldStoryArgs {
  label: string;
  hint: string;
  error: string;
  required: boolean;
}

const meta: Meta<FormFieldStoryArgs> = {
  title: 'Actions & inputs/Form field',
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

- With signal forms, bind the control with \`[formField]\` and pass the field's first message as
  \`error\`: the error and the control's invalid state wait until the field is touched (blur) or
  the form is submitted, so an empty required field is not red on load (see *With signal forms*).
- Without a form, pass \`error\` only after the user touched the control or submitted. An error
  that **appears** later is announced (\`role="alert"\`); one present on first render is not.
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

export const WithSignalForms: Story = {
  name: 'With signal forms',
  decorators: [moduleMetadata({ imports: [SignalFormDemo] })],
  render: () => ({ template: `<ui-form-field-signal-demo />` }),
  play: async ({ canvas, userEvent, step }) => {
    const emailInput = canvas.getByRole('textbox', { name: /Work email/ });
    const password = canvas.getByLabelText(/Password/, { selector: 'input' });
    const office = canvas.getByRole('button', { name: /Office/ });
    const department = canvas.getByRole('combobox', { name: /Department/ });
    const controls = [emailInput, password, office, department];

    await step('Nothing is invalid on load', async () => {
      for (const control of controls) {
        await expect(control).not.toHaveAttribute('aria-invalid');
      }
      await expect(canvas.queryByText('Enter a work email.')).toBeNull();
    });

    await step('Leaving an empty field shows its error', async () => {
      await userEvent.click(emailInput);
      await userEvent.tab();
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAccessibleDescription('Enter a work email.');
      await expect(department).not.toHaveAttribute('aria-invalid');
    });

    await step('Submitting shows every error', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
      for (const control of controls) {
        await waitFor(() => expect(control).toHaveAttribute('aria-invalid', 'true'));
      }
      await expect(canvas.getByText('Choose a department.')).toBeVisible();
      await expect(canvas.getByRole('status')).toHaveTextContent('');
    });

    await step('Fixing a field clears its error', async () => {
      await userEvent.type(emailInput, 'ama.mensah@akwaabalabs.example');
      await expect(emailInput).not.toHaveAttribute('aria-invalid');
      await userEvent.selectOptions(department, 'eng');
      await expect(department).not.toHaveAttribute('aria-invalid');
    });
  },
};
