import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  PublicAreaSummaryUnavailableError,
  createPublicAreaSummaryRepository,
} from '../lib/public-market/area-summary-repository.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

const expected = {
  marketId: 'kr-seoul',
  period: PUBLIC_AREA_FIXTURE_PERIOD,
} as const;

function repository(...sources: [] | [unknown]) {
  return createPublicAreaSummaryRepository({
    source: sources.length === 0 ? createPublicAreaFixture() : sources[0],
    expected,
  });
}

describe('verified public area summary repository', () => {
  it('returns the exact city and immutable 25-district legal-code order', () => {
    const store = repository();
    const districts = store.listDistrictSummaries();

    expect(store.getCitySummary()).toEqual(createPublicAreaFixture().citySummary);
    expect(districts).toHaveLength(25);
    expect(districts.map(({ area }) => area)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    );
    expect(store.getDistrictSummary('gangnam-gu')).toBe(
      districts.find(({ area }) => area === 'gangnam-gu'),
    );
    expect(Object.isFrozen(store)).toBe(true);
    expect(Object.isFrozen(districts)).toBe(true);
  });

  it.each([
    ['missing source', undefined],
    ['invalid JSON value', '{not-json'],
    ['wrong period', (() => {
      const value = createPublicAreaFixture();
      value.provenance.period = '2025-12/2026-06';
      return value;
    })()],
    ['rights mutation', (() => {
      const value = createPublicAreaFixture();
      value.provenance.rightsPolicyId = 'unreviewed';
      return value;
    })()],
  ])('fails closed for %s', (_label, source) => {
    expect(() => repository(source)).toThrow(PublicAreaSummaryUnavailableError);
  });

  it('uses one sanitized error for unknown district lookup and malformed source', () => {
    expect(() => repository().getDistrictSummary(
      'private-source-value' as 'jongno-gu',
    )).toThrow('Verified public area summary is unavailable.');

    const secret = 'https://apis.data.go.kr/raw?serviceKey=do-not-leak';
    let caught: unknown;
    try {
      repository({ secret });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(PublicAreaSummaryUnavailableError);
    expect(String(caught)).not.toContain(secret);
    expect(String(caught)).not.toContain('serviceKey');
  });
});
