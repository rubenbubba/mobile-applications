import { Card, Row, Stack, Text } from '@/components/primitives';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}

export function SectionCard({ title, description, action, children, testID }: SectionCardProps) {
  return (
    <Card testID={testID}>
      <Stack gap="md">
        <Row justify="space-between" align="flex-start" gap="sm" wrap>
          <Stack flex={1} gap="xs">
            <Text size="lg" weight="semibold" heading={2}>{title}</Text>
            {description !== undefined && <Text size="sm" tone="secondary">{description}</Text>}
          </Stack>
          {action}
        </Row>
        {children}
      </Stack>
    </Card>
  );
}
