import 'server-only';

import {
  createEvidenceDescriptor,
  createPublicMarketSummary,
  type EvidenceDescriptor,
  type PublishedMarketSummary,
  type QuotePositionAxis,
} from '@signedprice/market-core';
import {
  getSeoulDistrictBySlug,
  type SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';

import { buildCommunitySignalModel } from '../community/community-signal-model.server';
import type { CommunitySignalModel } from '../community/community-signal-model';
import type { NewsCardModel } from '../news/news-card-model';
import { buildNewsCardModels } from '../news/news-card-model.server';
import {
  createPublicBuildingRepository,
  publicBuildingRepositoryFromEnvironment,
} from './building-summary-repository.server';
import type {
  PublicBuildingDistribution,
  PublicBuildingRecord,
} from './building-summary-schema';
import {
  changeReliability,
  evidencePeriod,
  type ChangeReliability,
  type EvidencePeriodModel,
} from './evidence-interpretation';

export type PublicBuildingRouteDependencies = Readonly<{
  source: unknown;
  period: string;
  referenceInstant?: string | Date;
}>;

export type PublicBuildingEvidenceModel = Readonly<{
  provider: 'MOLIT';
  dataset: 'reported rent contracts';
  period: string;
  generatedAt: string;
  rightsPolicyId: 'kr-molit-rent-v1';
  publicationMinimum: number;
  exclusions: readonly string[];
  descriptor: EvidenceDescriptor;
}>;

const FLOOR_COEFFICIENT_BASIS = 'Compared filed contracts in the same building and exact floor area where floor was the differing retained field. Coefficients stay blank when fewer than six eligible pairs remain.' as const;

export type FloorCoefficientModel =
  | Readonly<{
      status: 'unavailable';
      pairCount: number;
      coefficient: null;
      reason: 'Contract evidence insufficient';
      basis: typeof FLOOR_COEFFICIENT_BASIS;
    }>
  | Readonly<{
      status: 'published';
      pairCount: number;
      coefficient: number;
      reason: null;
      basis: typeof FLOOR_COEFFICIENT_BASIS;
    }>;

export function buildFloorCoefficientModel(input: Readonly<{
  pairCount: number;
  coefficient: number | null;
}>): FloorCoefficientModel {
  if (
    !Number.isSafeInteger(input.pairCount)
    || input.pairCount < 0
    || (input.coefficient !== null && !Number.isFinite(input.coefficient))
  ) {
    throw new TypeError('Invalid floor coefficient evidence.');
  }
  if (input.pairCount < 6) {
    return Object.freeze({
      status: 'unavailable',
      pairCount: input.pairCount,
      coefficient: null,
      reason: 'Contract evidence insufficient',
      basis: FLOOR_COEFFICIENT_BASIS,
    });
  }
  if (input.coefficient === null) {
    throw new TypeError('Published floor coefficient evidence requires a coefficient.');
  }
  return Object.freeze({
    status: 'published',
    pairCount: input.pairCount,
    coefficient: input.coefficient,
    reason: null,
    basis: FLOOR_COEFFICIENT_BASIS,
  });
}

export type PublicBuildingModel = Readonly<{
  status: 'ready';
  district: SeoulRentCheckDistrict;
  building: PublicBuildingRecord & Readonly<{
    overall: Extract<PublicBuildingDistribution, { published: true }>;
  }>;
  display: Readonly<{
    sampleLabel: string;
    medianLabel: string;
    rangeLabel: string;
    middleHalfLabel: string;
    changeLabel: string;
    change: ChangeReliability;
  }>;
  distribution: PublishedMarketSummary;
  plotAxis: QuotePositionAxis;
  period: EvidencePeriodModel;
  presentation: Readonly<{
    distributionHeading: 'Declared-period contract evidence';
    sourceBoundary: 'Declared-period reported building contracts, including any filing-in-progress months shown above; not a listing, appraisal, or legal review.';
    periodLabel: 'Declared period';
  }>;
  floorCoefficient: FloorCoefficientModel;
  evidence: PublicBuildingEvidenceModel;
  communitySignal: CommunitySignalModel;
  news: readonly NewsCardModel[];
}>;

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

function displayFor(summary: Extract<PublicBuildingDistribution, { published: true }>) {
  const change = changeReliability({
    pct: summary.chg3m,
    nPrior: null,
    nLatest: null,
  });
  return Object.freeze({
    sampleLabel: `${summary.n} reported contract${summary.n === 1 ? '' : 's'}`,
    medianLabel: money.format(summary.med),
    rangeLabel: `${money.format(summary.min)}–${money.format(summary.max)}`,
    middleHalfLabel: `${money.format(summary.p25)}–${money.format(summary.p75)}`,
    changeLabel: change.label,
    change,
  });
}

function distributionFor(
  building: PublicBuildingRecord,
  summary: Extract<PublicBuildingDistribution, { published: true }>,
): PublishedMarketSummary {
  const distribution = createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: building.buildingId,
    parent: building.districtSlug,
    deal: 'jeonse',
    band: 'building',
    period: building.period,
    n: summary.n,
    min: summary.min,
    p25: summary.p25,
    med: summary.med,
    p75: summary.p75,
    max: summary.max,
    chg3m: null,
  });
  if (!distribution.published) throw new TypeError('Published building distribution required.');
  return distribution;
}

