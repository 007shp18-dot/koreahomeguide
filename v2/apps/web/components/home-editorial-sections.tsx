import Link from 'next/link';

import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import { NaverBuildingStreetView } from './maps/naver-building-street-view';
import styles from './home-editorial.module.css';

type Props = Readonly<{
  seoul: SeoulLiveModel;
  news: NewsIndexModel;
  featuredBuildings: readonly HomeFeaturedBuilding[];
  naverMapClientId: string | null;
}>;

const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function HomeEditorialSections({ seoul, news, featuredBuildings, naverMapClientId }: Props) {
  const lead = news.records[0];
  return (
    <div className={styles.homeBody}>
      <section className={styles.section} id="markets" aria-labelledby="home-markets-heading">
        <h2 id="home-markets-heading">Markets at a glance</h2>
        <div className={styles.snapshotGrid}>
          <Link href="/kr/seoul/"><span>🇰🇷 &nbsp; Korea</span><small>Seoul · Eligible contracts</small><strong>{seoul.status === 'ready' ? number.format(seoul.totalCount) : 'Evidence status'}</strong><p>{seoul.status === 'ready' ? seoul.period : 'Open the market for current availability.'}</p><em>View market →</em></Link>
          <Link href="/sg/"><span>🇸🇬 &nbsp; Singapore</span><small>Released evidence</small><strong>URA · HDB</strong><p>Private residential and public-housing layers stay separate.</p><em>View market →</em></Link>
          <Link href="/ae/dubai/"><span>🇦🇪 &nbsp; Dubai</span><small>Current status</small><strong>Rights review</strong><p>Transaction publication remains closed until rights are cleared.</p><em>Review market →</em></Link>
        </div>
        <nav className={styles.quickLinks} aria-label="Seoul evidence tools">
          <Link href="/kr/seoul/check/">Check a contract</Link>
          <Link href="/kr/seoul/explore/">Explore Seoul</Link>
          <Link href="/kr/seoul/rankings/">District rankings</Link>
          <Link href="/kr/seoul/news/">Market news</Link>
          <Link href="/kr/seoul/guide/">Buying guide</Link>
        </nav>
      </section>

      <section className={styles.section} id="home-explore" aria-labelledby="home-explore-heading">
        <div className={styles.sectionHeader}><h2 id="home-explore-heading">Explore markets</h2><Link href="/markets/">View all markets →</Link></div>
        <div className={styles.marketGrid}>
          <Link href="/kr/seoul/explore/" className={styles.marketSeoul}><span>Korea</span><h3>Seoul</h3><p>Districts · Buildings · Reported contracts</p><strong>Explore Korea →</strong></Link>
          <Link href="/sg/singapore/explore/" className={styles.marketSingapore}><span>Singapore</span><h3>Singapore</h3><p>Segments · Projects · URA evidence</p><strong>Explore Singapore →</strong></Link>
          <Link href="/ae/dubai/" className={styles.marketDubai}><span>Dubai</span><h3>Dubai</h3><p>Communities · Projects · Rights review</p><strong>Review Dubai →</strong></Link>
        </div>
      </section>

      <section className={styles.section} id="home-prices" aria-labelledby="home-prices-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-prices-heading">Recent building evidence</h2><p>Real building identities from reported Seoul contracts. Nearby street imagery is not a listing photo.</p></div><Link href="/prices/">View all price evidence →</Link></div>
        <div className={styles.buildingGrid}>
          {featuredBuildings.map((building) => (
            <article className={styles.buildingCard} key={building.id}>
              <div className={styles.buildingMedia}>
                <NaverBuildingStreetView
                  clientId={naverMapClientId}
                  buildingName={building.name}
                  latitude={building.latitude}
                  longitude={building.longitude}
                  addressQuery={building.addressQuery}
                  mapHref={building.href}
                />
              </div>
              <div><span>SEOUL</span><h3>{building.name}</h3><p>{building.location}</p><strong>{building.observationLabel}</strong><small>{building.periodLabel}</small><Link href={building.href}>View evidence →</Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="home-briefs" aria-labelledby="home-insights-heading">
        <div className={styles.sectionHeader}><h2 id="home-insights-heading">Market insights</h2><Link href="/insights/">View all insights →</Link></div>
        <div className={styles.insightGrid}>
          <article><span>KOREA</span>{lead === undefined ? <><h3>No approved brief yet</h3><p>Verified reporting appears only after the underlying evidence reconciles.</p></> : <><h3><Link href={`/kr/seoul/news/${lead.slug}/`}>{lead.title}</Link></h3><p>{lead.summary}</p><small>{date.format(new Date(lead.publishedAt))}</small></>}</article>
          <article><span>SINGAPORE</span><h3>Evidence before commentary.</h3><p>URA and HDB evidence remains separated by housing sector and publication boundary.</p><small>Source-led analysis</small></article>
          <article><span>DUBAI</span><h3>Transaction insights are preparing.</h3><p>We will not publish price or yield claims before source and display rights are cleared.</p><small>Rights review</small></article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-properties-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-properties-heading">Properties to explore</h2><p>Kept in the product roadmap, but not presented as live inventory.</p></div><Link href="/properties/">View service status →</Link></div>
        <div className={styles.propertyGrid}>
          {['Korea properties', 'Singapore properties', 'Dubai properties'].map((label) => <article key={label}><span>Service preparing</span><h3>{label}</h3><p>Listings, inquiries and agent connections are not active yet.</p><strong>Not a live listing</strong></article>)}
        </div>
      </section>

      <section className={styles.bottomGrid} id="home-trust">
        <article><span>Guides · Available</span><h2>Buying property in another country?</h2><p>Understand local terms, process and evidence boundaries first.</p><Link href="/guides/">Browse guides →</Link></article>
        <article><span>Invest · Service preparing</span><h2>Compare markets before investing.</h2><p>Personalized recommendations remain unavailable until costs, rules and data rights are verified.</p><Link href="/invest/">Review investment scope →</Link></article>
      </section>
    </div>
  );
}
