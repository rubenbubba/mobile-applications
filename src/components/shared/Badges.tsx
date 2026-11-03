import { Badge, type IoniconsName } from '@/components/primitives';
import type { AreaStatus } from '@/logic/overview';
import type { MetricRating } from '@/logic/scoring';
import type { IssueState, Severity } from '@/types/Issue';
import type { DataSource } from '@/types/Monitoring';

type BadgeVariant = 'default' | 'success' | 'warning' | 'serious' | 'error';

interface BadgeSpec {
  label: string;
  variant: BadgeVariant;
  icon: IoniconsName;
}

const STATUS_SPECS: Record<AreaStatus, BadgeSpec> = {
  healthy: { label: 'Healthy', variant: 'success', icon: 'checkmark-circle' },
  warning: { label: 'Needs work', variant: 'warning', icon: 'alert-circle' },
  critical: { label: 'Critical', variant: 'error', icon: 'close-circle' },
  unavailable: { label: 'Not available', variant: 'default', icon: 'remove-circle-outline' },
};

const SEVERITY_SPECS: Record<Severity, BadgeSpec> = {
  critical: { label: 'Critical', variant: 'error', icon: 'close-circle' },
  high: { label: 'High', variant: 'serious', icon: 'alert-circle' },
  medium: { label: 'Medium', variant: 'warning', icon: 'alert-circle-outline' },
  low: { label: 'Low', variant: 'default', icon: 'information-circle-outline' },
};

const STATE_SPECS: Record<IssueState, BadgeSpec> = {
  open: { label: 'To do', variant: 'default', icon: 'ellipse-outline' },
  'marked-fixed': { label: 'Waiting for check', variant: 'warning', icon: 'time-outline' },
  resolved: { label: 'Resolved', variant: 'success', icon: 'checkmark-circle' },
};

const SOURCE_SPECS: Record<DataSource | 'unavailable', BadgeSpec> = {
  demo: { label: 'Demo data', variant: 'default', icon: 'flask-outline' },
  live: { label: 'Live', variant: 'success', icon: 'radio-outline' },
  unavailable: { label: 'Not available', variant: 'default', icon: 'remove-circle-outline' },
};

const METRIC_SPECS: Record<MetricRating, BadgeSpec> = {
  good: { label: 'Good', variant: 'success', icon: 'checkmark-circle' },
  'needs-work': { label: 'Needs work', variant: 'warning', icon: 'alert-circle' },
  poor: { label: 'Poor', variant: 'error', icon: 'close-circle' },
};

export function StatusBadge({ status }: { status: AreaStatus }) {
  return <Badge {...STATUS_SPECS[status]} testID={`status-${status}`} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge {...SEVERITY_SPECS[severity]} />;
}

export function IssueStateBadge({ state }: { state: IssueState }) {
  return <Badge {...STATE_SPECS[state]} testID={`issue-state-${state}`} />;
}

export function SourceBadge({ source }: { source: DataSource | 'unavailable' }) {
  return <Badge {...SOURCE_SPECS[source]} testID={`source-${source}`} />;
}

export function MetricBadge({ rating }: { rating: MetricRating }) {
  return <Badge {...METRIC_SPECS[rating]} />;
}