function axisFor(summary: PublishedMarketSummary): QuotePositionAxis {
  return Object.freeze({
    min: summary.min,
    max: summary.max > summary.min ? summary.max : summary.max + 1,
  });
}

export function buildPublicBuildingModel(
  districtSlug: string,
  buildingId: string,
  dependencies?: PublicBuildingRouteDependencies,
): PublicBuildingModel | null {
  const district = getSeoulDistrictBySlug(districtSlug);
  if (district === null) return null;
  try {
    const repository = dependencies === undefined
      ? publicBuildingRepositoryFromEnvironment()
      : createPublicBuildingRepository({
          source: dependencies.source,
          expected: { marketId: 'kr-seoul', period: dependencies.period },
        });
    if (repository === null) return null;
    const building = repository.getById(district.slug, buildingId);
    if (!building.overall.published) return null;
    const context = repository.getContext();
    const distribution = distributionFor(building, building.overall);
    const descriptor = createEvidenceDescriptor({
      marketId: 'kr-seoul',
      provider: context.provider,
      dataset: context.dataset,
      period: context.period,
      generatedAt: context.generatedAt,
      state: 'ready',
      publicationMinimum: building.publicationMinimum,
      methodologyId: 'kr-building-reported-contracts-v1',
      rightsPolicyId: context.rightsPolicyId,
    });
    return Object.freeze({
      status: 'ready',
      district,
      building: building as PublicBuildingModel['building'],
      display: displayFor(building.overall),
      distribution,
      plotAxis: axisFor(distribution),
      period: evidencePeriod(
        context.period,
        dependencies?.referenceInstant ?? new Date(),
      ),
      presentation: Object.freeze({
        distributionHeading: 'Declared-period contract evidence',
        sourceBoundary: 'Declared-period reported building contracts, including any filing-in-progress months shown above; not a listing, appraisal, or legal review.',
        periodLabel: 'Declared period',
      }),
      floorCoefficient: buildFloorCoefficientModel({ pairCount: 0, coefficient: null }),
      evidence: Object.freeze({
        provider: context.provider,
        dataset: context.dataset,
        period: context.period,
        generatedAt: context.generatedAt,
        rightsPolicyId: context.rightsPolicyId,
        publicationMinimum: building.publicationMinimum,
        exclusions: context.exclusions,
        descriptor,
      }),
      communitySignal: buildCommunitySignalModel(Object.freeze({
        marketId: 'kr-seoul',
        scopeType: 'building',
        scopeId: building.buildingId,
        evidenceId: `kr-seoul:${context.period}:building:v1:all`,
      })),
      news: buildNewsCardModels(),
    });
  } catch {
    return null;
  }
}
