import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PublishedContentArticle } from '../lib/content/content-types';
vi.mock('server-only', () => ({}));
const { listPublishedContent } = vi.hoisted(() => ({ listPublishedContent: vi.fn() }));
vi.mock('../lib/content/content-repository.server', () => ({ listPublishedContent, getPublishedContent: vi.fn() }));
import { listNewsroomArticles, listInsightArticles, listLatestInsightArticles } from '../lib/content/newsroom-content.server';
const fixture = (locale: 'en' | 'ko', slug: string, publishedAt = '2026-09-19T09:27:42.710Z'): PublishedContentArticle => ({
  id: `${locale}:${slug}`, slug, locale, type: 'data-story', marketId: 'kr-seoul',
  title: 'A Seoul purchase budget', deck: 'A defined sample of recorded apartment sales.',
  bodyMarkdown: '## Sample\n\nThe sample has a specific contract period.', status: 'published',
  evidenceState: 'partial', authorName: 'SignedPrice Data Desk', reviewedAt: publishedAt,
  reviewedBy: 'editor', publishedAt, updatedAt: publishedAt, relatedHref: '/kr/seoul/explore/',
  sources: [{ id: 'molit', kind: 'primary', publisher: 'MOLIT', title: 'Recorded sales', href: 'https://rt.molit.go.kr/', checkedAt: publishedAt }],
});
beforeEach(() => { listPublishedContent.mockReset(); });
describe('live publication discovery', () => {
  it('can discover a new publication after an empty database response', async () => {
    const latest = fixture('en', 'newly-published-analysis');
    listPublishedContent.mockResolvedValueOnce([]).mockResolvedValueOnce([latest]);
    expect((await listNewsroomArticles('en')).some(item => item.slug === latest.slug)).toBe(false);
    expect((await listNewsroomArticles('en'))[0]).toMatchObject({ slug: latest.slug, canonicalHref: '/news/newly-published-analysis/' });
  });
  it('prefers a separately slugged Korean edition over its English original', async () => {
    const english = fixture('en', 'seoul-1-billion-80-90sqm-august-2026');
    const korean = fixture('ko', `${english.slug}-ko`);
    listPublishedContent.mockImplementation(async ({ locale }) => locale === 'ko' ? [korean] : [english]);
    const editions = (await listInsightArticles('ko')).filter(item => item.slug.startsWith(english.slug));
    expect(editions).toHaveLength(1);
    expect(editions[0]).toMatchObject({ locale: 'ko', canonicalHref: `/ko/news/${korean.slug}/`, translationGroupId: english.slug });
  });
  it('offers the homepage current analysis without neighborhood profiles or future records', async () => {
    const latest = fixture('en', 'newly-published-analysis');
    listPublishedContent.mockResolvedValue([fixture('en', 'scheduled-analysis', '2099-01-01T00:00:00Z'), fixture('en', 'singapore-little-india-tekka-campbell-lane'), latest]);
    const feed = await listLatestInsightArticles('en', 1);
    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({ slug: latest.slug, marketId: 'kr-seoul', publishedAt: latest.publishedAt });
  });
});
