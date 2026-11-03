import { useState } from 'react';
import { Banner, Card, EmptyState, Row, SegmentedControl, Stack, Tag, Text } from '@/components/primitives';
import { AREA_META, AREA_ORDER } from '@/components/shared/areaMeta';
import { IssueList } from '@/components/shared/IssueList';
import { RunCheckButton } from '@/components/shared/RunCheckButton';
import { pluralize } from '@/logic/format';
import type { Overview } from '@/logic/overview';
import type { IssueState, Severity } from '@/types/Issue';
import type { Area } from '@/types/Monitoring';

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const EMPTY_TEXT: Record<IssueState, { title: string; description: string }> = {
  open: { title: 'Nothing to do', description: 'No issues match right now. Nice work.' },
  'marked-fixed': { title: 'Nothing waiting', description: 'Issues you mark as fixed appear here until a new check confirms them.' },
  resolved: { title: 'Nothing resolved yet', description: 'Fixes confirmed by a check appear here.' },
};

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function IssuesPanel({ overview }: { overview: Overview }) {
  const [state, setState] = useState<IssueState>('open');
  const [severities, setSeverities] = useState<Severity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const { issues } = overview;

  const count = (target: IssueState) => issues.filter((issue) => issue.state === target).length;
  const waitingCount = count('marked-fixed');
  const visible = issues.filter(
    (issue) =>
      issue.state === state &&
      (severities.length === 0 || severities.includes(issue.severity)) &&
      (areas.length === 0 || areas.includes(issue.area)),
  );

  return (
    <Stack gap="lg">
      {waitingCount > 0 && (
        <Card tone="warning" testID="waiting-for-check">
          <Stack gap="md">
            <Text weight="semibold" tone="warning">
              {pluralize(waitingCount, 'fix', 'fixes')} waiting to be confirmed. Run a new check to update your score.
            </Text>
            <RunCheckButton variant="primary" />
          </Stack>
        </Card>
      )}

      <SegmentedControl<IssueState>
        label="Issue status"
        value={state}
        onChange={setState}
        options={[
          { value: 'open', label: `To do (${count('open')})`, testID: 'issues-tab-open' },
          { value: 'marked-fixed', label: `Waiting (${waitingCount})`, testID: 'issues-tab-marked-fixed' },
          { value: 'resolved', label: `Resolved (${count('resolved')})`, testID: 'issues-tab-resolved' },
        ]}
      />

      <Stack gap="sm">
        <Row gap="sm" wrap>
          {SEVERITIES.map(({ value, label }) => (
            <Tag
              key={value}
              label={label}
              selected={severities.includes(value)}
              onPress={() => setSeverities(toggled(severities, value))}
              testID={`filter-severity-${value}`}
            />
          ))}
        </Row>
        <Row gap="sm" wrap>
          {AREA_ORDER.map((area) => (
            <Tag
              key={area}
              label={AREA_META[area].label}
              selected={areas.includes(area)}
              onPress={() => setAreas(toggled(areas, area))}
              testID={`filter-area-${area}`}
            />
          ))}
        </Row>
      </Stack>

      <Card testID="issue-list">
        {visible.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={EMPTY_TEXT[state].title}
            description={EMPTY_TEXT[state].description}
            testID="issues-empty"
          />
        ) : (
          <IssueList issues={visible} />
        )}
      </Card>

      <Banner icon="flask-outline" message="These issues are worked out from demo data." />
    </Stack>
  );
}
