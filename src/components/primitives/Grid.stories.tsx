import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Grid } from './Grid';
import { Text } from './Text';

const meta: Meta<typeof Grid> = { title: 'Primitives/Grid', component: Grid };
export default meta;
type Story = StoryObj<typeof Grid>;

const cards = ['One', 'Two', 'Three', 'Four'].map((label) => (
  <Card key={label}><Text>{label}</Text></Card>
));

export const TwoColumns: Story = { args: { columns: 2, children: cards } };
export const FourColumns: Story = { args: { columns: 4, children: cards } };
