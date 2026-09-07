import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { formatInfographicValue } from '../components/infographics/infographic-frame';
import { CostStructureInfographic } from '../components/infographics/cost-structure';
import { DistrictComparisonInfographic } from '../components/infographics/district-comparison';
import { MarketTrendInfographic } from '../components/infographics/market-trend';
import { PolicyChangeInfographic } from '../components/infographics/policy-change';
import { PolicyTimelineInfographic } from '../components/infographics/policy-timeline';

const base = {
  id: 'graphic-one', locale: 'en' as const, title: 'Evidence, made legible',
  accessibleSummary: 'A concise accessible explanation of the released evidence.',
  evidenceReleaseIds: ['release-one'], unit: 'KRW',
  period: { start: '2026-01-01', end: '2026-03-31' },
  series: [{ id: 'series-one', label: 'Reported median', currency: 'KRW' as const, values: [
    { label: 'January', value: 10, evidenceReleaseId: 'release-one' },
    { label: 'February', value: 14, evidenceReleaseId: 'release-one' },
    { label: 'March', value: 12, evidenceReleaseId: 'release-one' },
  ] }],
  sourceLabel: 'Official reported transactions', sampleLabel: 'n=42 compatible records',
  relatedHref: '/kr/seoul/explore/', conversionProvenance: null,
};

const renderers = [
  ['policy-before-after', PolicyChangeInfographic],
  ['policy-timeline', PolicyTimelineInfographic],
  ['district-comparison', DistrictComparisonInfographic],
  ['market-trend', MarketTrendInfographic],
  ['cost-structure', CostStructureInfographic],
] as const;

describe('infographic renderers', () => {
  it.each(renderers)('renders %s with visible provenance and an accessible data table', (template, Renderer) => {
    const spec = { ...base, template };
    const html = renderToStaticMarkup(<Renderer spec={spec} />);

    expect(html).toContain(`data-infographic-template="${template}"`);
    expect(html).toContain(base.title);
    expect(html).toContain(base.accessibleSummary);
    expect(html).toContain(base.sourceLabel);
    expect(html).toContain(base.sampleLabel);
    expect(html).toContain('dateTime="2026-01-01"');
    expect(html).toContain('dateTime="2026-03-31"');
    expect(html).toContain('Evidence releases');
    expect(html).toContain('<details');
    expect(html).toContain('<table');
    expect(html).toContain('January');
    expect(html).toContain('10');
    expect(html).toContain('href="/kr/seoul/explore"');
  });

  it('keeps chart values visible and in the HTML table, never tooltip-only', () => {
    for (const [template, Renderer] of renderers.slice(2, 4)) {
      const html = renderToStaticMarkup(<Renderer spec={{ ...base, template }} />);
      expect(html).toContain('role="img"');
      expect(html).not.toContain('<title>10</title>');
      expect(html).toContain('<td>KRW 10</td>');
    }
  });

  it('never shrinks infographic text below twelve pixels', () => {
    const css = readFileSync(new URL('../components/infographics/infographic.module.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/font-size:\s*(?:[0-9]|1[01])px/u);
  });
});


describe('infographic units', () => {
  it.each([
    [4.8, 'KRW 100m', 'KRW 480,000,000'],
    [150, 'KRW 10k/month', 'KRW 1,500,000/month'],
    [2000, 'SGD psf', 'SGD 2,000/ft²'],
    [1500000, 'AED', 'AED 1,500,000'],
    [6.1, '%', '6.1%'],
    [70, 'm²', '70 m²'],
  ])('formats %s %s consistently', (value, unit, expected) => {
    expect(formatInfographicValue(value as number, 'en', unit as string)).toBe(expected);
  });
});
