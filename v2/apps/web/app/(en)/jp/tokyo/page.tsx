import { indexableMetadata } from '@/lib/public-metadata';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '@/components/market-representative-photo';
import { TokyoNavigation } from '@/components/japan/tokyo-navigation';
import TokyoExplorer from '@/components/japan/tokyo-explorer';
import styles from './tokyo.module.css';

type Params = Record<string, string | string[] | undefined>;
export const metadata = indexableMetadata({
  path: '/jp/tokyo/',
  title: 'Tokyo property prices and neighbourhoods | SignedPrice',
  description: 'Discover Tokyo neighbourhoods with official quarterly property transactions in JPY.',
});
export default async function Tokyo({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  // Keep older bookmarked searches functional without losing their filters.
  if (Object.keys(params).some(key => ['q', 'city', 'year', 'quarter', 'type', 'minArea', 'maxArea', 'page', 'release'].includes(key))) {
    return <TokyoExplorer searchParams={Promise.resolve(params)} />;
  }
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Tokyo', links: [{ label: 'Overview', href: '/jp/tokyo/', isCurrent: true }] }} />
    <main className={styles.main}>
      <div className={styles.overviewHero}>
        <div><p className={styles.eyebrow}>JAPAN / TOKYO</p><h1>Find your part of Tokyo.</h1><p className={styles.intro}>Explore neighbourhoods through recorded prices, home sizes and quarterly sales.</p><Link className={styles.exploreAction} href="/jp/tokyo/explore/">Explore Tokyo</Link></div>
        <MarketRepresentativePhoto photo={MARKET_PHOTOS.tokyo} context="city" cityLabel="Tokyo" eager />
      </div>
      <TokyoNavigation current="overview" />
      <section className={styles.overviewFacts} aria-label="Tokyo coverage">
        <div><h2>Neighbourhood prices</h2><p>Filter by ward, area, layout and quarter. Each result retains the information disclosed in the source.</p></div>
        <div><h2>Japanese yen</h2><p>Compare recorded purchase prices in JPY. Taxes, financing and other acquisition costs are separate.</p></div>
        <div><h2>Official transactions</h2><p>MLIT records are anonymous. They are not current listings or identified building sales.</p></div>
      </section>
    </main>
    <SiteFooter copy={homepageCopy.footer} />
  </>;
}
