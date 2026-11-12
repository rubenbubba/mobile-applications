// Only public websites by domain name. Blocks addresses that point at private networks or the server itself.
export function parseSafeUrl(input: unknown): URL | undefined {
  if (typeof input !== 'string' || input.length > 2000) return undefined;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
  if (url.username !== '' || url.password !== '') return undefined;
  if (url.port !== '' && url.port !== '80' && url.port !== '443') return undefined;

  const host = url.hostname.toLowerCase();
  const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host.startsWith('[');
  const isPrivateName =
    host === 'localhost' || /\.(localhost|local|internal|lan|home|corp)$/.test(host) || !host.includes('.');

  return isIpAddress || isPrivateName ? undefined : url;
}
