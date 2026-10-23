import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { Button } from '../../button/src/public-api';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { DialogLayout } from './dialog';
import { DialogService } from './dialog.service';

@Component({
  selector: 'ui-story-edit-office',
  imports: [DialogLayout, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-dialog
      heading="Edit office"
      description="The new name shows on every profile in this office."
    >
      <label style="display: grid; gap: 0.5rem; font-weight: 600;">
        Office name
        <input
          value="Accra"
          style="font: inherit; padding: 0.625rem 0.75rem; border-radius: 10px; border: 1px solid; font-weight: 400;"
        />
      </label>
      <button uiDialogAction uiButton variant="secondary" type="button" (click)="ref.close()">
        Cancel
      </button>
      <button uiDialogAction uiButton type="button" (click)="ref.close('saved')">
        Save changes
      </button>
    </ui-dialog>
  `,
})
class EditOfficeDialog {
  protected readonly ref = inject(DialogRef);
}

/** Story harness: a trigger and the last result. */
@Component({
  selector: 'ui-dialog-demo',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 1rem; justify-items: start;">
      @if (mode() === 'confirm') {
        <button uiButton variant="danger" type="button" (click)="archive()">Archive person</button>
      } @else {
        <button uiButton variant="secondary" type="button" (click)="edit()">Edit office</button>
      }
      <p role="status" style="margin: 0;">{{ result() }}</p>
    </div>
  `,
})
class DialogDemo {
  readonly mode = input<'form' | 'confirm'>('form');
  protected readonly result = signal('');
  private readonly dialogs = inject(DialogService);

  constructor() {
    // Stories render one after another in the same page: never leak an open dialog.
    this.dialogs.closeAll();
    inject(DestroyRef).onDestroy(() => this.dialogs.closeAll());
  }

  protected edit(): void {
    this.dialogs
      .open<string>(EditOfficeDialog)
      .closed.subscribe((r) => this.result.set(r === 'saved' ? 'Office saved' : 'No changes'));
  }

  protected async archive(): Promise<void> {
    const archived = await this.dialogs.confirm({
      heading: 'Archive Kwame Asante?',
      description:
        'Kwame loses access to EMS right away. You can restore the profile from Archived people.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    this.result.set(archived ? 'Kwame Asante was archived' : 'Kept Kwame Asante');
  }
}

const meta: Meta<DialogDemo> = {
  title: 'Components/Dialog',
  component: DialogDemo,
  args: { mode: 'form' },
  parameters: {
    docs: {
      description: {
        component: `
\`DialogService.open(component | template, options)\` opens a modal on the Angular CDK Dialog
(WAI-ARIA APG *Dialog (modal)*). \`ui-dialog\` lays out the content: heading, description, body,
footer actions (\`uiDialogAction\` on each button).

- **Focus**: trapped inside; starts on the heading (so the title is read first; \`autoFocus\` to
  change); returns to the trigger on close.
- **Close**: Escape, the × button, or a click on the scrim (\`bg-overlay\`). \`disableClose\` for
  unsaved forms that need a guard. The page behind is \`aria-hidden\` and the dialog \`aria-modal\`.
- **confirm()** opens an \`alertdialog\` and resolves \`true\` only on the confirm button. Focus
  starts on Cancel. Name the thing in the question: "Archive Kwame Asante?", and the verb on the
  button: "Archive".
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DialogDemo>;

const body = () => within(document.body);

/**
 * Angular CDK reads KeyboardEvent.keyCode, which the play-function userEvent.keyboard() leaves at 0
 * (real keyboards set it; checked with Playwright). Dispatch CDK-handled keys with their key code.
 */
const KEY_CODES = { Escape: 27, ArrowDown: 40, ArrowUp: 38, Home: 36, End: 35 } as const;
const press = (key: keyof typeof KEY_CODES) =>
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key,
    code: key,
    keyCode: KEY_CODES[key],
  });

export const FormDialog: Story = {
  name: 'Dialog with form',
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Edit office' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    const dialog = await body().findByRole('dialog', { name: 'Edit office' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription(
      'The new name shows on every profile in this office.',
    );
    await waitFor(() => expect(within(dialog).getByRole('heading')).toHaveFocus());

    // Tab order: close, field, Cancel, Save changes, then wraps back to close.
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(dialog).getByRole('textbox', { name: 'Office name' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Save changes' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();

    // Escape closes and focus returns to the trigger.
    press('Escape');
    await waitFor(() => expect(body().queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('No changes'));
  },
};

export const FormDialogSaved: Story = {
  name: 'Dialog with form (saved)',
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Edit office' });
    await userEvent.click(trigger);
    const dialog = await body().findByRole('dialog', { name: 'Edit office' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Office saved'));
  },
};

export const OpenDialog: Story = {
  name: 'Open (for review)',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit office' }));
    await body().findByRole('dialog', { name: 'Edit office' });
  },
};

export const ConfirmDestructive: Story = {
  name: 'Confirm (destructive)',
  args: { mode: 'confirm' },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Archive person' });
    await userEvent.click(trigger);
    const dialog = await body().findByRole('alertdialog', { name: 'Archive Kwame Asante?' });
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(cancel).toHaveFocus());
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();

    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent('Kwame Asante was archived'),
    );
  },
};

export const ConfirmOpen: Story = {
  name: 'Confirm (open, for review)',
  args: { mode: 'confirm' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Archive person' }));
    await body().findByRole('alertdialog', { name: 'Archive Kwame Asante?' });
  },
};
