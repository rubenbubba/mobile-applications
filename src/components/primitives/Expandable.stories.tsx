import type { Meta, StoryObj } from '@storybook/react';
import { Expandable } from './Expandable';
import { Text } from './Text';

const meta: Meta<typeof Expandable> = { title: 'Primitives/Expandable', component: Expandable };
export default meta;
type Story = StoryObj<typeof Expandable>;

export const Closed: Story = {
  args: { title: 'How is this calculated?', children: <Text>Hidden until opened.</Text> },
};
export const Open: Story = {
  args: { title: 'Contact page', subtitle: '2 things to fix', defaultOpen: true, children: <Text>Details.</Text> },
};
