import Link from 'next/link';

import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { HomeMarketVisual } from '../lib/home-market-visuals.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomepageMarketModel } from '../lib/site-copy';
import { RotatingBuildingGrid } from './home-building-showcase';
import styles from './home-editorial.module.css';

type Props = Readonly<{
  seoul: SeoulLiveModel;
  news: NewsIndexModel;
  featuredBuildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
  markets: readonly HomepageMarketModel[];
}>;

const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function HomeEditorialSections({ seoul, news, featuredBuildings, naverMapClientId, googleMapsBrowserKey, markets }: Props) {
  const lead = news.records[0];
  return (
    <div className={styles.homeBody}>
      <section className={styles.section} id="markets" aria-labelledby="home-markets-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-markets-heading">Explore markets</h2><p>One shared product structure, with each market’s own currency, source and release state.</p></div><Link href="/markets/">View all markets →</Link></div>
        <div className={styles.snapshotGrid}>
          <Link href="/kr/seoul/"><span>🇰🇷 &nbsp; Korea</span><small>Seoul · Eligible contracts</small><strong>{seoul.status === 'ready' ? number.format(seoul.totalCount) : 'Evidence status'}</strong><p>{seoul.status === 'ready' ? seoul.period : 'Open the market for current availability.'}</p><em>View market →</em></Link>
          <Link href="/sg/"><span>🇸🇬 &nbsp; Singapore</span><small>Released evidence</small><strong>URA · HDB</strong><p>Private residential and public-housing layers stay separate.</p><em>View market →</em></Link>
          <Link href="/ae/dubai/"><span>🇦🇪 &nbsp; Dubai</span><small>Current status</small><strong>Rights review</strong><p>Transaction publication remains closed until rights are cleared.</p><em>Review market →</em></Link>
        </div>
        <nav className={styles.quickLinks} aria-label="SignedPrice product entry points">
          <Link href="/prices/">Explore prices</Link>
          <Link href="/compare/">Compare markets</Link>
          <Link href="/news/">Read news</Link>
          <Link href="/community/">Community</Link>
          <Link href="/guides/">Guides</Link>
        </nav>
        <div className={styles.marketTools} id="home-explore" aria-label="Local products by market">
          {markets.map((market) => (
            <section data-market-panel={market.tabId} key={market.id}>
              <header><span>{market.currency}</span><h3>{market.cityName}</h3></header>
              <nav aria-label={`${market.cityName} products`}>
                {market.slots.map((slot) => slot.href === undefined
                  ? <span data-state={slot.state} key={slot.id}>{slot.label}<small>{slot.stateLabel}</small></span>
                  : <Link href={slot.href} data-state={slot.state} key={slot.id}>{slot.label}<small>{slot.stateLabel}</small></Link>)}
              </nav>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.section} id="home-prices" aria-labelledby="home-prices-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-prices-heading">Buildings across markets</h2><p>Real place identities across Seoul, Singapore and Dubai. Nearby street imagery is context—not a listing photo or active inventory.</p></div><Link href="/prices/">View available price evidence →</Link></div>
        <RotatingBuildingGrid buildings={featuredBuildings} naverMapClientId={naverMapClientId} googleMapsBrowserKey={googleMapsBrowserKey} />
      </section>

      <section className={styles.section} id="home-briefs" aria-labelledby="home-insights-heading">
        <div className={styles.sectionHeader}><h2 id="home-insights-heading">Market news</h2><Link href="/news/">View all news →</Link></div>
        <div className={styles.insightGrid}>
          <article><span>KOREA</span>{lead === undefined ? <><h3>No approved brief yet</h3><p>Verified reporting appears only after the underlying evidence reconciles.</p></> : <><h3><Link href={`/kr/seoul/news/${lead.slug}/`}>{lead.title}</Link></h3><p>{lead.summary}</p><small>{date.format(new Date(lead.publishedAt))}</small></>}</article>
          <article><span>SINGAPORE</span><h3>Evidence before commentary.</h3><p>URA and HDB evidence remains separated by housing sector and publication boundary.</p><small>Source-led analysis</small></article>
          <article><span>DUBAI</span><h3>Transaction insights are preparing.</h3><p>We will not publish price or yield claims before source and display rights are cleared.</p><small>Rights review</small></article>
        </div>
      </section>

      <section className={styles.section} id="home-community" aria-labelledby="home-community-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-community-heading">Community, organized by place</h2><p>One feed can be discovered globally and read again inside its market, district or building context.</p></div><Link href="/community/">Open community →</Link></div>
        <div className={styles.communityGrid}>
          <article><span>MARKET</span><h3>Seoul · Singapore · Dubai</h3><p>Begin with the local market whose rules and terminology matter.</p></article>
          <article><span>LOCAL</span><h3>Districts and neighbourhoods</h3><p>Keep area questions next to the map and local price evidence.</p></article>
          <article><span>BUILDING</span><h3>Exact building identity</h3><p>Building discussions attach to the same verified identity used by transaction evidence.</p></article>
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
