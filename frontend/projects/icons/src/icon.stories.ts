import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Icon } from './icon';
import { ICON_NAMES, type IconName } from './registry';

interface IconStoryArgs {
  name: IconName;
  size: number;
  label: string;
}

const meta: Meta<IconStoryArgs> = {
  title: 'Foundations/Icon',
  component: Icon,
  decorators: [moduleMetadata({ imports: [Icon] })],
  args: { name: 'search', size: 24, label: '' },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: { type: 'number', min: 12, max: 64, step: 4 } },
    label: { control: 'text' },
  },
  render: (args) => ({
    props: args,
    template: `<ui-icon [name]="name" [size]="size" [label]="label" />`,
  }),
  parameters: {
    docs: {
      description: {
        component: `
\`<ui-icon>\` wraps [Lucide](https://lucide.dev) through a curated registry (\`EMS_ICONS\`), so only
listed icons are bundled and the library can be swapped in one place. Icons draw in \`currentColor\`.

- **Decorative** (no \`label\`): \`aria-hidden="true"\`. Use when adjacent text already says it.
- **Meaningful** (\`label\`): \`role="img"\` + \`aria-label\`. Use for icon-only status or meaning.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<IconStoryArgs>;

export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('ui-icon');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).not.toHaveAttribute('role');
  },
};

export const Labelled: Story = {
  args: { name: 'circle-alert', label: 'Error' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Error' })).toBeInTheDocument();
  },
};

export const Gallery: Story = {
  name: 'Curated set',
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => ({
    props: { names: ICON_NAMES },
    template: `
      <ul style="display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: 1rem;
        list-style: none; padding: 0; margin: 0;">
        @for (name of names; track name) {
          <li style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            padding: 0.75rem; border: 1px solid var(--ems-color-border-default);
            border-radius: var(--ems-radius-md); color: var(--ems-color-text-default);">
            <ui-icon [name]="name" [size]="24" />
            <code style="font-size: var(--ems-font-size-xs);">{{ name }}</code>
          </li>
        }
      </ul>
    `,
  }),
};
