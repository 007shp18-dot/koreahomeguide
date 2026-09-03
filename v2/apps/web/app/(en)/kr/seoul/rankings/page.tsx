import type { Metadata } from 'next';

import { DistrictRankings } from '@/components/public-market/district-rankings';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import {
  buildKoreaExplorerEvidenceProjection,
  KOREA_EXPLORER_HOUSING_TYPES,
} from '@/lib/public-market/korea-explorer-evidence.server';
import {
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from '@/lib/public-market/korea-evidence-repositories.server';
import {
  buildKoreaEvidenceAreaRankingsModel,
  buildPublicAreaRankingsModel,
} from '@/lib/public-market/rankings-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '@/lib/site-copy';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/rankings/',
  title: 'Seoul sale, jeonse and monthly-rent rankings | signedprice',
  description: 'Compare verified Seoul district sale, jeonse and monthly-rent medians, spread and sample depth.',
  languageAlternates: {
    en: '/kr/seoul/rankings/',
    ko: '/ko/kr/seoul/rankings/',
  },
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul rankings navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: {
    label: 'KO',
    href: '/ko/kr/seoul/rankings/',
    hrefLang: 'ko',
  },
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District rankings', href: '/kr/seoul/rankings/', isCurrent: true },
  ],
};

type RankingsPageProps = Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

const evidenceAreas = Object.freeze([
  'all', 'under-40', '40-60', '60-85', '85-plus',
] as const);

export function resolveKoreaRankingsPageModel(
  query: Readonly<Record<string, string | readonly string[] | undefined>>,
  repositories: KoreaEvidenceRepositories,
  referenceInstant: string | Date = new Date(),
) {
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    { areas: evidenceAreas, propertyTypes: KOREA_EXPLORER_HOUSING_TYPES },
  );
  const projection = buildKoreaExplorerEvidenceProjection(repositories, {
    transaction: selection.transaction,
    areaBand: selection.area ?? 'all',
    housingType: selection.propertyType ?? 'all',
    contractGroup: selection.contractType ?? 'all',
  });
  return projection.status === 'ready'
    ? buildKoreaEvidenceAreaRankingsModel(projection, referenceInstant)
    : buildPublicAreaRankingsModel();
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District Explorer', href: '/kr/seoul/explore/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

export default async function RankingsPage({
  searchParams = Promise.resolve({}),
}: RankingsPageProps = {}) {
  const model = resolveKoreaRankingsPageModel(
    await searchParams,
    koreaEvidenceRepositoriesFromEnvironment(),
  );
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <main>
        <DistrictRankings model={model} />
      </main>
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Rankings', path: '/kr/seoul/rankings/' },
      ]} />
      <SiteFooter copy={footer} />
    </div>
  );
}
