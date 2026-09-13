import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PropertyReviewVisuals } from '../components/market-ui/property-review-visuals';
import { allReviewLocations, actualDetailHref, reviewDirectoryForMarket, type ReviewVisualMetric, type ReviewPhoto } from '../lib/research/property-review-locations';

function metric(label: string, value: number, unit: string, basis = 'Reported by the same method and date'): ReviewVisualMetric {
  return { label: { en: label, ko: label }, value, unit, basis: { en: basis, ko: basis }, sourceId: 'checked-source' };
}

describe('property review visual evidence', () => {
  it('shows complete-year mall visits and sales on separate labelled charts', () => {
    const plq=allReviewLocations().find(row=>row.reviewId==='sg-park-place-plq')!;
    const html=renderToStaticMarkup(<PropertyReviewVisuals locale="en" series={plq.series}/>);
    const figures=html.match(/<figure\b[\s\S]*?<\/figure>/g)!;
    expect(figures).toHaveLength(2);
    expect(figures[0]).toContain('10.4');
    expect(figures[0]).toContain('13.1');
    expect(figures[1]).toContain('243');
    expect(figures[1]).toContain('278.9');
    expect(html).toContain('2022');
    expect(html).toContain('2024');
    expect(html).not.toContain('9M2025');
    expect(html).not.toContain('<a ');
  });
  it('keeps minutes and metres on different scales with their own visible basis', () => {
    const html = renderToStaticMarkup(<PropertyReviewVisuals locale="en" metrics={[
      metric('Station A', 400, 'm'), metric('School B', 800, 'm'),
      metric('North entrance', 3, 'min', 'Advertised walk estimates'), metric('South entrance', 6, 'min', 'Advertised walk estimates'),
    ]} />);
    const figures = html.match(/<figure\b[\s\S]*?<\/figure>/g)!;
    expect(figures).toHaveLength(2);
    expect(figures[0]).toContain('400 m');
    expect(figures[0]).toContain('800 m');
    expect(figures[0]).not.toContain(' min');
    expect(figures[1]).toContain('3 min');
    expect(figures[1]).toContain('6 min');
    expect(figures[1]).toContain('Advertised walk estimates');
  });

  it('does not combine different measurement methods or currencies into one chart', () => {
    const html = renderToStaticMarkup(<PropertyReviewVisuals locale="en" metrics={[
      metric('Straight line', 300, 'm', 'Straight-line estimate'),
      metric('Actual route', 500, 'm', 'Mapped pedestrian route'),
      metric('Price', 900000, 'AED'), metric('Price per square metre', 18000, 'AED/m²'),
    ]} />);
    expect(html).not.toContain('<figure');
    expect(html).toContain('Straight-line estimate');
    expect(html).toContain('Mapped pedestrian route');
    expect(html).toContain('AED/m²');
  });

  it('keeps missing or invalid measurements out of the page without inventing a zero', () => {
    const html = renderToStaticMarkup(<PropertyReviewVisuals locale="en" metrics={[
      metric('Invalid negative', -2, 'm'), metric('Missing', Number.NaN, 'min'), metric('Infinite', Number.POSITIVE_INFINITY, 'm'),
    ]} />);
    expect(html).toBe('');
    const zero = renderToStaticMarkup(<PropertyReviewVisuals locale="en" metrics={[metric('Verified zero', 0, 'homes')]} />);
    expect(zero).toContain('Verified zero');
    expect(zero).toContain('0 <span>homes');
    expect(zero).not.toContain('NaN');
  });

  it('labels architectural renderings and exposes only the allowed image licence link', () => {
    const photo: ReviewPhoto = {
      url: 'https://images.example.test/project.jpg', sourceUrl: 'https://www.propertyguru.com.sg/example',
      credit: 'Credited creator', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      kind: 'render', alt: { ko: '예상 건물 모습', en: 'Proposed building appearance' },
    };
    const html = renderToStaticMarkup(<PropertyReviewVisuals locale="en" photo={photo} />);
    expect(html).toContain('Architectural rendering');
    expect(html).toContain('Credited creator');
    expect(html).toContain('href="https://creativecommons.org/licenses/by/4.0/"');
    expect(html).not.toContain('href="https://www.propertyguru.com.sg');
    const rejected = renderToStaticMarkup(<PropertyReviewVisuals locale="en" photo={{ ...photo, licenseUrl: 'https://www.propertyfinder.ae/example' }} />);
    expect(rejected).not.toContain('<a ');
  });

  it('gives every directory property bilingual identity and an internal detail destination', () => {
    const locations = allReviewLocations();
    expect(new Set(locations.map(location => location.reviewId)).size).toBe(locations.length);
    for (const location of locations) {
      expect(location.name?.en.trim()).toBeTruthy();
      expect(location.name?.ko.trim()).toBeTruthy();
      expect(location.area?.en.trim()).toBeTruthy();
      expect(location.area?.ko.trim()).toBeTruthy();
      for (const locale of ['en', 'ko', 'zh-CN'] as const) {
        const href = actualDetailHref(locale, location.reviewId)!;
        expect(href).toMatch(/^\/(?:ko\/|zh-cn\/)?(?:kr\/seoul|sg\/singapore|ae\/dubai|jp\/tokyo)\/explore\//);
        expect(href).not.toContain('/living');
      }
    }
    const entries = ['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'].flatMap(market => reviewDirectoryForMarket(market as 'kr-seoul' | 'sg-singapore' | 'ae-dubai' | 'jp-tokyo'));
    expect(entries).toHaveLength(locations.length);
  });
});
