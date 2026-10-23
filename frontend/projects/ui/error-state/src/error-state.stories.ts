import { Button } from '@ems/ui/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { ErrorState, type ErrorStateKind } from './error-state';

interface ErrorStateArgs {
  kind: ErrorStateKind;
  onAction: () => void;
}

const meta: Meta<ErrorStateArgs> = {
  title: 'Feedback/Error state',
  component: ErrorState,
  decorators: [moduleMetadata({ imports: [ErrorState, Button] })],
  args: { kind: 'server', onAction: fn() },
  argTypes: {
    kind: { control: 'inline-radio', options: ['forbidden', 'not-found', 'server', 'network'] },
    onAction: { action: 'action', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `<ui-error-state [kind]="kind" (action)="onAction()" />`,
  }),
  parameters: {
    docs: {
      description: {
        component: `
A page or section that failed: 403 (forbidden), 404 (not found), 500 (server) or network. Each kind
has default copy that says what went wrong and how to recover, and one recovery button (\`action\`
output). Override \`heading\`, \`description\`, \`actionLabel\` for a specific case.

- The heading has \`tabindex="-1"\`: call \`focus()\` when the error replaces content, so keyboard
  and screen-reader users land on it. Use \`headingLevel="1"\` for a full page (the 404 route).
- Extra actions (a "Contact HR" link) go in \`[uiErrorStateActions]\`.
- Don't show raw error messages or stack traces.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ErrorStateArgs>;

export const Server: Story = {
  name: '500 server error',
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Something went wrong on our side' }),
    ).toBeVisible();
    await expect(canvas.getByText('Error 500')).toBeVisible();
    await userEvent.tab();
    const retry = canvas.getByRole('button', { name: 'Try again' });
    await expect(retry).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};

export const Forbidden: Story = {
  name: '403 no access',
  args: { kind: 'forbidden' },
  render: (args) => ({
    props: args,
    template: `
      <ui-error-state [kind]="kind" headingLevel="1" (action)="onAction()">
        <a uiErrorStateActions uiButton variant="ghost" href="#request-access">Request access</a>
      </ui-error-state>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      "You don't have access to this page",
    );
    await expect(canvas.getByRole('link', { name: 'Request access' })).toBeVisible();
  },
};

export const NotFound: Story = { name: '404 not found', args: { kind: 'not-found' } };

export const Network: Story = {
  name: 'Offline',
  args: { kind: 'network' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/^Error/)).toBeNull();
  },
};

export const FocusOnRender: Story = {
  name: 'Focus moves to the heading',
  render: (args) => ({
    props: args,
    template: `
      <ui-error-state #err kind="not-found" heading="This person no longer exists"
        description="Kwame Asante's profile was removed. Search People to find someone else."
        actionLabel="Search People" (action)="onAction()" />
      <button uiButton variant="secondary" type="button" (click)="err.focus()">Show error</button>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show error' }));
    await expect(
      canvas.getByRole('heading', { name: 'This person no longer exists' }),
    ).toHaveFocus();
    // Tab continues into the error state's own action.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Search People' })).toHaveFocus();
  },
};
