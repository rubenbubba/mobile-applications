import { useCallback, useState } from 'react';
import { normalizeWebsiteUrl } from '../logic/url';
import { checkReachability } from '../services/reachabilityService';
import type { ReachabilityResult } from '../types/Monitoring';

export function useReachabilityCheck() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ReachabilityResult | undefined>();
  const [isChecking, setIsChecking] = useState(false);

  const start = useCallback(async () => {
    const normalized = normalizeWebsiteUrl(input);

    if (!normalized.ok) {
      setError(normalized.error);
      setResult(undefined);
      return;
    }

    setError(undefined);
    setIsChecking(true);
    setResult(await checkReachability(normalized.url));
    setIsChecking(false);
  }, [input]);

  return { input, setInput, error, result, isChecking, start };
}
