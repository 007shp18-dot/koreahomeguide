import { describe, expect, it } from 'vitest';

import {
  createSelectionHref,
  normalizeExplorerSelection,
  parseExplorerSelection,
  serializeExplorerSelection,
} from '../lib/navigation/explorer-selection';

const koreaDefaults = Object.freeze({ market: 'kr', transaction: 'jeonse' } as const);
const singaporeDefaults = Object.freeze({ market: 'sg', transaction: 'sale' } as const);
const allowLists = Object.freeze({
  areas: Object.freeze(['all', 'under-40', '40-60', '60-85', '85-plus'] as const),
  propertyTypes: Object.freeze(['apartment', 'officetel']),
  districts: Object.freeze(['jongno-gu', 'gangnam-gu', 'ccr']),
  neighborhoodsByDistrict: Object.freeze({
    'jongno-gu': Object.freeze(['sajik-dong']),
    'gangnam-gu': Object.freeze(['yeoksam-dong']),
  }),
  buildingIdsByNeighborhood: Object.freeze({
    'sajik-dong': Object.freeze(['jongno-gu-building-1']),
    'yeoksam-dong': Object.freeze(['gangnam-gu-building-2']),
  }),
  sorts: Object.freeze(['median-asc', 'sample-desc']),
});

describe('canonical Explorer selection codec', () => {
  it.each([
    ['kr', 'sale'],
    ['kr', 'jeonse'],
    ['kr', 'monthly'],
    ['sg', 'sale'],
    ['sg', 'rent'],
  ] as const)('round-trips the supported %s %s transaction', (market, transaction) => {
    const defaults = market === 'kr' ? koreaDefaults : singaporeDefaults;
    const serialized = serializeExplorerSelection({ market, transaction }, defaults);

    expect(parseExplorerSelection(new URLSearchParams(serialized), defaults)).toEqual({
      market,
      transaction,
    });
  });

  it('normalizes unsupported market and transaction combinations to market-safe defaults', () => {
    expect(normalizeExplorerSelection({ market: 'kr', transaction: 'rent' }, koreaDefaults))
      .toEqual({ market: 'kr', transaction: 'jeonse' });
    expect(normalizeExplorerSelection({ market: 'sg', transaction: 'monthly' }, koreaDefaults))
      .toEqual({ market: 'sg', transaction: 'sale' });
    expect(normalizeExplorerSelection({ market: 'ae', transaction: 'rent' }, koreaDefaults))
      .toEqual({ market: 'ae', transaction: 'sale' });
    expect(normalizeExplorerSelection({ market: 'unknown', transaction: 'sale' }, koreaDefaults))
      .toEqual({ market: 'kr', transaction: 'sale' });
  });

  it('drops unknown allow-listed IDs and orphan descendants', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      propertyType: 'castle',
      district: 'unknown-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-gu-building-1',
      sort: 'invented',
    }, koreaDefaults, allowLists)).toEqual({ market: 'kr', transaction: 'jeonse' });

    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      buildingId: 'jongno-gu-building-1',
    }, koreaDefaults, allowLists)).toEqual({ market: 'kr', transaction: 'jeonse' });
  });

  it('keeps only validated descendants, contract type, property type, and sort', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'monthly',
      area: '60-85',
      propertyType: 'officetel',
      district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong',
      buildingId: 'gangnam-gu-building-2',
      contractType: 'renewal',
      sort: 'sample-desc',
      q: 'must not enter the URL',
      depositWon: 300_000_000,
    }, koreaDefaults, allowLists)).toEqual({
      market: 'kr',
      transaction: 'monthly',
      area: '60-85',
      propertyType: 'officetel',
      district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong',
      buildingId: 'gangnam-gu-building-2',
      contractType: 'renewal',
      sort: 'sample-desc',
    });
  });

  it('drops contract type where the selected transaction cannot use it', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'sale',
      contractType: 'new',
    }, koreaDefaults)).toEqual({ market: 'kr', transaction: 'sale' });
    expect(normalizeExplorerSelection({
      market: 'sg',
      transaction: 'rent',
      contractType: 'renewal',
    }, singaporeDefaults)).toEqual({ market: 'sg', transaction: 'rent' });
  });

  it('parses only scalar query values and ignores unknown fields', () => {
    const parsed = parseExplorerSelection({
      market: ['sg', 'kr'],
      transaction: 'monthly',
      district: 'gangnam-gu',
      neighborhood: ['yeoksam-dong'],
      buildingId: 'gangnam-gu-building-2',
      contractType: 'all',
      q: '<script>unsafe</script>',
      depositWon: '300000000',
    }, koreaDefaults, allowLists);

    expect(parsed).toEqual({
      market: 'kr',
      transaction: 'monthly',
      district: 'gangnam-gu',
      contractType: 'all',
    });
  });

  it('serializes in deterministic order and omits route defaults', () => {
    const selection = normalizeExplorerSelection({
      market: 'kr',
      transaction: 'monthly',
      area: 'all',
      propertyType: 'apartment',
      district: 'jongno-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-gu-building-1',
      contractType: 'new',
      sort: 'median-asc',
      view: 'table',
    }, koreaDefaults, allowLists);

    expect(serializeExplorerSelection(selection, koreaDefaults)).toBe(
      'transaction=monthly&area=all&propertyType=apartment&district=jongno-gu&neighborhood=sajik-dong&buildingId=jongno-gu-building-1&contractType=new&sort=median-asc&view=table',
    );
    expect(serializeExplorerSelection(koreaDefaults, koreaDefaults)).toBe('');
    expect(createSelectionHref('/kr/seoul/explore/', selection, koreaDefaults)).toBe(
      '/kr/seoul/explore/?transaction=monthly&area=all&propertyType=apartment&district=jongno-gu&neighborhood=sajik-dong&buildingId=jongno-gu-building-1&contractType=new&sort=median-asc&view=table',
    );
  });

  it('keeps only approved Explorer V2 views', () => {
    for (const view of ['split', 'list', 'table', 'map'] as const) {
      expect(parseExplorerSelection(new URLSearchParams(`view=${view}`), koreaDefaults))
        .toMatchObject({ view });
    }
    expect(parseExplorerSelection(new URLSearchParams('view=globe'), koreaDefaults))
      .toEqual(koreaDefaults);
    expect(parseExplorerSelection({ view: ['map', 'list'] }, koreaDefaults))
      .toEqual(koreaDefaults);
  });

  it('round-trips approved all-area cohorts and rejects unknown area bands', () => {
    for (const area of allowLists.areas) {
      const parsed = parseExplorerSelection(
        new URLSearchParams(`area=${area}`),
        koreaDefaults,
        allowLists,
      );
      expect(parsed.area).toBe(area);
    }

    expect(parseExplorerSelection(
      new URLSearchParams('area=45-55'),
      koreaDefaults,
      allowLists,
    )).toEqual({ market: 'kr', transaction: 'jeonse' });
  });

  it('rejects malformed identifiers even when an allow-list is not supplied', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      district: '../jongno-gu',
      neighborhood: 'Sajik Dong',
      buildingId: '<building>',
    }, koreaDefaults)).toEqual({ market: 'kr', transaction: 'jeonse' });
  });

  it('defaults unconfigured URL identifiers to denied', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      propertyType: 'apartment',
      district: 'jongno-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-gu-building-1',
      sort: 'median-asc',
    }, koreaDefaults)).toEqual({ market: 'kr', transaction: 'jeonse' });
  });

  it('rejects descendants that do not belong to their selected parent', () => {
    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      district: 'gangnam-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-gu-building-1',
    }, koreaDefaults, allowLists)).toEqual({
      market: 'kr',
      transaction: 'jeonse',
      district: 'gangnam-gu',
    });

    expect(normalizeExplorerSelection({
      market: 'kr',
      transaction: 'jeonse',
      district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong',
      buildingId: 'jongno-gu-building-1',
    }, koreaDefaults, allowLists)).toEqual({
      market: 'kr',
      transaction: 'jeonse',
      district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong',
    });
  });
});
