import { createHash } from 'node:crypto';

export const KOREA_PROXIMITY_ARTIFACT_VERSION = 'signedprice-korea-proximity-v1';
export const KOREA_PROXIMITY_LIMIT_METERS = 1_000;
export const KOREA_PROXIMITY_BUCKETS_METERS = Object.freeze([250, 500, 750, 1_000] as const);
export const KOREA_STATION_MERGE_RADIUS_METERS = 75;
export const KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE = 0.9;

const EARTH_RADIUS_METERS = 6_371_008.8;
const GRID_CELL_METERS = KOREA_PROXIMITY_LIMIT_METERS;

export interface KoreaProximityCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface KoreaProximityBuildingSource {
  readonly buildingId: string;
  readonly coordinate: KoreaProximityCoordinate | null;
}

export interface KoreaProximityStationSource {
  readonly sourceId: string;
  readonly name: string;
  readonly line: string;
  readonly coordinate: KoreaProximityCoordinate;
}

export interface KoreaProximitySchoolSource {
  readonly sourceId: string;
  readonly name: string;
  readonly coordinate: KoreaProximityCoordinate;
}

export interface KoreaMergedStation {
  readonly sourceId: string;
  readonly name: string;
  readonly lines: readonly string[];
  readonly coordinate: KoreaProximityCoordinate;
}

export type KoreaProximityBucketMeters = (typeof KOREA_PROXIMITY_BUCKETS_METERS)[number];

export interface KoreaProximityNearestStation {
  readonly sourceId: string;
  readonly name: string;
  readonly lines: readonly string[];
  readonly distanceMeters: number;
  readonly bucketMeters: KoreaProximityBucketMeters | null;
}

export interface KoreaProximityStationMatch extends KoreaProximityNearestStation {
  readonly bucketMeters: KoreaProximityBucketMeters;
}

export interface KoreaProximityNearestSchool {
  readonly sourceId: string;
  readonly name: string;
  readonly distanceMeters: number;
  readonly bucketMeters: KoreaProximityBucketMeters | null;
}

export interface KoreaProximitySchoolMatch extends KoreaProximityNearestSchool {
  readonly bucketMeters: KoreaProximityBucketMeters;
}

export interface KoreaProximityReadyRecord {
  readonly buildingId: string;
  readonly status: 'ready';
  readonly nearestStation: KoreaProximityNearestStation | null;
  readonly nearestSchool: KoreaProximityNearestSchool | null;
  readonly stations: readonly KoreaProximityStationMatch[];
  readonly schools: readonly KoreaProximitySchoolMatch[];
}

export interface KoreaProximityPendingRecord {
  readonly buildingId: string;
  readonly status: 'pending_coordinate';
}

export type KoreaProximityRecord = KoreaProximityReadyRecord | KoreaProximityPendingRecord;

export interface KoreaProximitySourceProvenance {
  readonly landingPage: string;
  readonly sourceVersion: string;
  readonly asOf: string;
}

export interface KoreaProximityStationCatalogRecord {
  readonly sourceId: string;
  readonly name: string;
  readonly lines: readonly string[];
}

export interface KoreaProximitySchoolCatalogRecord {
  readonly sourceId: string;
  readonly name: string;
}

export interface KoreaProximityArtifact {
  readonly artifactVersion: typeof KOREA_PROXIMITY_ARTIFACT_VERSION;
  readonly generatedAt: string;
  readonly provenance: {
    readonly marketId: 'kr-seoul';
    readonly period: string;
    readonly stationSource: KoreaProximitySourceProvenance;
    readonly schoolSource: KoreaProximitySourceProvenance;
    readonly coordinateSource: KoreaProximitySourceProvenance;
    readonly methodology: {
      readonly distance: 'WGS84 Haversine straight-line metres';
      readonly nearbyLimitMeters: 1_000;
      readonly bucketsMeters: typeof KOREA_PROXIMITY_BUCKETS_METERS;
      readonly stationMergeRadiusMeters: 75;
    };
  };
  readonly counts: {
    readonly observedBuildingCount: number;
    readonly coordinateReadyCount: number;
    readonly pendingCoordinateCount: number;
    readonly stationCount: number;
    readonly schoolCount: number;
    readonly stationMatchedBuildingCount: number;
    readonly schoolMatchedBuildingCount: number;
  };
  readonly coverage: {
    readonly coordinateRatio: number;
    readonly minimumReleaseRatio: typeof KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE;
  };
  readonly stations: readonly KoreaProximityStationCatalogRecord[];
  readonly schools: readonly KoreaProximitySchoolCatalogRecord[];
  readonly records: readonly KoreaProximityRecord[];
  readonly sha256: string;
}

