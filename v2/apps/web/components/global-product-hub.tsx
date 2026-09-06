import Link from 'next/link';
import { ResearchPageHeading } from './market-ui/research-page-heading';

import { listPortfolioRecords } from '../content/portfolio-manifest';
import type { NewsWorkspaceModel } from '../lib/news/news-workspace-model';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import {
  homepageCopy,
  type SiteHeaderModel,
} from '../lib/site-copy';
import { PriceMarketSearch } from './price-market-search';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { NewsWorkbench } from './news/news-workbench';
import styles from './global-product-hub.module.css';

export type GlobalHubKind = 'markets' | 'prices' | 'news' | 'guides';

type GlobalProductHubProps = Readonly<{
  kind: GlobalHubKind;
  guideMarket?: 'all' | 'seoul' | 'singapore' | 'dubai';
  seoul?: SeoulLiveModel;
  newsWorkspace?: NewsWorkspaceModel;
}>;

const hubCopy = {
  markets: {
    eyebrow: 'Global market coverage',
    title: 'Markets',
    description: 'Explore residential property in Seoul and Singapore, with local transaction records and market guides. Dubai offers official market releases and area research.',
  },
  prices: {
    eyebrow: 'Signed price evidence',
    title: 'Prices',
    description: 'Move from city context to district and building evidence without mixing completed contracts with asking prices or active listings.',
  },
  news: {
    eyebrow: 'Market news',
    title: 'News, with the evidence boundary attached.',
    description: 'SignedPrice publishes market briefs only when the evidence, period and editorial boundary can be shown together.',
  },
  guides: {
    eyebrow: 'Buying across borders',
    title: 'Guides',
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
        <nav className={styles.marketReading} aria-label="Seoul research"><Link href="/kr/seoul/explore/">Explore</Link><Link href="/guides/buy-property-in-korea-as-foreigner/">Buying guide</Link><Link href="/news/?market=seoul">News and analysis</Link></nav>
      </article>
      <article className={`${styles.marketCard} ${styles.marketSingapore}`}>
        <header><span>SG</span><Status tone="limited">Available datasets</Status></header>
        <div><p>Singapore</p><h2>Singapore</h2><p>Explore private residential projects and HDB transactions separately, with coverage shown for each dataset.</p></div>
        <dl><div><dt>Currency</dt><dd>SGD</dd></div><div><dt>Coverage</dt><dd>Private · HDB</dd></div></dl>
        <nav className={styles.marketReading} aria-label="Singapore research"><Link href="/sg/singapore/explore/">Explore</Link><Link href="/guides/read-singapore-private-transactions/">Buying guide</Link><Link href="/news/?market=singapore">News and analysis</Link></nav>
      </article>
      <article className={`${styles.marketCard} ${styles.marketDubai}`} id="dubai">
        <header><span>AE</span><Status>Research only</Status></header>
        <div><p>United Arab Emirates</p><h2>Dubai</h2><p>Explore selected areas, official market releases and purchase costs. Building-level transaction search is not yet available.</p></div>
        <dl><div><dt>Currency</dt><dd>AED</dd></div><div><dt>Coverage</dt><dd>Area research</dd></div></dl>
        <nav className={styles.marketReading} aria-label="Dubai research"><Link href="/ae/dubai/explore/">Explore</Link><Link href="/ae/dubai/guide/">Buying guide</Link><Link href="/news/?market=dubai">News</Link></nav>
      </article>
    </div>
  );
}

