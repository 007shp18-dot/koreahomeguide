import 'server-only';

import { createHash } from 'node:crypto';

import type { NewsWorkspaceItem } from './news-workspace-model';

const rssEntities: Readonly<Record<string, string>> = Object.freeze({
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
});

function plainRssText(value: string): string {
  return value
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      return rssEntities[code.toLowerCase()] ?? entity;
    })
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type GoogleNewsFeed = Readonly<{
  market: 'seoul' | 'singapore' | 'dubai';
  marketLabel: string;
  query: string;
}>;

const feeds: readonly GoogleNewsFeed[] = Object.freeze([
  { market: 'seoul', marketLabel: 'Seoul', query: 'Seoul real estate OR South Korea housing' },
  { market: 'singapore', marketLabel: 'Singapore', query: 'Singapore property OR HDB OR condominium' },
  { market: 'dubai', marketLabel: 'Dubai', query: 'Dubai property OR real estate OR off-plan' },
] as const);

function tag(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match?.[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() ?? null;
}

function safeUrl(value: string | null): string | null {
  if (value === null) return null;
  try {
    const parsed = new URL(plainRssText(value));
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function categoryFor(text: string): string {
  if (/policy|regulation|government|ura|hdb|ministry/i.test(text)) return 'Policy & official';
  if (/price|sales|rent|index|transaction|mortgage/i.test(text)) return 'Market data';
  if (/launch|supply|development|redevelopment|off-plan/i.test(text)) return 'Supply & development';
  return 'Global property news';
}

export function parseGoogleNewsRss(
  xml: string,
  feed: GoogleNewsFeed,
): readonly NewsWorkspaceItem[] {
  return Object.freeze([...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const block = match[1] ?? '';
    const title = plainRssText(tag(block, 'title') ?? '');
    const summary = plainRssText(tag(block, 'description') ?? '');
    const url = safeUrl(tag(block, 'link'));
    const publisher = plainRssText(tag(block, 'source') ?? '') || 'Google News publisher';
    const publishedAt = new Date(plainRssText(tag(block, 'pubDate') ?? ''));
    if (title === '' || summary === '' || url === null || !Number.isFinite(publishedAt.getTime())) return [];
    return [Object.freeze({
      id: `google-rss-${createHash('sha256').update(url).digest('hex').slice(0, 20)}`,
      market: feed.market,
      marketLabel: feed.marketLabel,
      title,
      summary,
      url,
      internalHref: null,
      publisher,
      publishedAt: publishedAt.toISOString(),
      category: categoryFor(`${title} ${summary}`),
      evidence: 'checking' as const,
      evidenceLine: 'External headline discovered through Google News RSS. Open the original publisher and verify the claim against SignedPrice data.',
      sourceKind: 'google-news-rss' as const,
    })];
  }));
}

export type GoogleNewsRssResult = Readonly<{
  items: readonly NewsWorkspaceItem[];
  state: 'ready' | 'unavailable';
  failedFeeds: number;
}>;

export async function fetchGoogleNewsRssItems(): Promise<GoogleNewsRssResult> {
  const results = await Promise.allSettled(feeds.map(async (feed) => {
    const url = new URL('https://news.google.com/rss/search');
    url.searchParams.set('q', feed.query);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'US');
    url.searchParams.set('ceid', 'US:en');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SignedPrice/1.0 (+https://www.signedprice.com)' },
      next: { revalidate: 1800 },
    });
    if (!response.ok) throw new Error(`google-news-rss-status:${response.status}`);
    return parseGoogleNewsRss(await response.text(), feed);
  }));
  const unique = new Map<string, NewsWorkspaceItem>();
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const item of result.value) if (!unique.has(item.url)) unique.set(item.url, item);
  }
  return Object.freeze({
    items: Object.freeze([...unique.values()]),
    state: results.some((result) => result.status === 'fulfilled') ? 'ready' : 'unavailable',
    failedFeeds: results.filter((result) => result.status === 'rejected').length,
  });
}
