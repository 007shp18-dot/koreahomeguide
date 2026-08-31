import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type {
  PublishedMarketSummary,
  QuotePosition,
  WithheldMarketSummary,
} from '@signedprice/market-core';
import { BoxPlot } from '../components/public-market/box-plot';
import { StrokeState } from '../components/public-market/stroke-state';
import { VerdictLine } from '../components/public-market/verdict-line';

const css = readFileSync(
  new URL('../components/public-market/public-market.module.css', import.meta.url),
  'utf8',
);

const published: PublishedMarketSummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
  band: '45-55sqm', period: '2026-01/2026-07', n: 20, published: true,
  min: 1_000_000, p25: 2_000_000, med: 3_000_000,
  p75: 4_000_000, max: 5_000_000, chg3m: null,
};

const withheld: WithheldMarketSummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
  band: '45-55sqm', period: '2026-01/2026-07', n: 4, published: false,
};

const position: QuotePosition = {
  quote: 3_500_000,
  clampedQuote: 3_500_000,
  markerPct: 70,
  percentile: 62.5,
  differencePct: 16.7,
  verdict: 'within-typical',
  verdictLabel: 'Within the typical range',
};

function won(value: number): string {
  return `₩${value.toLocaleString('en-US')}`;
}

describe('public market stroke states', () => {
  it.each(['filled', 'outlined', 'hatched', 'hairline'] as const)(
    'renders the %s state with a visible non-colour label',
    (state) => {
      const html = renderToStaticMarkup(createElement(StrokeState, {
        state,
        label: `${state} evidence`,
      }));

      expect(html).toContain(`data-stroke-state="${state}"`);
      expect(html).toContain(`${state} evidence`);
      expect(html).toContain('aria-hidden="true"');
    },
  );

  it('uses only the approved square, shadowless structural tokens', () => {
    expect(css).toContain('#f3f2f2');
    expect(css).toContain('#201e1d');
    expect(css).toContain('#1d4ed8');
    expect(css).toMatch(/border-radius:\s*0/);
    expect(css).toMatch(/box-shadow:\s*none/);
    expect(css).toMatch(/repeating-linear-gradient/);
    expect(css).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});

describe('public market box plot', () => {
  it('renders all five labels, sample count, and an accessible description', () => {
    const html = renderToStaticMarkup(createElement(BoxPlot, {
      summary: published,
      axis: { min: 0, max: 5_000_000 },
      formatValue: won,
    }));

    for (const value of [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000]) {
      expect(html).toContain(won(value));
    }
    expect(html).toContain('20 reported contracts');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('Minimum');
    expect(html).toContain('25th percentile');
    expect(html).toContain('Median');
    expect(html).toContain('75th percentile');
    expect(html).toContain('Maximum');
  });

  it('renders a withheld hatch and no market numbers or marker', () => {
    const html = renderToStaticMarkup(createElement(BoxPlot, {
      summary: withheld,
      axis: { min: 0, max: 5_000_000 },
      formatValue: won,
      markerPct: 50,
      markerLabel: 'Your quote',
    }));

    expect(html).toContain('data-evidence-state="withheld"');
    expect(html).toContain('4 reported contracts');
    expect(html).toContain('At least 5 are required');
    expect(html).not.toContain('₩');
    expect(html).not.toContain('data-quote-marker');
    expect(html).not.toMatch(/Minimum|percentile|Median|Maximum/);
  });

  it.each([
    [0, '0 reported contracts'],
    [1, '1 reported contract'],
    [2, '2 reported contracts'],
  ] as const)('uses the correct sample-count plural for n=%i', (n, label) => {
    const html = renderToStaticMarkup(createElement(BoxPlot, {
      summary: { ...withheld, n },
      axis: { min: 0, max: 5_000_000 },
      formatValue: won,
    }));
    expect(html).toContain(`<strong>${label}</strong>`);
  });

  it('keeps zero-width ranges stable and clamps marker geometry', () => {
    const html = renderToStaticMarkup(createElement(BoxPlot, {
      summary: {
        ...published,
        min: 2_500_000,
        p25: 2_500_000,
        med: 2_500_000,
        p75: 2_500_000,
        max: 2_500_000,
      },
      axis: { min: 0, max: 5_000_000 },
      formatValue: won,
      markerPct: 140,
      markerLabel: 'Your quote',
    }));

    expect(html).toContain('--min-pct:50%');
    expect(html).toContain('--max-pct:50%');
    expect(html).toContain('--marker-pct:100%');
    expect(html).not.toMatch(/NaN|Infinity/);
  });
});

describe('public market verdict line', () => {
  it('uses geometry and visible text for the quote verdict', () => {
    const html = renderToStaticMarkup(createElement(VerdictLine, {
      position,
      formattedQuote: '₩3,500,000',
    }));

    expect(html).toContain('data-verdict="within-typical"');
    expect(html).toContain('Within the typical range');
    expect(html).toContain('16.7% above the median');
    expect(html).toContain('₩3,500,000');
  });

  it('renders a non-monetary refusal without a position', () => {
    const html = renderToStaticMarkup(createElement(VerdictLine, {
      position: null,
    }));

    expect(html).toContain('Market position withheld');
    expect(html).not.toContain('%');
    expect(html).not.toContain('data-verdict=');
  });
});
