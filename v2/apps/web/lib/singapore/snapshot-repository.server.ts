import 'server-only';

import {
  SG_URA_PRIVATE_SALE_RIGHTS,
  assertSingaporePublicationRights,
  parseSingaporeSnapshot,
  type SingaporeProjectSummary,
  type SingaporePublicationRights,
  type SingaporeSegmentSummary,
  type SingaporeSnapshot,
  type SingaporeSnapshotRecord,
} from '@signedprice/singapore-property';
import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  shouldUseCheckedInSnapshots,
  type VerifiedInstalledSnapshot,
} from '../snapshots/installed-snapshot-repository.server';

export type SingaporeProjectRouteParam = Readonly<{
  area: 'ccr' | 'rcr' | 'ocr';
  projectId: string;
}>;

export type SingaporeSnapshotContext = Readonly<{
  generatedAt: string;
  period: string;
  publicationMinimum: 5;
  projects: number;
  transactions: number;
  excluded: number;
  digest: string;
}>;

export type SingaporeSnapshotRepository = Readonly<{
  getMarket(): SingaporeSnapshot['version'];
  getContext(): SingaporeSnapshotContext;
  listSegments(): readonly SingaporeSegmentSummary[];
  getSegment(segment: string): SingaporeSegmentSummary | null;
  listProjects(segment: string): readonly SingaporeProjectSummary[];
  getProject(segment: string, projectId: string): SingaporeProjectSummary | null;
  listProjectRecords(segment: string, projectId: string): readonly SingaporeSnapshotRecord[];
  listProjectRouteParams(): readonly SingaporeProjectRouteParam[];
}>;

export class SingaporeEvidenceUnavailableError extends Error {
  readonly name = 'SingaporeEvidenceUnavailableError';
  readonly code = 'singapore_evidence_unavailable' as const;

  constructor() {
    super('Verified Singapore evidence unavailable');
  }
}

type RepositoryInput = Readonly<{
  serialized?: string;
  load?: () => Promise<string>;
  expectedDigest: string;
  expectedPeriod: string;
  rights?: SingaporePublicationRights;
}>;

const VALID_SEGMENTS = new Set(['CCR', 'RCR', 'OCR']);

function normalizedSegment(value: string): 'CCR' | 'RCR' | 'OCR' | null {
  const segment = value.toUpperCase();
  return VALID_SEGMENTS.has(segment) ? segment as 'CCR' | 'RCR' | 'OCR' : null;
}

export async function createSingaporeSnapshotRepository(
  input: RepositoryInput,
): Promise<SingaporeSnapshotRepository> {
  try {
    const rights = input.rights ?? SG_URA_PRIVATE_SALE_RIGHTS;
    assertSingaporePublicationRights(rights);
    if (!/^[a-f0-9]{64}$/.test(input.expectedDigest) || input.expectedPeriod.trim().length === 0) {
      throw new Error('invalid expected evidence');
    }
    if ((input.serialized === undefined) === (input.load === undefined)) {
      throw new Error('exactly one Singapore snapshot source is required');
    }
    const serialized = input.serialized ?? await input.load!();
    const snapshot = parseSingaporeSnapshot(serialized);
    const period = `${snapshot.period.from}..${snapshot.period.to}`;
    if (snapshot.digest !== input.expectedDigest || period !== input.expectedPeriod) {
      throw new Error('Singapore snapshot expectation mismatch');
    }
    const context = Object.freeze({
      generatedAt: snapshot.generatedAt,
      period,
      publicationMinimum: snapshot.publicationMinimum,
      projects: snapshot.totals.projects,
      transactions: snapshot.totals.transactions,
      excluded: snapshot.totals.excluded,
      digest: snapshot.digest,
    });
    const routeParams = Object.freeze(snapshot.projects
      .filter(({ published }) => published)
      .map(({ marketSegment, id }) => Object.freeze({
        area: marketSegment.toLowerCase() as SingaporeProjectRouteParam['area'],
        projectId: id,
      })));
    return Object.freeze({
      getMarket: () => snapshot.version,
      getContext: () => context,
      listSegments: () => snapshot.segments,
      getSegment(segment: string) {
        const code = normalizedSegment(segment);
        return code === null ? null : snapshot.segments.find((item) => item.segment === code) ?? null;
      },
      listProjects(segment: string) {
        const code = normalizedSegment(segment);
        if (code === null) return Object.freeze([]);
        return Object.freeze(snapshot.projects.filter(({ marketSegment }) => marketSegment === code));
      },
      getProject(segment: string, projectId: string) {
        const code = normalizedSegment(segment);
        if (code === null) return null;
        return snapshot.projects.find(({ marketSegment, id }) => (
          marketSegment === code && id === projectId
        )) ?? null;
      },
      listProjectRecords(segment: string, projectId: string) {
        const code = normalizedSegment(segment);
        if (code === null) return Object.freeze([]);
        return Object.freeze(snapshot.records.filter(({ marketSegment, projectId: id }) => (
          marketSegment === code && id === projectId
        )));
      },
      listProjectRouteParams: () => routeParams,
    });
  } catch (error) {
    if (error instanceof SingaporeEvidenceUnavailableError) throw error;
    throw new SingaporeEvidenceUnavailableError();
  }
}

export async function createSingaporeSnapshotRepositoryFromInstalled(
  installed: VerifiedInstalledSnapshot,
): Promise<SingaporeSnapshotRepository> {
  const payload = installed.payload as Partial<SingaporeSnapshot>;
  if (installed.metadata.marketId !== 'sg-singapore'
    || installed.metadata.dataset !== 'sg-private-sale'
    || payload.version !== 'signedprice-singapore-private-sale-v1'
    || typeof payload.digest !== 'string') {
    throw new SingaporeEvidenceUnavailableError();
  }
  return createSingaporeSnapshotRepository({
    serialized: JSON.stringify(installed.payload),
    expectedDigest: payload.digest,
    expectedPeriod: installed.metadata.period.replace('/', '..'),
  });
}

let environmentCache: Readonly<{
  serialized: string | undefined;
  digest: string;
  period: string;
  repository: Promise<SingaporeSnapshotRepository | null>;
}> | null = null;

export function singaporeSnapshotRepositoryFromEnvironment(): Promise<SingaporeSnapshotRepository | null> {
  const serialized = process.env.SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT;
  const digest = process.env.SIGNEDPRICE_SINGAPORE_SNAPSHOT_SHA256 ?? '';
  const period = process.env.SIGNEDPRICE_SINGAPORE_SNAPSHOT_PERIOD ?? '';
  if (environmentCache !== null
    && environmentCache.serialized === serialized
    && environmentCache.digest === digest
    && environmentCache.period === period) return environmentCache.repository;
  const repository = (async () => {
    if (shouldUseCheckedInSnapshots()) {
      try {
        const installed = createInstalledSnapshotRepository({
          registrySource: resolveInstalledSnapshotRegistry(),
          resolveObject: resolveInstalledSnapshotObject,
        }).get('sg-singapore', 'sg-private-sale');
        return await createSingaporeSnapshotRepositoryFromInstalled(installed);
      } catch {
        // Retry the explicit compatibility source below.
      }
    }
    return createSingaporeSnapshotRepository({
      serialized,
      expectedDigest: digest,
      expectedPeriod: period,
    }).catch(() => null);
  })();
  environmentCache = Object.freeze({ serialized, digest, period, repository });
  return repository;
}
