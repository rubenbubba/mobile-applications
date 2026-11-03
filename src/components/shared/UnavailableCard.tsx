import { Card, EmptyState } from '@/components/primitives';

interface UnavailableCardProps {
  title: string;
  reason?: string;
  action?: React.ReactNode;
}

export function UnavailableCard({ title, reason, action }: UnavailableCardProps) {
  return (
    <Card testID="unavailable-card">
      <EmptyState icon="remove-circle-outline" title={title} description={reason} action={action} />
    </Card>
  );
}
