import type { Metadata } from 'next';
import { AreaExplorer } from '../../../../components/public-market/area-explorer';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import { PublicBreadcrumbJsonLd } from '../../../../components/public-json-ld';
import { buildPublicAreaExploreModel } from '../../../../lib/public-market/area-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../../../lib/site-copy';
import { indexableMetadata } from '../../../../lib/public-metadata';

type ExplorerPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/explore/',
  title: 'Seoul district jeonse evidence | signedprice',
  description: 'Compare verified 45–55㎡ refundable jeonse deposits across Seoul districts.',
  languageAlternates: {
    en: '/kr/seoul/explore/',
    ko: '/ko/kr/seoul/explore/',
  },
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul evidence navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District evidence', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Compare markets', href: '/compare/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
  const query = await searchParams;
  const model = buildPublicAreaExploreModel(
    singleValue(query.district),
    undefined,
    singleValue(query.contract),
  );
  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID?.trim() || null;

  return (
    <div id="top" className="explorer-page">
      <SiteHeader copy={header} />
      <main>
        <AreaExplorer model={model} naverMapClientId={naverMapClientId} />
      </main>
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Explore', path: '/kr/seoul/explore/' },
      ]} />
      <SiteFooter copy={footer} />
    </div>
  );
}
