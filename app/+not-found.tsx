import { router } from 'expo-router';
import { EmptyState, Screen } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';

export default function NotFoundScreen() {
  return (
    <Screen padding="xl" scrollable={false} testID="screen-not-found">
      <EmptyState
        icon="compass-outline"
        title="We can't find this page"
        description="It may have moved, or the link may be wrong."
        action={<StyledButton label="Go to your overview" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
