import type { Metadata } from 'next';
import { ExplorerWorkspace } from '../../../../components/explorer-workspace';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import type { SiteFooterModel, SiteHeaderModel } from '../../../../lib/site-copy';

type ExplorerPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Seoul Explorer preview | signedprice',
  description: 'Explicit district, neighborhood and building discovery for Seoul.',
  robots: { index: false, follow: false },
};

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Explorer navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Explorer', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Property intelligence for Seoul, Singapore and Dubai.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Compare markets', href: '/compare/' },
  ],
  status:
    'Market information only. Not a listing, appraisal, legal opinion or financial recommendation.',
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
  const query = await searchParams;

  return (
    <div id="top" className="explorer-page">
      <SiteHeader copy={header} />
      <main>
        <ExplorerWorkspace
          initialDistrictCode={firstValue(query.lawdCd) ?? '11590'}
          initialPropertyType={firstValue(query.type) ?? 'officetel'}
          initialNeighborhoodId={firstValue(query.dong)}
          initialBuildingId={firstValue(query.building)}
        />
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
