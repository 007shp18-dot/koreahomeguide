import Link from 'next/link';

import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import styles from './home-editorial.module.css';

type HomeEditorialSectionsProps = Readonly<{ seoul: SeoulLiveModel; news: NewsIndexModel }>;

const date = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export function HomeEditorialSections({ seoul, news }: HomeEditorialSectionsProps) {
  const lead = news.records[0];
  return (
    <>
      <section className={styles.decisionSection} id="home-paths" aria-labelledby="home-paths-heading">
        <header className={styles.sectionHeading}>
          <div><p>One data foundation, three decisions</p><h2 id="home-paths-heading">Start with what you need to decide.</h2></div>
          <p>SignedPrice stays useful from the first rental check to a long-term property decision.</p>
        </header>
        <div className={styles.decisionGrid}>
          <article className={styles.decisionActive}><span>01 · Available now</span><h3>Rent</h3><p>Compare deposit and rent against signed contracts, renewals, and nearby evidence.</p><Link href="/kr/seoul/check/">Run a rent check →</Link></article>
          <article><span>02 · Data connection</span><h3>Buy</h3><p>Evaluate a sale price with transaction history, neighborhood context, and evidence quality.</p><Link href="/kr/seoul/buy/">Preview the decision model →</Link></article>
          <article><span>03 · Next layer</span><h3>Invest</h3><p>Bring yield, price momentum, supply, and market briefs into one decision view.</p><Link href="/kr/seoul/invest/">View the investment roadmap →</Link></article>
        </div>
      </section>

      <section className={styles.exploreSection} id="home-explore" aria-labelledby="home-explore-heading">
        <div className={styles.exploreVisual} aria-label="Explore Seoul district and building evidence">
          <div className={styles.exploreToolbar}><span>Explore Seoul</span><strong>District → neighborhood → building</strong></div>
          <span className={`${styles.mapRule} ${styles.mapRuleOne}`} aria-hidden="true" /><span className={`${styles.mapRule} ${styles.mapRuleTwo}`} aria-hidden="true" /><span className={`${styles.mapRule} ${styles.mapRuleThree}`} aria-hidden="true" />
          <span className={`${styles.mapPin} ${styles.mapPinOne}`} aria-hidden="true">A</span><span className={`${styles.mapPin} ${styles.mapPinTwo}`} aria-hidden="true">B</span><span className={`${styles.mapPin} ${styles.mapPinThree}`} aria-hidden="true">C</span>
        </div>
        <div className={styles.exploreCopy}>
          <p>Explore → Building detail</p><h2 id="home-explore-heading">Move from the city to one building without losing context.</h2>
          <p>Start with the district distribution, narrow to retained buildings, then open the exact contract and source boundary.</p>
          <dl><div><dt>City evidence</dt><dd>{seoul.status === 'ready' ? seoul.period : 'Current state shown in Explore'}</dd></div><div><dt>District depth</dt><dd>25 Seoul districts</dd></div><div><dt>Building depth</dt><dd>Published retained records only</dd></div></dl>
          <Link href="/kr/seoul/explore/">Open Seoul Explorer →</Link>
        </div>
      </section>

      <section className={styles.briefSection} id="home-briefs" aria-labelledby="home-briefs-heading">
        <header className={styles.sectionHeading}>
          <div><p>Market Briefs · Editor approved</p><h2 id="home-briefs-heading">Three markets, one disciplined editorial rhythm.</h2></div>
          <Link href="/kr/seoul/news/">View all Seoul briefs →</Link>
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

      <section className={styles.trustBoundary} id="home-trust" aria-label="SignedPrice publication principles">
        <p>SignedPrice does not turn missing evidence into confident claims.</p>
        <div><span>Official sources</span><span>Rights disclosed</span><span>Human-approved briefs</span><span>Methods visible</span></div>
      </section>
    </>
  );
}
