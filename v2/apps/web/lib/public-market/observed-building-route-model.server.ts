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
import {
  koreaProximityRepositoryFromEnvironment,
  type KoreaProximityRepositoryState,
} from './korea-proximity-repository.server';
import { koreaBuildingProximityModel } from './korea-proximity-display.server';

export type ObservedBuildingRouteDependencies = Readonly<{
  source?: unknown;
  period?: string;
  proximityRepository?: KoreaProximityRepositoryState;
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
  proximity: Readonly<{
    status: 'ready' | 'missing' | 'invalid';
    coordinateStatus: 'ready' | 'pending_coordinate' | 'unavailable';
    nearestStation: Readonly<{ sourceId: string; name: string; lines: readonly string[]; distanceMeters: number }> | null;
    nearestSchool: Readonly<{ sourceId: string; name: string; distanceMeters: number }> | null;
    provenance?: Readonly<{
      stationSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
      schoolSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
      coordinateSource: Readonly<{ landingPage: string; sourceVersion: string; asOf: string }>;
      methodology: 'WGS84 Haversine straight-line metres';
    }>;
  }>;
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
    message: 'No publishable price evidence is installed for the exact 45–55㎡ zero-rent jeonse cohort.';
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

function proximityModel(buildingId: string, repository: KoreaProximityRepositoryState) {
  if (repository.state !== 'ready') return Object.freeze({ status: repository.state, coordinateStatus: 'unavailable' as const, nearestStation: null, nearestSchool: null });
  const display = koreaBuildingProximityModel(buildingId, repository);
  if (display === null) throw new TypeError('Ready proximity display is unavailable.');
  const artifact = repository.repository.getArtifact();
  return Object.freeze({
    status: 'ready' as const,
    ...display,
    provenance: Object.freeze({ stationSource: artifact.provenance.stationSource, schoolSource: artifact.provenance.schoolSource, coordinateSource: artifact.provenance.coordinateSource, methodology: artifact.provenance.methodology.distance }),
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
    const repository = dependencies?.source === undefined || dependencies.period === undefined
      ? observedBuildingRepositoryFromEnvironment()
      : createObservedBuildingRepository({
          source: dependencies.source,
          expected: { marketId: 'kr-seoul', period: dependencies.period },
        });
    if (repository === null) return null;
    const building = repository.getById(buildingId);
    if (building.districtSlug !== district.slug) return null;
    const artifact = repository.getArtifact();
    const proximity = dependencies?.proximityRepository ?? koreaProximityRepositoryFromEnvironment({ observedBuildingRepository: repository });
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
      proximity: proximityModel(buildingId, proximity),
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
        message: 'No publishable price evidence is installed for the exact 45–55㎡ zero-rent jeonse cohort.',
      }),
    });
  } catch {
    return null;
  }
}
