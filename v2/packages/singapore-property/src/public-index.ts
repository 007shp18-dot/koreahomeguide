import { createHash } from 'node:crypto';

import type {
  SingaporeProjectSummary,
  SingaporeSegmentSummary,
  SingaporeSnapshot,
  SingaporeSnapshotRecord,
} from './artifact.ts';
import { SINGAPORE_MARKET_SEGMENTS, type SingaporeMarketSegment } from './browser.ts';

export const SINGAPORE_PUBLIC_INDEX_VERSION = 'signedprice-singapore-public-index-v1' as const;

export type PublicEvidenceReleaseRef = Readonly<{
  marketId: 'sg-singapore';
  datasetId: 'sg-private-sale';
  period: string;
  generatedAt: string;
  sourceDigest: string;
  recordCount: number;
}>;

export type SingaporePublicIndex = Readonly<{
  version: typeof SINGAPORE_PUBLIC_INDEX_VERSION;
  regionSummaryByCode: Readonly<Record<SingaporeMarketSegment, SingaporeSegmentSummary>>;
  projectSummaryById: Readonly<Record<string, SingaporeProjectSummary>>;
  projectTransactionsByIdPeriod: Readonly<Record<string, readonly SingaporeSnapshotRecord[]>>;
  evidenceReleaseByScope: Readonly<Record<string, PublicEvidenceReleaseRef>>;
  digest: string;
}>;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}

export function singaporeProjectPeriodKey(
  projectId: string,
  period: Readonly<{ from: string; to: string }>,
): string {
  return `${projectId}::${period.from}..${period.to}`;
}

export function buildSingaporePublicIndex(snapshot: SingaporeSnapshot): SingaporePublicIndex {
  const regionSummaryByCode = {} as Record<SingaporeMarketSegment, SingaporeSegmentSummary>;
  for (const segment of SINGAPORE_MARKET_SEGMENTS) {
    const matches = snapshot.segments.filter((summary) => summary.segment === segment);
    if (matches.length !== 1) throw new Error(`invalid Singapore segment summary: ${segment}`);
    regionSummaryByCode[segment] = matches[0]!;
  }

  const projectSummaryById: Record<string, SingaporeProjectSummary> = {};
  for (const project of snapshot.projects) {
    if (projectSummaryById[project.id] !== undefined) {
      throw new Error(`duplicate Singapore project id: ${project.id}`);
    }
    projectSummaryById[project.id] = project;
  }

  const groupedRecords: Record<string, SingaporeSnapshotRecord[]> = {};
  for (const record of snapshot.records) {
    const project = projectSummaryById[record.projectId];
    if (project === undefined || project.marketSegment !== record.marketSegment) {
      throw new Error(`unknown Singapore project record: ${record.projectId}`);
    }
    const key = singaporeProjectPeriodKey(record.projectId, snapshot.period);
    const group = groupedRecords[key] ?? [];
    group.push(record);
    groupedRecords[key] = group;
  }
  const projectTransactionsByIdPeriod = Object.fromEntries(
    Object.entries(groupedRecords).sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([key, records]) => [key, Object.freeze([...records])]),
  ) as Record<string, readonly SingaporeSnapshotRecord[]>;

  const period = `${snapshot.period.from}..${snapshot.period.to}`;
  const release = Object.freeze({
    marketId: 'sg-singapore' as const,
    datasetId: 'sg-private-sale' as const,
    period,
    generatedAt: snapshot.generatedAt,
    sourceDigest: snapshot.digest,
    recordCount: snapshot.records.length,
  });
  const evidenceReleaseByScope: Record<string, PublicEvidenceReleaseRef> = {
    market: release,
  };
  for (const segment of SINGAPORE_MARKET_SEGMENTS) {
    evidenceReleaseByScope[`region:${segment}`] = release;
  }
  for (const projectId of Object.keys(projectSummaryById).sort()) {
    evidenceReleaseByScope[`project:${projectId}`] = release;
  }

  const unsigned = {
    version: SINGAPORE_PUBLIC_INDEX_VERSION,
    regionSummaryByCode,
    projectSummaryById,
    projectTransactionsByIdPeriod,
    evidenceReleaseByScope,
  } as const;
  return deepFreeze({
    ...unsigned,
    digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
}
