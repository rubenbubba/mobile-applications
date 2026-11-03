import { useCallback } from 'react';
import { useMonitoringStore } from '../state/useMonitoringStore';
import { useToastStore } from '../state/useToastStore';
import { pluralize } from '../logic/format';

export function useRunCheck() {
  const runCheck = useMonitoringStore((state) => state.runCheck);
  const isChecking = useMonitoringStore((state) => state.isChecking);
  const showToast = useToastStore((state) => state.showToast);

  const start = useCallback(async () => {
    try {
      const { previousScore, newScore, verifiedCount } = await runCheck();
      const scoreChange =
        previousScore !== undefined && newScore !== undefined && previousScore !== newScore
          ? ` Score went from ${previousScore} to ${newScore}.`
          : '';
      const fixes = verifiedCount > 0 ? ` ${pluralize(verifiedCount, 'fix', 'fixes')} confirmed.` : '';

      showToast({ message: `Demo check finished.${fixes}${scoreChange}`, variant: 'success' });
    } catch {
      showToast({ message: 'The check could not run. Please try again.', variant: 'error' });
    }
  }, [runCheck, showToast]);

  return { start, isChecking };
}
