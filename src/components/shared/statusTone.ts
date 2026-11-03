import type { AreaStatus } from '@/logic/overview';
import type { ToneName } from '@/theme/tokens';

const STATUS_TONES: Record<AreaStatus, ToneName> = {
  healthy: 'healthy',
  warning: 'warning',
  critical: 'critical',
  unavailable: 'neutral',
};

export function toneForStatus(status: AreaStatus): ToneName {
  return STATUS_TONES[status];
}
