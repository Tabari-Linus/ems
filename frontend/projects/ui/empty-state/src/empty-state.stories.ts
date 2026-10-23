import { Icon } from '../../../icons/src/public-api';
import { Button } from '../../button/src/public-api';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { EmptyState } from './empty-state';

interface EmptyStateArgs {
  heading: string;
  description: string;
  onAction: () => void;
}

const meta: Meta<EmptyStateArgs> = {
  title: 'Components/Empty state',
  component: EmptyState,
  decorators: [moduleMetadata({ imports: [EmptyState, Icon, Button] })],
  args: {
    heading: 'No people in Kumasi yet',
    description:
      'People you add to the Kumasi office appear here. Add the first one to get started.',
    onAction: fn(),
  },
  argTypes: { onAction: { action: 'action', table: { disable: true } } },
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state [heading]="heading" [description]="description">
        <ui-icon uiEmptyStateIcon name="users" [size]="24" />
        <button uiEmptyStateActions uiButton type="button" (click)="onAction()">
          <ui-icon name="plus" [size]="16" /> Add person
        </button>
      </ui-empty-state>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
For a list or section with nothing in it yet. Say what is empty, why, and offer the next step
(one primary action). The icon slot is decorative.

- Slots: \`[uiEmptyStateIcon]\`, \`[uiEmptyStateActions]\`; anything else goes under the description.
- \`headingLevel\` (2–4) keeps the page outline correct.
- Do: "No requests to review. New password reset requests appear here." Don't: "No data".
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateArgs>;

export const WithAction: Story = {
  name: 'With primary action',
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'No people in Kumasi yet' }),
    ).toBeVisible();
    const action = canvas.getByRole('button', { name: 'Add person' });
    await userEvent.tab();
    await expect(action).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};

export const NoAction: Story = {
  name: 'Without action',
  render: () => ({
    template: `
      <ui-empty-state heading="No requests to review"
        description="You're all caught up. New password reset requests will appear here.">
        <ui-icon uiEmptyStateIcon name="circle-check" [size]="24" />
      </ui-empty-state>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const SearchNoResults: Story = {
  name: 'No search results',
  render: () => ({
    template: `
      <ui-empty-state heading="No one matches “Kwabena”" headingLevel="3"
        description="Check the spelling, or clear the Office and Status filters to search everyone.">
        <ui-icon uiEmptyStateIcon name="search" [size]="24" />
        <button uiEmptyStateActions uiButton variant="secondary" type="button">Clear filters</button>
      </ui-empty-state>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3 })).toBeVisible();
  },
};
