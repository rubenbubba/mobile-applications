import { Banner, InputField, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { SourceBadge } from '@/components/shared/Badges';
import { SectionCard } from '@/components/shared/SectionCard';
import { useIsLiveAccount } from '@/hooks/useAccount';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useReachabilityCheck } from '@/hooks/useReachabilityCheck';
import { formatDuration } from '@/logic/format';
import type { ReachabilityResult } from '@/types/Monitoring';

function ResultBanner({ result }: { result: ReachabilityResult }) {
  if (result.outcome === 'responded' && result.statusCode !== undefined && result.statusCode >= 400) {
    return (
      <Banner
        tone="critical"
        icon="alert-circle"
        message={`${result.url} answered in ${formatDuration(result.durationMs)}, but with error ${result.statusCode}. Visitors see an error page.`}
        testID="live-check-result"
      />
    );
  }

  if (result.outcome === 'responded') {
    return (
      <Banner
        tone="healthy"
        icon="checkmark-circle"
        message={
          result.statusCode !== undefined
            ? `${result.url} responded in ${formatDuration(result.durationMs)} (status ${result.statusCode}).`
            : `${result.url} responded in ${formatDuration(result.durationMs)}.`
        }
        testID="live-check-result"
      />
    );
  }

  return (
    <Banner
      tone="critical"
      icon="close-circle"
      message={
        result.outcome === 'timed-out'
          ? `${result.url} did not respond within ${formatDuration(result.durationMs)}.`
          : `We could not reach ${result.url} from this device.`
      }
      testID="live-check-result"
    />
  );
}

export function LiveCheckCard() {
  const isOnline = useOnlineStatus();
  const isLive = useIsLiveAccount();
  const { input, setInput, error, result, isChecking, start } = useReachabilityCheck();

  return (
    <SectionCard
      title="Test a website now"
      description={
        isLive
          ? 'A real test from our server. It is not added to your score.'
          : 'This is a real test, not demo data. It runs from this device and is not added to your score.'
      }
      action={<SourceBadge source="live" />}
      testID="live-check-card"
    >
      <Stack gap="md">
        <InputField
          label="Website address"
          value={input}
          onChangeText={setInput}
          placeholder="www.example.com"
          keyboardType="url"
          autoComplete="url"
          onSubmitEditing={start}
          error={error}
          testID="live-check-input"
        />
        <Row>
          <StyledButton
            label="Test now"
            icon="pulse"
            variant="secondary"
            onPress={start}
            isLoading={isChecking}
            disabled={!isOnline}
            testID="live-check-button"
          />
        </Row>
        {!isOnline && <Text size="sm" tone="muted">You can test a website when you are back online.</Text>}
        {result !== undefined && <ResultBanner result={result} />}
        {!isLive && (
          <Text size="sm" tone="muted">
            This shows whether the server answered and how fast. It cannot see the page itself, so a site showing an
            error page still counts as responding.
          </Text>
        )}
      </Stack>
    </SectionCard>
  );
}
