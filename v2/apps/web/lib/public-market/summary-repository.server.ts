import 'server-only';

import type { PublicMarketSummary } from '@signedprice/market-core';

import {
  parsePublicSummaryArtifact,
  type PublicSummaryArtifactExpectation,
} from './summary-schema';

export {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  type PublicSummaryArtifactExpectation,
  type PublicSummaryArtifactInput,
} from './summary-schema';

export type PublicSummaryQuery = Readonly<{
  area: string;
  deal: string;
  band: string;
}>;

export type PublicSummaryRepository = Readonly<{
  getSummary(query: PublicSummaryQuery): PublicMarketSummary;
}>;

export class PublicSummaryUnavailableError extends Error {
  readonly code = 'public_summary_unavailable' as const;

  constructor() {
    super('Verified public market summary is unavailable.');
    this.name = 'PublicSummaryUnavailableError';
  }
}

function key(query: PublicSummaryQuery): string {
  return JSON.stringify([query.area, query.deal, query.band]);
}

export function createPublicSummaryRepository(input: Readonly<{
  source: unknown;
  expected: PublicSummaryArtifactExpectation;
}>): PublicSummaryRepository {
  try {
    const artifact = parsePublicSummaryArtifact(input.source, input.expected);
    const summaries = new Map(
      artifact.summaries.map((summary) => [key(summary), summary] as const),
    );

    return Object.freeze({
      getSummary(query: PublicSummaryQuery): PublicMarketSummary {
        const summary = summaries.get(key(query));
        if (summary === undefined) throw new PublicSummaryUnavailableError();
        return summary;
      },
    });
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) throw error;
    throw new PublicSummaryUnavailableError();
  }
}
