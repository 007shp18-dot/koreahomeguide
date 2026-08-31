import 'server-only';

import {
  getSeoulDistrictBySlug,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent/browser';

import type {
  PublicAreaSummaryRepository,
  PublicContractGroup,
} from '../public-market/area-summary-repository.server';
import type {
  VerifiedNewsEvidence,
  VerifiedNewsRecord,
} from './news-schema';

export type NewsEvidenceClaim =
  | Readonly<{
      kind: 'district-count';
      artifactId: string;
      expected: number;
    }>
  | Readonly<{
      kind: 'summary-field';
      artifactId: string;
      area: 'seoul' | SeoulDistrictSlug;
      group: PublicContractGroup;
      field: 'n' | 'med' | 'chg3m';
      expected: number;
    }>;

export type NewsEvidenceDependencies = Readonly<{
  claims: readonly NewsEvidenceClaim[];
  areaSummaryRepository: PublicAreaSummaryRepository | null;
}>;

export class VerifiedNewsEvidenceUnavailableError extends Error {
  readonly code = 'verified_news_evidence_unavailable' as const;

  constructor() {
    super('Verified News evidence is unavailable.');
    this.name = 'VerifiedNewsEvidenceUnavailableError';
  }
}

function unavailable(): never {
  throw new VerifiedNewsEvidenceUnavailableError();
}

export function createPublicAreaArtifactId(
  repository: PublicAreaSummaryRepository,
): string {
  try {
    const evidence = repository.getEvidenceDescriptor();
    if (evidence.marketId !== 'kr-seoul') unavailable();
    return `kr-seoul:${evidence.period}:area:${repository.getArtifactVersion()}`;
  } catch {
    unavailable();
  }
}

function exactArtifactDeclaration(
  record: VerifiedNewsRecord,
  claims: readonly NewsEvidenceClaim[],
): boolean {
  const declared = [...record.evidence.artifactIds].sort();
  const referenced = [...new Set(claims.map(({ artifactId }) => artifactId))].sort();
  return (
    declared.length === referenced.length &&
    declared.every((artifactId, index) => artifactId === referenced[index])
  );
}

function assertClaim(
  claim: NewsEvidenceClaim,
  repository: PublicAreaSummaryRepository,
  installedArtifactId: string,
): void {
  if (
    claim.artifactId !== installedArtifactId ||
    !Number.isFinite(claim.expected)
  ) {
    unavailable();
  }

  if (claim.kind === 'district-count') {
    if (
      !Number.isSafeInteger(claim.expected) ||
      claim.expected < 0 ||
      repository.listDistrictSummaries('all').length !== claim.expected
    ) {
      unavailable();
    }
    return;
  }

  if (!['all', 'new', 'renewal'].includes(claim.group)) unavailable();
  const summary = claim.area === 'seoul'
    ? repository.getCitySummary(claim.group)
    : (() => {
        const district = getSeoulDistrictBySlug(claim.area);
        if (district === null) unavailable();
        return repository.getDistrictSummary(district.slug, claim.group);
      })();

  let actual: number | null;
  if (claim.field === 'n') {
    actual = summary.n;
  } else {
    if (!summary.published) unavailable();
    actual = summary[claim.field];
  }
  if (actual === null || !Object.is(actual, claim.expected)) unavailable();
}

export function resolveNewsEvidence(
  record: VerifiedNewsRecord,
  dependencies: NewsEvidenceDependencies,
): VerifiedNewsEvidence {
  try {
    if (record.evidence.status !== 'verified') {
      if (dependencies.claims.length !== 0) unavailable();
      return record.evidence;
    }
    if (
      dependencies.claims.length === 0 ||
      dependencies.areaSummaryRepository === null ||
      !exactArtifactDeclaration(record, dependencies.claims)
    ) {
      unavailable();
    }
    const installedArtifactId = createPublicAreaArtifactId(
      dependencies.areaSummaryRepository,
    );
    for (const claim of dependencies.claims) {
      assertClaim(claim, dependencies.areaSummaryRepository, installedArtifactId);
    }
    return record.evidence;
  } catch (error) {
    if (error instanceof VerifiedNewsEvidenceUnavailableError) throw error;
    unavailable();
  }
}
