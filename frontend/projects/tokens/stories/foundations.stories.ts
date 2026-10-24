import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { ColourPage } from './colour-page';
import { MotionPage } from './motion-page';
import { ShapePage } from './shape-page';
import { TypePage } from './type-page';

/*
 * Foundations: the Daylight visual language, generated from @ems/tokens. One story per page, so
 * the sidebar reads Foundations / Colour, Typography, Space and shape, Motion.
 */
const meta: Meta = {
  title: 'Foundations',
  tags: ['!autodocs'],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Colour: Story = {
  render: () => ({ moduleMetadata: { imports: [ColourPage] }, template: '<ems-colour-page />' }),
  play: async ({ canvas }) => {
    // Every declared pair passes in both themes (the CI gate checks the same data).
    await expect(canvas.queryByText(/FAIL/)).not.toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Surfaces' })).toBeInTheDocument();
  },
};

export const Typography: Story = {
  render: () => ({ moduleMetadata: { imports: [TypePage] }, template: '<ems-type-page />' }),
  play: async ({ canvas }) => {
    const greeting = canvas.getByText('Good morning, Ama');
    await expect(getComputedStyle(greeting).fontWeight).toBe('800');
    await expect(getComputedStyle(greeting).fontFamily).toContain('Plus Jakarta Sans');
  },
};

export const SpaceAndShape: Story = {
  name: 'Space and shape',
  render: () => ({ moduleMetadata: { imports: [ShapePage] }, template: '<ems-shape-page />' }),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('--ems-space-4')).toBeInTheDocument();
  },
};

export const Motion: Story = {
  render: () => ({ moduleMetadata: { imports: [MotionPage] }, template: '<ems-motion-page />' }),
  play: async ({ canvas, userEvent }) => {
    const play = canvas.getByRole('button', { name: 'Play the transitions' });
    await userEvent.click(play);
    await expect(play).toHaveAttribute('aria-pressed', 'true');
  },
};
