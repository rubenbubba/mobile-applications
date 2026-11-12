const USER_AGENT = 'VitrineMonitor/1.0 (+https://github.com/rubenbubba/mobile-applications)';
const MAX_HTML_BYTES = 2_000_000;

export interface Probe {
  isUp: boolean;
  statusCode: number;
  responseTimeMs: number;
  timedOut: boolean;
  finalUrl: string;
  headers?: Headers;
  html?: string;
}

// One request to a site, following redirects. A site counts as up when it answers with a 2xx status.
export async function probe(url: string, options: { readBody?: boolean; timeoutMs?: number; method?: 'GET' | 'HEAD' } = {}): Promise<Probe> {
  const { readBody = false, timeoutMs = 15000, method = 'GET' } = options;
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    });
    const responseTimeMs = Math.round(performance.now() - startedAt);
    const isHtml = (response.headers.get('content-type') ?? '').includes('html');
    const html = readBody && isHtml ? (await response.text()).slice(0, MAX_HTML_BYTES) : undefined;
    if (html === undefined) await response.body?.cancel();

    return {
      isUp: response.ok,
      statusCode: response.status,
      responseTimeMs,
      timedOut: false,
      finalUrl: response.url || url,
      headers: response.headers,
      html,
    };
  } catch (error) {
    return {
      isUp: false,
      statusCode: 0,
      responseTimeMs: Math.round(performance.now() - startedAt),
      timedOut: error instanceof DOMException && error.name === 'TimeoutError',
      finalUrl: url,
    };
  }
}

// Does the plain http:// address send visitors on to https://?
export async function redirectsToHttps(url: URL): Promise<boolean> {
  try {
    const response = await fetch(`http://${url.host}/`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': USER_AGENT },
    });
    await response.body?.cancel();
    const location = response.headers.get('location') ?? '';
    return response.status >= 300 && response.status < 400 && location.startsWith('https://');
  } catch {
    return false;
  }
}

// Runs async work over a list with a limit on how many run at once.
export async function mapLimited<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
