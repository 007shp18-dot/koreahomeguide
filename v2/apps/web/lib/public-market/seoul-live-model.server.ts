import 'server-only';

import { createPublicAreaSummaryRepository } from './area-summary-repository.server';

const links = Object.freeze([
  Object.freeze({ label: 'Check', description: 'Compare two offers', href: '/kr/' }),
  Object.freeze({ label: 'Explore', description: 'District and building evidence', href: '/kr/seoul/explore/' }),
  Object.freeze({ label: 'Rankings', description: 'Compare all 25 districts', href: '/kr/seoul/rankings/' }),
  Object.freeze({ label: 'News', description: 'Verified market briefs', href: '/kr/seoul/news/' }),
  Object.freeze({ label: 'Guide', description: 'Methods and decision guides', href: '/kr/seoul/guide/' }),
] as const);

export type SeoulLiveLink = (typeof links)[number];

export type SeoulLiveModel =
  | Readonly<{
      status: 'ready';
      period: string;
      totalCount: number;
      newCount: number;
      renewalCount: number;
      unknownCount: number;
      links: readonly SeoulLiveLink[];
    }>
  | Readonly<{
      status: 'unavailable';
      message: 'Official Seoul evidence is temporarily unavailable.';
      links: readonly SeoulLiveLink[];
    }>;

export type SeoulLiveDependencies = Readonly<{
  source: unknown;
  period: string;
}>;

function environmentDependencies(): SeoulLiveDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT;
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return Object.freeze({
    source,
    period: process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '',
  });
}

export function buildSeoulLiveModel(
  dependencies: SeoulLiveDependencies = environmentDependencies(),
): SeoulLiveModel {
  try {
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const split = repository.getContractSplitAvailability();
    if (split.status !== 'ready') throw new TypeError('Contract split unavailable.');
    const all = repository.getCitySummary('all');
    const fresh = repository.getCitySummary('new');
    const renewal = repository.getCitySummary('renewal');
    return Object.freeze({
      status: 'ready',
      period: all.period,
      totalCount: all.n,
      newCount: fresh.n,
      renewalCount: renewal.n,
      unknownCount: split.unknownCityCount,
      links,
    });
  } catch {
    return Object.freeze({
      status: 'unavailable',
      message: 'Official Seoul evidence is temporarily unavailable.',
      links,
    });
  }
}
