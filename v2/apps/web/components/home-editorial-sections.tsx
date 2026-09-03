import Link from 'next/link';

import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import styles from './home-editorial.module.css';

type HomeEditorialSectionsProps = Readonly<{ seoul: SeoulLiveModel; news: NewsIndexModel }>;

const date = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
const number = new Intl.NumberFormat('en-US');

export function HomeEditorialSections({ seoul, news }: HomeEditorialSectionsProps) {
  const lead = news.records[0];
  return (
    <>
      <section className={styles.decisionSection} id="markets" aria-labelledby="home-markets-heading">
        <header className={styles.sectionHeading}>
          <div><p>Markets at a glance</p><h2 id="home-markets-heading">Read each market in its own language.</h2></div>
          <p>Currency, property type, source and publication limits stay specific to Seoul, Singapore and Dubai.</p>
        </header>
        <div className={styles.snapshotGrid}>
          <Link href="/kr/seoul/"><span>KR · Live evidence</span><h3>Seoul</h3><strong>{seoul.status === 'ready' ? number.format(seoul.totalCount) : 'Evidence status'}</strong><p>{seoul.status === 'ready' ? `Eligible contracts · ${seoul.period}` : 'Open the market for the current data state.'}</p><small>View market →</small></Link>
          <Link href="/sg/"><span>SG · Released layers</span><h3>Singapore</h3><strong>URA · HDB</strong><p>Private residential and HDB evidence opens by verified dataset.</p><small>View market →</small></Link>
          <Link href="/markets/#dubai"><span>AE · Rights review</span><h3>Dubai</h3><strong>AED</strong><p>Transaction display and professional workflows remain closed.</p><small>Review scope →</small></Link>
        </div>
      </section>

      <section className={styles.marketDirectory} id="home-explore" aria-labelledby="home-explore-heading">
        <header className={styles.sectionHeading}>
          <div><p>Explore property markets</p><h2 id="home-explore-heading">City → district → building.</h2></div>
          <Link href="/markets/">See all market coverage →</Link>
        </header>
        <div className={styles.marketDirectoryGrid}>
          <Link href="/kr/seoul/explore/" className={styles.marketKorea}><span>Korea</span><h3>Seoul</h3><p>Transaction evidence, apartment and rental context across 25 districts.</p><strong>Explore Korea →</strong></Link>
          <Link href="/sg/singapore/explore/" className={styles.marketSingapore}><span>Singapore</span><h3>Singapore</h3><p>Districts, projects and released URA-linked transaction evidence.</p><strong>Explore Singapore →</strong></Link>
          <Link href="/markets/#dubai" className={styles.marketDubai}><span>Dubai</span><h3>Dubai</h3><p>Communities and projects will open after transaction rights review.</p><strong>Review Dubai status →</strong></Link>
        </div>
      </section>

      <section className={styles.evidenceSection} id="home-prices" aria-labelledby="home-prices-heading">
        <header className={styles.sectionHeading}>
          <div><p>Recent signed evidence</p><h2 id="home-prices-heading">The price layer comes first.</h2></div>
          <Link href="/prices/">Explore all price tools →</Link>
        </header>
        <div className={styles.evidenceGrid}>
          <article><span>Seoul · Current release</span><h3>{seoul.status === 'ready' ? `${number.format(seoul.totalCount)} eligible contracts` : 'Evidence status unavailable'}</h3><p>{seoul.status === 'ready' ? `Completed period ${seoul.period}. New, renewal and unknown contract groups remain separate.` : 'No replacement estimate is displayed while the official evidence state is unavailable.'}</p><Link href="/kr/seoul/explore/">View signed prices →</Link></article>
          <article><span>Compare</span><h3>Check two rent offers side by side.</h3><p>Use compatible completed contracts and keep deposit, recurring rent and source period visible.</p><Link href="/kr/seoul/check/">Compare rent offers →</Link></article>
          <article><span>Rank</span><h3>Compare all 25 Seoul districts.</h3><p>Read distributions and evidence depth without turning a ranking into a recommendation.</p><Link href="/kr/seoul/rankings/">View district rankings →</Link></article>
        </div>
      </section>

      <section className={styles.briefSection} id="home-briefs" aria-labelledby="home-briefs-heading">
        <header className={styles.sectionHeading}>
          <div><p>Market insights</p><h2 id="home-briefs-heading">Numbers first. Commentary second.</h2></div>
          <Link href="/insights/">View all insights →</Link>
        </header>
        <div className={styles.briefLedger}>
          <article>
            <span>Seoul · Published evidence</span>
            {lead === undefined ? <><h3>No approved brief yet</h3><p>Verified reporting appears here only after its evidence reconciles.</p></> : <><h3><Link href={`/kr/seoul/news/${lead.slug}/`}>{lead.title}</Link></h3><p>{lead.summary}</p><footer><em>{date.format(new Date(lead.publishedAt))}</em><strong>{lead.category}</strong></footer></>}
          </article>
          <article><span>Singapore · Human approval</span><h3>No approved brief yet</h3><p>URA-linked evidence must pass the market rights and editorial checks first.</p><footer><em>English</em><strong>Approval required</strong></footer></article>
          <article><span>Dubai · Rights review</span><h3>No approved brief yet</h3><p>DLD and RERA display-rights clearance remains a publication boundary.</p><footer><em>English</em><strong>Not published</strong></footer></article>
        </div>
      </section>

      <section className={styles.futureSection} aria-labelledby="home-properties-heading">
        <div className={styles.futureCard}>
          <span>Properties · Service preparing</span>
          <h2 id="home-properties-heading">Property discovery with market data behind it.</h2>
          <p>Active listings, contact requests and brokerage workflows remain closed while advertising, data and operating requirements are reviewed.</p>
          <Link href="/properties/">See what is being prepared →</Link>
        </div>
        <div className={styles.guideCard}>
          <span>Guides · Available now</span>
          <h2>Buying property in another country?</h2>
          <p>Start with the process, local terms and evidence boundary before making a decision.</p>
          <Link href="/guides/">Browse buying guides →</Link>
        </div>
      </section>

      <section className={styles.compareSection} aria-labelledby="home-compare-heading">
        <div><p>Compare markets</p><h2 id="home-compare-heading">Seoul, Singapore or Dubai?</h2><p>Compare data availability, local currency and decision coverage before interpreting any return or opportunity.</p></div>
        <div><span>Invest · Service preparing</span><p>Personalized investment recommendations remain unavailable until every cost, rights and operating input is verified.</p><Link href="/invest/">Review the investment scope →</Link></div>
      </section>

      <section className={styles.trustBoundary} id="home-trust" aria-label="SignedPrice publication principles">
        <p>SignedPrice does not turn missing evidence into confident claims.</p>
        <div><span>Official sources</span><span>Rights disclosed</span><span>Human-approved briefs</span><span>Methods visible</span></div>
      </section>
    </>
  );
}
