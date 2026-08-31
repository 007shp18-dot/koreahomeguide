import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import GuideIndexPage, { metadata as indexMetadata } from '../app/kr/seoul/guide/page';
import GuideDocumentPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/kr/seoul/guide/[slug]/page';
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
    for (const entry of GUIDE_GLOSSARY) expect(entry.whyItMatters.length).toBeGreaterThan(0);
  });

  it('renders a noindex index with every guide and glossary definition', () => {
    const html = renderToStaticMarkup(<GuideIndexPage />);

    expect(indexMetadata.robots).toEqual({ index: false, follow: true });
    expect(indexMetadata).not.toHaveProperty('alternates');
    for (const guide of GUIDES) {
      expect(html).toContain(guide.title);
      expect(html).toContain(`href="/kr/seoul/guide/${guide.slug}"`);
    }
    for (const entry of GUIDE_GLOSSARY) {
      expect(html).toContain(entry.term);
      expect(html).toContain(entry.whyItMatters);
    }
    expect(html).not.toMatch(/data-public-tab="news"|>News</);
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
        robots: { index: false, follow: true },
      });
      expect(metadata).not.toHaveProperty('alternates');
      expect(html).toContain(guide.title);
      expect(html).toContain(`dateTime="${guide.lastVerified}"`);
      expect(html).toContain(guide.evidenceBoundary);
      expect(html).toContain('href="/trust"');
    }
  });
});
