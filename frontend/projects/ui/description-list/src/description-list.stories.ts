import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { DescriptionItem, DescriptionList, type DescriptionListColumns } from './description-list';

interface DescriptionListArgs {
  columns: DescriptionListColumns;
}

const meta: Meta<DescriptionListArgs> = {
  title: 'Layout/Description list',
  component: DescriptionList,
  decorators: [moduleMetadata({ imports: [DescriptionList, DescriptionItem] })],
  args: { columns: 3 },
  argTypes: { columns: { control: 'inline-radio', options: [1, 2, 3] } },
  render: (args) => ({
    props: args,
    template: `
      <dl uiDescriptionList [columns]="columns" style="inline-size:min(720px, 100%)">
        <div uiDescriptionItem label="Department">Platform Engineering</div>
        <div uiDescriptionItem label="Office">Accra · ACC</div>
        <div uiDescriptionItem label="Date hired" mono>2023-03-14</div>
        <div uiDescriptionItem label="Position · level">Senior Backend Engineer · Senior</div>
        <div uiDescriptionItem label="Access level">Employee</div>
        <div uiDescriptionItem label="Employee no." mono copyable>GH-ACC-0042</div>
        <div uiDescriptionItem label="Work email" span="2" copyable>kwame.asante&#64;akwaabalabs.example</div>
        <div uiDescriptionItem label="Direct reports">None</div>
      </dl>`,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`dl[uiDescriptionList]\` with \`div[uiDescriptionItem]\` pairs (native \`<dt>\`/\`<dd>\`). 1–3 columns that
reduce as the list narrows; \`span\` widens a pair (2, 3 or \`full\`).

- \`mono\`: Geist Mono, tabular figures, for employee numbers, codes and dates.
- \`copyable\`: a copy button named "Copy <label>". "Copied" (or how to copy manually when the clipboard is
  blocked) is shown and announced through a polite \`role="status"\`.
- Don't: put long paragraphs in a value; use a card body instead.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DescriptionListArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Department').tagName).toBe('DT');
    await expect(canvas.getByText('Platform Engineering').closest('dd')).not.toBeNull();

    // Keyboard: Tab reaches the first copy button; Enter copies and announces it.
    const copy = canvas.getByRole('button', { name: 'Copy employee no.' });
    await userEvent.tab();
    await expect(copy).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(canvas.getAllByRole('status')[0]).toHaveTextContent(/Copied|Copy failed/),
    );
    await expect(copy).toHaveFocus();
  },
};

export const TwoColumns: Story = { name: 'Two columns', args: { columns: 2 } };

export const OneColumn: Story = { name: 'One column', args: { columns: 1 } };
