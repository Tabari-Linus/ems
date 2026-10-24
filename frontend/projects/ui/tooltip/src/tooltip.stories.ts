import { Icon } from '@ems/icons';
import { Button } from '@ems/ui/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Tooltip, type TooltipPosition } from './tooltip';

interface TooltipArgs {
  text: string;
  position: TooltipPosition;
}

const meta: Meta<TooltipArgs> = {
  title: 'Overlays/Tooltip',
  decorators: [moduleMetadata({ imports: [Tooltip, Button, Icon] })],
  args: { text: 'Copy GH-ACC-0042', position: 'above' },
  argTypes: { position: { control: 'inline-radio', options: ['above', 'below', 'start', 'end'] } },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 3rem 6rem;">
        <button uiButton variant="ghost" type="button" aria-label="Copy employee number"
          [uiTooltip]="text" [uiTooltipPosition]="position">
          <ui-icon name="copy" />
        </button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component: `
\`[uiTooltip]\` adds a short hint to an element that already has an accessible name (an icon
button with \`aria-label\`). The text is linked with \`aria-describedby\` (CDK AriaDescriber), so it
is announced whether or not the bubble shows. The bubble itself is \`role="tooltip"\`, \`aria-hidden\`.

- Shows on hover after \`uiTooltipShowDelay\` (400 ms) and at once on keyboard focus.
- WCAG 1.4.13: Escape dismisses it; the pointer can move onto it; it stays until hover/focus leaves.
- Don't put essential information, links or buttons in a tooltip; don't use one on disabled controls.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

const body = () => within(document.body);

export const OnFocus: Story = {
  name: 'Keyboard focus and Escape',
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Copy employee number' });
    await expect(button).toHaveAccessibleDescription('Copy GH-ACC-0042');
    await userEvent.tab();
    await expect(button).toHaveFocus();
    const tip = await body().findByText('Copy GH-ACC-0042', { selector: 'ui-tooltip-panel' });
    // The bubble fades in; wait for the end of the (short) animation.
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('ui-tooltip-panel')).toBeNull());
    await expect(button).toHaveFocus();
  },
};

export const OnHover: Story = {
  name: 'Hover',
  args: { position: 'below', text: 'Open in a new tab' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Copy employee number' }));
    await body().findByText('Open in a new tab', { selector: 'ui-tooltip-panel' });
  },
};

export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display: flex; gap: 1rem; padding: 3rem 6rem;">
        <button uiButton variant="secondary" size="sm" type="button" uiTooltip="Shown above">Above</button>
        <button uiButton variant="secondary" size="sm" type="button" uiTooltip="Shown below" uiTooltipPosition="below">Below</button>
        <button uiButton variant="secondary" size="sm" type="button" uiTooltip="Shown before" uiTooltipPosition="start">Start</button>
        <button uiButton variant="secondary" size="sm" type="button" uiTooltip="Shown after" uiTooltipPosition="end">End</button>
      </div>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Above' })).toHaveAccessibleDescription(
      'Shown above',
    );
    await body().findByText('Shown above', { selector: 'ui-tooltip-panel' });
    await userEvent.tab();
    await body().findByText('Shown below', { selector: 'ui-tooltip-panel' });
    await expect(body().queryByText('Shown above', { selector: 'ui-tooltip-panel' })).toBeNull();
  },
};
