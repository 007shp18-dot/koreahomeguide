import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home from '../app/page';
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
  it('keeps Singapore and Dubai out for every unavailable evidence cause', async () => {
    const presentation = buildHomepagePresentation(unavailable);
    expect(presentation.copy.marketIds).toEqual(['kr-seoul']);
    expect(JSON.stringify(presentation)).not.toMatch(/href":"\/(?:sg|ae)\//);

    const html = renderToStaticMarkup(await Home());
    expect(html).not.toMatch(/href="\/(?:sg|ae)\//);
  });

  it('adds only the Singapore evidence entry after the entry model is ready', () => {
    const presentation = buildHomepagePresentation(ready);
    expect(presentation.copy.marketIds).toEqual(['kr-seoul', 'sg-singapore']);
    expect(presentation.copy.header.links).toContainEqual({
      label: 'Singapore evidence', href: '/sg/', ariaLabel: 'Singapore evidence',
    });
    expect(presentation.markets.map(({ id }) => id)).toEqual(['kr-seoul', 'sg-singapore']);
    expect(presentation.groups.flatMap(({ destinations }) => destinations)
      .filter(({ label }) => label === 'Singapore')
      .every(({ href }) => href === '/sg/')).toBe(true);
    expect(JSON.stringify(presentation)).not.toMatch(/href":"\/ae\//);
  });
});
