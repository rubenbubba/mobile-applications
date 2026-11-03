import { router } from 'expo-router';
import { Divider, EmptyState, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { AreaHeaderCard } from '@/components/shared/AreaHeaderCard';
import { AreaIssues } from '@/components/shared/AreaIssues';
import { CheckRow } from '@/components/shared/InfoRow';
import { SectionCard } from '@/components/shared/SectionCard';
import { UnavailableCard } from '@/components/shared/UnavailableCard';
import type { Overview } from '@/logic/overview';
import { sectionValue } from '@/logic/scoring';
import { seoChecklist } from '@/logic/seoChecklist';
import { SeoPagesCard } from './SeoPagesCard';

export function SeoPanel({ overview }: { overview: Overview }) {
  const { areas, now, snapshot } = overview;
  const data = sectionValue(snapshot.seo);

  if (data === undefined) {
    return (
      <UnavailableCard
        title="We could not check your site for Google"
        reason={areas.seo.unavailableReason}
        action={<StyledButton label="See what to fix" variant="secondary" onPress={() => router.navigate('/issues')} />}
      />
    );
  }

  const checklist = seoChecklist(data);
  const passing = checklist.filter((item) => item.passed).length;

  return (
    <Stack gap="lg">
      <AreaHeaderCard
        summary={areas.seo}
        now={now}
        headline={`${passing} of ${checklist.length} basics are in place`}
        testID="seo-summary"
      >
        <Text tone="secondary">How easily people can find you when they search on Google.</Text>
      </AreaHeaderCard>

      <SectionCard title="The basics" testID="seo-checklist">
        <Stack gap="md">
          {checklist.map((item) => (
            <CheckRow key={item.id} label={item.label} detail={item.detail} passed={item.passed} />
          ))}
        </Stack>
      </SectionCard>

      <SeoPagesCard pages={data.pages} />

      <SectionCard title="Broken links" testID="seo-broken-links">
        {data.brokenLinks.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="No broken links found" />
        ) : (
          <Stack gap="sm">
            {data.brokenLinks.map((link, index) => (
              <Stack key={`${link.fromPath}-${link.target}`} gap="sm">
                {index > 0 && <Divider />}
                <Stack>
                  <Text weight="medium">{link.target}</Text>
                  <Text size="sm" tone="secondary">Linked from {link.fromPath}. Page not found ({link.statusCode}).</Text>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </SectionCard>

      <AreaIssues overview={overview} area="seo" title="How to improve" emptyTitle="Nothing to improve right now" />
    </Stack>
  );
}
