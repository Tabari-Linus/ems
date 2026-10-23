import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { TokenGallery } from './token-gallery';

const meta: Meta<TokenGallery> = {
  title: 'Foundations/Tokens',
  component: TokenGallery,
  tags: ['!autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Generated from @ems/tokens (tokens.json). All values are placeholders until the Slice DS Direction Board.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<TokenGallery>;

export const Gallery: Story = {
  play: async ({ canvas }) => {
    // Every declared pair passes in both themes (the CI gate checks the same data).
    await expect(canvas.queryByText(/FAIL/)).not.toBeInTheDocument();
  },
};
