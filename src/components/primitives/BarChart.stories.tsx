import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './BarChart';

const meta: Meta<typeof BarChart> = { title: 'Primitives/BarChart', component: BarChart };
export default meta;
type Story = StoryObj<typeof BarChart>;

const values = [58, 60, 63, 61, 64, 66, 65, 67];

export const Default: Story = {
  args: {
    max: 100,
    summary: 'Score over 8 weeks, from 58 to 67.',
    data: values.map((value, index) => ({
      key: `week-${index}`,
      label: `Week ${index + 1}`,
      value,
      valueLabel: `${value} / 100`,
    })),
  },
};
