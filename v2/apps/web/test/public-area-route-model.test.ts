import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  buildPublicAreaExploreModel,
  buildPublicDistrictModel,
  hydratePublicAreaExploreModelWithProjections,
  normalizePublicContractGroup,
} from '../lib/public-market/area-route-model.server';
import {
  CITY_MEDIAN_SENTINEL,
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';
import {
  createPublicBuildingFixture,
  createPublicBuildingRecord,
} from './public-building-fixture';

const rankedFixture = () => createPublicAreaFixture({
  publishedMedians: {
    'jongno-gu': 500_000_000,
    'jung-gu': 100_000_000,
    'yongsan-gu': 100_000_000,
    'seongdong-gu': 300_000_000,
    'gwangjin-gu': 700_000_000,
    'dongdaemun-gu': 400_000_000,
    'jungnang-gu': 200_000_000,
  },
  withheldCounts: { 'seongbuk-gu': 1 },
});

const dependencies = (source: unknown = rankedFixture()) => ({
  source,
  period: PUBLIC_AREA_FIXTURE_PERIOD,
  referenceInstant: '2026-09-01T00:00:00.000Z',
  observedBuildingSource: null,
});

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function observedBuildingFixture(): Record<string, unknown> {
  const records = [{
    buildingId: 'gangnam-evidence-tower', districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam-dong', neighborhoodName: '역삼동',
    officialName: 'Evidence Tower', housingType: 'apartment', observationCount: 8,
    jeonseObservationCount: 6, monthlyObservationCount: 2,
    firstObservedMonth: '2026-01', lastObservedMonth: '2026-07',
    coordinate: { state: 'ready', latitude: 37.5001, longitude: 127.0352 },
  }, {
    buildingId: 'jongno-monthly-home', districtSlug: 'jongno-gu',
    neighborhoodId: 'sajik-dong', neighborhoodName: '사직동',
    officialName: 'Monthly Home', housingType: 'officetel', observationCount: 1,
    jeonseObservationCount: 0, monthlyObservationCount: 1,
    firstObservedMonth: '2026-06', lastObservedMonth: '2026-06',
    coordinate: { state: 'pending', reason: 'coordinate_not_resolved' },
  }, {
    buildingId: 'gangnam-large-detached', districtSlug: 'gangnam-gu',
    neighborhoodId: 'sinsa-dong', neighborhoodName: '신사동',
    officialName: 'Large Detached Home', housingType: 'detached', observationCount: 2,
    jeonseObservationCount: 2, monthlyObservationCount: 0,
    firstObservedMonth: '2026-04', lastObservedMonth: '2026-07',
    coordinate: { state: 'ready', latitude: 37.518, longitude: 127.022 },
  }];
  const unsigned = {
    artifactVersion: 'signedprice-observed-building-inventory-v1',
    generatedAt: '2026-09-01T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD, provider: 'MOLIT',
      dataset: 'reported rent contracts', endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true, displayRights: true,
      exclusions: ['Canceled records', 'Records without a stable building identity'],
    },
    stats: {
      sourceRecordCount: 12, observedRecordCount: 11, observedBuildingCount: 3,
      cancelledRecordCount: 1, missingIdentityRecordCount: 0,
      coordinateReadyCount: 2, coordinatePendingCount: 1,
    },
    records,
  };
  return {
    ...unsigned,
    sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  };
}

