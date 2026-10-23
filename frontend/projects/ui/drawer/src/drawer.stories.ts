import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Button } from '../../button/src/public-api';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { DrawerLayout } from './drawer';
import { DrawerService } from './drawer.service';

const field = 'display: grid; gap: 0.375rem; font-weight: 600;';
const control =
  'font: inherit; font-weight: 400; padding: 0.625rem 0.75rem; border-radius: 10px; border: 1px solid;';

@Component({
  selector: 'ui-story-add-person',
  imports: [DrawerLayout, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-drawer
      heading="Add person"
      description="They get an email invitation to set up their EMS account."
    >
      <div style="display: grid; gap: 1rem;">
        <label [style]="field">First name <input id="first-name" [style]="control" /></label>
        <label [style]="field">Last name <input [style]="control" /></label>
        <label [style]="field"
          >Work email <input type="email" [style]="control" placeholder="name@akwaabalabs.example"
        /></label>
        <label [style]="field"
          >Office
          <select [style]="control">
            <option>Accra</option>
            <option>Kumasi</option>
            <option>Takoradi</option>
          </select>
        </label>
      </div>
      <button uiDrawerAction uiButton variant="secondary" type="button" (click)="ref.close()">
        Cancel
      </button>
      <button uiDrawerAction uiButton type="button" (click)="ref.close('added')">Add person</button>
    </ui-drawer>
  `,
})
class AddPersonDrawer {
  protected readonly ref = inject(DialogRef);
  protected readonly field = field;
  protected readonly control = control;
}

@Component({
  selector: 'ui-drawer-demo',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 1rem; justify-items: start;">
      <button uiButton type="button" (click)="open()">Add person</button>
      <p role="status" style="margin: 0;">{{ result() }}</p>
    </div>
  `,
})
class DrawerDemo {
  protected readonly result = signal('');
  private readonly drawers = inject(DrawerService);

  constructor() {
    this.drawers.closeAll();
    inject(DestroyRef).onDestroy(() => this.drawers.closeAll());
  }

  protected open(): void {
    this.drawers
      .open<string>(AddPersonDrawer, { autoFocus: '#first-name' })
      .closed.subscribe((r) => this.result.set(r === 'added' ? 'Invitation sent' : ''));
  }
}

const meta: Meta<DrawerDemo> = {
  title: 'Components/Drawer',
  component: DrawerDemo,
  parameters: {
    docs: {
      description: {
        component: `
\`DrawerService.open()\` opens a modal side sheet docked to the inline end (full screen below
640px) for create and edit forms. Same behaviour as a dialog (CDK Dialog): focus trapped, Escape
and scrim close, focus returns to the trigger. \`ui-drawer\` lays out heading, description, a
scrolling body and footer actions (\`uiDrawerAction\`) that stay visible.

- Start focus on the first field (\`autoFocus: '#first-name'\`) when the user came to type.
- Use \`disableClose\` plus your own guard when closing would lose unsaved input.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DrawerDemo>;

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

export const AddPerson: Story = {
  name: 'Add person form',
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Add person' });
    await userEvent.click(trigger);
    const drawer = await body().findByRole('dialog', { name: 'Add person' });
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    const first = within(drawer).getByRole('textbox', { name: 'First name' });
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.type(first, 'Ama');

    // Shift+Tab from the first field wraps inside the drawer (to the close button).
    await userEvent.tab({ shift: true });
    await expect(within(drawer).getByRole('button', { name: 'Close' })).toHaveFocus();

    press('Escape');
    await waitFor(() => expect(body().queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Submitted: Story = {
  name: 'Add person (submitted)',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add person' }));
    const drawer = await body().findByRole('dialog', { name: 'Add person' });
    await userEvent.click(within(drawer).getAllByRole('button', { name: 'Add person' }).at(-1)!);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Invitation sent'));
  },
};

export const Open: Story = {
  name: 'Open (for review)',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add person' }));
    await body().findByRole('dialog', { name: 'Add person' });
  },
};
