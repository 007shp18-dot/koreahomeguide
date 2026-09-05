import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import GuidesPage from '../app/(en)/guides/page';
import GuidePage, { generateMetadata as guideMetadata, generateStaticParams as guideParams } from '../app/(en)/guides/[slug]/page';
import ChineseGuidesPage from '../app/(zh-cn)/zh-cn/guides/page';
import ChineseNewsPage from '../app/(zh-cn)/zh-cn/news/page';
import ChineseGuidePage, { generateStaticParams as chineseGuideParams } from '../app/(zh-cn)/zh-cn/guides/[slug]/page';
import { listPortfolioRecords } from '../content/portfolio-manifest';

describe('editorial portfolio public routes', () => {
  it('publishes all seven English guides on the global Guide hub', () => {
    const guides = listPortfolioRecords('en').filter(({ type }) => type === 'guide');
    const html = renderToStaticMarkup(<GuidesPage />);
    expect(guides).toHaveLength(7);
    expect(guideParams()).toEqual(guides.map(({ slug }) => ({ slug })));
    for (const guide of guides) {
      expect(html).toContain(guide.title);
      expect(html).toContain(`href="${guide.canonicalHref.slice(0, -1)}"`);
    }
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
    const newsIndex = renderToStaticMarkup(<ChineseNewsPage />);
    expect(records).toHaveLength(8);
    expect(chineseGuideParams()).toEqual(guides.map(({ slug }) => ({ slug })));
    for (const record of records) {
      expect(record.type === 'guide' ? guideIndex : newsIndex).toContain(record.title);
    }
    const guide = guides[0]!;
    expect(renderToStaticMarkup(await ChineseGuidePage({ params: Promise.resolve({ slug: guide.slug }) })))
      .not.toContain(guide.reviewedBy);
  });
});
