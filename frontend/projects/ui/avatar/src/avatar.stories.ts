import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { Avatar, type AvatarSize, type AvatarStatus, type AvatarTint } from './avatar';

interface AvatarArgs {
  name: string;
  size: AvatarSize;
  tint: AvatarTint | null;
  status: AvatarStatus | null;
  src: string | null;
  decorative: boolean;
}

const meta: Meta<AvatarArgs> = {
  title: 'Components/Avatar',
  component: Avatar,
  decorators: [moduleMetadata({ imports: [Avatar] })],
  args: {
    name: 'Kwame Asante',
    size: 'lg',
    tint: null,
    status: null,
    src: null,
    decorative: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    tint: { control: 'select', options: [null, 1, 2, 3, 4, 5, 6] },
    status: { control: 'select', options: [null, 'active', 'pending', 'inactive', 'archived'] },
  },
  render: (args) => ({
    props: args,
    template: `<ui-avatar [name]="name" [size]="size" [tint]="tint" [status]="status" [src]="src"
      [decorative]="decorative" />`,
  }),
  parameters: {
    docs: {
      description: {
        component: `
Initials on a soft department tint (\`--ems-color-avatar-{1..6}-{bg,text}\`), or a photo with a
fallback to initials if it fails to load. \`tint\` picks a tint; otherwise \`tintKey\` (e.g. the
department id) or the name is hashed to a stable one.

- Accessible name: \`role="img"\` + \`aria-label\` = the name, plus the status when shown ("Kwame Asante, Active").
- Do: set \`decorative\` when the name is printed next to the avatar. Don't: rely on the tint to convey meaning.
- The status dot pairs colour with shape (filled, half, ring, square).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AvatarArgs>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Kwame Asante' });
    await expect(avatar).toHaveTextContent('KA');
    await expect(avatar).toHaveAttribute('data-size', 'lg');
  },
};

export const WithStatus: Story = {
  name: 'With status',
  args: { name: 'Kofi Owusu', status: 'pending' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Kofi Owusu, Pending' })).toBeVisible();
  },
};

export const BrokenImage: Story = {
  name: 'Image falls back to initials',
  args: { name: 'Efua Boateng', src: 'data:image/png;base64,broken' },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Efua Boateng' });
    await expect(await canvas.findByText('EB')).toBeVisible();
    await expect(avatar.querySelector('img')).toBeNull();
  },
};

export const Decorative: Story = {
  args: { decorative: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;align-items:center;gap:0.75rem">
        <ui-avatar [name]="name" size="md" decorative />
        <span>{{ name }}</span>
      </div>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvas.getByText('Kwame Asante')).toBeVisible();
  },
};

export const SizesAndTints: Story = {
  name: 'Sizes, tints and statuses',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'] satisfies AvatarSize[],
      people: [
        { name: 'Ama Mensah', tint: 1, status: 'active' },
        { name: 'Efua Boateng', tint: 2, status: 'active' },
        { name: 'Kofi Owusu', tint: 3, status: 'pending' },
        { name: 'Abena Darko', tint: 4, status: 'active' },
        { name: 'Yaw Appiah', tint: 5, status: 'inactive' },
        { name: 'Nana Agyeman', tint: 6, status: 'archived' },
      ],
    },
    template: `
      <div style="display:grid;gap:1rem">
        <div style="display:flex;align-items:center;gap:0.75rem">
          @for (size of sizes; track size) {
            <ui-avatar name="Ama Mensah" [size]="size" />
          }
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem">
          @for (p of people; track p.name) {
            <ui-avatar [name]="p.name" [tint]="p.tint" [status]="p.status" size="lg" />
          }
        </div>
      </div>`,
  }),
};
