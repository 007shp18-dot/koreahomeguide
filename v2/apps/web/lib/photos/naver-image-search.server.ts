import 'server-only';

export type NaverImageCandidate = Readonly<{
  title: string;
  temporaryImageUrl: string;
  temporaryThumbnailUrl: string;
  sourceDocumentUrl: string;
  width: number | null;
  height: number | null;
}>;

export type NaverImageCandidateResult = Readonly<{
  state: 'ready' | 'not-configured' | 'provider-error';
  candidates: readonly NaverImageCandidate[];
  reason?: string;
}>;

export type SelectedNaverImageCandidate = Readonly<{
  candidate: NaverImageCandidate;
  confidence: number;
  evidence: readonly string[];
}>;

export const NAVER_IMAGE_API_HUB_URL = 'https://naverapihub.apigw.ntruss.com/search/v1/image' as const;
export const NAVER_IMAGE_LEGACY_URL = 'https://openapi.naver.com/v1/search/image' as const;

type NaverImageApiConfig = Readonly<{
  clientId: string;
  clientSecret: string;
  endpoint: typeof NAVER_IMAGE_API_HUB_URL | typeof NAVER_IMAGE_LEGACY_URL;
  headerNames: Readonly<{ clientId: string; clientSecret: string }>;
}>;

function credentialPair(clientId: string | undefined, clientSecret: string | undefined): Readonly<{
  clientId: string;
  clientSecret: string;
}> | null {
  const normalizedClientId = clientId?.trim();
  const normalizedClientSecret = clientSecret?.trim();
  return normalizedClientId && normalizedClientSecret
    ? Object.freeze({ clientId: normalizedClientId, clientSecret: normalizedClientSecret })
    : null;
}

function apiConfig(): NaverImageApiConfig | null {
  const apiHub = credentialPair(
    process.env.NAVER_API_HUB_CLIENT_ID,
    process.env.NAVER_API_HUB_CLIENT_SECRET,
  ) ?? credentialPair(
    process.env.NAVER_NEWS_CLIENT_ID,
    process.env.NAVER_NEWS_CLIENT_SECRET,
  );
  if (apiHub !== null) return Object.freeze({
    ...apiHub,
    endpoint: NAVER_IMAGE_API_HUB_URL,
    headerNames: Object.freeze({
      clientId: 'X-NCP-APIGW-API-KEY-ID',
      clientSecret: 'X-NCP-APIGW-API-KEY',
    }),
  });

  const legacy = credentialPair(
    process.env.NAVER_SEARCH_CLIENT_ID,
    process.env.NAVER_SEARCH_CLIENT_SECRET,
  );
  return legacy === null ? null : Object.freeze({
    ...legacy,
    endpoint: NAVER_IMAGE_LEGACY_URL,
    headerNames: Object.freeze({
      clientId: 'X-Naver-Client-Id',
      clientSecret: 'X-Naver-Client-Secret',
    }),
  });
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function plainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/gu, ' ')
    .replace(/&quot;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/\s+/gu, ' ')
    .trim();
}

function normalizedIdentity(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

function candidateScore(candidate: NaverImageCandidate, exactName: boolean): number {
  const pixels = (candidate.width ?? 0) * (candidate.height ?? 0);
  const landscapeBonus = candidate.width !== null && candidate.height !== null
    && candidate.width >= candidate.height ? 1.15 : 1;
  return (exactName ? 1_000_000_000_000 : 0) + pixels * landscapeBonus;
}

export function selectNaverBuildingImageCandidate(input: Readonly<{
  buildingName: string;
  candidates: readonly NaverImageCandidate[];
}>): SelectedNaverImageCandidate | null {
  const normalizedName = normalizedIdentity(input.buildingName);
  const ranked = input.candidates.map((candidate) => {
    const exactName = normalizedName.length >= 2
      && normalizedIdentity(candidate.title).includes(normalizedName);
    return Object.freeze({ candidate, exactName, score: candidateScore(candidate, exactName) });
  }).sort((left, right) => right.score - left.score);
  const selected = ranked[0];
  if (selected === undefined || !selected.exactName) return null;
  return Object.freeze({
    candidate: selected.candidate,
    confidence: selected.exactName ? 0.65 : 0.35,
    evidence: Object.freeze([
      ...(selected.exactName ? ['name'] : []),
      'address-in-search-query',
      'rights-review-required',
    ]),
  });
}

function dimension(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function searchNaverBuildingImages(input: Readonly<{
  buildingName: string;
  address: string;
  display?: number;
}>): Promise<NaverImageCandidateResult> {
  const config = apiConfig();
  if (config === null) return Object.freeze({ state: 'not-configured', candidates: Object.freeze([]) });

  const requestedDisplay = Number.isInteger(input.display) ? input.display as number : 20;
  const display = Math.min(Math.max(requestedDisplay, 1), 100);
  const endpoint = new URL(config.endpoint);
  endpoint.search = new URLSearchParams({
    query: `${input.buildingName} ${input.address}`.trim(),
    display: String(display),
    sort: 'sim',
    filter: 'large',
  }).toString();

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        [config.headerNames.clientId]: config.clientId,
        [config.headerNames.clientSecret]: config.clientSecret,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return Object.freeze({
      state: 'provider-error', candidates: Object.freeze([]), reason: `http-${response.status}`,
    });
    const body = await response.json() as Readonly<{ items?: readonly Readonly<{
      title?: unknown;
      link?: unknown;
      thumbnail?: unknown;
      sizewidth?: unknown;
      sizeheight?: unknown;
    }>[] }>;
    const candidates = (body.items ?? []).flatMap((item): NaverImageCandidate[] => {
      const temporaryImageUrl = httpsUrl(item.link);
      const temporaryThumbnailUrl = httpsUrl(item.thumbnail);
      if (temporaryImageUrl === null || temporaryThumbnailUrl === null) return [];
      return [Object.freeze({
        title: plainText(item.title),
        temporaryImageUrl,
        temporaryThumbnailUrl,
        sourceDocumentUrl: temporaryImageUrl,
        width: dimension(item.sizewidth),
        height: dimension(item.sizeheight),
      })];
    });
    return Object.freeze({ state: 'ready', candidates: Object.freeze(candidates) });
  } catch {
    return Object.freeze({ state: 'provider-error', candidates: Object.freeze([]), reason: 'request-failed' });
  }
}
