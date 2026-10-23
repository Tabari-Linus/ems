import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideRouter, RouterLink, RouterLinkActive, withHashLocation } from '@angular/router';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { TabLink, TabNav } from './tab-nav';
import { TabPanel, Tabs } from './tabs';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyRoute {}

const meta: Meta<Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  decorators: [moduleMetadata({ imports: [Tabs, TabPanel, TabNav, TabLink] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Two kinds of pill tabs:

- **Routed** \`nav[uiTabNav]\` + \`a[uiTab]\`: links, each its own URL. Current = \`aria-current="page"\`
  (\`routerLinkActive ariaCurrentWhenActive="page"\`). Use for settings sections and profile tabs with routes.
- **In-page** \`ui-tabs\` + \`ui-tab-panel\`: WAI-ARIA APG Tabs (automatic activation). Tab enters the
  selected tab then the panel; Left/Right arrows move and select (wrapping); Home/End jump.

The selected tab is the soft indigo tint (solid indigo is reserved for the primary action and the current nav item).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<Tabs>;

export const InPage: Story = {
  name: 'In-page tablist',
  render: () => ({
    template: `
      <ui-tabs label="Profile sections">
        <ui-tab-panel label="Overview"><p>Department, office and access level.</p></ui-tab-panel>
        <ui-tab-panel label="Job"><p>Position, level and reporting line.</p></ui-tab-panel>
        <ui-tab-panel label="Personal"><p>Contact details and emergency contacts.</p></ui-tab-panel>
        <ui-tab-panel label="Documents"><p>No documents yet.</p></ui-tab-panel>
      </ui-tabs>`,
  }),
  play: async ({ canvas, userEvent }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const job = canvas.getByRole('tab', { name: 'Job' });
    const documents = canvas.getByRole('tab', { name: 'Documents' });
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName('Overview');

    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(job).toHaveFocus();
    await expect(job).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('reporting line');

    await userEvent.keyboard('{End}');
    await expect(documents).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(documents).toHaveAttribute('aria-selected', 'true');

    // Tab leaves the tablist for the panel.
    await userEvent.tab();
    await expect(canvas.getByRole('tabpanel')).toHaveFocus();
  },
};

export const Routed: Story = {
  name: 'Routed (links)',
  render: () => ({
    template: `
      <nav uiTabNav aria-label="Profile sections">
        <a uiTab href="#overview" aria-current="page">Overview</a>
        <a uiTab href="#job">Job</a>
        <a uiTab href="#personal">Personal</a>
        <a uiTab href="#documents">Documents</a>
        <a uiTab href="#activity">Activity</a>
      </nav>`,
  }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Profile sections' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Job' })).toHaveFocus();
  },
};

export const RoutedWithRouter: Story = {
  name: 'Routed with routerLinkActive',
  decorators: [
    applicationConfig({
      providers: [provideRouter([{ path: '**', component: EmptyRoute }], withHashLocation())],
    }),
    moduleMetadata({ imports: [RouterLink, RouterLinkActive] }),
  ],
  render: () => ({
    template: `
      <nav uiTabNav aria-label="Settings sections">
        <a uiTab routerLink="/settings/companies" routerLinkActive ariaCurrentWhenActive="page">Companies</a>
        <a uiTab routerLink="/settings/offices" routerLinkActive ariaCurrentWhenActive="page">Offices</a>
        <a uiTab routerLink="/settings/departments" routerLinkActive ariaCurrentWhenActive="page">Departments</a>
      </nav>`,
  }),
  play: async ({ canvas, userEvent }) => {
    const offices = canvas.getByRole('link', { name: 'Offices' });
    await userEvent.click(offices);
    await waitFor(() => expect(offices).toHaveAttribute('aria-current', 'page'));
    await expect(canvas.getByRole('link', { name: 'Companies' })).not.toHaveAttribute(
      'aria-current',
    );
  },
};
