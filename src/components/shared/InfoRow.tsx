import { Icon, Row, Stack, Text } from '@/components/primitives';
import { useTheme } from '@/theme/useTheme';

interface InfoRowProps {
  label: string;
  value: string;
  testID?: string;
}

export function InfoRow({ label, value, testID }: InfoRowProps) {
  return (
    <Row justify="space-between" align="flex-start" gap="md">
      <Text tone="secondary">{label}</Text>
      <Text weight="medium" align="right" testID={testID}>{value}</Text>
    </Row>
  );
}

interface CheckRowProps {
  label: string;
  detail?: string;
  passed: boolean;
}

export function CheckRow({ label, detail, passed }: CheckRowProps) {
  const { colors } = useTheme();

  return (
    <Row gap="md" align="flex-start">
      <Icon
        name={passed ? 'checkmark-circle' : 'alert-circle'}
        size={20}
        color={passed ? colors.tones.healthy.mark : colors.tones.warning.mark}
      />
      <Stack flex={1}>
        <Text weight="medium">{label}</Text>
        {detail !== undefined && <Text size="sm" tone="secondary">{detail}</Text>}
      </Stack>
    </Row>
  );
}
