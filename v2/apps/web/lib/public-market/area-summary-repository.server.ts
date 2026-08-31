import 'server-only';

import {
  createEvidenceDescriptor,
  type EvidenceDescriptor,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  parsePublicAreaSummaryArtifact,
  parsePublicAreaSummaryArtifactV1,
  type PublicAreaSummaryArtifactExpectation,
  type VerifiedPublicAreaSummaryGroup,
} from './area-summary-schema';

export type PublicContractGroup = 'all' | 'new' | 'renewal';

export type ContractSplitAvailability =
  | Readonly<{ status: 'ready'; unknownCityCount: number }>
  | Readonly<{ status: 'snapshot_v1' }>;

export type PublicAreaSummaryRepository = Readonly<{
  getArtifactVersion(): 'v1' | 'v2';
  getContractSplitAvailability(): ContractSplitAvailability;
  getCitySummary(group?: PublicContractGroup): PublicMarketSummary;
  getEvidenceDescriptor(): EvidenceDescriptor;
  listDistrictSummaries(group?: PublicContractGroup): readonly PublicMarketSummary[];
  getDistrictSummary(
    slug: SeoulDistrictSlug,
    group?: PublicContractGroup,
  ): PublicMarketSummary;
  getDistrictUnknownContractCount(slug: SeoulDistrictSlug): number | null;
}>;

export class PublicAreaSummaryUnavailableError extends Error {
  readonly code = 'public_area_summary_unavailable' as const;

  constructor() {
    super('Verified public area summary is unavailable.');
    this.name = 'PublicAreaSummaryUnavailableError';
  }
}

type NormalizedArtifact = Readonly<{
  version: 'v1' | 'v2';
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  groups: Readonly<Partial<Record<PublicContractGroup, VerifiedPublicAreaSummaryGroup>>>;
  splitAvailability: ContractSplitAvailability;
  unknownDistrictCounts: readonly number[] | null;
}>;

function normalizeArtifact(
  source: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): NormalizedArtifact {
  try {
    const artifact = parsePublicAreaSummaryArtifact(source, expected);
    return Object.freeze({
      version: 'v2',
      generatedAt: artifact.generatedAt,
      marketId: artifact.marketId,
      period: artifact.period,
      groups: artifact.groups,
      splitAvailability: Object.freeze({
        status: 'ready',
        unknownCityCount: artifact.unknownContractCounts.city,
      }),
      unknownDistrictCounts: artifact.unknownContractCounts.districts,
    });
  } catch {
    const artifact = parsePublicAreaSummaryArtifactV1(source, expected);
    return Object.freeze({
      version: 'v1',
      generatedAt: artifact.generatedAt,
      marketId: artifact.marketId,
      period: artifact.period,
      groups: Object.freeze({
        all: Object.freeze({
          citySummary: artifact.citySummary,
          districtSummaries: artifact.districtSummaries,
        }),
      }),
      splitAvailability: Object.freeze({ status: 'snapshot_v1' }),
      unknownDistrictCounts: null,
    });
  }
}

export function createPublicAreaSummaryRepository(input: Readonly<{
  source: unknown;
  expected: PublicAreaSummaryArtifactExpectation;
}>): PublicAreaSummaryRepository {
  try {
    const artifact = normalizeArtifact(input.source, input.expected);
    const groups = new Map<PublicContractGroup, Readonly<{
      citySummary: PublicMarketSummary;
      districts: readonly PublicMarketSummary[];
      districtsBySlug: ReadonlyMap<string, PublicMarketSummary>;
    }>>();
    for (const group of ['all', 'new', 'renewal'] as const) {
      const value = artifact.groups[group];
      if (value === undefined) continue;
      const districts = Object.freeze([...value.districtSummaries]);
      groups.set(group, Object.freeze({
        citySummary: value.citySummary,
        districts,
        districtsBySlug: new Map(
          districts.map((summary) => [summary.area, summary] as const),
        ),
      }));
    }
    const all = groups.get('all');
    if (all === undefined) throw new PublicAreaSummaryUnavailableError();
    const unknownCountsBySlug = artifact.unknownDistrictCounts === null
      ? null
      : new Map(all.districts.map((summary, index) => [
          summary.area,
          artifact.unknownDistrictCounts![index]!,
        ] as const));
    const evidence = createEvidenceDescriptor({
      marketId: artifact.marketId,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      period: artifact.period,
      generatedAt: artifact.generatedAt,
      state: 'ready',
      publicationMinimum: 5,
      methodologyId: `kr-jeonse-45-55-${artifact.version}`,
      rightsPolicyId: 'kr-molit-rent-v1',
    });

    const groupFor = (group: PublicContractGroup = 'all') => {
      const value = groups.get(group);
      if (value === undefined) throw new PublicAreaSummaryUnavailableError();
      return value;
    };

    return Object.freeze({
      getArtifactVersion(): 'v1' | 'v2' {
        return artifact.version;
      },
      getContractSplitAvailability(): ContractSplitAvailability {
        return artifact.splitAvailability;
      },
      getCitySummary(group: PublicContractGroup = 'all'): PublicMarketSummary {
        return groupFor(group).citySummary;
      },
      getEvidenceDescriptor(): EvidenceDescriptor {
        return evidence;
      },
      listDistrictSummaries(
        group: PublicContractGroup = 'all',
      ): readonly PublicMarketSummary[] {
        return groupFor(group).districts;
      },
      getDistrictSummary(
        slug: SeoulDistrictSlug,
        group: PublicContractGroup = 'all',
      ): PublicMarketSummary {
        const summary = groupFor(group).districtsBySlug.get(slug);
        if (summary === undefined) throw new PublicAreaSummaryUnavailableError();
        return summary;
      },
      getDistrictUnknownContractCount(slug: SeoulDistrictSlug): number | null {
        if (unknownCountsBySlug === null) return null;
        const count = unknownCountsBySlug.get(slug);
        if (count === undefined) throw new PublicAreaSummaryUnavailableError();
        return count;
      },
    });
  } catch (error) {
    if (error instanceof PublicAreaSummaryUnavailableError) throw error;
    throw new PublicAreaSummaryUnavailableError();
  }
}
