export type RentCheckHostEnvironment = Readonly<
  Record<'VERCEL_PROJECT_PRODUCTION_URL' | 'VERCEL_URL', string | undefined>
>;

const PUBLIC_HOSTS = ['signedprice.com', 'www.signedprice.com'] as const;

function exactEnvironmentHost(value: string | undefined): string | null {
  const candidate = value?.trim().toLowerCase();
  if (!candidate) return null;

  try {
    const parsed = new URL(`https://${candidate}`);
    if (
      parsed.host !== candidate ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.pathname !== '/' ||
      parsed.search !== '' ||
      parsed.hash !== ''
    ) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

export function createAllowedRentCheckHosts(
  environment: RentCheckHostEnvironment,
): ReadonlySet<string> {
  const hosts = new Set<string>(PUBLIC_HOSTS);
  for (const value of [
    environment.VERCEL_PROJECT_PRODUCTION_URL,
    environment.VERCEL_URL,
  ]) {
    const host = exactEnvironmentHost(value);
    if (host !== null) hosts.add(host);
  }
  return hosts;
}

function headerOriginMatches(value: string, expectedOrigin: string): boolean {
  try {
    return new URL(value).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function isTrustedRentCheckRequest(
  request: Request,
  allowedHosts: ReadonlySet<string>,
): boolean {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }

  const requestHost = url.host.toLowerCase();
  if (!allowedHosts.has(requestHost) || url.username !== '' || url.password !== '') return false;

  const hostHeader = request.headers.get('host');
  if (hostHeader !== null && hostHeader.trim().toLowerCase() !== requestHost) return false;

  const origin = request.headers.get('origin');
  if (origin !== null && !headerOriginMatches(origin, url.origin)) return false;

  const referer = request.headers.get('referer');
  if (referer !== null && !headerOriginMatches(referer, url.origin)) return false;

  return request.headers.get('sec-fetch-site')?.toLowerCase() !== 'cross-site';
}
