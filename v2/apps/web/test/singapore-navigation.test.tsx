import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home from '../app/(en)/page';
import { SingaporeEntry } from '../components/singapore/singapore-entry';
import { buildHomepagePresentation } from '../lib/site-copy';

const unavailable = {
  status: 'unavailable',
  message: 'Verified Singapore evidence unavailable',
  correctionHref: '/sg/singapore/corrections/',
} as const;
const ready = {
  status: 'ready',
  city: 'Singapore',
  currency: 'SGD',
  transactionLabel: '12 private residential sale transactions',
  projectLabel: '2 projects',
  periodLabel: 'Jun 2026–Aug 2026',
  exploreHref: '/sg/singapore/explore/',
  correctionHref: '/sg/singapore/corrections/',
  evidence: {
    provider: 'URA',
    dataset: 'private residential sale transactions',
    period: '2026-06/2026-08',
    generatedAt: '2026-09-01T00:00:00.000Z',
    publicationMinimum: 5,
    rightsPolicyId: 'sg-ura-private-sale-v1',
    limitations: ['Private residential sales only.'],
    correctionHref: '/sg/singapore/corrections/',
    descriptor: {} as never,
  },
} as const;

describe('Singapore navigation promotion gate', () => {
  it('uses the compact product intro even when Singapore evidence is unavailable', () => {
    const html = renderToStaticMarkup(<SingaporeEntry model={unavailable} />);

    expect(html).toContain('data-product-intro="true"');
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });

  it('shows actual Singapore counts, period, currency and limits without internal product status rows', () => {
    const html = renderToStaticMarkup(<SingaporeEntry model={ready} />);

    expect(html).toContain('data-market-overview="true"');
    expect(html).toMatch(/Transactions<\/dt><dd[^>]*>12/);
    expect(html).toMatch(/Projects<\/dt><dd[^>]*>2/);
    expect(html).toContain('SGD');
    expect(html).toContain('Jun 2026–Aug 2026');
    expect(html).toContain('Private residential sales only.');
    expect(html).toContain('https://www.ura.gov.sg/Corporate/Property/Property-Data');
    expect(html).toContain('href="/sg/singapore/check"');
    expect(html).not.toContain('Current product depth');
    expect(html).not.toContain('data-overview-row=');
  });

  it('keeps Korean Singapore comparison actions localized even without evidence', () => {
    const html = renderToStaticMarkup(<SingaporeEntry model={unavailable} locale="ko" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('href="/ko/sg/singapore/check"');
    expect(html).toContain('href="/ko/sg/singapore/explore"');
    expect(html).toContain('href="/ko/sg/singapore/corrections"');
    expect(html).not.toContain('<dt>');
    expect(html).not.toContain('Release gate');
  });

  it('keeps Singapore and Dubai visible in global market navigation', async () => {
    const presentation = buildHomepagePresentation(unavailable);
    expect(presentation.copy.marketIds).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    const hrefs = presentation.markets.flatMap((market) =>
      market.slots.flatMap((slot) => slot.href ?? []),
    );
    expect(hrefs).toContain('/kr/seoul/community/');
    expect(hrefs).toContain('/sg/singapore/explore/');
    expect(hrefs).toContain('/sg/singapore/community/');
    expect(hrefs).toContain('/ae/dubai/explore/');
    expect(hrefs).toContain('/ae/dubai/community/');

    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('href="/sg">Singapore</a>');
    expect(html).toContain('href="/ae/dubai">Dubai</a>');
  });

  it('adds Singapore Explore after its evidence gate passes while Seoul stays crawlable', () => {
    const presentation = buildHomepagePresentation(ready);
    expect(presentation.copy.marketIds).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(presentation.copy.header.links).not.toContainEqual({
      label: 'Singapore evidence', href: '/sg/', ariaLabel: 'Singapore evidence',
    });
    expect(presentation.markets.map(({ id }) => id)).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(presentation.singapore).toEqual(ready);
    expect(
      presentation.markets.map((market) => ({
        id: market.id,
        slots: market.slots.map((slot) => ({ id: slot.id, href: slot.href })),
      })),
    ).toEqual([
      {
        id: 'kr-seoul',
        slots: [
          { id: 'check', href: '/kr/seoul/check/' },
          { id: 'explore', href: '/kr/seoul/explore/' },
          { id: 'rankings', href: '/kr/seoul/rankings/' },
          { id: 'news', href: '/kr/seoul/news/' },
          { id: 'guide', href: '/kr/seoul/guide/' },
          { id: 'community', href: '/kr/seoul/community/' },
        ],
      },
      {
        id: 'sg-singapore',
        slots: [
          { id: 'check', href: '/sg/singapore/check/' },
          { id: 'explore', href: '/sg/singapore/explore/' },
          { id: 'rankings', href: '/sg/singapore/rankings/' },
          { id: 'news', href: '/sg/singapore/news/' },
          { id: 'guide', href: '/sg/singapore/guide/' },
          { id: 'community', href: '/sg/singapore/community/' },
        ],
      },
      {
        id: 'ae-dubai',
        slots: [
          { id: 'check', href: '/ae/dubai/check/' },
          { id: 'explore', href: '/ae/dubai/explore/' },
          { id: 'rankings', href: '/ae/dubai/rankings/' },
          { id: 'news', href: '/ae/dubai/news/' },
          { id: 'guide', href: '/ae/dubai/guide/' },
          { id: 'community', href: '/ae/dubai/community/' },
        ],
      },
    ]);
    expect(JSON.stringify(presentation)).toMatch(/href":"\/ae\/dubai\/explore\//);
  });
});
