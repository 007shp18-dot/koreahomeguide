import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  getPublicMarketConfig,
  type PublishedMarketSummary,
  type WithheldMarketSummary,
} from '@signedprice/market-core';
import {
  QuoteInput,
  buildPublicQuoteViewModel,
  parsePublicQuoteInput,
} from '../components/public-market/quote-input';

const source = readFileSync(
  new URL('../components/public-market/quote-input.tsx', import.meta.url),
  'utf8',
);
const css = readFileSync(
  new URL('../components/public-market/public-market.module.css', import.meta.url),
  'utf8',
);
const config = getPublicMarketConfig('kr-seoul');
const published: PublishedMarketSummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'rent',
  band: 'all-homes', period: '2026-05/2026-07', n: 20, published: true,
  min: 1_000_000, p25: 2_000_000, med: 3_000_000,
  p75: 4_000_000, max: 5_000_000, chg3m: null,
};
const withheld: WithheldMarketSummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'rent',
  band: 'all-homes', period: '2026-05/2026-07', n: 4, published: false,
};

describe('public quote input model', () => {
  it.each([
    ['', { status: 'empty' }],
    ['0', { status: 'valid', value: 0 }],
    ['3500000', { status: 'valid', value: 3_500_000 }],
    ['3,500,000', { status: 'invalid' }],
    ['-1', { status: 'invalid' }],
    ['1.5', { status: 'invalid' }],
    ['9007199254740992', { status: 'invalid' }],
  ] as const)('parses and preserves quote draft %j', (raw, parsed) => {
    expect(parsePublicQuoteInput(raw)).toEqual(parsed);
  });

  it('updates marker and verdict without changing the summary', () => {
    const below = buildPublicQuoteViewModel(published, '500000', config.axis);
    const within = buildPublicQuoteViewModel(published, '3500000', config.axis);
    const above = buildPublicQuoteViewModel(published, '6000000', config.axis);

    expect(below.position).toMatchObject({ markerPct: 10, verdict: 'below-typical' });
    expect(within.position).toMatchObject({ markerPct: 70, verdict: 'within-typical' });
    expect(above.position).toMatchObject({ markerPct: 100, verdict: 'above-typical' });
    expect(published.med).toBe(3_000_000);
  });

  it('never constructs a marker or percentile from withheld evidence', () => {
    expect(buildPublicQuoteViewModel(withheld, '3500000', config.axis)).toEqual({
      draft: '3500000',
      parsed: { status: 'valid', value: 3_500_000 },
      position: null,
      error: null,
    });
  });

  it('keeps empty and invalid edits visible without a position', () => {
    expect(buildPublicQuoteViewModel(published, '', config.axis)).toMatchObject({
      draft: '', position: null, error: null,
    });
    expect(buildPublicQuoteViewModel(published, 'bad input', config.axis)).toMatchObject({
      draft: 'bad input',
      position: null,
      error: 'Enter a whole, non-negative amount without commas.',
    });
  });
});

describe('public quote input markup', () => {
  it('renders exactly the Area and Monthly rent inputs with the selected area', () => {
    const html = renderToStaticMarkup(createElement(QuoteInput, {
      config,
      summary: published,
      initialQuote: '3500000',
    }));

    expect(html).toContain('<select');
    expect(html).toContain('name="area"');
    expect(html).toContain('<option value="seoul" selected="">Seoul</option>');
    expect(html).toContain('name="quote"');
    expect(html).toContain('value="3500000"');
    expect(html).toContain('Within the typical range');
    expect(html).toContain('data-quote-marker="true"');
    expect((html.match(/<(?:input|select)\b/g) ?? [])).toHaveLength(2);
    expect(html).not.toMatch(/<button|type="submit"|<form/);
  });

  it('preserves an invalid draft and connects its authored error', () => {
    const html = renderToStaticMarkup(createElement(QuoteInput, {
      config,
      summary: published,
      initialQuote: 'bad input',
    }));

    expect(html).toContain('value="bad input"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('Enter a whole, non-negative amount without commas.');
    expect(html).not.toContain('data-quote-marker');
  });

  it('keeps the quote draft but withholds every position for sparse evidence', () => {
    const html = renderToStaticMarkup(createElement(QuoteInput, {
      config,
      summary: withheld,
      initialQuote: '3500000',
    }));

    expect(html).toContain('value="3500000"');
    expect(html).toContain('Market position withheld');
    expect(html).not.toContain('data-quote-marker');
    expect(html).not.toContain('₩3,500,000');
  });

  it('contains no network, navigation, storage, or effect API', () => {
    expect(source).toMatch(/^'use client';/);
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
    expect(source).not.toMatch(/useRouter|router\.|location\.|history\.|<form/);
    expect(source).not.toMatch(/useEffect|localStorage|sessionStorage/);
  });

  it('authors 44px targets and a visible two-pixel cobalt focus indicator', () => {
    expect(css).toMatch(/\.quoteControl[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.quoteControl:focus-visible[\s\S]*?outline:\s*2px solid var\(--public-accent\)/);
    expect(css).toMatch(/outline-offset:\s*2px/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)/);
  });
});
