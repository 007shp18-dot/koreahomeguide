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
  evidence: {} as never,
} as const;

describe('Singapore navigation promotion gate', () => {
  it('uses the compact product intro even when Singapore evidence is unavailable', () => {
    const html = renderToStaticMarkup(<SingaporeEntry model={unavailable} />);

    expect(html).toContain('data-product-intro="true"');
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });

  it('keeps Singapore and Dubai visible in global market navigation', async () => {
    const presentation = buildHomepagePresentation(unavailable);
    expect(presentation.copy.marketIds).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(
      presentation.markets.flatMap((market) =>
        market.slots.flatMap((slot) => slot.href ?? []),
      ),
    ).toEqual([
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/news/',
      '/kr/seoul/guide/',
    ]);

    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('href="/sg">Singapore</a>');
    expect(html).toContain('href="/markets#dubai">Dubai</a>');
  });

  it('adds Singapore Explore after its evidence gate passes while Seoul stays crawlable', () => {
    const presentation = buildHomepagePresentation(ready);
    expect(presentation.copy.marketIds).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(presentation.copy.header.links).toContainEqual({
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
          { id: 'community', href: undefined },
        ],
      },
      {
        id: 'sg-singapore',
        slots: [
          { id: 'check', href: undefined },
          { id: 'explore', href: '/sg/singapore/explore/' },
          { id: 'rankings', href: undefined },
          { id: 'news', href: undefined },
          { id: 'guide', href: undefined },
          { id: 'community', href: undefined },
        ],
      },
      {
        id: 'ae-dubai',
        slots: [
          { id: 'check', href: undefined },
          { id: 'explore', href: undefined },
          { id: 'rankings', href: undefined },
          { id: 'news', href: undefined },
          { id: 'guide', href: undefined },
          { id: 'community', href: undefined },
        ],
      },
    ]);
    expect(JSON.stringify(presentation)).not.toMatch(/href":"\/ae\//);
  });
});
