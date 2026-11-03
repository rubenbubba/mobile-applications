import { Card, EmptyState, Skeleton, Stack } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import type { OverviewState } from '@/hooks/useOverview';
import type { Overview } from '@/logic/overview';

interface OverviewGateProps {
  state: OverviewState;
  children: (overview: Overview) => React.ReactNode;
}

function LoadingCards() {
  return (
    <Stack gap="md" testID="loading-skeleton">
      <Card>
        <Stack gap="md">
          <Skeleton width={120} height={40} />
          <Skeleton height={8} borderRadius={4} />
          <Skeleton width="70%" height={20} />
          <Skeleton width="50%" />
        </Stack>
      </Card>
      {[0, 1, 2].map((key) => (
        <Card key={key}>
          <Stack gap="sm">
            <Skeleton width="40%" height={18} />
            <Skeleton />
            <Skeleton width="85%" />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

// Every screen goes through this, so loading and error states look the same everywhere.
export function OverviewGate({ state, children }: OverviewGateProps) {
  if (state.kind === 'loading') return <LoadingCards />;

  if (state.kind === 'error') {
    return (
      <Card testID="load-error">
        <EmptyState
          icon="cloud-offline-outline"
          title="We could not load your results"
          description={state.message}
          action={<StyledButton label="Try again" onPress={state.retry} variant="secondary" />}
        />
      </Card>
    );
  }

  return <>{children(state.overview)}</>;
}
