import type { Meta, StoryObj } from '@storybook/react';
import { ThresholdBar } from './ThresholdBar';

const meta: Meta<typeof ThresholdBar> = { title: 'Primitives/ThresholdBar', component: ThresholdBar };
export default meta;
type Story = StoryObj<typeof ThresholdBar>;

export const Good: Story = { args: { position: 0.2 } };
export const NeedsWork: Story = { args: { position: 0.5 } };
export const Poor: Story = { args: { position: 0.85 } };
