import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from './Banner';

const meta: Meta<typeof Banner> = { title: 'Primitives/Banner', component: Banner };
export default meta;
type Story = StoryObj<typeof Banner>;

export const Neutral: Story = { args: { message: 'You are viewing demo data for a fictional business.' } };
export const Warning: Story = {
  args: { message: 'You are offline. Showing data from 14:02.', tone: 'warning', icon: 'cloud-offline' },
};