describe('public area Explore model', () => {
  it('normalizes query input and exposes independent v2 group evidence', () => {
    expect(normalizePublicContractGroup(undefined)).toBe('new');
    expect(normalizePublicContractGroup('all')).toBe('all');
    expect(normalizePublicContractGroup('new')).toBe('new');
    expect(normalizePublicContractGroup('renewal')).toBe('renewal');
    expect(normalizePublicContractGroup('private')).toBe('all');
    expect(normalizePublicContractGroup(['new'])).toBe('all');

    const model = buildPublicAreaExploreModel('jung-gu', {
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    }, 'renewal');
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;
    const district = model.districts.find(({ slug }) => slug === 'jung-gu');
    expect(district?.contractEvidence).toMatchObject({
      selected: 'renewal',
      splitStatus: 'ready',
      unknownContractCount: 1,
      groups: {
        all: { status: 'published', medianLabel: '₩110,000,000' },
        new: { status: 'published', medianLabel: '₩90,000,000' },
        renewal: { status: 'published', medianLabel: '₩130,000,000' },
      },
    });
  });

  it('defaults v2 and v1 snapshots to New without substituting All evidence', () => {
    const v2 = buildPublicAreaExploreModel('jung-gu', {
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    expect(v2.status).toBe('ready');
    if (v2.status !== 'ready') return;
    expect(v2.districts.find(({ slug }) => slug === 'jung-gu')?.contractEvidence)
      .toMatchObject({
        selected: 'new',
        groups: { new: { status: 'published', medianLabel: '₩90,000,000' } },
      });

    const v1 = buildPublicAreaExploreModel('jung-gu', {
      source: rankedFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    expect(v1.status).toBe('ready');
    if (v1.status !== 'ready') return;
    expect(v1.districts.find(({ slug }) => slug === 'jung-gu')?.contractEvidence)
      .toMatchObject({
        selected: 'new',
        splitStatus: 'snapshot_v1',
        groups: {
          all: { status: 'published', medianLabel: '₩100,000,000' },
          new: { status: 'snapshot_unavailable' },
        },
      });
  });

  it('calculates coverage only from retained verified area and building records', () => {
    const withheldBuilding = createPublicBuildingRecord({
      buildingId: 'gangnam-retained-thin-building',
      name: 'Retained Thin Building',
      groups: {
        all: { n: 4, published: false },
        new: { n: 2, published: false },
        renewal: { n: 1, published: false },
      },
      unknownContractCount: 1,
      areaBands: [{ band: '45-55sqm', summary: { n: 4, published: false } }],
    });
    const model = buildPublicAreaExploreModel('gangnam-gu', {
      ...dependencies(),
      buildingSource: createPublicBuildingFixture([
        createPublicBuildingRecord(),
        withheldBuilding,
      ]),
    });
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;

    expect((model as typeof model & { coverage: unknown }).coverage).toEqual({
      districts: { published: 7, retained: 25 },
      buildings: {
        status: 'inventory_unavailable',
        transactionCovered: 2,
        priceReady: 1,
        reason: 'Verified observed building inventory is not loaded.',
      },
      eligibleContracts: 104,
      unpublished: {
        districtsBelowMinimum: 18,
        retainedBuildingsBelowMinimum: 1,
        sourceBuildingCandidates: {
          status: 'unavailable',
          reason: 'Source candidate building counts are not retained in this verified artifact.',
        },
      },
    });
  });

  it('marks the building denominator unavailable when no verified artifact is loaded', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies());
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;

    expect((model as typeof model & { coverage: Record<string, unknown> }).coverage.buildings)
      .toEqual({
        status: 'inventory_unavailable',
        transactionCovered: null,
        priceReady: null,
        reason: 'Verified observed building inventory is not loaded.',
      });
    expect(JSON.stringify((model as typeof model & { coverage: unknown }).coverage))
      .not.toContain('"published":0,"retained":0');
  });

  it('discovers observed buildings independently from the price-ready cohort', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', {
      ...dependencies(),
      observedBuildingSource: observedBuildingFixture(),
      buildingSource: createPublicBuildingFixture(),
    });
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;

    expect(model.buildingAvailability.buildings).toHaveLength(2);
    expect(model.buildingAvailability.buildings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'gangnam-evidence-tower', evidenceStatus: 'published',
        medianLabel: '₩320,000,000', observationCount: 8,
      }),
      expect.objectContaining({
        id: 'gangnam-large-detached', housingType: 'detached',
        evidenceStatus: 'unavailable', medianLabel: null,
      }),
    ]));
    expect(model.coverage.buildings).toEqual({
      status: 'ready', observed: 3, transactionCovered: 1, priceReady: 1,
    });
  });

  it.each(['ready', 'unavailable'] as const)('hydrates approved media independently of location state: %s', async (state) => {
    const base = buildPublicAreaExploreModel('gangnam-gu', {
      ...dependencies(),
      buildingSource: createPublicBuildingFixture(),
    });
    const listBuildings = vi.fn(async () => new Map([[
      'gangnam-evidence-tower',
      Object.freeze({
        entityId: 'gangnam-evidence-tower',
        location: state === 'unavailable' ? null : Object.freeze({
          entityId: 'gangnam-evidence-tower', marketId: 'kr-seoul',
          latitude: 37.501, longitude: 127.031, precision: 'rooftop' as const,
          provider: 'official-address', providerReference: 'record-1',
          rightsPolicyId: 'kr-open-data', verificationStatus: 'verified' as const,
          verifiedAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
        }),
        media: Object.freeze([Object.freeze({
          entityId: 'gangnam-evidence-tower', mediaAssetId: '9', role: 'hero' as const,
          position: 0, displayUrl: '/assets/buildings/hero.jpg', providerReference: null,
          width: 1600, height: 900, focalX: 0.4, focalY: 0.6,
          attributionName: 'Owner', attributionUrl: null, exactSubject: true,
          publishedAt: '2026-09-01T00:00:00.000Z', lastCheckedAt: '2026-09-01T00:00:00.000Z',
        })]),
        evidenceReleaseId: null,
        state,
      }),
    ]]));

    const model = await hydratePublicAreaExploreModelWithProjections(base, { listBuildings });

    expect(listBuildings).toHaveBeenCalledWith(['gangnam-evidence-tower']);
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'not_loaded') return;
    expect(model.buildingAvailability.fallbackBuildings[0]).toMatchObject({
      latitude: state === 'unavailable' ? 37.5001 : 37.501,
      longitude: state === 'unavailable' ? 127.0352 : 127.031,
      media: { displayUrl: '/assets/buildings/hero.jpg', attributionName: 'Owner' },
    });
  });

  it('resolves a global building query on the server and sends only that district inventory', () => {
    const model = buildPublicAreaExploreModel(undefined, {
      ...dependencies(),
      observedBuildingSource: observedBuildingFixture(),
      buildingSource: createPublicBuildingFixture(),
    }, undefined, 'Monthly Home');
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;

    expect(model.selectedSlug).toBe('jongno-gu');
    expect(model.buildingAvailability.buildings).toEqual([
      expect.objectContaining({
        id: 'jongno-monthly-home', evidenceStatus: 'unavailable',
        monthlyObservationCount: 1,
      }),
    ]);
    expect(model.coverage.buildings).toEqual({
      status: 'ready', observed: 3, transactionCovered: 1, priceReady: 1,
    });
  });

  it('keeps the selected district inventory visible for a Korean district query', () => {
    const model = buildPublicAreaExploreModel(undefined, {
      ...dependencies(),
      observedBuildingSource: observedBuildingFixture(),
      buildingSource: createPublicBuildingFixture(),
    }, undefined, '강남구');
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;

    expect(model.selectedSlug).toBe('gangnam-gu');
    expect(model.buildingAvailability.buildings.map(({ id }) => id)).toEqual([
      'gangnam-evidence-tower',
      'gangnam-large-detached',
    ]);
  });

  it('calculates the first configured monthly UTC instant strictly after the reference', () => {
    const schedule = { cadence: 'monthly', dayOfMonth: 1, hourUtc: 8, minuteUtc: 30 } as const;
    const atBoundary = buildPublicAreaExploreModel('jongno-gu', {
      ...dependencies(createPublicAreaV2Fixture()),
      referenceInstant: '2026-09-01T08:30:00.000Z',
      updateSchedule: schedule,
    } as Parameters<typeof buildPublicAreaExploreModel>[1]);
    expect(atBoundary.status).toBe('ready');
    if (atBoundary.status !== 'ready') return;
    expect((atBoundary.source as typeof atBoundary.source & { nextUpdate: unknown }).nextUpdate)
      .toEqual({ cadence: 'monthly', instant: '2026-10-01T08:30:00.000Z' });

    const beforeBoundary = buildPublicAreaExploreModel('jongno-gu', {
      ...dependencies(createPublicAreaV2Fixture()),
      referenceInstant: '2026-12-01T08:29:59.999Z',
      updateSchedule: schedule,
    } as Parameters<typeof buildPublicAreaExploreModel>[1]);
    expect(beforeBoundary.status).toBe('ready');
    if (beforeBoundary.status !== 'ready') return;
    expect((beforeBoundary.source as typeof beforeBoundary.source & { nextUpdate: unknown }).nextUpdate)
      .toEqual({ cadence: 'monthly', instant: '2026-12-01T08:30:00.000Z' });

    const yearRollover = buildPublicAreaExploreModel('jongno-gu', {
      ...dependencies(createPublicAreaV2Fixture()),
      referenceInstant: '2026-12-31T23:59:59.999Z',
      updateSchedule: schedule,
    } as Parameters<typeof buildPublicAreaExploreModel>[1]);
    expect(yearRollover.status).toBe('ready');
    if (yearRollover.status !== 'ready') return;
    expect((yearRollover.source as typeof yearRollover.source & { nextUpdate: unknown }).nextUpdate)
      .toEqual({ cadence: 'monthly', instant: '2027-01-01T08:30:00.000Z' });
  });

  it('omits a next-update promise when schedule configuration is absent or invalid', () => {
    const absent = buildPublicAreaExploreModel('jongno-gu', dependencies(createPublicAreaV2Fixture()));
    expect(absent.status).toBe('ready');
    if (absent.status !== 'ready') return;
    expect((absent.source as typeof absent.source & { nextUpdate: unknown }).nextUpdate).toBeNull();

    const invalid = buildPublicAreaExploreModel('jongno-gu', {
      ...dependencies(createPublicAreaV2Fixture()),
      updateSchedule: { cadence: 'monthly', dayOfMonth: 29, hourUtc: 8, minuteUtc: 30 },
    } as Parameters<typeof buildPublicAreaExploreModel>[1]);
    expect(invalid.status).toBe('ready');
    if (invalid.status !== 'ready') return;
    expect((invalid.source as typeof invalid.source & { nextUpdate: unknown }).nextUpdate).toBeNull();
  });

  it('assigns deterministic five-step ranks without changing catalog order', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies());
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;

    expect(model.selectedSlug).toBe('gangnam-gu');
    expect(model.districts.map(({ slug }) => slug)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    );
    expect(Object.fromEntries(model.districts.map(({ slug, bucket }) => [slug, bucket])))
      .toMatchObject({
        'jung-gu': 0,
        'yongsan-gu': 0,
        'jungnang-gu': 1,
        'seongdong-gu': 2,
        'dongdaemun-gu': 2,
        'jongno-gu': 3,
        'gwangjin-gu': 4,
        'seongbuk-gu': null,
      });
    expect(model.legend).toEqual([
      { bucket: 0, count: 2, minimumMedian: 100_000_000, maximumMedian: 100_000_000, label: '₩100,000,000' },
      { bucket: 1, count: 1, minimumMedian: 200_000_000, maximumMedian: 200_000_000, label: '₩200,000,000' },
      { bucket: 2, count: 2, minimumMedian: 300_000_000, maximumMedian: 400_000_000, label: '₩300,000,000–₩400,000,000' },
      { bucket: 3, count: 1, minimumMedian: 500_000_000, maximumMedian: 500_000_000, label: '₩500,000,000' },
      { bucket: 4, count: 1, minimumMedian: 700_000_000, maximumMedian: 700_000_000, label: '₩700,000,000' },
    ]);
  });

  it('falls back to Jongno for an invalid selection and derives every row field', () => {
    const model = buildPublicAreaExploreModel('not-a-district', dependencies());
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;

    expect(model.selectedSlug).toBe('jongno-gu');
    expect(model.districts).toHaveLength(25);
    expect(model.districts[0]).toMatchObject({
      lawdCd: '11110',
      slug: 'jongno-gu',
      nameEn: 'Jongno-gu',
      nameKo: '종로구',
      href: '/kr/seoul/explore/jongno-gu/',
      state: 'published',
      sampleLabel: '5 reported contracts',
      medianLabel: '₩500,000,000',
    });
    expect(model.districts[0]!.path).toMatch(/^M/);
    expect(model.districts.map(({ href }) => href)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => `/kr/seoul/explore/${slug}/`),
    );
    expect(model.districts[7]).toMatchObject({
      state: 'withheld',
      sampleLabel: '1 reported contract',
      medianLabel: null,
      changeLabel: null,
    });
    expect(model.source).toEqual({
      evidence: {
        marketId: 'kr-seoul',
        provider: 'MOLIT',
        dataset: 'reported rent contracts',
        period: PUBLIC_AREA_FIXTURE_PERIOD,
        generatedAt: '2026-08-31T01:13:24.787Z',
        state: 'ready',
        publicationMinimum: 5,
        methodologyId: 'kr-jeonse-45-55-v1',
        rightsPolicyId: 'kr-molit-rent-v1',
      },
      provider: 'MOLIT',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
      band: '45–55㎡',
      publicationMinimum: 5,
      includesNewAndRenewal: true,
      includesUnknownContractType: true,
      includesUnknownRecordStatus: true,
      nextUpdate: null,
      geometryAttribution: 'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
    });
  });

  it('returns an explicit unavailable state with no district money fallback', () => {
    const model = buildPublicAreaExploreModel(undefined, dependencies({ broken: true }));

    expect(model).toEqual({
      status: 'unavailable',
      selectedSlug: null,
      districts: [],
      source: expect.objectContaining({ period: PUBLIC_AREA_FIXTURE_PERIOD }),
      message: 'Verified district summary unavailable',
    });
    expect(model.source.evidence).toBeNull();
    expect(JSON.stringify(model)).not.toContain(String(CITY_MEDIAN_SENTINEL));
  });
});

