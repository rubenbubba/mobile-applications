import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = { title: 'Primitives/SegmentedControl', component: SegmentedControl };
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  args: {
    value: 'open',
    onChange: () => {},
    options: [
      { value: 'open', label: 'To do' },
      { value: 'fixed', label: 'Marked fixed' },
      { value: 'resolved', label: 'Resolved' },
    ],
  },
};
