import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Button } from '../../button/src/public-api';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ToastService, type ToastTone } from './toast.service';
import { Toaster } from './toaster';

/** Story harness: buttons that raise toasts, plus the one toaster an app shell would have. */
@Component({
  selector: 'ui-toast-demo',
  imports: [Button, Toaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button uiButton type="button" (click)="raise()">Show toast</button>
      <button uiButton variant="secondary" type="button" (click)="toasts.dismissAll()">
        Clear all
      </button>
    </div>
    <ui-toaster />
  `,
})
class ToastDemo {
  readonly tone = input<ToastTone>('success');
  readonly message = input('Kwame Asante was added');
  readonly actionLabel = input<string>();
  readonly duration = input<number>();
  protected readonly toasts = inject(ToastService);

  constructor() {
    this.toasts.dismissAll();
  }

  protected raise(): void {
    const label = this.actionLabel();
    this.toasts.show({
      message: this.message(),
      tone: this.tone(),
      duration: this.duration(),
      action: label
        ? { label, run: () => this.toasts.success('Kofi Owusu was restored') }
        : undefined,
    });
  }
}

const meta: Meta<ToastDemo> = {
  title: 'Components/Toast',
  component: ToastDemo,
  args: { tone: 'success', message: 'Kwame Asante was added', duration: 0 },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
\`ToastService\` shows short confirmations; one \`<ui-toaster />\` at the end of the app shell renders them.

- The toaster is a region named "Notifications" with a **polite live region**: new toasts are
  announced without moving focus.
- Auto-dismiss (6 s; 10 s with an action). Timers **pause** while the pointer is over the toasts
  or focus is inside them. Errors (\`danger\`) stay until dismissed. Escape closes the focused toast.
- At most 3 on screen; more wait in a queue. Entry animation is removed under reduced motion.
- Do: "Kofi Owusu was archived · Undo". Don't: put the only path to an action in a toast, or use a
  toast for errors that block the user (use an inline alert next to the problem).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ToastDemo>;

export const Success: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    const region = within(canvasElement).getByRole('region', { name: 'Notifications' });
    await expect(region.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'Kwame Asante was added',
    );
  },
};

export const WithAction: Story = {
  name: 'With undo action',
  args: { tone: 'neutral', message: 'Kofi Owusu was archived', actionLabel: 'Undo' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    // Keyboard path: Tab from the trigger reaches the toast's action, then its close button.
    await userEvent.tab();
    await userEvent.tab();
    const undo = canvas.getByRole('button', { name: 'Undo' });
    await expect(undo).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByText('Kofi Owusu was restored')).toBeVisible());
    await expect(canvas.queryByText('Kofi Owusu was archived')).toBeNull();
  },
};

export const ErrorToast: Story = {
  name: 'Error (stays until dismissed)',
  args: {
    tone: 'danger',
    message: "Couldn't archive Esi Quaye. Check your connection and try again.",
    duration: undefined,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    const close = canvas.getByRole('button', { name: 'Dismiss notification' });
    close.focus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByText(/Couldn't archive/)).toBeNull();
  },
};

export const Stacked: Story = {
  name: 'Stacking (max 3)',
  args: { tone: 'info', message: 'Leave policy updated' },
  play: async ({ canvas, userEvent }) => {
    const show = canvas.getByRole('button', { name: 'Show toast' });
    for (let i = 0; i < 4; i++) await userEvent.click(show);
    await expect(canvas.getAllByText('Leave policy updated')).toHaveLength(3);
  },
};
