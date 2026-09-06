import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DistrictComparisonInfographic } from '../components/infographics/district-comparison';
import { infographic } from '../content/portfolio-builders';

describe('signed changes on comparison charts', () => {
  it('draws a negative observation to the left of a shared zero baseline', () => {
    const spec = infographic({ id: 'signed-change', locale: 'en', template: 'district-comparison', title: 'Quarterly changes', summary: 'One region rises and another falls.', releases: ['ura-q2-2026'], period: { start: '2026-04-01', end: '2026-06-30' }, unit: '%', source: 'URA', sample: 'Non-landed private homes', relatedHref: '/sg/singapore/explore/', series: [{ id: 'change', label: 'Change', values: [{ label: 'CCR', value: 1.8 }, { label: 'RCR', value: -1.2 }] }] });
    const html = renderToStaticMarkup(<DistrictComparisonInfographic spec={spec} />);
    const rects = [...html.matchAll(/<rect x="([\d.]+)"[^>]*width="([\d.]+)"/g)];
    expect(rects).toHaveLength(2);
    expect(Number(rects[1]![1])).toBeLessThan(Number(rects[0]![1]));
    expect(Number(rects[1]![2])).toBeGreaterThan(2);
  });
});
