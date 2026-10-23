import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Pagination, type PaginationVariant } from './pagination';

interface PaginationArgs {
  page: number;
  pageSize: number;
  total: number;
  variant: PaginationVariant;
  loading: boolean;
  itemLabel: string;
  pageChange: (page: number) => void;
  loadMore: (page: number) => void;
}

const meta: Meta<PaginationArgs> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  decorators: [moduleMetadata({ imports: [Pagination] })],
  args: {
    page: 1,
    pageSize: 20,
    total: 134,
    variant: 'pages',
    loading: false,
    itemLabel: 'people',
    pageChange: fn(),
    loadMore: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['pages', 'load-more'] },
    pageChange: { action: 'pageChange', table: { disable: true } },
    loadMore: { action: 'loadMore', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size:min(720px, 100%)">
        <ui-pagination [(page)]="page" [pageSize]="pageSize" [total]="total" [variant]="variant"
          [loading]="loading" [itemLabel]="itemLabel" (pageChange)="pageChange($event)"
          (loadMore)="loadMore($event)" />
      </div>`,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
"Showing 1–20 of 134 people" with Previous/Next, inside \`<nav aria-label="Pagination">\`. The range is a
polite live region. \`variant="load-more"\` shows "Showing 20 of 134" and a Load more button that emits
\`loadMore\` with the next page number.

- Slot \`[uiPaginationPageSize]\` for a page-size select.
- When Previous/Next becomes disabled on the first/last page, focus moves to the other button.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PaginationArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(canvas.getByText('Showing 1–20 of 134 people')).toBeVisible();
    const previous = canvas.getByRole('button', { name: 'Previous' });
    const next = canvas.getByRole('button', { name: 'Next' });
    await expect(previous).toBeDisabled();

    await userEvent.tab();
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.pageChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByText('Showing 21–40 of 134 people')).toBeVisible();
    await expect(previous).toBeEnabled();
  },
};

export const LastPage: Story = {
  name: 'Last page',
  args: { page: 6 },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('Showing 101–120 of 134 people')).toBeVisible();
    const next = canvas.getByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await expect(args.pageChange).toHaveBeenLastCalledWith(7);
    await expect(canvas.getByText('Showing 121–134 of 134 people')).toBeVisible();
    // Next is now disabled; focus moved to Previous instead of being lost.
    await expect(next).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Previous' })).toHaveFocus();
  },
};

export const LoadMore: Story = {
  name: 'Load more',
  args: { variant: 'load-more' },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('Showing 20 of 134 people')).toBeVisible();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(args.loadMore).toHaveBeenCalledWith(2);
  },
};

export const LoadingMore: Story = {
  name: 'Loading more',
  args: { variant: 'load-more', loading: true },
};

export const Empty: Story = {
  args: { total: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No people')).toBeVisible();
  },
};
