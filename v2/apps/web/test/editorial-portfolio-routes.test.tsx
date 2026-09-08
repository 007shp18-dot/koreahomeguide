import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import GuidesPage from '../app/(en)/guides/page';
import KoreanGuidesPage from '../app/(ko)/ko/guides/page';
import GuidePage, { generateMetadata as guideMetadata, generateStaticParams as guideParams } from '../app/(en)/guides/[slug]/page';
import ChineseGuidesPage from '../app/(zh-cn)/zh-cn/guides/page';
import ChineseNewsPage from '../app/(zh-cn)/zh-cn/news/page';
import ChineseGuidePage, { generateStaticParams as chineseGuideParams } from '../app/(zh-cn)/zh-cn/guides/[slug]/page';
import { listPortfolioRecords } from '../content/portfolio-manifest';

describe('editorial portfolio public routes', () => {
  it('curates the practical directory while keeping all ten existing guide URLs', async () => {
    const guides = listPortfolioRecords('en').filter(({ type }) => type === 'guide');
    const html = renderToStaticMarkup(await GuidesPage({ searchParams: Promise.resolve({}) }));
    expect(guides).toHaveLength(10);
    expect(guideParams()).toEqual(guides.map(({ slug }) => ({ slug })));
    const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
    expect(main.match(/<h3>/g)).toHaveLength(6);
    for (const slug of ['buy-property-in-korea-as-foreigner', 'read-singapore-private-transactions', 'rent-an-apartment-in-korea', 'wolse-vs-jeonse', 'korea-rental-contract-checklist']) expect(main).toContain(`/guides/${slug}`);
    expect(main).toContain('/ae/dubai/guide');
    for (const slug of ['read-seoul-sale-transactions', 'compare-seoul-district-prices', 'seoul-apartment-buying-budget-guide']) expect(main).not.toContain(slug);
  });

  it('filters guides by city and makes Dubai research discoverable', async () => {
    const html = renderToStaticMarkup(await GuidesPage({ searchParams: Promise.resolve({market: 'dubai'}) }));
    expect(html).toContain('Buying in Dubai: checks before you commit');
    expect(html.match(/<h3>/g)).toHaveLength(1);
    expect(html).not.toContain('/guides/read-singapore-private-transactions');
  });

  it('offers the same six practical guides in Korean and keeps city selection', async () => {
    const html = renderToStaticMarkup(await KoreanGuidesPage({ searchParams: Promise.resolve({}) }));
    expect(html.match(/<h3>/g)).toHaveLength(6);
    expect(html).toContain('/ko/ae/dubai/guide');
    expect(html).toContain('한국에서 집 구하기');
    const dubai = renderToStaticMarkup(await KoreanGuidesPage({ searchParams: Promise.resolve({ market: 'dubai' }) }));
    expect(dubai.match(/<h3>/g)).toHaveLength(1);
    expect(dubai).toContain('두바이 주택 매수 전 확인할 사항');
  });

  it('renders an evidence-reviewed English guide with its canonical', async () => {
    const guide = listPortfolioRecords('en').find(({ type }) => type === 'guide')!;
    const params = Promise.resolve({ slug: guide.slug });
    const html = renderToStaticMarkup(await GuidePage({ params }));
    const metadata = await guideMetadata({ params });
    expect(html).toContain(guide.title);
    expect(html).not.toContain(guide.reviewedBy);
    expect(html).toContain(guide.sources[0]!.href);
    expect(metadata.alternates).toMatchObject({ canonical: `https://www.signedprice.com${guide.canonicalHref}` });
  });

  it('publishes all eight independently reviewed Chinese records', async () => {
    const records = listPortfolioRecords('zh-CN');
    const guides = records.filter(({ type }) => type === 'guide');
    const guideIndex = renderToStaticMarkup(<ChineseGuidesPage />);
    const newsIndexes = (await Promise.all(['insights', 'news', 'policy'].map(async (type) =>
      renderToStaticMarkup(await ChineseNewsPage({ searchParams: Promise.resolve({ type }) })),
    ))).join('');
    expect(records).toHaveLength(8);
    expect(chineseGuideParams()).toEqual(guides.map(({ slug }) => ({ slug })));
    for (const record of records) {
      expect(record.type === 'guide' ? guideIndex : newsIndexes).toContain(record.title);
    }
    const guide = guides[0]!;
    expect(renderToStaticMarkup(await ChineseGuidePage({ params: Promise.resolve({ slug: guide.slug }) })))
      .not.toContain(guide.reviewedBy);
  });
});
