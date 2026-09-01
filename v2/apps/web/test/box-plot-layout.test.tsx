import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PublishedMarketSummary } from '@signedprice/market-core';
import {
  BoxPlot,
  assignPlotLanes,
} from '../components/public-market/box-plot';

const source = readFileSync(
  new URL('../components/public-market/box-plot.tsx', import.meta.url),
  'utf8',
);
const css = readFileSync(
  new URL('../components/public-market/public-market.module.css', import.meta.url),
  'utf8',
);
const summary: PublishedMarketSummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
  band: '45-55sqm', period: '2026-01/2026-07', n: 20, published: true,
  min: 180_000_000, p25: 390_000_000, med: 400_000_000,
  p75: 410_000_000, max: 580_000_000, chg3m: null,
};

describe('collision-safe box plot labels', () => {
  it('assigns close quartile labels to separate deterministic lanes', () => {
    expect(assignPlotLanes([
      { key: 'p25', pct: 48 },
      { key: 'median', pct: 50 },
      { key: 'p75', pct: 52 },
    ])).toEqual({ p25: 0, median: 1, p75: 2 });
  });

  it('renders HTML annotations instead of the old five-cell value table', () => {
    const html = renderToStaticMarkup(
      <BoxPlot
        summary={summary}
        axis={{ min: 160_000_000, max: 620_000_000 }}
        formatValue={(value) => `₩${value.toLocaleString('en-US')}`}
        markerPct={54}
        markerLabel="Your quote"
      />,
    );

    for (const key of ['min', 'p25', 'median', 'p75', 'max', 'quote']) {
      expect(html).toContain(`data-plot-label="${key}"`);
    }
    expect(html).toContain('data-plot-lane="0"');
    expect(html).toContain('data-plot-lane="1"');
    expect(html).toContain('data-plot-lane="2"');
    expect(html).not.toContain('<dl');
    expect(source).not.toContain('plotLabels');
  });

  it('uses end anchors, a taller canvas, and responsive compact labels', () => {
    expect(css).toMatch(/\.plotCanvas[\s\S]*?min-height:\s*180px/);
    expect(css).toMatch(/\.minimumAnnotation[\s\S]*?transform:\s*none/);
    expect(css).toMatch(/\.maximumAnnotation[\s\S]*?translateX\(-100%\)/);
    expect(css).toMatch(/\.medianAnnotation[\s\S]*?var\(--public-accent\)/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*?\.endpointLong/);
  });

  it('keeps compact distribution plots on the same accessible shared component', () => {
    const html = renderToStaticMarkup(
      <BoxPlot
        summary={summary}
        axis={{ min: 160_000_000, max: 620_000_000 }}
        formatValue={(value) => `₩${value.toLocaleString('en-US')}`}
        variant="compact"
      />,
    );

    expect(html).toContain('data-plot-variant="compact"');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('data-plot-label="median"');
    expect(css).toMatch(/\.compactPlot[\s\S]*?\.plotCanvas[\s\S]*?min-height:/);
  });
});