function MarketsHub() {
  const rows = [
    ['Signed price evidence', 'Live', 'Available datasets', 'Research only'],
    ['District or area exploration', 'Live', 'Available by dataset', 'Selected area guides'],
    ['Active property listings', 'Not offered', 'Not offered', 'Not offered'],
    ['Personalized investment advice', 'Not offered', 'Not offered', 'Not offered'],
  ] as const;
  return (
    <>
      <section className={styles.section} aria-labelledby="market-directory-title">
        <div className={styles.sectionHeading}><p>Explore markets</p><h2 id="market-directory-title">Choose a market, then a dataset.</h2></div>
        <MarketCards />
      </section>
      <section className={styles.section} aria-labelledby="market-research-title">
        <div className={styles.sectionHeading}><p>Before you shortlist</p><h2 id="market-research-title">Three questions before comparing prices.</h2></div>
        <ol className={styles.researchSteps}>
          <li>
            <h3>Can you buy this property?</h3>
            <div><h4>Seoul</h4><p>Record your residency, intended use and the exact parcel. Check permission, reporting and registration requirements before paying a deposit.</p><Link href="/guides/buy-property-in-korea-as-foreigner/">Foreign-buyer checklist</Link></div>
            <div><h4>Singapore</h4><p>Identify the housing type and your buyer status first. Treat private apartments, landed homes and HDB flats as separate eligibility questions.</p><Link href="/guides/read-singapore-private-transactions/">Ownership and eligibility</Link></div>
            <div><h4>Dubai</h4><p>Check the exact project, developer and ownership eligibility with the official registers before committing to a unit.</p><Link href="/ae/dubai/guide/">Dubai buying research</Link></div>
          </li>
          <li>
            <h3>How much cash will you need?</h3>
            <div><h4>Seoul</h4><p>Budget for taxes, brokerage, registration and legal work alongside the price. Put confirmed financing, transfers and any existing tenant deposit on a dated cash schedule.</p><Link href="/guides/buy-property-in-korea-as-foreigner/">Plan the purchase budget</Link></div>
            <div><h4>Singapore</h4><p>Calculate Buyer’s Stamp Duty and any Additional Buyer’s Stamp Duty for your profile. The guide’s S$2 million example shows why duties can materially change the budget.</p><Link href="/guides/read-singapore-private-transactions/">See the acquisition-cost chart</Link></div>
            <div><h4>Dubai</h4><p>Request an itemised acquisition quote and current service charges. Enter confirmed figures into the AED scenario; include vacancy and recurring costs.</p><Link href="/ae/dubai/guide/">Dubai buying research</Link></div>
          </li>
          <li>
            <h3>Are the transactions comparable?</h3>
            <div><h4>Seoul</h4><p>Compare sale contracts within the same building and similar exclusive floor area. Keep lease deposits, monthly rents and purchase prices in separate comparisons.</p><Link href="/kr/seoul/explore/">Explore Seoul transactions</Link></div>
            <div><h4>Singapore</h4><p>Match the project, tenure, size and sale period. Compare private housing and HDB records separately, then inspect the individual project.</p><Link href="/sg/singapore/explore/">Explore Singapore transactions</Link></div>
            <div><h4>Dubai</h4><p>Separate ready properties from off-plan contracts and registration dates from completion dates. SignedPrice currently provides area context and aggregate releases.</p><Link href="/ae/dubai/guide/">Dubai buying research</Link></div>
          </li>
        </ol>
        <p className={styles.researchSources}>Official starting points: <a href="https://www.investkorea.org/ik-en/cntnts/i-417/web.do">Invest KOREA acquisition procedures</a> and <a href="https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd)">IRAS stamp duties</a>. The linked guides include the detailed sources and worked examples.</p>
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

function PricesHub() {
  return <>
    <PriceMarketSearch />
    <section className={styles.section} aria-labelledby="price-products-title">
      <div className={styles.sectionHeading}><p>Choose a market</p><h2 id="price-products-title">Local records. Comparable decisions.</h2></div>
      <div className={styles.productGrid}>
        <Link href="/kr/seoul/explore/"><span>Seoul · KRW</span><h3>Reported housing contracts</h3><p>Explore sale, jeonse and monthly rent by district, neighborhood and building. Compare the same property type and area.</p><strong>Explore →</strong></Link>
        <Link href="/sg/singapore/explore/"><span>Singapore · SGD</span><h3>Private homes and HDB</h3><p>Search private projects and inspect transaction history, size bands and tenure. HDB records stay in their own dataset.</p><strong>Explore →</strong></Link>
        <Link href="/ae/dubai/explore/"><span>Dubai · AED</span><h3>Market and area research</h3><p>Review official market releases, compare area context and prepare purchase costs. Individual transaction search is not available.</p><strong>Explore research →</strong></Link>
      </div>
    </section>
  </>;
}

function InsightsHub({ workspace }: Readonly<{ workspace?: NewsWorkspaceModel }>) {
  const model = workspace ?? Object.freeze({ items: Object.freeze([]), naverState: 'not-configured' as const });
  return (
    <section className={`${styles.section} ${styles.newsSection}`} aria-labelledby="insights-title">
      <div className={styles.newsToolbar}>
        <div><p>SignedPrice reporting</p><h2 id="insights-title">Evidence first, commentary second.</h2></div>
        <nav className={styles.newsToolbarLinks} aria-label="News and original reporting">
          <Link href="/news/?type=data-stories">Read original reports →</Link>
          <Link href="/news/?market=seoul">Approved Seoul briefs →</Link>
        </nav>
      </div>
      <NewsWorkbench model={model} />
    </section>
  );
}

function GuidesHub({ market = 'all' }: Readonly<{ market?: GlobalProductHubProps['guideMarket'] }>) {
  const guides = listPortfolioRecords('en').filter(({ type, marketId }) => type === 'guide' && (market === 'all' || (market === 'seoul' && marketId === 'kr-seoul') || (market === 'singapore' && marketId === 'sg-singapore'))).sort((a, b) => {
    const first = ['buy-property-in-korea-as-foreigner', 'read-singapore-private-transactions'];
    return (first.includes(a.slug) ? first.indexOf(a.slug) : 2) - (first.includes(b.slug) ? first.indexOf(b.slug) : 2);
  });
  return (
    <>
      <nav className={styles.directoryFilters} aria-label="Guide markets">{([['all', 'All'], ['seoul', 'Seoul'], ['singapore', 'Singapore'], ['dubai', 'Dubai']] as const).map(([id, label]) => <Link key={id} href={id === 'all' ? '/guides/' : `/guides/?market=${id}`} aria-current={market === id ? 'page' : undefined}>{label}</Link>)}</nav>
      <section className={styles.section} aria-labelledby="guides-title">
        <div className={styles.sectionHeading}><p>Buying and renting</p><h2 id="guides-title">Practical guides for each market.</h2></div>
        <p className={styles.resultCount}>{guides.length + (market === 'all' || market === 'dubai' ? 1 : 0)} {guides.length + (market === 'all' || market === 'dubai' ? 1 : 0) === 1 ? 'guide' : 'guides'} · Sources and reporting dates inside each guide</p>
        <div className={styles.guideGrid}>{guides.map((guide) => <article key={guide.slug}><span>{guide.marketId === 'kr-seoul' ? 'Seoul' : 'Singapore'} · Updated {guide.updatedAt.slice(0, 10)}</span><h3>{guide.title}</h3><p>{guide.deck}</p><Link href={guide.canonicalHref}>Read guide</Link></article>)}{market === 'all' || market === 'dubai' ? <article><span>Dubai · Updated 2026-09-06</span><h3>Research a Dubai property purchase</h3><p>Check project identity, completion status and service charges, then build an AED purchase-cost scenario.</p><Link href="/ae/dubai/guide/">Read guide</Link></article> : null}</div>
      </section>
    </>
  );
}

export function GlobalProductHub({ kind, newsWorkspace, guideMarket }: GlobalProductHubProps) {
  const copy = hubCopy[kind];
  return (
    <div id="top">
      <SiteHeader copy={headerFor(kind)} />
      <main className={styles.main}>
        <ResearchPageHeading title={copy.title} description={copy.description} />
        {kind === 'markets' ? <MarketsHub /> : null}
        {kind === 'prices' ? <PricesHub /> : null}
        {kind === 'news' ? <InsightsHub workspace={newsWorkspace} /> : null}
        {kind === 'guides' ? <GuidesHub market={guideMarket} /> : null}
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
