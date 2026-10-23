import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Button } from '../../button/src/public-api';
import { PageHeader } from './page-header';

interface PageHeaderArgs {
  title: string;
  count: string | null;
  description: string | null;
}

const meta: Meta<PageHeaderArgs> = {
  title: 'Layout/Page header',
  component: PageHeader,
  decorators: [moduleMetadata({ imports: [PageHeader, Button] })],
  args: { title: 'People', count: '9 people', description: null },
  render: (args) => ({
    props: args,
    template: `
      <ui-page-header [title]="title" [count]="count" [description]="description">
        <button uiPageHeaderActions uiButton type="button">Add person</button>
      </ui-page-header>`,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Page title (an \`<h1>\` in type role *title*), an optional count with its noun, a description and
page actions. Breadcrumbs go in \`[uiPageHeaderBreadcrumbs]\` (provide your own
\`<nav aria-label="Breadcrumb">\`).

- Do: one primary action; counts are real data ("9 people"). Don't: add an eyebrow that repeats the title.
- \`level="2"\` renders an \`<h2>\` when the header sits inside a page section.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PageHeaderArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await expect(canvas.getByText('9 people')).toBeVisible();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Add person' })).toHaveFocus();
  },
};

export const WithDescription: Story = {
  name: 'With description',
  args: {
    title: 'Access levels',
    count: '4 levels',
    description:
      'Decide what each group of people can see and change. Changes apply at next sign-in.',
  },
};

export const WithBreadcrumbs: Story = {
  name: 'With breadcrumbs',
  args: { title: 'Kwame Asante', count: null },
  render: (args) => ({
    props: args,
    template: `
      <ui-page-header [title]="title">
        <nav uiPageHeaderBreadcrumbs aria-label="Breadcrumb">
          <a href="#people">People</a> <span aria-hidden="true">/</span>
          <span aria-current="page">Kwame Asante</span>
        </nav>
        <button uiPageHeaderActions uiButton variant="secondary" type="button">Edit profile</button>
      </ui-page-header>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Kwame Asante');
  },
};

export const TitleOnly: Story = {
  name: 'Title only',
  args: { title: 'Settings', count: null },
  render: (args) => ({ props: args, template: `<ui-page-header [title]="title" />` }),
};
