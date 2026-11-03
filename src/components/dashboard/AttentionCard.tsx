import { router } from 'expo-router';
import { EmptyState } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { IssueList } from '@/components/shared/IssueList';
import { SectionCard } from '@/components/shared/SectionCard';
import { pluralize } from '@/logic/format';
import type { Overview } from '@/logic/overview';

const TOP_ISSUES = 3;

export function AttentionCard({ overview }: { overview: Overview }) {
  const { openIssues } = overview;

  return (
    <SectionCard
      title="What needs your attention"
      description={openIssues.length > 0 ? `Most important first. ${pluralize(openIssues.length, 'open item')} in total.` : undefined}
      testID="attention-card"
    >
      {openIssues.length === 0 ? (
        <EmptyState icon="checkmark-circle-outline" title="Nothing to do right now" description="We will tell you when something changes." />
      ) : (
        <>
          <IssueList issues={openIssues.slice(0, TOP_ISSUES)} />
          <StyledButton label="See all issues" variant="secondary" onPress={() => router.navigate('/issues')} testID="see-all-issues" />
        </>
      )}
    </SectionCard>
  );
}
