import Link from 'next/link';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import type { SiteFooterModel, SiteHeaderModel } from '../lib/site-copy';
import styles from './future-service.module.css';

type FutureServicePageProps = Readonly<{
  type: 'properties' | 'invest' | 'community';
  header: SiteHeaderModel;
  footer: SiteFooterModel;
}>;

export function FutureServicePage({ type, header, footer }: FutureServicePageProps) {
  const properties = type === 'properties';
  const community = type === 'community';
  const currentHref = properties ? '/properties/' : community ? '/community/' : '/invest/';
  const currentHeader = {
    ...header,
    links: header.links.map((link) => ({
      ...link,
      isCurrent: link.href === currentHref,
    })),
  } satisfies SiteHeaderModel;
  const checks = properties
    ? ['Comparable signed evidence', 'Advertising and brokerage requirements', 'Source and sponsorship separation']
    : community
      ? ['Moderation and reporting tools', 'Privacy-safe member controls', 'Evidence and promotion labels']
      : ['Complete cost inputs', 'Currency-aware return comparison', 'Advice, licensing and partner boundaries'];
  const label = properties ? 'SIGNEDPRICE PROPERTIES' : community ? 'SIGNEDPRICE COMMUNITY' : 'SIGNEDPRICE INVEST';
  const heading = properties
    ? 'Evidence-backed property discovery is being prepared.'
    : community
      ? 'A useful local property community is being prepared.'
      : 'Cross-border investment comparison is being prepared.';
  const description = properties
    ? 'SignedPrice does not currently publish active listings, accept enquiries or provide brokerage services. We are validating data quality and the operating requirements first.'
    : community
      ? 'Posting is not open yet. We are designing moderation, reporting and privacy controls before discussions about buildings, contracts and neighbourhoods go live.'
      : 'SignedPrice does not currently provide personalized investment recommendations or advisory services. We are validating costs, rights and comparison rules first.';

  return (
    <div id="top">
      <SiteHeader copy={currentHeader} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <span className={styles.status}>Service preparing</span>
            <p>{label}</p>
            <h1>{heading}</h1>
            <p>{description}</p>
            <Link href="/kr/seoul/explore/">Explore available price evidence →</Link>
          </div>
          <div className={styles.preview} aria-label="Locked service preview">
            <div className={styles.previewBar}><span /><span /><span /></div>
            <div className={styles.previewCards}><i /><i /><i /></div>
            <div className={styles.lock}><strong>COMING SOON</strong><span>Public access opens after verification.</span></div>
          </div>
        </section>
        <section className={styles.readiness}>
          <header><p>READINESS CHECK</p><h2>What must be true before launch</h2></header>
          <div>{checks.map((check, index) => <article key={check}><span>0{index + 1}</span><strong>{check}</strong><p>Publication remains unavailable until this requirement is verified.</p></article>)}</div>
        </section>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
