import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideRouter, RouterLink, RouterLinkActive, withHashLocation } from '@angular/router';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { Icon } from '@ems/icons';
import { NavItem } from './nav-item';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyRoute {}

const ICON_HOME = '<ui-icon uiNavIcon name="home" />';
const ICON_PEOPLE = '<ui-icon uiNavIcon name="users" />';
const ICON_REQUESTS = '<ui-icon uiNavIcon name="inbox" />';
const ICON_PROFILE = '<ui-icon uiNavIcon name="user" />';

const meta: Meta<NavItem> = {
  title: 'Navigation/Nav item',
  component: NavItem,
  decorators: [moduleMetadata({ imports: [NavItem, Icon] })],
  parameters: {
    docs: {
      description: {
        component: `
\`a[uiNavItem]\` — a sidebar link. The current page is \`aria-current="page"\`, which also draws the
solid indigo pill (the only solid indigo in the sidebar). With the router:
\`routerLinkActive ariaCurrentWhenActive="page"\`.

- \`badge\` adds a count pill; the link's accessible name becomes "Requests, 2 pending" (\`badgeLabel\`).
- Icons go first with the \`uiNavIcon\` attribute and are decorative.
- Do: keep labels to one or two words. Don't: put buttons inside a nav item.
`,
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <nav aria-label="Main" style="display:grid;gap:4px;inline-size:232px">
        <a uiNavItem href="#home">${ICON_HOME} Home</a>
        <a uiNavItem href="#people" aria-current="page">${ICON_PEOPLE} People</a>
        <a uiNavItem href="#requests" [badge]="2">${ICON_REQUESTS} Requests</a>
        <a uiNavItem href="#profile">${ICON_PROFILE} My profile</a>
      </nav>`,
  }),
};

export default meta;
type Story = StoryObj<NavItem>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const current = canvas.getByRole('link', { name: 'People' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: /^Requests\s*, 2 pending$/ })).toBeVisible();

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    await expect(current).toHaveFocus();
  },
};

export const WithBadge: Story = {
  name: 'Badge (99+)',
  render: () => ({
    template: `
      <nav aria-label="Main" style="display:grid;gap:4px;inline-size:232px">
        <a uiNavItem href="#requests" aria-current="page" [badge]="140" badgeLabel="waiting">${ICON_REQUESTS} Requests</a>
        <a uiNavItem href="#none" [badge]="0">${ICON_PEOPLE} No badge at zero</a>
      </nav>`,
  }),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /^Requests\s*, 140 waiting$/ });
    await expect(link).toHaveTextContent('99+');
    await expect(canvas.getByRole('link', { name: 'No badge at zero' })).not.toHaveAttribute(
      'data-has-badge',
    );
  },
};

export const WithRouter: Story = {
  name: 'With routerLinkActive',
  decorators: [
    applicationConfig({
      providers: [provideRouter([{ path: '**', component: EmptyRoute }], withHashLocation())],
    }),
    moduleMetadata({ imports: [RouterLink, RouterLinkActive] }),
  ],
  render: () => ({
    template: `
      <nav aria-label="Main" style="display:grid;gap:4px;inline-size:232px">
        <a uiNavItem routerLink="/home" routerLinkActive ariaCurrentWhenActive="page">${ICON_HOME} Home</a>
        <a uiNavItem routerLink="/people" routerLinkActive ariaCurrentWhenActive="page">${ICON_PEOPLE} People</a>
      </nav>`,
  }),
  play: async ({ canvas, userEvent }) => {
    const people = canvas.getByRole('link', { name: 'People' });
    await userEvent.tab();
    await userEvent.tab();
    await expect(people).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(people).toHaveAttribute('aria-current', 'page'));
    await expect(canvas.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  },
};