describe('public district route model', () => {
  it('keeps every nearby-district link symmetric across all 25 detail models', () => {
    const models = new Map(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => [
      slug,
      buildPublicDistrictModel(slug, dependencies()),
    ] as const));

    for (const [slug, model] of models) {
      expect(model).not.toBeNull();
      if (model === null) continue;
      for (const nearby of model.nearby) {
        expect(models.get(nearby.slug)?.nearby.map(({ slug: peer }) => peer))
          .toContain(slug);
      }
    }
  });

  it('builds published copy, nearby links, FAQ, and structured data from one summary', () => {
    const model = buildPublicDistrictModel('jongno-gu', dependencies());
    expect(model?.status).toBe('published');
    if (model === null || model.status !== 'published') return;

    expect(model.identity.slug).toBe('jongno-gu');
    expect(model.summary.med).toBe(500_000_000);
    expect(model.display).toEqual({
      heading: 'Jongno-gu refundable jeonse deposit evidence',
      sampleLabel: '5 reported contracts',
      medianLabel: '₩500,000,000',
      rangeLabel: '₩480,000,000–₩520,000,000',
      middleHalfLabel: '₩490,000,000–₩510,000,000',
      changeLabel: '3-month change not assessable',
      spread: {
        status: 'interpretable',
        bucket: 'narrow',
        ratio: 0.04,
        label: 'Narrow middle-half spread',
        explanation: 'The middle half spans 4.0% of the median.',
      },
      change: {
        status: 'not_assessable',
        label: '3-month change not assessable',
        sampleLabel: null,
        reasons: ['Prior/latest sample counts were not retained in this snapshot.'],
      },
    });
    expect(model.nearby.map(({ slug }) => slug)).toEqual([
      'jung-gu', 'dongdaemun-gu', 'seongbuk-gu', 'eunpyeong-gu', 'seodaemun-gu',
    ]);
    expect(model.faq).toHaveLength(5);
    expect(model.faq[0]!.answer).toContain('₩500,000,000');
    expect(model.faq[0]!.answer).toContain('5 reported contracts');
    expect(model.faq[1]!.answer).toMatch(/below, equal to, or above/i);
    expect(model.faq[1]!.answer).not.toMatch(/fair|unfair|good|bad/i);
    expect(model.datasetJsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      temporalCoverage: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    expect(model.faqJsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
    });
  });

  it('withholds every monetary field and city fallback from a thin district model', () => {
    const model = buildPublicDistrictModel('seongbuk-gu', dependencies());
    expect(model?.status).toBe('withheld');
    if (model === null || model.status !== 'withheld') return;

    expect(model.display).toEqual({
      heading: 'Seongbuk-gu refundable jeonse deposit evidence',
      sampleLabel: '1 reported contract',
      medianLabel: null,
      rangeLabel: null,
      middleHalfLabel: null,
      changeLabel: null,
      spread: null,
      change: null,
    });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain(String(CITY_MEDIAN_SENTINEL));
    expect(serialized).not.toMatch(/"(?:min|p25|med|p75|max|chg3m)"/);
    expect(serialized).not.toMatch(/₩|KRW\s*\d/i);
    expect(model.faq[0]!.answer).toMatch(/not published/i);
    expect(model.datasetJsonLd).toMatchObject({
      '@type': 'Dataset',
      measurementTechnique: 'Publication withheld because fewer than 5 contracts qualified.',
    });
  });

  it('returns null for an unknown slug and a money-free unavailable model for bad data', () => {
    expect(buildPublicDistrictModel('unknown-gu', dependencies())).toBeNull();

    const model = buildPublicDistrictModel('jongno-gu', dependencies(null));
    expect(model).toMatchObject({
      status: 'unavailable',
      identity: { slug: 'jongno-gu' },
      message: 'Verified district summary unavailable',
    });
    expect(JSON.stringify(model)).not.toContain(String(CITY_MEDIAN_SENTINEL));
  });
});
