import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { ViewToggle, type ViewToggleValue } from './view-toggle';

interface ViewToggleArgs {
  view: ViewToggleValue;
  iconOnly: boolean;
  viewChange: (view: ViewToggleValue) => void;
}

const meta: Meta<ViewToggleArgs> = {
  title: 'Actions & inputs/View toggle',
  component: ViewToggle,
  decorators: [moduleMetadata({ imports: [ViewToggle] })],
  args: { view: 'grid', iconOnly: false, viewChange: fn() },
  argTypes: {
    view: { control: 'inline-radio', options: ['grid', 'list'] },
    viewChange: { action: 'viewChange', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `<ui-view-toggle [view]="view" [iconOnly]="iconOnly" (viewChange)="viewChange($event)" />`,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Segmented grid/list switch. Radio-group semantics (WAI-ARIA APG *Radio Group*): one tab stop on the
checked option; Arrow keys move and select (wrapping). Bind \`[(view)]\` or listen to \`viewChange\`.

- \`iconOnly\` keeps the labels as accessible names but hides them visually.
- Do: remember the choice per user. Don't: use it for anything but switching how the same data is shown.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ViewToggleArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const group = canvas.getByRole('radiogroup', { name: 'View' });
    const grid = canvas.getByRole('radio', { name: 'Grid' });
    const list = canvas.getByRole('radio', { name: 'List' });
    await expect(group).toBeVisible();
    await expect(grid).toBeChecked();

    await userEvent.tab();
    await expect(grid).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(list).toHaveFocus();
    await expect(list).toBeChecked();
    await expect(args.viewChange).toHaveBeenLastCalledWith('list');

    await userEvent.keyboard('{ArrowRight}');
    await expect(grid).toBeChecked();
    // Only the checked option is in the tab order.
    await expect(list).toHaveAttribute('tabindex', '-1');
  },
};

export const ListSelected: Story = { name: 'List selected', args: { view: 'list' } };

export const IconOnly: Story = {
  name: 'Icon only',
  args: { iconOnly: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'List' })).toBeVisible();
  },
};
