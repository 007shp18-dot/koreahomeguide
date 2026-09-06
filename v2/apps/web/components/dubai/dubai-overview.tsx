import Link from 'next/link';
import { MarketHero } from '../market-hero';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import { DUBAI_ANNUAL_TRANSACTIONS, DUBAI_RESEARCH_DATE, DUBAI_SOURCES } from '../../lib/dubai/research';
import styles from './dubai-research.module.css';

export function DubaiOverview() {
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  const areas = repository?.listAreas() ?? [];
  const context = repository?.getContext();
  return <main>
    <MarketHero model={{ sectionLabel: 'Dubai market overview', eyebrow: 'Dubai market', heading: 'Dubai Market Overview', description: 'Compare Ready and Off-Plan prices, annual rents and estimated gross yields by area. Follow the released evidence from your budget to a property shortlist.', facts: [], layout: 'overview', tier: { state: 'limited', label: 'Area evidence' } }} media={<MarketRepresentativePhoto photo={MARKET_PHOTOS.dubai} cityLabel="Dubai" eager />} />
    <div className={styles.main}>
    <section className={styles.section} aria-label="Dubai released evidence">
      <dl className={styles.metrics}><div><dt>Released areas</dt><dd>{repository === null ? 'Unavailable' : areas.length}</dd></div><div><dt>Price comparison</dt><dd>Ready · Off-Plan</dd></div><div><dt>Rental comparison</dt><dd>Annual rent · Yield</dd></div></dl>
      <p>{context === undefined ? 'Released area evidence is temporarily unavailable.' : `Comparison period: ${context.comparisonPeriod.from}–${context.comparisonPeriod.to}. Data as of ${context.asOfDate}. Each area shows its own sample sizes; insufficient samples are withheld.`}</p>
      <nav className={styles.actions} aria-label="Dubai research"><Link href="/ae/dubai/explore/">Explore areas</Link><Link href="/ae/dubai/check/">Check a price</Link><Link href="/ae/dubai/guide/">Buying guide</Link><Link href="/news/?market=dubai">News and analysis</Link></nav>
    </section>
    <section className={styles.section} aria-labelledby="dubai-annual-heading"><h2 id="dubai-annual-heading">Annual transaction activity</h2><p>The government reported AED 917 billion in real estate transactions for 2025, compared with AED 761 billion for 2024. These totals cover the wider property market and transaction categories; they are not residential sale-price indices.</p><figure className={styles.chart} aria-label="Dubai annual real estate transaction value in AED billions"><div><span>2024</span><i className={styles.bar} style={{width: `${761 / 1000 * 100}%`}} /><strong>AED 761B</strong></div><div><span>2025</span><i className={styles.bar} style={{width: `${917 / 1000 * 100}%`}} /><strong>AED 917B</strong></div><figcaption>Zero-based scale: AED 0–1,000 billion. Sources: {DUBAI_ANNUAL_TRANSACTIONS.map((row, index) => <span key={row.year}>{index > 0 ? ' · ' : ''}<a href={row.source}>{row.year} government release</a> ({row.published})</span>)}.</figcaption></figure></section>
    <section className={styles.section} aria-labelledby="dubai-quarter-heading"><h2 id="dubai-quarter-heading">Q1 2026 · a separate reporting period</h2><dl className={styles.metrics}><div><dt>Total transaction value</dt><dd>AED 252B</dd></div><div><dt>Real estate transactions</dt><dd>60,303</dd></div><div><dt>Value change · year on year</dt><dd>+31%</dd></div></dl><p>DLD’s release dated 9 April 2026 compares Q1 with the same quarter of 2025. The quarterly result is kept separate from the full-year chart. It does not establish a current price for an individual home. <a href={DUBAI_SOURCES.quarter2026}>Read the DLD release</a>.</p></section>
    <section className={styles.section} aria-labelledby="dubai-checks-heading"><h2 id="dubai-checks-heading">Move from the city to the exact property</h2><p>Use the area directory to frame your search. For a shortlist, record the project number, unit identity, completion status and recurring costs. The guide brings those checks and an AED cost calculator together.</p><nav className={styles.actions} aria-label="Official Dubai tools"><a href={DUBAI_SOURCES.projects}>Project status</a><a href={DUBAI_SOURCES.charges}>Service charges</a><a href={DUBAI_SOURCES.services}>Title, broker and developer checks</a><a href={DUBAI_SOURCES.data}>DLD public data</a></nav><p>Coverage: released area-level sale prices, annual rents and estimated gross yields, alongside dated official market releases. Area medians are screening evidence; individual property valuations and available listings are not offered. Sources checked {DUBAI_RESEARCH_DATE}.</p></section>
    </div>
  </main>;
}
