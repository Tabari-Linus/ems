import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { SearchInput, type ShortcutPlatform } from './search-input';

interface SearchStoryArgs {
  value: string;
  shortcut: boolean;
  platform: ShortcutPlatform;
  disabled: boolean;
  debounce: number;
  onQuery: (query: string) => void;
}

const meta: Meta<SearchStoryArgs> = {
  title: 'Actions & inputs/Search input',
  component: SearchInput,
  decorators: [moduleMetadata({ imports: [SearchInput] })],
  args: {
    value: '',
    shortcut: true,
    platform: 'mac',
    disabled: false,
    debounce: 250,
    onQuery: fn(),
  },
  argTypes: {
    value: { control: 'text' },
    shortcut: { control: 'boolean' },
    platform: { control: 'inline-radio', options: ['auto', 'mac', 'other'] },
    disabled: { control: 'boolean' },
    debounce: { control: 'number' },
    onQuery: { action: 'query', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size: 24rem">
        <ui-search-input placeholder="Search people, offices, requests" [value]="value"
          [shortcut]="shortcut" [platform]="platform" [disabled]="disabled" [debounce]="debounce"
          (query)="onQuery($event)" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Pill search field. \`query\` emits the trimmed text after \`debounce\` ms (Enter and clear emit
at once); Escape clears. The optional shortcut hint shows ⌘K on Apple platforms and Ctrl K
elsewhere, focuses the field from anywhere, and is \`aria-hidden\` (the input carries
\`aria-keyshortcuts\`). Standalone it is named "Search"; inside \`ui-form-field\` the label names it.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SearchStoryArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const field = canvas.getByRole('searchbox', { name: 'Search' });
    await expect(field).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
    // The page-wide shortcut moves focus into the field.
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await expect(field).toHaveFocus();
    await userEvent.keyboard('Ama');
    await waitFor(() => expect(args.onQuery).toHaveBeenCalledWith('Ama'));
    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveValue('');
    await expect(args.onQuery).toHaveBeenLastCalledWith('');
  },
};

export const Filled: Story = {
  args: { value: 'Kumasi' },
  play: async ({ canvas, userEvent }) => {
    const clear = canvas.getByRole('button', { name: 'Clear search' });
    await userEvent.tab();
    await userEvent.tab();
    await expect(clear).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('searchbox')).toHaveValue('');
    await expect(canvas.getByRole('searchbox')).toHaveFocus();
  },
};

export const WindowsHint: Story = {
  name: 'Ctrl K hint (Windows/Linux)',
  args: { platform: 'other' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ctrl K')).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('searchbox')).toBeDisabled();
  },
};
