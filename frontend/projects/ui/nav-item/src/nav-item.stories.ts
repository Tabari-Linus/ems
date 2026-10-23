import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideRouter, RouterLink, RouterLinkActive, withHashLocation } from '@angular/router';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { NavItem } from './nav-item';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyRoute {}

const ICON_HOME = `<svg uiNavIcon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`;
const ICON_PEOPLE = `<svg uiNavIcon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>`;
const ICON_REQUESTS = `<svg uiNavIcon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
const ICON_PROFILE = `<svg uiNavIcon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`;

const meta: Meta<NavItem> = {
  title: 'Layout/Nav item',
  component: NavItem,
  decorators: [moduleMetadata({ imports: [NavItem] })],
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
