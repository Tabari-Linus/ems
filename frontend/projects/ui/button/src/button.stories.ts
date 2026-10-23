import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Button, type ButtonSize, type ButtonVariant } from './button';

interface ButtonStoryArgs {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  disabled: boolean;
  label: string;
  onClick: (event: Event) => void;
}

const meta: Meta<ButtonStoryArgs> = {
  title: 'Components/Button',
  component: Button,
  decorators: [moduleMetadata({ imports: [Button] })],
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    label: 'Save changes',
    onClick: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    onClick: { action: 'click', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <button uiButton type="button" [variant]="variant" [size]="size" [loading]="loading"
        [disabled]="disabled" (click)="onClick($event)">{{ label }}</button>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Native \`<button uiButton>\` or \`<a uiButton>\` (WAI-ARIA APG *Button* pattern: the native element
provides role, focus and Enter/Space activation). Styles use only \`--ems-button-*\` component tokens
and semantic tokens.

- **loading** shows a spinner, sets \`aria-busy="true"\` and \`aria-disabled="true"\`, blocks activation and
  keeps focus (the label stays in the accessible name).
- **disabled** uses the native \`disabled\` attribute on \`<button>\`; on \`<a>\` it sets
  \`aria-disabled="true"\` and \`tabindex="-1"\`.
- Do: one primary action per view; label with a verb. Don't: use \`<a uiButton>\` for actions that do
  not navigate.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

export const Primary: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await expect(button).toHaveAttribute('data-variant', 'primary');
    await expect(button).not.toHaveAttribute('aria-busy');

    // Keyboard activation: Tab to the button, then Enter and Space each activate it once.
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Ghost: Story = { args: { variant: 'ghost' } };

export const Danger: Story = { args: { variant: 'danger', label: 'Delete employee' } };

export const Small: Story = { args: { size: 'sm' } };

export const Large: Story = { args: { size: 'lg' } };

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toBeEnabled();

    // Still focusable, but neither click nor keyboard activates it.
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await expect(button).toBeDisabled();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const AsLink: Story = {
  name: 'As link (a[uiButton])',
  args: { variant: 'secondary', label: 'Open directory' },
  render: (args) => ({
    props: args,
    template: `
      <a uiButton href="#directory" [variant]="variant" [size]="size" [loading]="loading"
        [disabled]="disabled" (click)="$event.preventDefault(); onClick($event)">{{ label }}</a>
    `,
  }),
  play: async ({ canvas, userEvent, args }) => {
    const link = canvas.getByRole('link', { name: 'Open directory' });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledLink: Story = {
  name: 'Disabled link',
  args: { variant: 'secondary', label: 'Open directory', disabled: true },
  render: AsLink.render,
  play: async ({ canvas, userEvent, args }) => {
    const link = canvas.getByRole('link', { name: 'Open directory' });
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await expect(link).toHaveAttribute('tabindex', '-1');
    await userEvent.click(link);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const AllVariants: Story = {
  name: 'All variants and sizes',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 1rem;">
        @for (size of sizes; track size) {
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            @for (variant of variants; track variant) {
              <button uiButton type="button" [variant]="variant" [size]="size">{{ variant }} {{ size }}</button>
            }
            <button uiButton type="button" [size]="size" loading>Loading {{ size }}</button>
            <button uiButton type="button" [size]="size" disabled>Disabled {{ size }}</button>
          </div>
        }
      </div>
    `,
    props: {
      sizes: ['sm', 'md', 'lg'] satisfies ButtonSize[],
      variants: ['primary', 'secondary', 'ghost', 'danger'] satisfies ButtonVariant[],
    },
  }),
};
