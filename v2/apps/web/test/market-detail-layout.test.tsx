import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketDetailShell } from '../components/market-ui/market-shell';
import { HdbBlockDetail } from '../components/singapore/hdb-block-detail';

describe('detail reading order', () => {
  it.each([false, true])('renders the price once and keeps section links usable (media: %s)', (withMedia) => {
    const html = renderToStaticMarkup(<MarketDetailShell locale="en" breadcrumb="Area"
      identity={<h1>Building</h1>} metric={<strong>AED 123,456</strong>}
      evidence={<p>12 transactions</p>} rail={<p>Source · 2026-01</p>}
      media={withMedia ? <figure aria-label="Building photo">Building photo</figure> : undefined} />);
    expect(html.match(/AED 123,456/g)).toHaveLength(1);
    for (const id of ['detail-overview', 'detail-evidence', 'detail-source']) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`href="#${id}"`);
    }
    expect(html.indexOf('<h1>Building')).toBeLessThan(html.indexOf('AED 123,456'));
    expect(html.indexOf('AED 123,456')).toBeLessThan(html.indexOf('12 transactions'));
    expect(html.indexOf('12 transactions')).toBeLessThan(html.indexOf('Source · 2026-01'));
  });

  it('does not repeat the HDB resale median while keeping monthly rent separate', () => {
    const html = renderToStaticMarkup(<HdbBlockDetail town="BEDOK" townHref="/sg/singapore/hdb/bedok/" googleMapsBrowserKey={null}
      block={{ blockId: 'one', href: '/sg/singapore/hdb/bedok/one/', address: '1 BEDOK ROAD', resaleCountLabel: '8', resaleMedianLabel: 'SGD 543,210', rentalCountLabel: '6', rentalMedianLabel: 'SGD 2,400', property: null }} />);
    expect(html.match(/SGD 543,210/g)).toHaveLength(1);
    expect(html).toContain('Monthly rent median');
    expect(html).toContain('SGD 2,400');
    expect(html.indexOf('SGD 543,210')).toBeLessThan(html.indexOf('id="detail-evidence"'));
  });
});
