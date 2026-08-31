import type { Metadata } from 'next';
import { AreaExplorer } from '../../../../components/public-market/area-explorer';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import { buildPublicAreaExploreModel } from '../../../../lib/public-market/area-route-model.server';
import type { SiteFooterModel, SiteHeaderModel } from '../../../../lib/site-copy';

type ExplorerPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Seoul district jeonse evidence | signedprice',
  description: 'Compare verified 45–55㎡ refundable jeonse deposits across Seoul districts.',
  robots: { index: false, follow: true },
};

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
  ],
  status: 'Korea public P2 preview. Production launch is not authorized.',
};

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
  const query = await searchParams;
  const model = buildPublicAreaExploreModel(singleValue(query.district));

  return (
    <div id="top" className="explorer-page">
      <SiteHeader copy={header} />
      <main>
        <AreaExplorer model={model} />
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
