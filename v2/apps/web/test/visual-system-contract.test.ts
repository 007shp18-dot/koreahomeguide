import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const userFacingStyles = [
  '../components/public-market/public-market.module.css',
  '../components/public-market/building-detail.module.css',
  '../components/public-market/district-detail.module.css',
  '../components/public-market/district-evidence-summary.module.css',
  '../components/public-market/seoul-live.module.css',
  '../components/news/news.module.css',
  '../components/news/detail-news-list.module.css',
  '../components/community/community-signal.module.css',
  '../components/singapore/singapore.module.css',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');
const boxPlotSource = readFileSync(
  new URL('../components/public-market/box-plot.tsx', import.meta.url),
  'utf8',
);

describe('visual system readability contract', () => {
  it('avoids collision-prone display typography', () => {
    expect(userFacingStyles).not.toMatch(/letter-spacing:\s*-0\.0(?:5\d*|[6-9]\d*)em/);
    expect(userFacingStyles).not.toMatch(/line-height:\s*0\.(?:[0-8]\d*|9[0-7])\s*;/);
  });

  it('keeps chart labels outside plot geometry and mobile layouts responsive', () => {
    expect(boxPlotSource).toContain('data-plot-layout="legend"');
    expect(userFacingStyles).toMatch(/\.plotLegend\s*\{[\s\S]*?grid-template-columns/);
  });
});
