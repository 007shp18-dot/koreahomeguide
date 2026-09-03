import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import GuideIndexPage, { metadata as indexMetadata } from '../app/(en)/kr/seoul/guide/page';
import GuideDocumentPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/guide/[slug]/page';
import { GUIDES, GUIDE_GLOSSARY } from '../lib/guide/guide-content';

const expectedGuides = [
  { slug: 'compare-two-contracts', stage: 'Before signing', readMinutes: 4 },
  { slug: 'read-district-evidence', stage: 'Market research', readMinutes: 3 },
  { slug: 'understand-publication-limits', stage: 'Evidence check', readMinutes: 3 },
] as const;

describe('Korea methodology guides', () => {
  it('publishes exactly three immutable methodology documents and the glossary', () => {
    expect(GUIDES.map(({ slug, stage, readMinutes }) => ({ slug, stage, readMinutes })))
      .toEqual(expectedGuides);
    expect(Object.isFrozen(GUIDES)).toBe(true);
    expect(GUIDE_GLOSSARY.map(({ term }) => term)).toEqual([
      'reported contract', 'median', 'middle half', 'publication minimum',
      'withheld', 'conversion curve', 'completed period', 'correction',
    ]);
    for (const guide of GUIDES) {
      expect(guide.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.links.map(({ href }) => href)).toContain('/trust/');
      expect(JSON.stringify(guide)).not.toMatch(/₩|72,291|29\.4|\b\d+(?:\.\d+)?%/);
      expect(JSON.stringify(guide)).not.toMatch(/within \d+ days|legal deadline|guaranteed|must file/i);
    }
    expect(GUIDES.flatMap(({ links }) => links)).toContainEqual({
      label: 'Open Contract Check',
      href: '/kr/seoul/check/',
    });
    for (const entry of GUIDE_GLOSSARY) expect(entry.whyItMatters.length).toBeGreaterThan(0);
  });

  it('renders an indexable guide hub with every guide and glossary definition', () => {
    const html = renderToStaticMarkup(<GuideIndexPage />);

    expect(indexMetadata.robots).toEqual({ index: true, follow: true });
    expect(indexMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/guide/',
    });
    for (const guide of GUIDES) {
      expect(html).toContain(guide.title);
      expect(html).toContain(`href="/kr/seoul/guide/${guide.slug}"`);
      expect(html).toContain(`data-guide-stage="${guide.stage}"`);
    }
    for (const entry of GUIDE_GLOSSARY) {
      expect(html).toContain(entry.term);
      expect(html).toContain(entry.whyItMatters);
    }
    expect(html).toContain('href="/kr/seoul/check"');
    expect(html).not.toMatch(/data-guide-stage="(?:Buy|Invest)"/);
  });

  it('keeps the shared market and product navigation around the Guide index', () => {
    const html = renderToStaticMarkup(<GuideIndexPage />);

    expect(html.match(/data-navigation-tier="product"/g) ?? []).toHaveLength(1);
    expect(html).toContain('class="site-header__market-tier"');
    expect(html.match(/<footer/g) ?? []).toHaveLength(1);
    for (const href of [
      '/kr/seoul/',
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/news/',
      '/kr/seoul/community/',
      '/kr/seoul/guide/',
    ]) {
      expect(html).toContain(`href="${href.slice(0, -1)}"`);
    }
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/kr\/seoul\/guide"/);
    expect(html).toContain('<strong>Overview</strong>');
    expect(html).not.toMatch(/>Rent<|>Buy<|>Evidence</);
  });

  it('generates exact static params and renders every shareable guide', async () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual(expectedGuides.map(({ slug }) => ({ slug })));
    for (const guide of GUIDES) {
      const params = Promise.resolve({ slug: guide.slug });
      const metadata = await generateMetadata({ params });
      const html = renderToStaticMarkup(await GuideDocumentPage({ params }));
      expect(metadata).toMatchObject({
        title: `${guide.title} | signedprice`,
        robots: { index: true, follow: true },
        alternates: {
          canonical: `https://www.signedprice.com/kr/seoul/guide/${guide.slug}/`,
        },
      });
      expect(html).toContain(guide.title);
      expect(html).toContain(`dateTime="${guide.lastVerified}"`);
      expect(html).toContain(guide.evidenceBoundary);
      expect(html).toContain('href="/trust"');
      expect(html.match(/data-navigation-tier="product"/g) ?? []).toHaveLength(1);
      expect(html).toContain('class="site-header__market-tier"');
      expect(html.match(/<footer/g) ?? []).toHaveLength(1);
      expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/kr\/seoul\/guide"/);
    }
  });
});
