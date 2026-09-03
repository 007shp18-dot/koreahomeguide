import Link from 'next/link';

import { GUIDES } from '../lib/guide/guide-content';
import type { NewsIndexModel } from '../lib/news/news-route-model.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import {
  homepageCopy,
  type SiteHeaderModel,
} from '../lib/site-copy';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import styles from './global-product-hub.module.css';

export type GlobalHubKind = 'markets' | 'prices' | 'news' | 'guides';

type GlobalProductHubProps = Readonly<{
  kind: GlobalHubKind;
  seoul?: SeoulLiveModel;
  news?: NewsIndexModel;
}>;

const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const hubCopy = {
  markets: {
    eyebrow: 'Global market coverage',
    title: 'Compare each market on its own terms.',
    description: 'One interface for three different property systems. Currency, source, housing type and publication limits stay local to each market.',
  },
  prices: {
    eyebrow: 'Signed price evidence',
    title: 'Start with what actually happened.',
    description: 'Move from city context to district and building evidence without mixing completed contracts with asking prices or active listings.',
  },
  news: {
    eyebrow: 'Market news',
    title: 'News, with the evidence boundary attached.',
    description: 'SignedPrice publishes market briefs only when the evidence, period and editorial boundary can be shown together.',
  },
  guides: {
    eyebrow: 'Buying across borders',
    title: 'Understand the process before making a decision.',
    description: 'Practical guides explain local terms, comparison methods and the limits of the available evidence.',
  },
} as const;

function headerFor(kind: GlobalHubKind): SiteHeaderModel {
  const currentHref = `/${kind}/`;
  return {
    ...homepageCopy.header,
    links: homepageCopy.header.links.map((link) => ({
      ...link,
      isCurrent: link.href === currentHref,
    })),
  };
}

function Status({ children, tone = 'quiet' }: Readonly<{
  children: string;
  tone?: 'live' | 'limited' | 'quiet';
}>) {
  return <span className={`${styles.status} ${styles[`status_${tone}`]}`}>{children}</span>;
}

function MarketCards() {
  return (
    <div className={styles.marketGrid}>
      <article className={`${styles.marketCard} ${styles.marketKorea}`}>
        <header><span>KR</span><Status tone="live">Live evidence</Status></header>
        <div><p>Korea</p><h2>Seoul</h2><p>Official reported housing contracts, district distributions and retained building evidence.</p></div>
        <dl><div><dt>Currency</dt><dd>KRW</dd></div><div><dt>Coverage</dt><dd>Rent · Sale</dd></div></dl>
        <Link href="/kr/seoul/">Explore Seoul →</Link>
      </article>
      <article className={`${styles.marketCard} ${styles.marketSingapore}`}>
        <header><span>SG</span><Status tone="limited">Released layers</Status></header>
        <div><p>Singapore</p><h2>Singapore</h2><p>URA-linked private residential context and HDB evidence where the release gate is satisfied.</p></div>
        <dl><div><dt>Currency</dt><dd>SGD</dd></div><div><dt>Coverage</dt><dd>Private · HDB</dd></div></dl>
        <Link href="/sg/">Explore Singapore →</Link>
      </article>
      <article className={`${styles.marketCard} ${styles.marketDubai}`} id="dubai">
        <header><span>AE</span><Status>Rights review</Status></header>
        <div><p>United Arab Emirates</p><h2>Dubai</h2><p>Market structure is defined, while transaction display rights and professional workflows remain closed.</p></div>
        <dl><div><dt>Currency</dt><dd>AED</dd></div><div><dt>Coverage</dt><dd>Preparing</dd></div></dl>
        <Link href="/compare/?market=dubai">Review market boundary →</Link>
      </article>
    </div>
  );
}

function MarketsHub() {
  const rows = [
    ['Signed price evidence', 'Live', 'Released layers', 'Rights review'],
    ['District or area exploration', 'Live', 'Available by dataset', 'Preparing'],
    ['Active property listings', 'Preparing', 'Preparing', 'Preparing'],
    ['Personalized investment advice', 'Not offered', 'Not offered', 'Not offered'],
  ] as const;
  return (
    <>
      <section className={styles.section} aria-labelledby="market-directory-title">
        <div className={styles.sectionHeading}><p>Explore markets</p><h2 id="market-directory-title">Three cities. One consistent way to read them.</h2></div>
        <MarketCards />
      </section>
      <section className={`${styles.section} ${styles.comparison}`} aria-labelledby="market-coverage-title">
        <div className={styles.sectionHeading}><p>Coverage</p><h2 id="market-coverage-title">See what is usable before opening a market.</h2></div>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>Product layer</th><th>Seoul</th><th>Singapore</th><th>Dubai</th></tr></thead><tbody>{rows.map(([label, ...values]) => <tr key={label}><th>{label}</th>{values.map((value, index) => <td key={`${label}-${index}`}>{value}</td>)}</tr>)}</tbody></table>
        </div>
      </section>
    </>
  );
}

