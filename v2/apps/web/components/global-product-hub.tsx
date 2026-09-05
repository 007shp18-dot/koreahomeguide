import Link from 'next/link';

import { listPortfolioRecords } from '../content/portfolio-manifest';
import type { NewsWorkspaceModel } from '../lib/news/news-workspace-model';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import {
  homepageCopy,
  type SiteHeaderModel,
} from '../lib/site-copy';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { NewsWorkbench } from './news/news-workbench';
import styles from './global-product-hub.module.css';

export type GlobalHubKind = 'markets' | 'prices' | 'news' | 'guides';

type GlobalProductHubProps = Readonly<{
  kind: GlobalHubKind;
  seoul?: SeoulLiveModel;
  newsWorkspace?: NewsWorkspaceModel;
}>;

const number = new Intl.NumberFormat('en-US');
const hubCopy = {
  markets: {
    eyebrow: 'Global market coverage',
    title: 'Find your starting market.',
    description: 'Explore residential property in Seoul and Singapore, with local transaction records and market guides. Dubai currently offers market context only.',
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
    title: 'Buying abroad starts with local knowledge.',
    description: 'Understand housing types, read transaction prices and learn which questions to ask before buying in another country.',
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
        <Link href="/kr/seoul/">Explore Seoul</Link>
      </article>
      <article className={`${styles.marketCard} ${styles.marketSingapore}`}>
        <header><span>SG</span><Status tone="limited">Available datasets</Status></header>
        <div><p>Singapore</p><h2>Singapore</h2><p>Explore private residential projects and HDB transactions separately, with coverage shown for each dataset.</p></div>
        <dl><div><dt>Currency</dt><dd>SGD</dd></div><div><dt>Coverage</dt><dd>Private · HDB</dd></div></dl>
        <Link href="/sg/">Explore Singapore</Link>
      </article>
      <article className={`${styles.marketCard} ${styles.marketDubai}`} id="dubai">
        <header><span>AE</span><Status>Research only</Status></header>
        <div><p>United Arab Emirates</p><h2>Dubai</h2><p>Read the market overview. Building-level transaction search is not yet available.</p></div>
        <dl><div><dt>Currency</dt><dd>AED</dd></div><div><dt>Coverage</dt><dd>Preparing</dd></div></dl>
        <Link href="/ae/dubai/">Read Dubai overview</Link>
      </article>
    </div>
  );
}

function MarketsHub() {
  const rows = [
    ['Signed price evidence', 'Live', 'Available datasets', 'Research only'],
    ['District or area exploration', 'Live', 'Available by dataset', 'Preparing'],
    ['Active property listings', 'Not offered', 'Not offered', 'Not offered'],
    ['Personalized investment advice', 'Not offered', 'Not offered', 'Not offered'],
  ] as const;
  return (
    <>
      <section className={styles.section} aria-labelledby="market-directory-title">
        <div className={styles.sectionHeading}><p>Explore markets</p><h2 id="market-directory-title">Start with Seoul and Singapore.</h2></div>
        <MarketCards />
      </section>
      <section className={`${styles.section} ${styles.comparison}`} aria-labelledby="market-coverage-title">
        <div className={styles.sectionHeading}><p>Coverage</p><h2 id="market-coverage-title">What you can explore today.</h2></div>
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
        <p>Search covers Seoul buildings and districts. Open Singapore Explore to browse residential projects there.</p>
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

function InsightsHub({ workspace }: Readonly<{ workspace?: NewsWorkspaceModel }>) {
  const model = workspace ?? Object.freeze({ items: Object.freeze([]), naverState: 'not-configured' as const });
  return (
    <section className={`${styles.section} ${styles.newsSection}`} aria-labelledby="insights-title">
      <div className={styles.newsToolbar}>
        <div><p>SignedPrice reporting</p><h2 id="insights-title">Evidence first, commentary second.</h2></div>
        <nav className={styles.newsToolbarLinks} aria-label="News and original reporting">
          <Link href="/news/?type=data-stories">Read original reports →</Link>
          <Link href="/kr/seoul/news/">Approved Seoul briefs →</Link>
        </nav>
      </div>
      <NewsWorkbench model={model} />
    </section>
  );
}

function GuidesHub() {
  const guides = listPortfolioRecords('en').filter(({ type }) => type === 'guide');
  return (
    <>
      <section className={styles.section} aria-labelledby="guides-title">
        <div className={styles.sectionHeading}><p>Korea guides</p><h2 id="guides-title">Use the data without losing the local context.</h2></div>
        <div className={styles.guideGrid}>{guides.map((guide) => <article key={guide.slug}><span>{guide.marketId === 'kr-seoul' ? 'Seoul' : 'Singapore'} · Published {guide.publishedAt?.slice(0, 10)}</span><h3>{guide.title}</h3><p>{guide.deck}</p><Link href={guide.canonicalHref}>Read guide</Link></article>)}</div>
      </section>
      <section className={styles.marketGuideRow} aria-label="Guide coverage by market">
        <article><Status tone="live">Available</Status><h3>Buying and renting in Korea</h3><p>Contract evidence, district comparisons and decision methods.</p><Link href="/guides/rent-an-apartment-in-korea/">Start with renting →</Link></article>
        <article><Status tone="live">Pilot published</Status><h3>Reading Singapore evidence</h3><p>A source-led pilot keeps regional and project transaction layers separate.</p><Link href="/guides/read-singapore-private-transactions/">Read the Singapore guide →</Link></article>
        <article><Status>Preparing</Status><h3>Buying in Dubai</h3><p>Ownership and process guidance will open after legal and source review.</p></article>
      </section>
    </>
  );
}

export function GlobalProductHub({ kind, seoul, newsWorkspace }: GlobalProductHubProps) {
  const copy = hubCopy[kind];
  return (
    <div id="top">
      <SiteHeader copy={headerFor(kind)} />
      <main className={styles.main}>
        <header className={`${styles.hero} ${kind === 'news' ? styles.heroCompact : ''}`}><p>{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></header>
        {kind === 'markets' ? <MarketsHub /> : null}
        {kind === 'prices' ? <PricesHub seoul={seoul} /> : null}
        {kind === 'news' ? <InsightsHub workspace={newsWorkspace} /> : null}
        {kind === 'guides' ? <GuidesHub /> : null}
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
