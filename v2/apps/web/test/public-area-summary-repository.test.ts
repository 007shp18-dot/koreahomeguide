import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  PublicAreaSummaryUnavailableError,
  createPublicAreaSummaryRepository,
} from '../lib/public-market/area-summary-repository.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV1Fixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

const expected = {
  marketId: 'kr-seoul',
  period: PUBLIC_AREA_FIXTURE_PERIOD,
} as const;

function repository(...sources: [] | [unknown]) {
  return createPublicAreaSummaryRepository({
    source: sources.length === 0 ? createPublicAreaV2Fixture() : sources[0],
    expected,
  });
}

describe('verified public area summary repository', () => {
  it('returns immutable group-specific city and 25-district evidence from v2', () => {
    const source = createPublicAreaV2Fixture();
    const store = repository(source);
    const all = store.listDistrictSummaries();
    const newContracts = store.listDistrictSummaries('new');
    const renewals = store.listDistrictSummaries('renewal');

    expect(store.getArtifactVersion()).toBe('v2');
    expect(store.getContractSplitAvailability()).toEqual({
      status: 'ready',
      unknownCityCount: 25,
    });
    expect(store.getCitySummary()).toEqual(source.groups.all.citySummary);
    expect(store.getCitySummary('new')).toEqual(source.groups.new.citySummary);
    expect(store.getCitySummary('renewal')).toEqual(source.groups.renewal.citySummary);
    expect(all).toHaveLength(25);
    expect(newContracts).toHaveLength(25);
    expect(renewals).toHaveLength(25);
    expect(all.map(({ area }) => area)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    );
    expect(store.getDistrictSummary('gangnam-gu')).toBe(
      all.find(({ area }) => area === 'gangnam-gu'),
    );
    expect(store.getDistrictSummary('gangnam-gu', 'new')).toBe(
      newContracts.find(({ area }) => area === 'gangnam-gu'),
    );
    expect(store.getDistrictSummary('gangnam-gu', 'renewal')).toBe(
      renewals.find(({ area }) => area === 'gangnam-gu'),
    );
    expect(store.getDistrictUnknownContractCount('gangnam-gu')).toBe(1);
    expect(store.getEvidenceDescriptor()).toEqual({
      marketId: 'kr-seoul',
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      generatedAt: '2026-08-31T01:13:24.787Z',
      state: 'ready',
      publicationMinimum: 5,
      methodologyId: 'kr-jeonse-45-55-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
    });
    expect(Object.isFrozen(store)).toBe(true);
    expect(Object.isFrozen(all)).toBe(true);
    expect(Object.isFrozen(newContracts)).toBe(true);
    expect(Object.isFrozen(renewals)).toBe(true);
    expect(Object.isFrozen(store.getContractSplitAvailability())).toBe(true);
    expect(Object.isFrozen(store.getEvidenceDescriptor())).toBe(true);
  });

  it('keeps a v1 snapshot readable as combined evidence without inventing splits', () => {
    const source = createPublicAreaV1Fixture();
    const store = repository(source);

    expect(store.getArtifactVersion()).toBe('v1');
    expect(store.getContractSplitAvailability()).toEqual({ status: 'snapshot_v1' });
    expect(store.getCitySummary()).toEqual(source.citySummary);
    expect(store.getDistrictSummary('gangnam-gu', 'all').area).toBe('gangnam-gu');
    expect(store.getDistrictUnknownContractCount('gangnam-gu')).toBeNull();
    expect(store.getEvidenceDescriptor().methodologyId).toBe('kr-jeonse-45-55-v1');
    expect(() => store.getCitySummary('new')).toThrow(
      'Verified public area summary is unavailable.',
    );
    expect(() => store.listDistrictSummaries('renewal')).toThrow(
      'Verified public area summary is unavailable.',
    );
    expect(() => store.getDistrictSummary('gangnam-gu', 'new')).toThrow(
      'Verified public area summary is unavailable.',
    );
  });

  it.each([
    ['missing source', undefined],
    ['invalid JSON value', '{not-json'],
    ['wrong period', (() => {
      const value = createPublicAreaV2Fixture();
      value.provenance.period = '2025-12/2026-06';
      return value;
    })()],
    ['rights mutation', (() => {
      const value = createPublicAreaV2Fixture();
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
