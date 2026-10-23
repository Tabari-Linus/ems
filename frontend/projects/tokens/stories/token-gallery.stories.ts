import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { TokenGallery } from './token-gallery';

const meta: Meta<TokenGallery> = {
  title: 'Foundations/Token reference',
  component: TokenGallery,
  tags: ['!autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Every @ems/tokens token with its CSS variable and value, generated from tokens.json.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<TokenGallery>;

export const Reference: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: /^Semantic/ })).toBeInTheDocument();
    await expect(canvas.getByText('--ems-color-accent-solid')).toBeInTheDocument();
  },
};
