import { Card } from '@ems/ui/card';
import { PageHeader } from '@ems/ui/page-header';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { CHROME_IMPORTS, shell } from '../../patterns/chrome';
import { AppShell } from './app-shell';

const PLACEHOLDER = `
  <ui-page-header title="People" count="9 people" />
  <ui-card title="Page content">
    <p style="margin:0">Pages render inside the main landmark. Narrow the window below 900px for the drawer.</p>
  </ui-card>`;

const SHELL = shell('people', PLACEHOLDER);

const meta: Meta<AppShell> = {
  title: 'Layout/App shell',
  component: AppShell,
  decorators: [moduleMetadata({ imports: [...CHROME_IMPORTS, Card, PageHeader] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Application frame: light sidebar (\`[uiShellBrand]\`, \`[uiShellNav]\` inside \`<nav aria-label="Main">\`,
\`[uiShellFooter]\`), top bar \`<header>\` (\`[uiShellSearch]\`, \`[uiShellActions]\`, \`[uiShellUser]\`) and
\`<main id="main-content">\` for the page, bounded by \`--ems-layout-content-max-width\`.

- "Skip to content" is the first tab stop and moves focus to \`<main>\`.
- Desktop: the sidebar (\`--ems-layout-sidebar-width\`) collapses to icons (\`[(collapsed)]\`); mark text
  that should hide then with \`uiShellHideCollapsed\`.
- Below \`breakpoint.compact\` (900px): an off-canvas drawer (\`role="dialog"\`, \`aria-modal\`) opened by
  the menu button; the rest of the page is \`inert\`; Escape, the scrim or following a link closes it
  and focus returns to the menu button.
- Put \`<ui-toaster />\` after the shell so toasts come last in the tab order.
- Do: keep the nav to the five main destinations. Don't: put the page's primary action in the top bar.

The composed pages live under **Patterns** (Home, People directory).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AppShell>;

export const Default: Story = {
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(canvas.getByRole('banner')).toBeVisible();
    await expect(canvas.getByRole('main')).toBeVisible();

    // Skip link: first tab stop; Enter moves focus to <main>.
    await userEvent.tab();
    const skip = canvas.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};

export const Collapsed: Story = {
  name: 'Collapsed sidebar',
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Collapse sidebar' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    const expand = await canvas.findByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect(expand).toHaveFocus();
    // Labels are hidden visually but still name the links.
    await expect(canvas.getByRole('link', { name: /^Requests\s*, 2 open$/ })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'People' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const MobileDrawer: Story = {
  name: 'Mobile drawer',
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => ({ template: SHELL }),
  play: async ({ canvas, userEvent }) => {
    const menu = await canvas.findByRole('button', { name: 'Open navigation' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    // Closed drawer: its links are inert, so not exposed.
    await expect(canvas.queryByRole('link', { name: 'Home' })).toBeNull();

    menu.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await canvas.findByRole('dialog', { name: 'Main' });
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    await expect(menu).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};
