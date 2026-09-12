import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (callback: () => unknown) => callback }));
const stored = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../lib/content/content-repository.server', () => ({ listPublishedContent: stored.list }));
import KoreanNewsPage from '../app/(ko)/ko/news/page';
import ChineseNewsPage from '../app/(zh-cn)/zh-cn/news/page';
import { buildInsightItems } from '../components/newsroom/insights-index';
import { listPortfolioRecords } from '../content/portfolio-manifest';

const base = listPortfolioRecords('en').find(article => article.type === 'data-story')!;
const profile = { ...base, id: 'en:seoul-mullae-steel-and-art', slug: 'seoul-mullae-steel-and-art',
  title: 'Mullae: the workshop doors still matter', marketId: 'kr-seoul' as const,
  publishedAt: '2025-01-01T10:00:00.000Z', canonicalHref: '/news/seoul-mullae-steel-and-art/',
  bodyMarkdown: '![Mullae lane](/api/editorial-images/fea7c09a-ebc2-473a-94ae-2359aef6eb35/)\n*Photographed 2023-03-25. CC BY 2.0.*' };

describe('published neighborhood discovery', () => {
  it.each(['seoul-mullae-steel-and-art', 'singapore-kampong-gelam-trades-and-streets', 'tokyo-kuramae-craft-and-river', 'dubai-al-fahidi-creek-walk'])('classifies %s as neighborhood living while keeping its article and photo', slug => {
    const article = { ...profile, slug, canonicalHref: `/news/${slug}/` };
    const item = buildInsightItems([article], 'all').find(item => item.href === article.canonicalHref)!;
    expect(item).toMatchObject({ topic: 'Neighborhood living', investment: false,
      uploadedPhoto: { src: '/api/editorial-images/fea7c09a-ebc2-473a-94ae-2359aef6eb35/' } });
    expect(buildInsightItems([article], 'all', 'en', 'investment').some(item => item.href === article.canonicalHref)).toBe(false);
  });
  it.each([['ko', KoreanNewsPage], ['zh-CN', ChineseNewsPage]] as const)('shows an untranslated stored article with its English URL in the %s index', async (locale, Page) => {
    vi.stubEnv('DATABASE_URL', 'test-only');
    stored.list.mockImplementation(async ({ locale }: { locale: string }) => locale === 'en' ? [profile] : []);
    try {
      const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ market: 'seoul' }) }));
      expect(html.match(/href="[^"]*mullae[^"]*"/g)).toContainEqual(expect.stringMatching(/^href="\/news\/seoul-mullae-steel-and-art\/?"$/));
      expect(html).toContain(profile.title);
      expect(html).toContain('>English</span>');
      expect(html).toContain(locale === 'ko' ? '동네 생활' : '社区生活');
    } finally { vi.unstubAllEnvs(); }
  });
});
