import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Button } from '../../button/src/public-api';
import { Card } from './card';

interface CardArgs {
  title: string | null;
  count: number | null;
  flush: boolean;
}

const meta: Meta<CardArgs> = {
  title: 'Layout/Card',
  component: Card,
  decorators: [moduleMetadata({ imports: [Card, Button] })],
  args: { title: 'Needs your attention', count: 2, flush: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size:min(560px, 100%)">
        <ui-card [title]="title" [count]="count" [flush]="flush">
          <a uiCardActions href="#requests" style="font-weight:600">All requests</a>
          <p style="margin:0">Password reset for <b>Kwame Asante</b>. Requested today, 08:12.</p>
        </ui-card>
      </div>`,
  }),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Section card: surface, soft shadow (\`--ems-elevation-card\`), 14px radius (\`radius="lg"\` for 12px).
With a \`title\` it is a \`<section>\` named by its heading (\`level\` 2–4).

Slots: \`[uiCardActions]\` (header, right), default body, \`[uiCardFooter]\`. \`flush\` removes body
padding for tables and edge-to-edge lists.

- Do: separate cards with space, not borders. Don't: nest cards inside cards.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CardArgs>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const region = canvas.getByRole('region', { name: /Needs your attention/ });
    await expect(region).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('2');
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'All requests' })).toHaveFocus();
  },
};

export const WithFooter: Story = {
  name: 'With footer',
  args: { title: 'Job', count: null },
  render: (args) => ({
    props: args,
    template: `
      <div style="inline-size:min(560px, 100%)">
        <ui-card [title]="title">
          <button uiCardActions uiButton variant="ghost" size="sm" type="button">Edit</button>
          <p style="margin:0">Senior Backend Engineer, Platform Engineering.</p>
          <div uiCardFooter>
            <button uiButton variant="secondary" size="sm" type="button">Cancel</button>
            <button uiButton size="sm" type="button">Save changes</button>
          </div>
        </ui-card>
      </div>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Save changes' })).toBeVisible();
  },
};

export const Flush: Story = {
  name: 'Flush (for tables)',
  args: { title: 'Your team', count: 4, flush: true },
  render: (args) => ({
    template: `
      <div style="inline-size:min(560px, 100%)">
        <ui-card [title]="title" [count]="count" flush>
          <ul style="list-style:none;margin:0;padding:0">
            @for (name of names; track name) {
              <li style="padding:12px 20px;border-block-start:1px solid var(--ems-color-border-subtle)">{{ name }}</li>
            }
          </ul>
        </ui-card>
      </div>`,
    props: { ...args, names: ['Kwame Asante', 'Efua Boateng', 'Akosua Frimpong', 'Esi Quaye'] },
  }),
};

export const Untitled: Story = {
  args: { title: null, count: null },
  render: () => ({
    template: `
      <div style="inline-size:min(360px, 100%)">
        <ui-card><p style="margin:0">Two things need you today. The rest of your team is set.</p></ui-card>
      </div>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region')).toBeNull();
    await expect(canvas.queryByRole('heading')).toBeNull();
  },
};
