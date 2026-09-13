import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import seoul from '../content/property-reviews/seoul.json';
import singapore from '../content/property-reviews/singapore.json';
import dubai from '../content/property-reviews/dubai.json';
import tokyo from '../content/property-reviews/tokyo.json';
import { propertyReviewSchema } from '../lib/research/property-review';
import { LivingContextCard } from '../components/market-ui/living-context';
import { actualDetailHref } from '../lib/research/property-review-locations';
import { propertyReviewMetadata } from '../lib/research/property-review-metadata';

it('renders every published review in English without leaking Korean body copy', () => {
  for (const value of [...seoul,...singapore,...dubai,...tokyo]) {
    const review = propertyReviewSchema.parse(value);
    const profile = {id:review.id,market_id:review.marketId,name_ko:review.name.ko,canonical_name:review.name.en,area:review.area.en,headline:review.verdict.ko,checked_on:review.checkedOn,identity_note:'',publication_status:'published' as const,linked_entity_ids:[],facts:[],analysis:[],field_checks:[],sources:{},review};
    const html = renderToStaticMarkup(createElement(LivingContextCard,{profile,locale:'en'}));
    expect(html.replace(/<[^>]*>/g,'')).not.toMatch(/[가-힣]/);
    const outbound=[...html.matchAll(/<a[^>]*href="(https:[^"]+)"/g)].map(match=>match[1]);
    expect(outbound.every(url=>/^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(url!))).toBe(true);
    expect(html).not.toContain('/living/');
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