function assertCoordinate(coordinate: KoreaProximityCoordinate): void {
  if (
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90 ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    throw new TypeError('Invalid Korea proximity coordinate');
  }
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) {
    throw new TypeError(`Invalid Korea proximity ${label}`);
  }
  return normalized;
}

function sourceId(value: string, label: string): string {
  const normalized = nonEmpty(value, label);
  if (normalized !== value) throw new TypeError(`Invalid Korea proximity ${label}`);
  return normalized;
}

export function compareKoreaProximityText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function haversineDistanceMeters(
  left: KoreaProximityCoordinate,
  right: KoreaProximityCoordinate,
): number {
  assertCoordinate(left);
  assertCoordinate(right);
  const toRadians = Math.PI / 180;
  const latitudeDelta = (right.latitude - left.latitude) * toRadians;
  const longitudeDelta = (right.longitude - left.longitude) * toRadians;
  const leftLatitude = left.latitude * toRadians;
  const rightLatitude = right.latitude * toRadians;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function koreaProximityBucketMeters(
  distanceMeters: number,
): KoreaProximityBucketMeters | null {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new TypeError('Invalid Korea proximity distance');
  }
  return KOREA_PROXIMITY_BUCKETS_METERS.find((limit) => distanceMeters <= limit) ?? null;
}

export function mergeKoreaStationSources(
  sources: readonly KoreaProximityStationSource[],
): readonly KoreaMergedStation[] {
  const rows = sources
    .map((source) => ({
      sourceId: sourceId(source.sourceId, 'station source id'),
      name: nonEmpty(source.name, 'station name'),
      line: nonEmpty(source.line, 'station line'),
      coordinate: source.coordinate,
    }))
    .sort((left, right) =>
      compareKoreaProximityText(left.name, right.name) ||
      left.coordinate.latitude - right.coordinate.latitude ||
      left.coordinate.longitude - right.coordinate.longitude ||
      compareKoreaProximityText(left.sourceId, right.sourceId) ||
      compareKoreaProximityText(left.line, right.line),
    );
  rows.forEach((row) => assertCoordinate(row.coordinate));

  const clusters: Array<Array<(typeof rows)[number]>> = [];
  for (const row of rows) {
    const cluster = clusters.find((candidate) => (
      candidate[0]?.name === row.name
      && candidate.every((member) => (
        haversineDistanceMeters(member.coordinate, row.coordinate)
          <= KOREA_STATION_MERGE_RADIUS_METERS
      ))
    ));
    if (cluster === undefined) clusters.push([row]);
    else cluster.push(row);
  }

  return clusters
    .map((cluster): KoreaMergedStation => ({
      sourceId: [...new Set(cluster.map((row) => row.sourceId))].sort().join('+'),
      name: cluster[0]!.name,
      lines: [...new Set(cluster.map((row) => row.line))].sort(),
      coordinate: {
        latitude: cluster.reduce((sum, row) => sum + row.coordinate.latitude, 0) / cluster.length,
        longitude: cluster.reduce((sum, row) => sum + row.coordinate.longitude, 0) / cluster.length,
      },
    }))
    .sort(
      (left, right) =>
        compareKoreaProximityText(left.name, right.name) ||
        left.coordinate.latitude - right.coordinate.latitude ||
        left.coordinate.longitude - right.coordinate.longitude ||
        compareKoreaProximityText(left.sourceId, right.sourceId),
    );
}

interface GridPoint<T> {
  readonly value: T;
  readonly coordinate: KoreaProximityCoordinate;
}

function ecefCoordinate(coordinate: KoreaProximityCoordinate): readonly [number, number, number] {
  assertCoordinate(coordinate);
  const latitude = (coordinate.latitude * Math.PI) / 180;
  const longitude = (coordinate.longitude * Math.PI) / 180;
  const cosLatitude = Math.cos(latitude);
  return [
    EARTH_RADIUS_METERS * cosLatitude * Math.cos(longitude),
    EARTH_RADIUS_METERS * cosLatitude * Math.sin(longitude),
    EARTH_RADIUS_METERS * Math.sin(latitude),
  ];
}

