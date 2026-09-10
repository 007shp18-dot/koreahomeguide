import Link from 'next/link';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import type { SiteFooterModel, SiteHeaderModel } from '../lib/site-copy';
import styles from './future-service.module.css';

type FutureServicePageProps = Readonly<{
  type: 'properties' | 'invest';
  header: SiteHeaderModel;
  footer: SiteFooterModel;
}>;

export function FutureServicePage({ type, header, footer }: FutureServicePageProps) {
  const properties = type === 'properties';
  const currentHeader = {
    ...header,
    links: header.links.map((link) => ({
      ...link,
      isCurrent: link.href === (properties ? '/properties/' : '/invest/'),
    })),
  } satisfies SiteHeaderModel;
  const checks = properties
    ? ['Comparable signed evidence', 'Advertising and brokerage requirements', 'Source and sponsorship separation']
    : ['Complete cost inputs', 'Currency-aware return comparison', 'Advice, licensing and partner boundaries'];

  return (
    <div id="top">
      <SiteHeader copy={currentHeader} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <span className={styles.status}>Service preparing</span>
            <p>{properties ? 'SIGNEDPRICE PROPERTIES' : 'SIGNEDPRICE INVEST'}</p>
            <h1>{properties ? 'Evidence-backed property discovery is being prepared.' : 'Cross-border investment comparison is being prepared.'}</h1>
            <p>{properties
              ? 'SignedPrice does not currently publish active listings, accept enquiries or provide brokerage services. We are validating data quality and the operating requirements first.'
              : 'SignedPrice does not currently provide personalized investment recommendations or advisory services. We are validating costs, rights and comparison rules first.'}</p>
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
