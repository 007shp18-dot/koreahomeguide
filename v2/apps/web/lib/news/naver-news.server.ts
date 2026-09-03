import 'server-only';

import type { NewsIndexModel } from './news-route-model.server';
import type { NewsWorkspaceItem, NewsWorkspaceModel } from './news-workspace-model';

type NaverNewsItem = Readonly<{
  title?: unknown;
  originallink?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
}>;

type NaverNewsResponse = Readonly<{ items?: unknown }>;

const searches = Object.freeze([
  { market: 'seoul', marketLabel: 'Seoul', query: '서울 아파트 부동산 매매' },
  { market: 'singapore', marketLabel: 'Singapore', query: '싱가포르 부동산 주택' },
  { market: 'dubai', marketLabel: 'Dubai', query: '두바이 부동산 주택' },
] as const);

const entityMap: Readonly<Record<string, string>> = Object.freeze({
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
});

export function plainNewsText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      return entityMap[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function safeArticleUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function publisherFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'External publisher';
  }
}

function categoryFor(text: string): string {
  if (/정책|규제|정부|국토부|ura|hdb/i.test(text)) return 'Official update';
  if (/통계|거래량|가격|지수|매매/i.test(text)) return 'Market data';
  if (/개발|분양|공급|재건축/i.test(text)) return 'Supply & development';
  return 'Market news';
}

async function fetchMarketNews(search: (typeof searches)[number], clientId: string, clientSecret: string): Promise<readonly NewsWorkspaceItem[]> {
  const url = new URL('https://openapi.naver.com/v1/search/news.json');
  url.searchParams.set('query', search.query);
  url.searchParams.set('display', '12');
  url.searchParams.set('start', '1');
  url.searchParams.set('sort', 'date');
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    next: { revalidate: 900 },
  });
  if (!response.ok) throw new Error(`naver-status:${response.status}`);
  const body = await response.json() as NaverNewsResponse;
  if (!Array.isArray(body.items)) return Object.freeze([]);
  return Object.freeze((body.items as NaverNewsItem[]).flatMap((item, index) => {
    const urlValue = safeArticleUrl(item.originallink) ?? safeArticleUrl(item.link);
    if (urlValue === null || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.pubDate !== 'string') return [];
    const published = new Date(item.pubDate);
    if (!Number.isFinite(published.getTime())) return [];
    const title = plainNewsText(item.title);
    const summary = plainNewsText(item.description);
    if (title === '' || summary === '') return [];
    return [Object.freeze({
      id: `naver-${search.market}-${published.getTime()}-${index}`,
      market: search.market,
      marketLabel: search.marketLabel,
      title,
      summary,
      url: urlValue,
      internalHref: null,
      publisher: publisherFor(urlValue),
      publishedAt: published.toISOString(),
      category: categoryFor(`${title} ${summary}`),
      evidence: 'checking' as const,
      evidenceLine: 'External headline from Naver News Search. It has not yet been reconciled with SignedPrice transaction evidence.',
      sourceKind: 'naver-search' as const,
    })];
  }));
}

function approvedItems(news: NewsIndexModel): readonly NewsWorkspaceItem[] {
  return Object.freeze(news.records.map((record) => Object.freeze({
    id: `approved-${record.id}`,
    market: 'seoul' as const,
    marketLabel: 'Seoul',
    title: record.title,
    summary: record.summary,
    url: record.source.url,
    internalHref: `/kr/seoul/news/${record.slug}/`,
    publisher: record.source.publisher,
    publishedAt: record.publishedAt,
    category: record.category.replaceAll('-', ' '),
    evidence: record.evidence.status === 'verified' ? 'matched' as const : 'checking' as const,
    evidenceLine: record.evidence.line,
    sourceKind: 'signedprice-brief' as const,
  })));
}

export function buildApprovedNewsWorkspaceModel(news: NewsIndexModel): NewsWorkspaceModel {
  return Object.freeze({ items: approvedItems(news), naverState: 'not-configured' });
}

export async function buildNewsWorkspaceModel(news: NewsIndexModel): Promise<NewsWorkspaceModel> {
  const clientId = process.env.NAVER_NEWS_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_NEWS_CLIENT_SECRET?.trim();
  const fallback = approvedItems(news);
  if (!clientId || !clientSecret) return Object.freeze({ items: fallback, naverState: 'not-configured' });
  const results = await Promise.allSettled(searches.map((search) => fetchMarketNews(search, clientId, clientSecret)));
  const external = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const unique = new Map<string, NewsWorkspaceItem>();
  for (const item of [...fallback, ...external]) if (!unique.has(item.url)) unique.set(item.url, item);
  const items = Object.freeze([...unique.values()].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)));
  const failureCodes = results.flatMap((result) => result.status === 'rejected' && result.reason instanceof Error
    ? [result.reason.message]
    : []);
  const naverDiagnostic = failureCodes.some((message) => message === 'naver-status:401')
    ? 'credentials-rejected' as const
    : failureCodes.some((message) => message === 'naver-status:403')
      ? 'permission-denied' as const
      : failureCodes.some((message) => message === 'naver-status:429')
        ? 'rate-limited' as const
        : failureCodes.some((message) => /^naver-status:5\d\d$/.test(message))
          ? 'upstream-error' as const
          : 'network-error' as const;
  return Object.freeze({
    items,
    naverState: results.some((result) => result.status === 'fulfilled') ? 'ready' : 'unavailable',
    ...(results.some((result) => result.status === 'fulfilled') ? {} : { naverDiagnostic }),
  });
}
