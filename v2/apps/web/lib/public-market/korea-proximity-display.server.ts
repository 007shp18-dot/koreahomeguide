import 'server-only';

import type {
  ExploreBuildingProximityModel,
  KoreaExploreProximityPair,
  KoreaExploreProximitySelection,
} from './area-route-types';
import type { KoreaProximityRepositoryState } from './korea-proximity-repository.server';

export function koreaBuildingMatchesProximity(
  buildingId: string,
  repository: KoreaProximityRepositoryState | undefined,
  selection: KoreaExploreProximitySelection | undefined,
): boolean {
  if (
    repository?.state !== 'ready'
    || selection === undefined
    || (selection.station === null && selection.school === null)
  ) return true;
  const record = repository.repository.findByBuildingId(buildingId);
  if (record === null || record.status !== 'ready') return false;
  const matches = (
    pair: KoreaExploreProximityPair | null,
    values: readonly { sourceId: string; distanceMeters: number }[],
  ) => pair === null || values.some((value) => (
    value.sourceId === pair.sourceId && value.distanceMeters <= pair.distanceMeters
  ));
  return matches(selection.station, record.stations)
    && matches(selection.school, record.schools);
}

export function koreaBuildingProximityModel(
  buildingId: string,
  repository: KoreaProximityRepositoryState | undefined,
): ExploreBuildingProximityModel | null {
  if (repository?.state !== 'ready') return null;
  const record = repository.repository.findByBuildingId(buildingId);
  if (record === null) return Object.freeze({
    coordinateStatus: 'unavailable', nearestStation: null, nearestSchool: null,
  });
  if (record.status === 'pending_coordinate') return Object.freeze({ coordinateStatus: 'pending_coordinate', nearestStation: null, nearestSchool: null });
  return Object.freeze({
    coordinateStatus: 'ready',
    nearestStation: record.nearestStation === null ? null : Object.freeze({
      sourceId: record.nearestStation.sourceId,
      name: record.nearestStation.name,
      lines: Object.freeze([...record.nearestStation.lines]),
      distanceMeters: record.nearestStation.distanceMeters,
    }),
    nearestSchool: record.nearestSchool === null ? null : Object.freeze({
      sourceId: record.nearestSchool.sourceId,
      name: record.nearestSchool.name,
      distanceMeters: record.nearestSchool.distanceMeters,
    }),
  });
}
