import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  buildPublicAreaExploreModel,
  buildPublicDistrictModel,
  normalizePublicContractGroup,
} from '../lib/public-market/area-route-model.server';
import {
  CITY_MEDIAN_SENTINEL,
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

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
});

describe('public area Explore model', () => {
  it('normalizes query input and exposes independent v2 group evidence', () => {
    expect(normalizePublicContractGroup(undefined)).toBe('all');
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
      changeLabel: '3-month change unavailable',
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
