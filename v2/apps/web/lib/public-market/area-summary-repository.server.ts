import 'server-only';

import {
  createEvidenceDescriptor,
  type EvidenceDescriptor,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  parsePublicAreaSummaryArtifact,
  type PublicAreaSummaryArtifactExpectation,
} from './area-summary-schema';

export type PublicAreaSummaryRepository = Readonly<{
  getCitySummary(): PublicMarketSummary;
  getEvidenceDescriptor(): EvidenceDescriptor;
  listDistrictSummaries(): readonly PublicMarketSummary[];
  getDistrictSummary(slug: SeoulDistrictSlug): PublicMarketSummary;
}>;

export class PublicAreaSummaryUnavailableError extends Error {
  readonly code = 'public_area_summary_unavailable' as const;

  constructor() {
    super('Verified public area summary is unavailable.');
    this.name = 'PublicAreaSummaryUnavailableError';
  }
}

export function createPublicAreaSummaryRepository(input: Readonly<{
  source: unknown;
  expected: PublicAreaSummaryArtifactExpectation;
}>): PublicAreaSummaryRepository {
  try {
    const artifact = parsePublicAreaSummaryArtifact(input.source, input.expected);
    const districts = Object.freeze([...artifact.districtSummaries]);
    const districtsBySlug = new Map(
      districts.map((summary) => [summary.area, summary] as const),
    );
    const evidence = createEvidenceDescriptor({
      marketId: artifact.marketId,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      period: artifact.period,
      generatedAt: artifact.generatedAt,
      state: 'ready',
      publicationMinimum: 5,
      methodologyId: 'kr-jeonse-45-55-v1',
      rightsPolicyId: 'kr-molit-rent-v1',
    });

    return Object.freeze({
      getCitySummary(): PublicMarketSummary {
        return artifact.citySummary;
      },
      getEvidenceDescriptor(): EvidenceDescriptor {
        return evidence;
      },
      listDistrictSummaries(): readonly PublicMarketSummary[] {
        return districts;
      },
      getDistrictSummary(slug: SeoulDistrictSlug): PublicMarketSummary {
        const summary = districtsBySlug.get(slug);
        if (summary === undefined) throw new PublicAreaSummaryUnavailableError();
        return summary;
      },
    });
  } catch (error) {
    if (error instanceof PublicAreaSummaryUnavailableError) throw error;
    throw new PublicAreaSummaryUnavailableError();
  }
}
