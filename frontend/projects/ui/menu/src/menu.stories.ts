import { Icon } from '../../../icons/src/public-api';
import { Button } from '../../button/src/public-api';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from './menu';

interface MenuArgs {
  onPick: (action: string) => void;
}

const meta: Meta<MenuArgs> = {
  title: 'Components/Menu',
  decorators: [
    moduleMetadata({ imports: [Menu, MenuItem, MenuSeparator, MenuTrigger, Button, Icon] }),
  ],
  args: { onPick: fn() },
  argTypes: { onPick: { action: 'pick', table: { disable: true } } },
  render: (args) => ({
    props: args,
    template: `
      <button uiButton variant="secondary" type="button" [uiMenuTrigger]="actions">
        More actions <ui-icon name="chevron-down" [size]="16" />
      </button>
      <ng-template #actions>
        <ui-menu>
          <button uiMenuItem (triggered)="onPick('edit')">
            <ui-icon uiMenuItemIcon name="pencil" [size]="16" /> Edit profile
          </button>
          <button uiMenuItem (triggered)="onPick('email')">
            <ui-icon uiMenuItemIcon name="mail" [size]="16" /> Send invitation again
          </button>
          <button uiMenuItem disabled>
            <ui-icon uiMenuItemIcon name="eye-off" [size]="16" /> Deactivate (already inactive)
          </button>
          <ui-menu-separator />
          <button uiMenuItem variant="danger" (triggered)="onPick('archive')">
            <ui-icon uiMenuItemIcon name="trash" [size]="16" /> Archive Kwame Asante
          </button>
        </ui-menu>
      </ng-template>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Actions menu on Angular CDK Menu (WAI-ARIA APG *Menu Button*). \`[uiMenuTrigger]\` on a button,
\`ui-menu\` in an \`ng-template\`, \`button[uiMenuItem]\` items, \`ui-menu-separator\` between groups.

- Keyboard: Enter/Space/ArrowDown open on the first item, ArrowUp on the last; arrows move
  (wrapping), Home/End jump, letters type-ahead; Escape closes and returns focus to the trigger;
  Tab closes and moves on.
- \`variant="danger"\` for destructive items: last, after a separator, and confirmed in a dialog.
- Disabled items stay focusable (\`aria-disabled\`) so people can discover them; say why in the label.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<MenuArgs>;

const body = () => within(document.body);

/**
 * Angular CDK reads KeyboardEvent.keyCode, which the play-function userEvent.keyboard() leaves at 0
 * (real keyboards set it; checked with Playwright). Dispatch CDK-handled keys with their key code.
 */
const KEY_CODES = { Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38, Home: 36, End: 35 } as const;
const press = (key: keyof typeof KEY_CODES) =>
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key,
    code: key,
    keyCode: KEY_CODES[key],
  });

export const KeyboardNavigation: Story = {
  name: 'Profile actions (keyboard)',
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole('button', { name: 'More actions' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    press('ArrowDown');

    const menu = await body().findByRole('menu');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    const items = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());
    press('ArrowDown');
    await expect(items[1]).toHaveFocus();
    press('End');
    await expect(items[3]).toHaveFocus();
    press('ArrowDown');
    await expect(items[0]).toHaveFocus();

    // Escape closes and returns focus to the trigger.
    press('Escape');
    await waitFor(() => expect(body().queryByRole('menu')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());

    // Enter opens; Enter on an item runs it and closes the menu.
    press('Enter');
    const reopened = await body().findByRole('menu');
    await waitFor(() => expect(within(reopened).getAllByRole('menuitem')[0]).toHaveFocus());
    press('Enter');
    await expect(args.onPick).toHaveBeenCalledWith('edit');
    await waitFor(() => expect(body().queryByRole('menu')).toBeNull());
  },
};

export const Open: Story = {
  name: 'Open (for review)',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    const menu = await body().findByRole('menu');
    await expect(within(menu).getByRole('separator')).toBeInTheDocument();
    await expect(within(menu).getByRole('menuitem', { name: /Deactivate/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

export const DangerItem: Story = {
  name: 'Danger item',
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    const menu = await body().findByRole('menu');
    const archive = within(menu).getByRole('menuitem', { name: 'Archive Kwame Asante' });
    await expect(archive).toHaveAttribute('data-variant', 'danger');
    await userEvent.click(archive);
    await expect(args.onPick).toHaveBeenCalledWith('archive');
  },
};
