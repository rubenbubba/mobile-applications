import { BarChart, EmptyState } from '@/components/primitives';
import { SectionCard } from '@/components/shared/SectionCard';
import type { Overview } from '@/logic/overview';

export function ScoreTrendCard({ overview }: { overview: Overview }) {
  const { trend, trendSummary } = overview;

  return (
    <SectionCard title="Your score over time" description="Overall score per week. Tap a bar for details." testID="trend-card">
      {trend.length === 0 ? (
        <EmptyState icon="bar-chart-outline" title="No history yet" description="Your score history appears after your first check." />
      ) : (
        <BarChart data={trend} max={100} summary={trendSummary} testID="score-trend" />
      )}
    </SectionCard>
  );
}