function gridKey(coordinate: KoreaProximityCoordinate): readonly [number, number, number] {
  const [x, y, z] = ecefCoordinate(coordinate);
  return [
    Math.floor(x / GRID_CELL_METERS),
    Math.floor(y / GRID_CELL_METERS),
    Math.floor(z / GRID_CELL_METERS),
  ];
}

function createGrid<T>(points: readonly GridPoint<T>[]): Map<string, readonly GridPoint<T>[]> {
  const grid = new Map<string, GridPoint<T>[]>();
  for (const point of points) {
    const key = gridKey(point.coordinate).join(':');
    const cell = grid.get(key) ?? [];
    cell.push(point);
    grid.set(key, cell);
  }
  return grid;
}

function candidates<T>(
  grid: ReadonlyMap<string, readonly GridPoint<T>[]>,
  coordinate: KoreaProximityCoordinate,
): readonly GridPoint<T>[] {
  const [x, y, z] = gridKey(coordinate);
  const result: GridPoint<T>[] = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        result.push(...(grid.get(`${x! + dx}:${y! + dy}:${z! + dz}`) ?? []));
      }
    }
  }
  return result;
}

interface KdPoint<T> extends GridPoint<T> {
  readonly ecef: readonly [number, number, number];
}

interface KdNode<T> {
  readonly point: KdPoint<T>;
  readonly axis: 0 | 1 | 2;
  readonly left: KdNode<T> | null;
  readonly right: KdNode<T> | null;
}

function createKdTree<T>(
  points: readonly GridPoint<T>[],
  compareValues: (left: T, right: T) => number,
  depth = 0,
): KdNode<T> | null {
  if (points.length === 0) return null;
  const axis = (depth % 3) as 0 | 1 | 2;
  const indexed = points.map((point): KdPoint<T> => ({
    ...point,
    ecef: ecefCoordinate(point.coordinate),
  }));
  indexed.sort((left, right) =>
    left.ecef[axis] - right.ecef[axis] || compareValues(left.value, right.value),
  );
  const median = Math.floor(indexed.length / 2);
  return {
    point: indexed[median]!,
    axis,
    left: createKdTree(indexed.slice(0, median), compareValues, depth + 1),
    right: createKdTree(indexed.slice(median + 1), compareValues, depth + 1),
  };
}

function squaredEcefDistance(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
): number {
  return (left[0] - right[0]) ** 2 +
    (left[1] - right[1]) ** 2 +
    (left[2] - right[2]) ** 2;
}

function nearestKdPoint<T>(
  tree: KdNode<T> | null,
  coordinate: KoreaProximityCoordinate,
  compareValues: (left: T, right: T) => number,
): Readonly<{ point: GridPoint<T> | null; distanceChecks: number }> {
  const target = ecefCoordinate(coordinate);
  let best: KdPoint<T> | null = null;
  let bestSquaredDistance = Number.POSITIVE_INFINITY;
  let distanceChecks = 0;

  const search = (node: KdNode<T> | null): void => {
    if (node === null) return;
    distanceChecks += 1;
    const squaredDistance = squaredEcefDistance(target, node.point.ecef);
    if (
      squaredDistance < bestSquaredDistance ||
      (squaredDistance === bestSquaredDistance && best !== null &&
        compareValues(node.point.value, best.value) < 0)
    ) {
      best = node.point;
      bestSquaredDistance = squaredDistance;
    }
    const delta = target[node.axis] - node.point.ecef[node.axis];
    const near = delta <= 0 ? node.left : node.right;
    const far = delta <= 0 ? node.right : node.left;
    search(near);
    if (delta ** 2 <= bestSquaredDistance) search(far);
  };
  search(tree);
  return { point: best, distanceChecks };
}

function compareProximityIdentity(
  left: { readonly name: string; readonly sourceId: string },
  right: { readonly name: string; readonly sourceId: string },
): number {
  return compareKoreaProximityText(left.name, right.name) ||
    compareKoreaProximityText(left.sourceId, right.sourceId);
}

export function compareKoreaProximityMatches(
  left: { readonly distanceMeters: number; readonly name: string; readonly sourceId: string },
  right: { readonly distanceMeters: number; readonly name: string; readonly sourceId: string },
): number {
  return left.distanceMeters - right.distanceMeters || compareProximityIdentity(left, right);
}

