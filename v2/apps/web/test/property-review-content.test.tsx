import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import seoul from '../content/property-reviews/seoul.json';
import singapore from '../content/property-reviews/singapore.json';
import dubai from '../content/property-reviews/dubai.json';
import tokyo from '../content/property-reviews/tokyo.json';
import { propertyReviewSchema } from '../lib/research/property-review';
import baselines from '../content/property-reviews/property-prose-baselines.json';
import { propertyEditorial, withPropertyEditorial } from '../lib/research/property-editorial';
import { LivingContextCard } from '../components/market-ui/living-context';
import { actualDetailHref } from '../lib/research/property-review-locations';
import { propertyReviewMetadata } from '../lib/research/property-review-metadata';

it('renders every published review in English without leaking Korean body copy', () => {
  for (const value of [...seoul,...singapore,...dubai,...tokyo]) {
    const review = withPropertyEditorial(propertyReviewSchema.parse(value));
    const profile = {id:review.id,market_id:review.marketId,name_ko:review.name.ko,canonical_name:review.name.en,area:review.area.en,headline:review.verdict.ko,checked_on:review.checkedOn,identity_note:'',publication_status:'published' as const,linked_entity_ids:[],facts:[],analysis:[],field_checks:[],sources:{},review};
    const html = renderToStaticMarkup(createElement(LivingContextCard,{profile,locale:'en'}));
    expect(html).toContain('data-property-editorial');
    expect(review.editorial?.paragraphs.en.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain('Facts, photographs &amp; evidence scope');
    expect(html.replace(/<[^>]*>/g,'')).not.toMatch(/[가-힣]/);
    const outbound=[...html.matchAll(/<a[^>]*href="(https:[^"]+)"/g)].map(match=>match[1]);
    expect(outbound.every(url=>/^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(url!))).toBe(true);
    expect(html).not.toContain('/living/');
  }
});

it('covers all 124 reviews in both languages without changing evidence or its check date', () => {
  const values = [...seoul, ...singapore, ...dubai, ...tokyo];
  expect(values).toHaveLength(124);
  for (const value of values) {
    const original = propertyReviewSchema.parse(value);
    const review = withPropertyEditorial(original);
    expect(review.editorial?.revisedOn).toBe('2026-09-14');
    expect(review.checkedOn).toBe(original.checkedOn);
    expect(review.sources).toEqual(original.sources);
    for (const locale of ['en', 'ko'] as const) {
      expect(review.editorial?.paragraphs[locale].length).toBeGreaterThanOrEqual(3);
      expect(review.verdict[locale]).toBe(propertyEditorial(review.id)?.headline[locale]);
      if (original.id in baselines) {
        expect(review.verdict[locale]).not.toBe(original.verdict[locale]);
        expect(review.summary[locale]).not.toBe(original.summary[locale]);
      }
      expect(review.editorial?.paragraphs[locale].join(' ')).not.toMatch(/운영 사례가 있다는 점이 구체적|각자 확인하는 후보/);
    }
  }
});
it('gives a selected review its own canonical URL and English/Korean alternatives', () => {
  const metadata=propertyReviewMetadata('en','sg-marina-one-residences');
  const canonical='https://www.signedprice.com'+actualDetailHref('en','sg-marina-one-residences');
  expect(metadata.alternates).toEqual({
    canonical,
    languages:{
      en:canonical,
      ko:'https://www.signedprice.com'+actualDetailHref('ko','sg-marina-one-residences'),
      'x-default':canonical,
    },
  });
  expect(metadata.openGraph?.url).toBe(canonical);
  expect(metadata.title).toContain('Marina One');
});

it('applies reader copy to matching stored evidence without overwriting newer or changed evidence', () => {
  const original = propertyReviewSchema.parse(seoul.find(review => review.id === 'kr-helio-city'));
  const stored = structuredClone(original);
  const point = stored.sections.costs.find(point => point.body.ko.includes('지역난방'))!;
  const originalText = point.body.ko;
  point.body.ko = '매물 자료는 지역난방과 열병합 방식을 안내합니다.';
  const revised = withPropertyEditorial(stored);
  expect(revised.sections.costs.find(point => point.body.ko.includes('지역난방'))?.body.ko).toBe(originalText);
  expect(revised.sources).toEqual(stored.sources);
  expect(revised.checkedOn).toBe(stored.checkedOn);
  expect(point.body.ko).toContain('안내합니다');
  const newer = structuredClone(stored);
  newer.checkedOn = '2026-09-15';
  expect(withPropertyEditorial(newer).sections).toEqual(newer.sections);
  point.body.en = 'A corrected heating specification from a newer inspection.';
  expect(withPropertyEditorial(stored).sections.costs).toEqual(stored.sections.costs);
});
