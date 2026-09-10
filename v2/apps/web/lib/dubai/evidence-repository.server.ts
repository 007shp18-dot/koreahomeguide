import 'server-only';

import { createHash } from 'node:crypto';

import {
  isDubaiEvidenceUsePermitted,
  parseDubaiAreaEvidence,
  type DubaiAreaEvidence,
  type DubaiAreaEvidenceSnapshot,
} from './evidence-contract';
import {
  checkedInSnapshotsAreEnabled,
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  type VerifiedInstalledSnapshot,
} from '../snapshots/installed-snapshot-repository.server';

export class DubaiEvidenceUnavailableError extends Error {
  readonly code = 'dubai_area_evidence_unavailable' as const;

  constructor() {
    super('Dubai area evidence unavailable');
    this.name = 'DubaiEvidenceUnavailableError';
  }
}
export type DubaiEvidenceContext = Readonly<{
  generatedAt: string;
  asOfDate: string;
  comparisonPeriod: DubaiAreaEvidenceSnapshot['comparisonPeriod'];
  sourcePeriods: DubaiAreaEvidenceSnapshot['sourcePeriods'];
  publicationMinimum: 30;
  displayState: DubaiAreaEvidenceSnapshot['publication']['displayState'];
  indexState: DubaiAreaEvidenceSnapshot['publication']['indexState'];
  provider: 'Dubai Land Department';
  sourceUrl: string;
  licenseUrl: string;
  attribution: string;
  rightsPolicyId: string;
  dataDigest: string;
}>;

export type DubaiEvidenceRepository = Readonly<{
  getContext(): DubaiEvidenceContext;
  listAreas(): readonly DubaiAreaEvidence[];
  getArea(slug: string): DubaiAreaEvidence | null;
  listAreaRouteParams(): readonly Readonly<{ area: string }>[];
}>;

type RepositoryInput = Readonly<{
  serialized: string;
  expectedDigest: string;
}>;

function isDigest(value: string): boolean {
  return /^[a-f0-9]{64}$/u.test(value);
}

function repositoryFromSnapshot(snapshot: DubaiAreaEvidenceSnapshot): DubaiEvidenceRepository {
  const { rights, publication } = snapshot;
  if (rights.state !== 'approved' || !rights.canStore || !rights.canCreateDerived
    || !isDubaiEvidenceUsePermitted(rights) || !rights.canDisplay || rights.licenseUrl === null
    || snapshot.unitVerification.state !== 'verified'
    || !['published', 'stale'].includes(publication.displayState)) {
    throw new DubaiEvidenceUnavailableError();
  }
  const context = Object.freeze({
    generatedAt: snapshot.generatedAt,
    asOfDate: snapshot.asOfDate,
    comparisonPeriod: snapshot.comparisonPeriod,
    sourcePeriods: snapshot.sourcePeriods,
    publicationMinimum: snapshot.publicationMinimum,
    displayState: publication.displayState,
    indexState: publication.indexState,
    provider: 'Dubai Land Department' as const,
    sourceUrl: rights.sourceUrl,
    licenseUrl: rights.licenseUrl,
    attribution: rights.attribution,
    rightsPolicyId: rights.policyId,
    dataDigest: snapshot.dataDigest,
  });
  const areas = snapshot.areas;
  const bySlug = new Map(areas.map((area) => [area.slug, area] as const));
  const indexable = publication.displayState === 'published'
    && publication.indexState === 'index'
    && rights.canIndex;
  return Object.freeze({
    getContext: () => context,
    listAreas: () => areas,
    getArea: (slug) => bySlug.get(slug) ?? null,
    listAreaRouteParams: () => indexable
      ? Object.freeze(areas.map(({ slug }) => Object.freeze({ area: slug })))
      : Object.freeze([]),
  });
}

function createDubaiEvidenceRepositorySync(
  input: RepositoryInput,
): DubaiEvidenceRepository {
  try {
    if (!isDigest(input.expectedDigest)
      || createHash('sha256').update(input.serialized).digest('hex') !== input.expectedDigest) {
      throw new DubaiEvidenceUnavailableError();
    }
    const snapshot = parseDubaiAreaEvidence(JSON.parse(input.serialized));
    return repositoryFromSnapshot(snapshot);
  } catch (error) {
    if (error instanceof DubaiEvidenceUnavailableError) throw error;
    throw new DubaiEvidenceUnavailableError();
  }
}

export async function createDubaiEvidenceRepository(
  input: RepositoryInput,
): Promise<DubaiEvidenceRepository> {
  return createDubaiEvidenceRepositorySync(input);
}

export function createDubaiEvidenceRepositoryFromInstalled(
  installed: VerifiedInstalledSnapshot,
): DubaiEvidenceRepository {
  if (installed.metadata.marketId !== 'ae-dubai'
    || installed.metadata.dataset !== 'ae-area-evidence') {
    throw new DubaiEvidenceUnavailableError();
  }
  try {
    const snapshot = parseDubaiAreaEvidence(installed.payload);
    const period = `${snapshot.comparisonPeriod.from.slice(0, 7)}/${snapshot.comparisonPeriod.to.slice(0, 7)}`;
    if (installed.metadata.schemaVersion !== snapshot.version
      || installed.metadata.generatedAt !== snapshot.generatedAt
      || installed.metadata.rightsPolicyId !== snapshot.rights.policyId
      || installed.metadata.period !== period
      || installed.metadata.recordCount !== snapshot.areas.length) {
      throw new DubaiEvidenceUnavailableError();
    }
    return repositoryFromSnapshot(snapshot);
  } catch (error) {
    if (error instanceof DubaiEvidenceUnavailableError) throw error;
    throw new DubaiEvidenceUnavailableError();
  }
}

let environmentCache: Readonly<{
  serialized: string | undefined;
  digest: string;
  repository: DubaiEvidenceRepository | null;
}> | null = null;

export function dubaiEvidenceRepositoryFromEnvironment(): DubaiEvidenceRepository | null {
  const serialized = process.env.SIGNEDPRICE_DUBAI_AREA_EVIDENCE_ARTIFACT;
  const digest = process.env.SIGNEDPRICE_DUBAI_AREA_EVIDENCE_SHA256 ?? '';
  if (environmentCache !== null
    && environmentCache.serialized === serialized
    && environmentCache.digest === digest) return environmentCache.repository;
  const repository = (() => {
    if (checkedInSnapshotsAreEnabled()) {
      try {
        const installed = createInstalledSnapshotRepository({
          registrySource: resolveInstalledSnapshotRegistry(),
          resolveObject: resolveInstalledSnapshotObject,
        }).get('ae-dubai', 'ae-area-evidence');
        return createDubaiEvidenceRepositoryFromInstalled(installed);
      } catch {
        // Retry the explicit compatibility source below.
      }
    }
    if (serialized === undefined) return null;
    try {
      return createDubaiEvidenceRepositorySync({ serialized, expectedDigest: digest });
    } catch {
      return null;
    }
  })();
  environmentCache = Object.freeze({ serialized, digest, repository });
  return repository;
}