export function buildKoreaProximityRecords(input: {
  readonly buildings: readonly KoreaProximityBuildingSource[];
  readonly stations: readonly KoreaProximityStationSource[];
  readonly schools: readonly KoreaProximitySchoolSource[];
}): {
  readonly records: readonly KoreaProximityRecord[];
  readonly mergedStations: readonly KoreaMergedStation[];
  readonly diagnostics: {
    readonly stationDistanceChecks: number;
    readonly schoolDistanceChecks: number;
    readonly stationNearestDistanceChecks: number;
    readonly schoolNearestDistanceChecks: number;
  };
} {
  const stationSourceIds = input.stations.map((station) => sourceId(station.sourceId, 'station source id'));
  if (new Set(stationSourceIds).size !== stationSourceIds.length) {
    throw new TypeError('Duplicate Korea proximity station source id');
  }
  const schoolSourceIds = input.schools.map((school) => sourceId(school.sourceId, 'school source id'));
  if (new Set(schoolSourceIds).size !== schoolSourceIds.length) {
    throw new TypeError('Duplicate Korea proximity school source id');
  }
  const mergedStations = mergeKoreaStationSources(input.stations);
  if (new Set(mergedStations.map((station) => station.sourceId)).size !== mergedStations.length) {
    throw new TypeError('Duplicate Korea proximity merged station source id');
  }
  const schools = input.schools
    .map((school) => ({
      sourceId: sourceId(school.sourceId, 'school source id'),
      name: nonEmpty(school.name, 'school name'),
      coordinate: school.coordinate,
    }))
    .sort((left, right) => compareProximityIdentity(left, right));
  schools.forEach((school) => assertCoordinate(school.coordinate));

  const stationGrid = createGrid(mergedStations.map((value) => ({ value, coordinate: value.coordinate })));
  const schoolGrid = createGrid(schools.map((value) => ({ value, coordinate: value.coordinate })));
  const stationTree = createKdTree(
    mergedStations.map((value) => ({ value, coordinate: value.coordinate })),
    compareProximityIdentity,
  );
  const schoolTree = createKdTree(
    schools.map((value) => ({ value, coordinate: value.coordinate })),
    compareProximityIdentity,
  );
  let stationDistanceChecks = 0;
  let schoolDistanceChecks = 0;
  let stationNearestDistanceChecks = 0;
  let schoolNearestDistanceChecks = 0;
  const seenBuildingIds = new Set<string>();

  const records = [...input.buildings]
    .sort((left, right) => compareKoreaProximityText(left.buildingId, right.buildingId))
    .map((building): KoreaProximityRecord => {
      const buildingId = sourceId(building.buildingId, 'building id');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(buildingId)) {
        throw new TypeError('Invalid Korea proximity building id');
      }
      if (seenBuildingIds.has(buildingId)) throw new TypeError('Duplicate Korea proximity building id');
      seenBuildingIds.add(buildingId);
      if (building.coordinate === null) return { buildingId, status: 'pending_coordinate' };
      assertCoordinate(building.coordinate);

      const stations: KoreaProximityStationMatch[] = [];
      for (const candidate of candidates(stationGrid, building.coordinate)) {
        stationDistanceChecks += 1;
        const distance = haversineDistanceMeters(building.coordinate, candidate.coordinate);
        const rawBucket = koreaProximityBucketMeters(distance);
        if (rawBucket !== null) {
          stations.push({
            sourceId: candidate.value.sourceId,
            name: candidate.value.name,
            lines: candidate.value.lines,
            distanceMeters: distance,
            bucketMeters: rawBucket,
          });
        }
      }
      const nearbySchools: KoreaProximitySchoolMatch[] = [];
      for (const candidate of candidates(schoolGrid, building.coordinate)) {
        schoolDistanceChecks += 1;
        const distance = haversineDistanceMeters(building.coordinate, candidate.coordinate);
        const rawBucket = koreaProximityBucketMeters(distance);
        if (rawBucket !== null) {
          nearbySchools.push({
            sourceId: candidate.value.sourceId,
            name: candidate.value.name,
            distanceMeters: distance,
            bucketMeters: rawBucket,
          });
        }
      }
      stations.sort(compareKoreaProximityMatches);
      nearbySchools.sort(compareKoreaProximityMatches);
      const nearestStationPoint = nearestKdPoint(
        stationTree,
        building.coordinate,
        compareProximityIdentity,
      );
      stationNearestDistanceChecks += nearestStationPoint.distanceChecks;
      const nearestSchoolPoint = nearestKdPoint(
        schoolTree,
        building.coordinate,
        compareProximityIdentity,
      );
      schoolNearestDistanceChecks += nearestSchoolPoint.distanceChecks;
      const nearestStationDistance = nearestStationPoint.point === null
        ? null
        : haversineDistanceMeters(building.coordinate, nearestStationPoint.point.coordinate);
      const nearestSchoolDistance = nearestSchoolPoint.point === null
        ? null
        : haversineDistanceMeters(building.coordinate, nearestSchoolPoint.point.coordinate);
      return {
        buildingId,
        status: 'ready',
        nearestStation: nearestStationPoint.point === null || nearestStationDistance === null
          ? null
          : {
            sourceId: nearestStationPoint.point.value.sourceId,
            name: nearestStationPoint.point.value.name,
            lines: nearestStationPoint.point.value.lines,
            distanceMeters: nearestStationDistance,
            bucketMeters: koreaProximityBucketMeters(nearestStationDistance),
          },
        nearestSchool: nearestSchoolPoint.point === null || nearestSchoolDistance === null
          ? null
          : {
            sourceId: nearestSchoolPoint.point.value.sourceId,
            name: nearestSchoolPoint.point.value.name,
            distanceMeters: nearestSchoolDistance,
            bucketMeters: koreaProximityBucketMeters(nearestSchoolDistance),
          },
        stations,
        schools: nearbySchools,
      };
    });

  return {
    records,
    mergedStations,
    diagnostics: {
      stationDistanceChecks,
      schoolDistanceChecks,
      stationNearestDistanceChecks,
      schoolNearestDistanceChecks,
    },
  };
}

