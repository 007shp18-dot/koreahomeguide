import { expect, it } from 'vitest';
import { parseReviewSaved } from '../lib/research/property-review-saved';
it('recovers saved review IDs while rejecting malformed values and duplicates', () => {
  expect(parseReviewSaved('{broken')).toEqual([]);
  expect(parseReviewSaved(JSON.stringify(['sg-marina-one-residences', 'sg-marina-one-residences', '//evil.test', null, 'jp-park-city-toyosu']))).toEqual(['sg-marina-one-residences', 'jp-park-city-toyosu']);
});

it('retains every property in a 112-property catalogue', () => {
  const ids=Array.from({length:112},(_,i)=>`kr-property-${i}`);
  expect(parseReviewSaved(JSON.stringify(ids))).toEqual(ids);
});
