const HTTPS_URL = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i;

export type UrlResult = { ok: true; url: string } | { ok: false; error: string };

export function normalizeWebsiteUrl(input: string): UrlResult {
  const trimmed = input.trim();

  if (trimmed === '') return { ok: false, error: 'Enter a website address.' };
  if (/^http:\/\//i.test(trimmed)) {
    return { ok: false, error: 'Use the secure https:// address. Insecure addresses cannot be tested from here.' };
  }

  const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return HTTPS_URL.test(url)
    ? { ok: true, url }
    : { ok: false, error: 'That does not look like a website address. Try something like www.example.com.' };
}