export interface KoreaProximitySourceCounts {
  readonly observedBuildingCount: number;
  readonly coordinateReadyCount: number;
  readonly stationCount: number;
  readonly schoolCount: number;
}

export function assertKoreaProximityReleaseGate(input: {
  readonly current: KoreaProximitySourceCounts;
  readonly previous?: KoreaProximitySourceCounts;
}): void {
  const countKeys = ['observedBuildingCount', 'coordinateReadyCount', 'stationCount', 'schoolCount'] as const;
  for (const key of countKeys) {
    const count = input.current[key];
    if (!Number.isSafeInteger(count) || count < 0) throw new TypeError(`Invalid ${key}`);
  }
  if (Object.keys(input.current).length !== countKeys.length ||
    !Object.keys(input.current).every((key) => countKeys.includes(key as typeof countKeys[number]))) {
    throw new TypeError('Invalid Korea proximity current counts');
  }
  for (const key of ['observedBuildingCount', 'stationCount', 'schoolCount'] as const) {
    if (input.current[key] === 0) {
      throw new Error(`Korea proximity required ${key} is empty`);
    }
  }
  if (input.current.coordinateReadyCount > input.current.observedBuildingCount) {
    throw new TypeError('Invalid coordinate ready count');
  }
  if (input.previous !== undefined) {
    if (Object.keys(input.previous).length !== countKeys.length ||
      !Object.keys(input.previous).every((key) => countKeys.includes(key as typeof countKeys[number]))) {
      throw new TypeError('Invalid Korea proximity previous counts');
    }
    for (const key of countKeys) {
      const previous = input.previous[key];
      const current = input.current[key];
      if (!Number.isSafeInteger(previous) || previous < 0) throw new TypeError(`Invalid previous ${key}`);
      if (previous > 0 && (previous - current) / previous >= 0.1) {
        const percent = Math.round(((previous - current) / previous) * 1000) / 10;
        throw new Error(`Korea proximity ${key} shrank by ${percent}%`);
      }
    }
    if (input.previous.coordinateReadyCount > input.previous.observedBuildingCount) {
      throw new TypeError('Invalid previous coordinate ready count');
    }
  }
  const coverage =
    input.current.observedBuildingCount === 0
      ? 0
      : input.current.coordinateReadyCount / input.current.observedBuildingCount;
  if (coverage === 0 || coverage < KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE) {
    throw new Error('Korea proximity coordinate coverage is below the release threshold');
  }
}