function PricesHub({ seoul }: Readonly<{ seoul?: SeoulLiveModel }>) {
  return (
    <>
      <section className={styles.searchPanel} aria-label="Search available signed price evidence">
        <form action="/kr/seoul/explore/" method="get" role="search">
          <label htmlFor="global-price-search">Search a city, district or building</label>
          <div><input id="global-price-search" name="q" type="search" placeholder="Try Mapo-gu or Gongdeok" /><button type="submit">Search prices</button></div>
        </form>
        <p>Search currently opens verified Seoul evidence. Other markets appear as their release gates pass.</p>
      </section>
      <section className={styles.section} aria-labelledby="price-products-title">
        <div className={styles.sectionHeading}><p>Price products</p><h2 id="price-products-title">Choose the evidence that matches the decision.</h2></div>
        <div className={styles.productGrid}>
          <Link href="/kr/seoul/explore/"><span>01 · Explore</span><h3>District and building prices</h3><p>Move from Seoul-wide context to a retained building and inspect its source boundary.</p><strong>Open Explorer →</strong></Link>
          <Link href="/kr/seoul/check/"><span>02 · Compare</span><h3>Compare two rent offers</h3><p>Put compatible contract evidence beside two real rental options.</p><strong>Compare offers →</strong></Link>
          <Link href="/kr/seoul/rankings/"><span>03 · Rank</span><h3>Compare all 25 districts</h3><p>Read district-level distributions without turning them into unsupported recommendations.</p><strong>View rankings →</strong></Link>
        </div>
      </section>
      <section className={`${styles.section} ${styles.evidencePanel}`} aria-labelledby="price-evidence-title">
        <div className={styles.sectionHeading}><p>Current evidence</p><h2 id="price-evidence-title">The latest released Seoul contract set.</h2></div>
        {seoul?.status === 'ready' ? <dl className={styles.metrics}><div><dt>Eligible contracts</dt><dd>{number.format(seoul.totalCount)}</dd></div><div><dt>New</dt><dd>{number.format(seoul.newCount)}</dd></div><div><dt>Renewal</dt><dd>{number.format(seoul.renewalCount)}</dd></div><div><dt>Completed period</dt><dd>{seoul.period}</dd></div></dl> : <div className={styles.emptyState}><strong>Evidence status is temporarily unavailable.</strong><p>The product remains accessible without inventing replacement figures.</p></div>}
      </section>
    </>
  );
}

function InsightsHub({ news }: Readonly<{ news?: NewsIndexModel }>) {
  const records = news?.records.slice(0, 4) ?? [];
  return (
    <>
      <section className={styles.section} aria-labelledby="insights-title">
        <div className={styles.sectionHeading}><p>Latest approved briefs</p><h2 id="insights-title">Evidence first, commentary second.</h2></div>
        <div className={styles.insightGrid}>
          {records.length === 0 ? <article className={styles.emptyState}><strong>No approved Seoul brief is available right now.</strong><p>Verified reporting returns after its declared evidence reconciles.</p></article> : records.map((record) => <article key={record.id}><span>Seoul · {date.format(new Date(record.publishedAt))}</span><h3><Link href={`/kr/seoul/news/${record.slug}/`}>{record.title}</Link></h3><p>{record.summary}</p><strong>{record.category}</strong></article>)}
          <article className={styles.preparingCard}><Status>Approval required</Status><h3>Singapore briefs</h3><p>URA-linked analysis opens only after evidence and editorial review.</p></article>
          <article className={styles.preparingCard}><Status>Rights review</Status><h3>Dubai briefs</h3><p>No transaction claim is published before the display-rights boundary is established.</p></article>
        </div>
      </section>
      <section className={styles.actionBand}><div><p>Seoul market insights</p><h2>See every approved brief with its official source.</h2></div><Link href="/kr/seoul/news/">Open Seoul insights →</Link></section>
    </>
  );
}

function GuidesHub() {
  return (
    <>
      <section className={styles.section} aria-labelledby="guides-title">
        <div className={styles.sectionHeading}><p>Korea guides</p><h2 id="guides-title">Use the data without losing the local context.</h2></div>
        <div className={styles.guideGrid}>{GUIDES.slice(0, 6).map((guide) => <article key={guide.slug}><span>{guide.stage} · {guide.readMinutes} min</span><h3>{guide.title}</h3><p>{guide.summary}</p><Link href={`/kr/seoul/guide/${guide.slug}/`}>Read guide →</Link></article>)}</div>
      </section>
      <section className={styles.marketGuideRow} aria-label="Guide coverage by market">
        <article><Status tone="live">Available</Status><h3>Buying and renting in Korea</h3><p>Contract evidence, district comparisons and decision methods.</p><Link href="/kr/seoul/guide/">Browse Korea guides →</Link></article>
        <article><Status>Preparing</Status><h3>Buying in Singapore</h3><p>Local rules and cost guidance will open after dated sources are approved.</p></article>
        <article><Status>Preparing</Status><h3>Buying in Dubai</h3><p>Ownership and process guidance will open after legal and source review.</p></article>
      </section>
    </>
  );
}

export function GlobalProductHub({ kind, seoul, news }: GlobalProductHubProps) {
  const copy = hubCopy[kind];
  return (
    <div id="top">
      <SiteHeader copy={headerFor(kind)} />
      <main className={styles.main}>
        <header className={styles.hero}><p>{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></header>
        {kind === 'markets' ? <MarketsHub /> : null}
        {kind === 'prices' ? <PricesHub seoul={seoul} /> : null}
        {kind === 'news' ? <InsightsHub news={news} /> : null}
        {kind === 'guides' ? <GuidesHub /> : null}
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
