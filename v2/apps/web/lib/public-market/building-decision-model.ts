import {
  createPublicMarketSummary,
  type PublishedMarketSummary,
  type QuotePositionAxis,
} from '@signedprice/market-core';

import type { PublicBuildingModel } from './building-route-model.server';
import type {
  BuildingContractCohort,
  BuildingDecisionSelection,
} from './building-decision-state';

export type BuildingDecisionReadiness =
  | Readonly<{ state: 'published'; count: number }>
  | Readonly<{
      state: 'confirmed_future'; title: string; reason: string; nextAction: string;
    }>
  | Readonly<{
      state: 'insufficient'; count: number; title: string; reason: string; nextAction: string;
    }>
  | Readonly<{
      state: 'unavailable'; title: string; reason: string; nextAction: string;
    }>;

export type BuildingDecisionModel = Readonly<{
  selection: BuildingDecisionSelection;
  overview: Readonly<{ primaryMode: 'rent' }>;
  rent: Readonly<{
    cohort: BuildingContractCohort;
    readiness: BuildingDecisionReadiness;
    summary: PublishedMarketSummary | null;
    axis: QuotePositionAxis;
  }>;
  buy: Readonly<{ readiness: BuildingDecisionReadiness }>;
  invest: Readonly<{ readiness: BuildingDecisionReadiness }>;
  rentCheckHref: string;
}>;

function cohortGroup(model: PublicBuildingModel, cohort: BuildingContractCohort) {
  return cohort === 'all' ? model.building.groups.all : model.building.groups[cohort];
}

function rentCheckType(model: PublicBuildingModel): 'apartment' | 'officetel' | 'villa' {
  return model.building.housingType === 'villa_multifamily'
    ? 'villa'
    : model.building.housingType;
}

function rentReadiness(
  cohort: BuildingContractCohort,
  group: ReturnType<typeof cohortGroup>,
  minimum: number,
): BuildingDecisionReadiness {
  if (group.published) return Object.freeze({ state: 'published', count: group.n });
  const label = cohort === 'all' ? 'All' : cohort === 'new' ? 'New' : 'Renewal';
  return Object.freeze({
    state: 'insufficient',
    count: group.n,
    title: `${label} contract evidence is not published`,
    reason: `${group.n} eligible records are below the ${minimum}-record publication minimum.`,
    nextAction: cohort === 'all' ? 'Return to district evidence' : 'View All contract evidence',
  });
}

function summaryFor(
  model: PublicBuildingModel,
  cohort: BuildingContractCohort,
): PublishedMarketSummary | null {
  const group = cohortGroup(model, cohort);
  if (!group.published) return null;
  const summary = createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: model.building.buildingId,
    parent: model.district.slug,
    deal: 'jeonse',
    band: `building:${cohort}`,
    period: model.building.period,
    n: group.n,
    min: group.min,
    p25: group.p25,
    med: group.med,
    p75: group.p75,
    max: group.max,
    chg3m: null,
  });
  if (!summary.published) throw new TypeError('Published cohort summary required.');
  return summary;
}

export function buildBuildingDecisionModel(
  model: PublicBuildingModel,
  selection: BuildingDecisionSelection,
): BuildingDecisionModel {
  const group = cohortGroup(model, selection.contract);
  const query = new URLSearchParams({
    lawdCd: model.district.lawdCd,
    type: rentCheckType(model),
  });
  return Object.freeze({
    selection,
    overview: Object.freeze({ primaryMode: 'rent' }),
    rent: Object.freeze({
      cohort: selection.contract,
      readiness: rentReadiness(
        selection.contract,
        group,
        model.evidence.publicationMinimum,
      ),
      summary: summaryFor(model, selection.contract),
      axis: model.plotAxis,
    }),
    buy: Object.freeze({
      readiness: Object.freeze({
        state: 'unavailable',
        title: 'Official sale evidence is not ready',
        reason: 'No rights-cleared official sale artifact is installed for this building.',
        nextAction: 'Review the current evidence ledger',
      }),
    }),
    invest: Object.freeze({
      readiness: Object.freeze({
        state: 'insufficient',
        count: 0,
        title: 'Investment evidence is incomplete',
        reason: 'Official sale evidence and explicit financing assumptions are required.',
        nextAction: 'Review the current evidence ledger',
      }),
    }),
    rentCheckHref: `/kr/seoul/check/?${query.toString()}`,
  });
}
