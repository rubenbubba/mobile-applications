import { Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useRunCheck } from '@/hooks/useRunCheck';

interface RunCheckButtonProps {
  variant?: 'primary' | 'secondary';
}

export function RunCheckButton({ variant = 'secondary' }: RunCheckButtonProps) {
  const isOnline = useOnlineStatus();
  const { start, isChecking } = useRunCheck();

  return (
    <Stack gap="xs">
      <StyledButton
        label={isChecking ? 'Checking…' : 'Run new check'}
        icon="refresh"
        variant={variant}
        onPress={start}
        isLoading={isChecking}
        disabled={!isOnline}
        hint="Runs a simulated demo check"
        testID="run-check"
      />
      {!isOnline && (
        <Text size="sm" tone="muted" align="center">You can run a new check when you are back online.</Text>
      )}
    </Stack>
  );
}
