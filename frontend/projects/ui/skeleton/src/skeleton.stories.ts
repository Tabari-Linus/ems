import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Skeleton, type SkeletonShape } from './skeleton';

interface SkeletonArgs {
  shape: SkeletonShape;
  lines: number;
}

const meta: Meta<SkeletonArgs> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  decorators: [moduleMetadata({ imports: [Skeleton] })],
  args: { shape: 'text', lines: 3 },
  argTypes: {
    shape: { control: 'inline-radio', options: ['text', 'avatar', 'card'] },
    lines: { control: { type: 'number', min: 1, max: 8 } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="region" aria-label="Profile" aria-busy="true" style="inline-size: 20rem;">
        <ui-skeleton [shape]="shape" [lines]="lines" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Placeholder in the shape of the content that is loading, so the layout does not jump. Skeletons
are \`aria-hidden\`; mark the loading region with \`aria-busy="true"\` (and, for long loads, a
\`ui-spinner\` or status message). The pulse stops under reduced motion.

- Do: match the real layout (a grid of \`card\` skeletons for the People directory).
- Don't: show skeletons for more than a few seconds; switch to an error state if loading fails.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

export const Text: Story = {
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector('ui-skeleton');
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    await expect(skeleton?.querySelectorAll('.ui-skeleton__line')).toHaveLength(3);
  },
};

export const Avatar: Story = { args: { shape: 'avatar' } };

export const Card: Story = { args: { shape: 'card' } };

export const DirectoryLoading: Story = {
  name: 'People directory loading',
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => ({
    template: `
      <section aria-label="People" aria-busy="true"
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.875rem; max-inline-size: 48rem;">
        <span class="ui-visually-hidden" role="status">Loading people</span>
        @for (i of [1, 2, 3, 4, 5, 6]; track i) { <ui-skeleton shape="card" /> }
      </section>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading people');
  },
};
