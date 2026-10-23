import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Spinner, type SpinnerSize } from './spinner';

interface SpinnerArgs {
  label: string;
  size: SpinnerSize;
}

const meta: Meta<SpinnerArgs> = {
  title: 'Components/Spinner',
  component: Spinner,
  decorators: [moduleMetadata({ imports: [Spinner] })],
  args: { label: 'Loading people', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => ({ props: args, template: `<ui-spinner [label]="label" [size]="size" />` }),
  parameters: {
    docs: {
      description: {
        component: `
Indeterminate progress. With a label it is \`role="status"\` with visually hidden text, so the label
is announced politely. With \`label=""\` it is decorative (\`aria-hidden\`): use that only when
something else already says the area is busy (e.g. \`aria-busy\` on the region or button).
Reduced motion slows the rotation instead of freezing it.

- Do: name what is loading ("Loading people"). Don't: show a spinner for content with a known shape;
  use a skeleton instead.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SpinnerArgs>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent('Loading people');
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: center;">
        <ui-spinner size="sm" label="Saving" />
        <ui-spinner size="md" label="Loading profile" />
        <ui-spinner size="lg" label="Loading directory" />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('status')).toHaveLength(3);
  },
};

export const Decorative: Story = {
  args: { label: '' },
  render: (args) => ({
    props: args,
    template: `
      <div aria-busy="true" aria-label="People" role="region" style="display: flex; gap: 0.5rem; align-items: center;">
        <ui-spinner [label]="label" size="sm" /> <span>Refreshing…</span>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('ui-spinner')).toHaveAttribute('aria-hidden', 'true');
  },
};
