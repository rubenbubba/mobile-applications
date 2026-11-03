import { Avatar, Badge, Expandable, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { formatRelativeTime } from '@/logic/format';
import { suggestReply } from '@/logic/reviewInsights';
import type { Review } from '@/types/Monitoring';
import { Stars } from './Stars';

interface ReviewCardProps {
  review: Review;
  businessName: string;
  now: Date;
  onMarkReplied: (reviewId: string) => void;
}

export function ReviewCard({ review, businessName, now, onMarkReplied }: ReviewCardProps) {
  const needsReply = review.stars <= 2 && !review.replied;

  return (
    <Stack gap="sm" testID={`review-${review.id}`}>
      <Row gap="md" align="flex-start">
        <Avatar name={review.author} />
        <Stack flex={1} gap="xs">
          <Row justify="space-between" gap="sm" wrap>
            <Text weight="semibold">{review.author}</Text>
            <Text size="sm" tone="muted">{formatRelativeTime(review.date, now)}</Text>
          </Row>
          <Stars value={review.stars} />
        </Stack>
      </Row>

      <Text selectable>{review.text}</Text>

      <Row gap="sm" wrap>
        {needsReply && <Badge label="Needs a reply" variant="error" icon="chatbubble-ellipses" />}
        {review.replied && <Badge label="Replied" variant="success" icon="checkmark-circle" testID={`replied-${review.id}`} />}
      </Row>

      {!review.replied && (
        <Expandable title="Suggested reply" testID={`suggest-${review.id}`} defaultOpen={needsReply}>
          <Text size="sm" tone="secondary" selectable>{suggestReply(review, businessName)}</Text>
          <Text size="sm" tone="muted">Post your reply on Google, then mark it here.</Text>
          <Row>
            <StyledButton
              label="Mark as replied"
              variant="secondary"
              compact
              icon="checkmark"
              onPress={() => onMarkReplied(review.id)}
              testID={`mark-replied-${review.id}`}
            />
          </Row>
        </Expandable>
      )}
    </Stack>
  );
}
