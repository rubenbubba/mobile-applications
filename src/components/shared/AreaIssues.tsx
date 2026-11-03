import { EmptyState } from '@/components/primitives';
import type { Overview } from '@/logic/overview';
import type { Area } from '@/types/Monitoring';
import { IssueList } from './IssueList';
import { SectionCard } from './SectionCard';

interface AreaIssuesProps {
  overview: Overview;
  area: Area;
  title: string;
  emptyTitle: string;
}

export function AreaIssues({ overview, area, title, emptyTitle }: AreaIssuesProps) {
  const issues = overview.issues.filter((issue) => issue.area === area && issue.state !== 'resolved');

  return (
    <SectionCard title={title} testID={`area-issues-${area}`}>
      {issues.length === 0 ? (
        <EmptyState icon="checkmark-circle-outline" title={emptyTitle} />
      ) : (
        <IssueList issues={issues} />
      )}
    </SectionCard>
  );
}