function assertPublicSource(source: KoreaProximitySourceProvenance): void {
  if (
    source === null || typeof source !== 'object' || Array.isArray(source) ||
    Object.keys(source).length !== 3 ||
    !Object.keys(source).every((key) => ['landingPage', 'sourceVersion', 'asOf'].includes(key)) ||
    typeof source.landingPage !== 'string' || typeof source.sourceVersion !== 'string' ||
    typeof source.asOf !== 'string'
  ) {
    throw new TypeError('Invalid Korea proximity public provenance');
  }
  const landingPage = new URL(source.landingPage);
  const asOf = new Date(`${source.asOf}T00:00:00.000Z`);
  if (
    landingPage.protocol !== 'https:' ||
    landingPage.username !== '' ||
    landingPage.password !== '' ||
    landingPage.search !== '' ||
    landingPage.hash !== '' ||
    nonEmpty(source.sourceVersion, 'source version') !== source.sourceVersion ||
    !/^\d{4}-\d{2}-\d{2}$/.test(source.asOf) ||
    !Number.isFinite(asOf.getTime()) ||
    asOf.toISOString().slice(0, 10) !== source.asOf
  ) {
    throw new TypeError('Invalid Korea proximity public provenance');
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compareKoreaProximityText(left, right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildKoreaProximityArtifact(input: {
  readonly generatedAt: string;
  readonly period: string;
  readonly sources: {
    readonly station: KoreaProximitySourceProvenance;
    readonly school: KoreaProximitySourceProvenance;
    readonly coordinate: KoreaProximitySourceProvenance;
  };
  readonly buildings: readonly KoreaProximityBuildingSource[];
  readonly stations: readonly KoreaProximityStationSource[];
  readonly schools: readonly KoreaProximitySchoolSource[];
  readonly previousCounts?: KoreaProximitySourceCounts;
}): KoreaProximityArtifact {
  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.toISOString() !== input.generatedAt) {
    throw new TypeError('Invalid Korea proximity generated instant');
  }
  const period = /^(\d{4}-(\d{2}))\/(\d{4}-(\d{2}))$/.exec(input.period);
  if (
    period === null || Number(period[2]) < 1 || Number(period[2]) > 12 ||
    Number(period[4]) < 1 || Number(period[4]) > 12 || period[1]! > period[3]!
  ) {
    throw new TypeError('Invalid Korea proximity artifact period');
  }
  assertPublicSource(input.sources.station);
  assertPublicSource(input.sources.school);
  assertPublicSource(input.sources.coordinate);
  const built = buildKoreaProximityRecords(input);
  const coordinateReadyCount = built.records.filter((record) => record.status === 'ready').length;
  const current = {
    observedBuildingCount: built.records.length,
    coordinateReadyCount,
    stationCount: built.mergedStations.length,
    schoolCount: input.schools.length,
  };
  assertKoreaProximityReleaseGate({
    current,
    previous: input.previousCounts,
  });
  const stations = built.mergedStations
    .map(({ sourceId, name, lines }): KoreaProximityStationCatalogRecord => ({ sourceId, name, lines }))
    .sort((left, right) => compareKoreaProximityText(left.sourceId, right.sourceId));
  const schools = input.schools
    .map(({ sourceId: id, name }): KoreaProximitySchoolCatalogRecord => ({
      sourceId: sourceId(id, 'school source id'),
      name: nonEmpty(name, 'school name'),
    }))
    .sort((left, right) => compareKoreaProximityText(left.sourceId, right.sourceId));
  const withoutDigest = {
    artifactVersion: KOREA_PROXIMITY_ARTIFACT_VERSION as typeof KOREA_PROXIMITY_ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    provenance: {
      marketId: 'kr-seoul' as const,
      period: input.period,
      stationSource: input.sources.station,
      schoolSource: input.sources.school,
      coordinateSource: input.sources.coordinate,
      methodology: {
        distance: 'WGS84 Haversine straight-line metres' as const,
        nearbyLimitMeters: KOREA_PROXIMITY_LIMIT_METERS as 1_000,
        bucketsMeters: KOREA_PROXIMITY_BUCKETS_METERS,
        stationMergeRadiusMeters: KOREA_STATION_MERGE_RADIUS_METERS as 75,
      },
    },
    counts: {
      ...current,
      pendingCoordinateCount: built.records.length - coordinateReadyCount,
      stationMatchedBuildingCount: built.records.filter(
        (record) => record.status === 'ready' && record.stations.length > 0,
      ).length,
      schoolMatchedBuildingCount: built.records.filter(
        (record) => record.status === 'ready' && record.schools.length > 0,
      ).length,
    },
    coverage: {
      coordinateRatio: coordinateReadyCount / built.records.length,
      minimumReleaseRatio: KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE as
        typeof KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE,
    },
    stations,
    schools,
    records: built.records,
  };
  return {
    ...withoutDigest,
    sha256: createHash('sha256').update(canonicalJson(withoutDigest)).digest('hex'),
  };
}

export function canonicalKoreaProximityArtifactJson(value: unknown): string {
  return canonicalJson(value);
}
