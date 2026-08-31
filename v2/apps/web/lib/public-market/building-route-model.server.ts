import 'server-only';

import { createEvidenceDescriptor, type EvidenceDescriptor } from '@signedprice/market-core';
import {
  getSeoulDistrictBySlug,
  type SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';

import {
  createPublicBuildingRepository,
  publicBuildingRepositoryFromEnvironment,
} from './building-summary-repository.server';
import type {
  PublicBuildingDistribution,
  PublicBuildingRecord,
} from './building-summary-schema';

export type PublicBuildingRouteDependencies = Readonly<{
  source: unknown;
  period: string;
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
  }>;
  evidence: PublicBuildingEvidenceModel;
}>;

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

function displayFor(summary: Extract<PublicBuildingDistribution, { published: true }>) {
  return Object.freeze({
    sampleLabel: `${summary.n} reported contract${summary.n === 1 ? '' : 's'}`,
    medianLabel: money.format(summary.med),
    rangeLabel: `${money.format(summary.min)}–${money.format(summary.max)}`,
    middleHalfLabel: `${money.format(summary.p25)}–${money.format(summary.p75)}`,
    changeLabel: summary.chg3m === null
      ? '3-month change unavailable'
      : `${summary.chg3m > 0 ? '+' : ''}${summary.chg3m.toFixed(1)}% over the prior 3 months`,
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
    });
  } catch {
    return null;
  }
}
