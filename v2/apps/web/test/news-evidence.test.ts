import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicAreaArtifactId,
  resolveNewsEvidence,
  type NewsEvidenceClaim,
} from '../lib/news/news-evidence.server';
import { parseVerifiedNewsRecord } from '../lib/news/news-schema';
import { createPublicAreaSummaryRepository } from '../lib/public-market/area-summary-repository.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV1Fixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';
import { KR_SEOUL_NEWS_RECORDS } from '../content/news/kr-seoul';
import { KR_SEOUL_NEWS_CLAIMS_BY_ID } from '../content/news/kr-seoul-claims.server';
import { createNewsRepository } from '../lib/news/news-repository.server';

const V2_ARTIFACT_ID = `kr-seoul:${PUBLIC_AREA_FIXTURE_PERIOD}:area:v2`;

function verifiedRecord(artifactIds: readonly string[] = [V2_ARTIFACT_ID]) {
  return parseVerifiedNewsRecord({
    schemaVersion: 1,
    id: 'kr-seoul-coverage-2026-08-31',
    slug: 'what-the-seoul-district-snapshot-covers',
    marketId: 'kr-seoul',
    language: 'en',
    category: 'data-brief',
    title: 'What the Seoul district snapshot covers',
    summary: 'The current completed-period coverage boundary.',
    publishedAt: '2026-08-31T01:00:00.000Z',
    updatedAt: null,
    source: {
      publisher: 'Public Data Portal',
      title: 'MOLIT apartment rental transaction API',
      url: 'https://www.data.go.kr/data/15126474/openapi.do',
      publishedAt: null,
    },
    evidence: {
      status: 'verified',
      line: '25 Seoul districts are included in the completed-period snapshot.',
      artifactIds,
    },
    body: [{ type: 'paragraph', text: 'This brief explains the coverage boundary.' }],
  });
}

function repositoryV2() {
  return createPublicAreaSummaryRepository({
    source: createPublicAreaV2Fixture(),
    expected: { marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD },
  });
}

