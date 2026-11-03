import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = { title: 'Primitives/ProgressBar', component: ProgressBar };
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Healthy: Story = { args: { value: 92, tone: 'healthy', label: 'Score' } };
export const Warning: Story = { args: { value: 67, tone: 'warning', label: 'Score' } };
export const Critical: Story = { args: { value: 18, tone: 'critical', label: 'Score' } };
