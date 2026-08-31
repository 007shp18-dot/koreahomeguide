import type { Metadata } from 'next';

import { DistrictRankings } from '../../../../components/public-market/district-rankings';
import { PublicSectionTabs } from '../../../../components/public-market/public-section-tabs';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import { buildPublicAreaRankingsModel } from '../../../../lib/public-market/rankings-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../../../lib/site-copy';
import { indexableMetadata } from '../../../../lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/rankings/',
  title: 'Seoul district jeonse rankings | signedprice',
  description: 'Compare verified Seoul district refundable jeonse deposits, change, spread and sample depth.',
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul rankings navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District Explorer', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

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

export default function RankingsPage() {
  const model = buildPublicAreaRankingsModel();
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <PublicSectionTabs current="explore" />
      <main>
        <DistrictRankings model={model} />
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
