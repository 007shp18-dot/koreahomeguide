import Link from 'next/link';

import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import { RotatingBuildingGrid } from './home-building-showcase';
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
        <div className={styles.sectionHeader}>
          <div><span className={styles.sectionEyebrow}>MARKET COVERAGE</span><h2 id="home-markets-heading">Explore property markets</h2><p>One structure for every city, with each market&apos;s actual data status shown clearly.</p></div>
          <Link href="/markets/">Compare all markets →</Link>
        </div>
        <div className={styles.marketGrid}>
          <Link href="/kr/seoul/explore/" className={styles.marketSeoul}><header><span>🇰🇷 Korea</span><small>{seoul.status === 'ready' ? 'LIVE' : 'STATUS'}</small></header><h3>Seoul</h3><strong>{seoul.status === 'ready' ? number.format(seoul.totalCount) : 'Evidence status'}</strong><p>{seoul.status === 'ready' ? `${seoul.period} · eligible contracts` : 'Open the market for current availability.'}</p><em>Explore Seoul →</em></Link>
          <Link href="/sg/singapore/explore/" className={styles.marketSingapore}><header><span>🇸🇬 Singapore</span><small>PUBLIC DATA</small></header><h3>Singapore</h3><strong>URA · HDB</strong><p>Private residential and public-housing evidence stays separate.</p><em>Explore Singapore →</em></Link>
          <Link href="/ae/dubai/" className={styles.marketDubai}><header><span>🇦🇪 UAE</span><small>PREPARING</small></header><h3>Dubai</h3><strong>Rights review</strong><p>Transaction publication opens after display rights are cleared.</p><em>Review Dubai →</em></Link>
        </div>
        <nav className={styles.primaryActions} aria-label="Seoul evidence tools">
          <strong>Seoul tools</strong>
          <Link className={styles.primaryAction} href="/kr/seoul/explore/">Explore buildings</Link>
          <Link href="/kr/seoul/check/">Check a contract</Link>
          <Link href="/kr/seoul/rankings/">Compare districts</Link>
          <Link href="/kr/seoul/news/">Read market news</Link>
          <Link href="/kr/seoul/guide/">Buying guide</Link>
        </nav>
      </section>

      <section className={styles.section} id="home-prices" aria-labelledby="home-prices-heading">
        <div className={styles.sectionHeader}><div><h2 id="home-prices-heading">Recent building evidence</h2><p>Real building identities from reported Seoul contracts. Nearby street imagery is not a listing photo.</p></div><Link href="/prices/">View all price evidence →</Link></div>
        <RotatingBuildingGrid buildings={featuredBuildings} naverMapClientId={naverMapClientId} />
      </section>

      <section className={styles.section} id="home-briefs" aria-labelledby="home-news-heading">
        <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>UPDATES & DISCUSSION</span><h2 id="home-news-heading">News and community</h2></div><Link href="/insights/">View all news →</Link></div>
        <div className={styles.newsCommunityGrid}>
          <article className={styles.newsFeature}><span>SEOUL MARKET NEWS</span>{lead === undefined ? <><h3>No approved brief yet</h3><p>Verified reporting appears only after the underlying evidence reconciles.</p></> : <><h3><Link href={`/kr/seoul/news/${lead.slug}/`}>{lead.title}</Link></h3><p>{lead.summary}</p><footer><small>{date.format(new Date(lead.publishedAt))}</small><Link href={`/kr/seoul/news/${lead.slug}/`}>Read the brief →</Link></footer></>}</article>
          <article className={styles.communityPanel}><span>COMMUNITY · PREPARING</span><h3>Local questions, evidence-led answers.</h3><p>A place to discuss buildings, contracts and neighbourhoods is planned. Posting stays closed until moderation, reporting and privacy controls are ready.</p><strong>Coming soon</strong></article>
        </div>
      </section>

      <section className={styles.section} id="home-trust" aria-labelledby="home-roadmap-heading">
        <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>PRODUCT ROADMAP</span><h2 id="home-roadmap-heading">Go deeper when you are ready</h2></div></div>
        <div className={styles.roadmapGrid}>
          <article><span>GUIDES · AVAILABLE</span><h3>Understand the process.</h3><p>Read local terms, buying steps and evidence boundaries.</p><Link href="/guides/">Browse guides →</Link></article>
          <article><span>PROPERTIES · PREPARING</span><h3>Discover with price context.</h3><p>Listings and agent connections are not active yet.</p><Link href="/properties/">View service status →</Link></article>
          <article><span>INVEST · PREPARING</span><h3>Compare before investing.</h3><p>Personalized recommendations remain unavailable.</p><Link href="/invest/">Review investment scope →</Link></article>
        </div>
      </section>
    </div>
  );
}
