import { Button } from '@ems/ui/button';
import {
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Alert, type AlertTone } from './alert';

interface AlertArgs {
  tone: AlertTone;
  heading: string;
  body: string;
  dismissible: boolean;
  onDismiss: () => void;
}

const meta: Meta<AlertArgs> = {
  title: 'Feedback/Alert',
  component: Alert,
  decorators: [
    moduleMetadata({ imports: [Alert, Button] }),
    componentWrapperDecorator(
      (story) => `<div style="inline-size: min(34rem, 90vw);">${story}</div>`,
    ),
  ],
  args: {
    tone: 'info',
    heading: 'Profiles now show emergency contacts',
    body: 'Ask your team to add one from My profile. Only HR admins can see them.',
    dismissible: false,
    onDismiss: fn(),
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
    onDismiss: { action: 'dismissed', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-alert [tone]="tone" [heading]="heading" [dismissible]="dismissible" (dismissed)="onDismiss()">
        {{ body }}
      </ui-alert>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Inline notice in the page flow. Icon + optional heading (with meta such as "2h ago") + body +
actions slot (\`[uiAlertAction]\`) + optional dismiss.

- **Announcement** (\`live\`, default \`auto\`): \`danger\`/\`warning\` are \`role="alert"\` (interrupt),
  \`neutral\`/\`info\`/\`success\` are \`role="status"\` (polite). Use \`live="off"\` for notices that are
  already on the page when it loads (a pending request), so they are not announced as news.
- **Dismiss** hides the alert and emits \`dismissed\`; the button is named "Dismiss" (\`dismissLabel\`).
- Errors say what went wrong and how to fix it. Don't stack several alerts; one per section.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AlertArgs>;

export const Info: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Profiles now show emergency contacts',
    );
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    heading: 'Kwame Asante was added',
    body: 'We sent an invitation to kwame.asante@akwaabalabs.example. It expires in 7 days.',
  },
};

export const Warning: Story = {
  args: {
    tone: 'warning',
    heading: 'Profile incomplete',
    body: "Kofi Owusu's profile has no department yet, so he won't appear in team lists. Add a department to finish setup.",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-tone', 'warning');
  },
};

export const Danger: Story = {
  args: {
    tone: 'danger',
    heading: "Couldn't save changes",
    body: 'Phone number must start with + and a country code, for example +233 24 123 4567. Fix it and save again.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent("Couldn't save changes");
  },
};

export const Dismissible: Story = {
  args: { dismissible: true },
  play: async ({ canvas, userEvent, args }) => {
    const dismiss = canvas.getByRole('button', { name: 'Dismiss' });
    await userEvent.tab();
    await expect(dismiss).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

export const PendingRequest: Story = {
  name: 'Password reset request (with actions)',
  parameters: { controls: { disable: true } },
  render: (args) => ({
    props: { ...args, decline: fn(), approve: fn() },
    template: `
      <ui-alert tone="neutral" heading="Password reset requested" meta="2h ago" live="off">
        Approving sends Kwame a link to set a new password.
        <button uiAlertAction uiButton variant="secondary" size="sm" type="button" (click)="decline()">Decline</button>
        <button uiAlertAction uiButton size="sm" type="button" (click)="approve()">Approve</button>
      </ui-alert>
    `,
  }),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Already on the page when it loads: not a live region.
    await expect(canvasElement.querySelector('ui-alert')).not.toHaveAttribute('role');
    await expect(canvas.getByText('Password reset requested')).toBeVisible();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Decline' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Approve' })).toHaveFocus();
  },
};
