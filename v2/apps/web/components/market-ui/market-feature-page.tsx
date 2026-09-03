import Link from 'next/link';

import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import styles from './market-feature-page.module.css';

export type MarketFeature = 'explore' | 'check' | 'rankings' | 'news' | 'community' | 'guide';

const featureCopy = {
  explore: { title: 'Explore local property evidence.', description: 'Browse local areas and building identities without mixing source classes.', status: 'Data release preparing' },
  check: { title: 'Check a price in local context.', description: 'Comparable evidence appears only when compatible source fields and minimum samples are available.', status: 'Comparison preparing' },
  rankings: { title: 'Compare areas without invented scores.', description: 'Rankings will use declared metrics, periods and collection states—never editorial ratings.', status: 'Data release preparing' },
  news: { title: 'Read local news with its source attached.', description: 'News API items will be paired with market, place and evidence context before publication.', status: 'Editorial feed preparing' },
  community: { title: 'Join the conversation for this place.', description: 'The community scope is ready for market, district and building feeds. Public posting opens after moderation controls pass.', status: 'Read-only foundation' },
  guide: { title: 'Understand the local process.', description: 'Guides will keep dated rules, costs and evidence limits specific to this market.', status: 'Local guide preparing' },
} as const;

export function MarketFeaturePage({ city, code, feature, href, overviewHref }: Readonly<{
  city: 'Seoul' | 'Singapore' | 'Dubai';
  code: 'KR' | 'SG' | 'AE';
  feature: MarketFeature;
  href: string;
  overviewHref: string;
}>) {
  const copy = featureCopy[feature];
  const header: SiteHeaderModel = {
    brand: 'signedprice', homeLabel: 'signedprice home', navigationLabel: `${city} product navigation`,
    marketLabel: city, languageLabel: 'EN', links: [{ label: feature, href, isCurrent: true }],
  };
  const footer: SiteFooterModel = {
    brand: 'signedprice', descriptor: `Property evidence and local context for ${city}.`, navigationLabel: `${city} footer navigation`,
    links: [{ label: `${city} overview`, href: overviewHref }, { label: 'Global markets', href: '/markets/' }, { label: 'Trust', href: '/trust/' }],
    status: 'Unavailable data stays unavailable. No listing, brokerage or personalized advice service is active.',
  };
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <main className={styles.main}>
        <header className={styles.hero}>
          <div><p>{code} · {city} · {feature}</p><h1>{copy.title}</h1><p>{copy.description}</p></div>
          <aside><span>{copy.status}</span><strong>—</strong><small>No unsupported values substituted</small></aside>
        </header>
        <section className={styles.workspace} aria-labelledby="feature-foundation-heading">
          <div className={styles.sectionHeading}><p>PRODUCT FOUNDATION</p><h2 id="feature-foundation-heading">The same structure in every market.</h2></div>
          <div className={styles.cards}>
            <article><span>01</span><strong>Local identity</strong><p>Market, area and building references use the same hierarchy.</p></article>
            <article><span>02</span><strong>Native evidence</strong><p>Currency, housing type and source fields stay local.</p></article>
            <article><span>03</span><strong>Clear limits</strong><p>Missing, insufficient or rights-blocked data is labelled directly.</p></article>
          </div>
        </section>
        <aside className={styles.next}><div><span>SERVICE STATE</span><strong>{copy.status}</strong></div><p>The route and shared layout are in place. Content opens market by market after its exact data and operating gates pass.</p><Link href={overviewHref}>Return to {city} overview →</Link></aside>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