describe('verified News evidence', () => {
  it('reconciles every authored Seoul record with its sibling claims', () => {
    const news = createNewsRepository(KR_SEOUL_NEWS_RECORDS);

    for (const record of news.list('kr-seoul')) {
      expect(resolveNewsEvidence(record, {
        claims: KR_SEOUL_NEWS_CLAIMS_BY_ID[record.id] ?? [],
        areaSummaryRepository: repositoryV2(),
      })).toEqual(record.evidence);
    }
  });

  it('derives an exact public-area artifact identity', () => {
    expect(createPublicAreaArtifactId(repositoryV2())).toBe(V2_ARTIFACT_ID);
  });

  it('returns the authored line only after the district count reconciles', () => {
    const evidence = resolveNewsEvidence(verifiedRecord(), {
      claims: [{ kind: 'district-count', artifactId: V2_ARTIFACT_ID, expected: 25 }],
      areaSummaryRepository: repositoryV2(),
    });

    expect(evidence).toEqual({
      status: 'verified',
      line: '25 Seoul districts are included in the completed-period snapshot.',
      artifactIds: [V2_ARTIFACT_ID],
    });
    expect(Object.isFrozen(evidence)).toBe(true);
  });

  it('reconciles count, median, and change against the declared split group', () => {
    const claims: readonly NewsEvidenceClaim[] = [
      {
        kind: 'summary-field', artifactId: V2_ARTIFACT_ID, area: 'jung-gu',
        group: 'new', field: 'n', expected: 5,
      },
      {
        kind: 'summary-field', artifactId: V2_ARTIFACT_ID, area: 'jung-gu',
        group: 'new', field: 'med', expected: 90_000_000,
      },
      {
        kind: 'summary-field', artifactId: V2_ARTIFACT_ID, area: 'jung-gu',
        group: 'new', field: 'chg3m', expected: 1.2,
      },
    ];

    expect(resolveNewsEvidence(verifiedRecord(), {
      claims,
      areaSummaryRepository: repositoryV2(),
    }).status).toBe('verified');
  });

  it.each([
    ['wrong period', {
      kind: 'district-count',
      artifactId: 'kr-seoul:2025-12/2026-06:area:v2',
      expected: 25,
    } satisfies NewsEvidenceClaim],
    ['altered number', {
      kind: 'district-count', artifactId: V2_ARTIFACT_ID, expected: 24,
    } satisfies NewsEvidenceClaim],
    ['wrong group value', {
      kind: 'summary-field', artifactId: V2_ARTIFACT_ID, area: 'jung-gu',
      group: 'renewal', field: 'med', expected: 90_000_000,
    } satisfies NewsEvidenceClaim],
  ])('fails closed for a %s claim', (_name, claim) => {
    expect(() => resolveNewsEvidence(verifiedRecord([claim.artifactId]), {
      claims: [claim],
      areaSummaryRepository: repositoryV2(),
    })).toThrow('Verified News evidence is unavailable.');
  });

  it('fails closed when the declared artifact is missing', () => {
    expect(() => resolveNewsEvidence(verifiedRecord(), {
      claims: [{ kind: 'district-count', artifactId: V2_ARTIFACT_ID, expected: 25 }],
      areaSummaryRepository: null,
    })).toThrow('Verified News evidence is unavailable.');
  });

  it('rejects split evidence when only a v1 combined snapshot is installed', () => {
    const repository = createPublicAreaSummaryRepository({
      source: createPublicAreaV1Fixture(),
      expected: { marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD },
    });
    const artifactId = createPublicAreaArtifactId(repository);

    expect(() => resolveNewsEvidence(verifiedRecord([artifactId]), {
      claims: [{
        kind: 'summary-field', artifactId, area: 'jung-gu', group: 'new',
        field: 'med', expected: 90_000_000,
      }],
      areaSummaryRepository: repository,
    })).toThrow('Verified News evidence is unavailable.');
  });

  it('rejects a money field when the referenced summary is withheld', () => {
    const source = createPublicAreaV2Fixture();
    const previous = source.groups.new.districtSummaries[0]!;
    source.groups.new.districtSummaries[0] = {
      marketId: 'kr-seoul', area: 'jongno-gu', parent: 'seoul', deal: 'jeonse',
      band: '45-55sqm', period: PUBLIC_AREA_FIXTURE_PERIOD, n: 4, published: false,
    };
    source.groups.new.citySummary.n -= previous.n - 4;
    source.groups.all.districtSummaries[0]!.n -= previous.n - 4;
    source.groups.all.citySummary.n -= previous.n - 4;
    const repository = createPublicAreaSummaryRepository({
      source,
      expected: { marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD },
    });

    expect(() => resolveNewsEvidence(verifiedRecord(), {
      claims: [{
        kind: 'summary-field', artifactId: V2_ARTIFACT_ID, area: 'jongno-gu',
        group: 'new', field: 'med', expected: 80_000_000,
      }],
      areaSummaryRepository: repository,
    })).toThrow('Verified News evidence is unavailable.');
  });

  it('passes a non-numeric methodology line without an artifact dependency', () => {
    const record = parseVerifiedNewsRecord({
      ...structuredClone({
        schemaVersion: 1,
        id: 'method',
        slug: 'method',
        marketId: 'kr-seoul',
        language: 'en',
        category: 'methodology',
        title: 'Method note',
        summary: 'A source-boundary note.',
        publishedAt: '2026-08-31T00:00:00.000Z',
        updatedAt: null,
        source: {
          publisher: 'Public Data Portal', title: 'MOLIT API',
          url: 'https://www.data.go.kr/data/15126474/openapi.do', publishedAt: null,
        },
        evidence: {
          status: 'not-applicable', line: 'This brief makes no market-change claim.',
          artifactIds: [],
        },
        body: [{ type: 'paragraph', text: 'Method.' }],
      }),
    });

    expect(resolveNewsEvidence(record, {
      claims: [],
      areaSummaryRepository: null,
    })).toEqual(record.evidence);
  });
});
