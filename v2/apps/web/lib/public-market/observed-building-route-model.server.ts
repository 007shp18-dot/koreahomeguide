import 'server-only';

import {
  getSeoulDistrictBySlug,
  type SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';

import {
  createObservedBuildingRepository,
  observedBuildingRepositoryFromEnvironment,
} from './observed-building-repository.server';
import type {
  ObservedBuildingCoordinate,
  ObservedBuildingRecord,
} from './observed-building-schema';

export type ObservedBuildingRouteDependencies = Readonly<{
  source: unknown;
  period: string;
}>;

type ObservedCoordinateModel =
  | Readonly<{
      status: 'ready';
      latitude: number;
      longitude: number;
    }>
  | Readonly<{
      status: 'unavailable';
      reason: 'coordinate_not_resolved';
    }>;

export type ObservedBuildingIdentityModel = Readonly<{
  status: 'identity_only';
  district: SeoulRentCheckDistrict;
  building: ObservedBuildingRecord;
  observations: Readonly<{
    total: number;
    jeonse: number;
    monthly: number;
    firstMonth: string;
    lastMonth: string;
  }>;
  coordinate: ObservedCoordinateModel;
  source: Readonly<{
    provider: 'MOLIT';
    dataset: 'reported rent contracts';
    period: string;
    generatedAt: string;
    rightsPolicyId: 'kr-molit-rent-v1';
    boundary: 'Observed building identity and contract counts only; no price is inferred from district or property-type aggregates.';
  }>;
  evidence: Readonly<{
    status: 'unavailable';
    message: 'Price evidence is unavailable for this building because its verified contract sample does not meet the publication threshold.';
  }>;
}>;

function coordinateModel(coordinate: ObservedBuildingCoordinate): ObservedCoordinateModel {
  if (coordinate.state === 'pending') {
    return Object.freeze({
      status: 'unavailable',
      reason: coordinate.reason,
    });
  }
  return Object.freeze({
    status: 'ready',
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
  });
}

export function buildObservedBuildingIdentityModel(
  districtSlug: string,
  buildingId: string,
  dependencies?: ObservedBuildingRouteDependencies,
): ObservedBuildingIdentityModel | null {
  const district = getSeoulDistrictBySlug(districtSlug);
  if (district === null) return null;
  try {
    const repository = dependencies === undefined
      ? observedBuildingRepositoryFromEnvironment()
      : createObservedBuildingRepository({
          source: dependencies.source,
          expected: { marketId: 'kr-seoul', period: dependencies.period },
        });
    if (repository === null) return null;
    const building = repository.getById(buildingId);
    if (building.districtSlug !== district.slug) return null;
    const artifact = repository.getArtifact();
    return Object.freeze({
      status: 'identity_only',
      district,
      building,
      observations: Object.freeze({
        total: building.observationCount,
        jeonse: building.jeonseObservationCount,
        monthly: building.monthlyObservationCount,
        firstMonth: building.firstObservedMonth,
        lastMonth: building.lastObservedMonth,
      }),
      coordinate: coordinateModel(building.coordinate),
      source: Object.freeze({
        provider: artifact.provider,
        dataset: artifact.dataset,
        period: artifact.period,
        generatedAt: artifact.generatedAt,
        rightsPolicyId: artifact.rightsPolicyId,
        boundary: 'Observed building identity and contract counts only; no price is inferred from district or property-type aggregates.',
      }),
      evidence: Object.freeze({
        status: 'unavailable',
        message: 'Price evidence is unavailable for this building because its verified contract sample does not meet the publication threshold.',
      }),
    });
  } catch {
    return null;
  }
}
