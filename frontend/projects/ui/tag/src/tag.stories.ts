import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { Tag, type TagVariant } from './tag';

interface TagArgs {
  label: string;
  variant: TagVariant;
  removable: boolean;
  onRemove: () => void;
}

const meta: Meta<TagArgs> = {
  title: 'Components/Tag',
  component: Tag,
  decorators: [moduleMetadata({ imports: [Tag] })],
  args: { label: 'Accra', variant: 'neutral', removable: false, onRemove: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'accent'] },
    onRemove: { action: 'remove', table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `<ui-tag [label]="label" [variant]="variant" [removable]="removable" (remove)="onRemove()" />`,
  }),
  parameters: {
    docs: {
      description: {
        component: `
A small pill for short metadata: skills, offices, contact channels. Not interactive by itself.

- \`removable\` adds a native \`<button>\` named **"Remove {label}"** (Tab to it, Enter/Space to remove).
  After removing, move focus somewhere sensible (the next tag or the input that adds tags).
- Do: use for metadata. Don't: use for status (use a status pill) or for filters (use a filter pill).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<TagArgs>;

export const Neutral: Story = {};

export const Accent: Story = { args: { variant: 'accent', label: 'Team lead' } };

export const Removable: Story = {
  args: { removable: true, label: 'Angular' },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Remove Angular' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onRemove).toHaveBeenCalledTimes(2);
  },
};

export const SkillList: Story = {
  name: 'Editable skill list',
  parameters: { controls: { disable: true } },
  render: () => {
    const skills = signal(['Angular', 'Spring Boot', 'PostgreSQL', 'GraphQL']);
    return {
      props: {
        skills,
        drop: (s: string) => skills.update((all) => all.filter((x) => x !== s)),
      },
      template: `
        <ul aria-label="Skills" style="display: flex; gap: 0.5rem; flex-wrap: wrap; list-style: none; margin: 0; padding: 0;">
          @for (s of skills(); track s) {
            <li><ui-tag [label]="s" variant="accent" removable (remove)="drop(s)" /></li>
          }
        </ul>
      `,
    };
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove PostgreSQL' }));
    await expect(canvas.queryByText('PostgreSQL')).toBeNull();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};
