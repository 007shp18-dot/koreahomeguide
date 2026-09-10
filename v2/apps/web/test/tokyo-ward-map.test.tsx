import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TokyoWardMap } from '../components/japan/tokyo-ward-map';

describe('Tokyo ward map navigation', () => {
  const props = { city: '13103', year: '2025', quarter: '4', filters: { q: 'Azabu', type: '', minArea: 50, maxArea: null } };
  it('renders 23 geographic targets, preserves the period and filters, and distinguishes missing data from zero matches', () => {
    const html = renderToStaticMarkup(<TokyoWardMap {...props} summaries={[
      { city: '13103', count: 25, medianPrice: 13000000 }, { city: '13113', count: 0, medianPrice: null },
    ]} />);
    expect(html.match(/data-ward="131\d{2}"/g)).toHaveLength(23);
    expect(html).toContain('city=13113&amp;year=2025&amp;quarter=4&amp;q=Azabu&amp;minArea=50');
    expect(html).toContain('Shibuya: No matching transactions');
    expect(html).toContain('Chiyoda: Not published for this quarter');
    expect(html).toContain('25 transactions');
    expect(html).toContain('¥13,000,000');
    expect(html).not.toContain('release=');
    expect(html).not.toContain('page=');
  });
  it('does not label a summary outage as unpublished or zero transactions', () => {
    const html = renderToStaticMarkup(<TokyoWardMap {...props} summaries={null} />);
    expect(html).toContain('Summary temporarily unavailable');
    expect(html).not.toContain('Not published for this quarter');
    expect(html).not.toContain('0 transactions');
  });
});
