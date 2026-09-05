import { describe, expect, it } from 'vitest';

import { createEditorialEvent, type EditorialEvent } from '../lib/analytics/editorial-events';

const base = Object.freeze({
  contentId: 'en:seoul-district-price-distribution',
  contentType: 'data-story' as const,
  locale: 'en' as const,
  market: 'kr-seoul' as const,
});

describe('privacy-safe editorial analytics', () => {
  it.each<EditorialEvent>([
    'article_complete', 'article_to_explore', 'article_to_check',
    'policy_source_open', 'infographic_data_open',
  ])('creates the allowlisted %s journey event', (event) => {
    expect(createEditorialEvent(event, base)).toEqual({ event, ...base });
  });

  it('drops addresses, amounts, search text, identity and arbitrary fields', () => {
    const event = createEditorialEvent('article_to_check', {
      ...base,
      address: 'private address', quotedPrice: 900_000_000, contractAmount: 1,
      searchText: 'building query', userId: 'user-1', arbitrary: 'not allowed',
    });
    for (const forbidden of ['address', 'quotedPrice', 'contractAmount', 'searchText', 'userId', 'arbitrary']) {
      expect(event).not.toHaveProperty(forbidden);
    }
    expect(Object.keys(event).sort()).toEqual(['contentId', 'contentType', 'event', 'locale', 'market'].sort());
  });

  it('rejects unknown event names and invalid editorial dimensions', () => {
    expect(() => createEditorialEvent('page_view' as EditorialEvent, base)).toThrow(/event/i);
    expect(() => createEditorialEvent('article_complete', { ...base, contentId: '../address' })).toThrow(/content/i);
    expect(() => createEditorialEvent('article_complete', { ...base, locale: 'ko' })).toThrow(/locale/i);
  });
});
