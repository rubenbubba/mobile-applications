import { useLocalSearchParams } from 'expo-router';
import { BackButton, IssueDetailPanel } from '@/components/issues/IssueDetailPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { useOverview } from '@/hooks/useOverview';
import { ISSUE_IDS } from '@/logic/issueRules';

export function generateStaticParams(): Record<string, string>[] {
  return ISSUE_IDS.map((id) => ({ id }));
}

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useOverview();

  return (
    <PageLayout testID="screen-issue-detail" leading={<BackButton />}>
      <OverviewGate state={state}>{(overview) => <IssueDetailPanel overview={overview} issueId={id} />}</OverviewGate>
    </PageLayout>
  );
}
