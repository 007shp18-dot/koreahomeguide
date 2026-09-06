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
}>;

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

function dimension(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function searchNaverBuildingImages(input: Readonly<{
  buildingName: string;
  address: string;
  display?: number;
}>): Promise<NaverImageCandidateResult> {
  const clientId = (process.env.NAVER_SEARCH_CLIENT_ID ?? process.env.NAVER_NEWS_CLIENT_ID)?.trim();
  const clientSecret = (process.env.NAVER_SEARCH_CLIENT_SECRET ?? process.env.NAVER_NEWS_CLIENT_SECRET)?.trim();
  if (!clientId || !clientSecret) return Object.freeze({ state: 'not-configured', candidates: Object.freeze([]) });

  const requestedDisplay = Number.isInteger(input.display) ? input.display as number : 20;
  const display = Math.min(Math.max(requestedDisplay, 1), 100);
  const endpoint = new URL('https://openapi.naver.com/v1/search/image');
  endpoint.search = new URLSearchParams({
    query: `${input.buildingName} ${input.address}`.trim(),
    display: String(display),
    sort: 'sim',
    filter: 'large',
  }).toString();

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return Object.freeze({ state: 'provider-error', candidates: Object.freeze([]) });
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
    return Object.freeze({ state: 'provider-error', candidates: Object.freeze([]) });
  }
}
