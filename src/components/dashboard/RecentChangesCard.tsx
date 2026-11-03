import { Divider, EmptyState, Icon, Row, Stack, Text, type IoniconsName } from '@/components/primitives';
import { SectionCard } from '@/components/shared/SectionCard';
import { formatRelativeTime } from '@/logic/format';
import type { Overview } from '@/logic/overview';
import type { ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { ChangeTone } from '@/types/Monitoring';

const TONE_ICONS: Record<ChangeTone, IoniconsName> = {
  good: 'arrow-up-circle',
  bad: 'arrow-down-circle',
  neutral: 'ellipse-outline',
};

const TONE_COLORS: Record<ChangeTone, ToneName> = {
  good: 'healthy',
  bad: 'critical',
  neutral: 'neutral',
};

export function RecentChangesCard({ overview }: { overview: Overview }) {
  const { colors } = useTheme();
  const { changes, now } = overview;

  return (
    <SectionCard title="Recent changes" testID="changes-card">
      {changes.length === 0 ? (
        <EmptyState icon="time-outline" title="No changes yet" />
      ) : (
        <Stack gap="sm">
          {changes.map((change, index) => (
            <Stack key={change.id} gap="sm">
              {index > 0 && <Divider />}
              <Row gap="md" align="flex-start">
                <Icon name={TONE_ICONS[change.tone]} size={20} color={colors.tones[TONE_COLORS[change.tone]].mark} />
                <Stack flex={1}>
                  <Text weight="medium">{change.title}</Text>
                  <Text size="sm" tone="muted">{formatRelativeTime(change.at, now)}</Text>
                </Stack>
              </Row>
            </Stack>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}
