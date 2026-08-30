import type {
  PublicMarketConfig,
  PublicMarketSummary,
} from '@signedprice/market-core';
import Link from 'next/link';

import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { BoxPlot } from './box-plot';
import styles from './public-market.module.css';
import { QuoteInput } from './quote-input';

export type PublicMarketPageMode = 'home' | 'check' | 'area';

function formatter(config: PublicMarketConfig): (value: number) => string {
  const number = new Intl.NumberFormat(config.formatLocale, {
    style: 'currency',
    currency: config.currencyCode,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  });
  return (value) => number.format(value);
}

export function PublicMarketPage({
  mode,
  config,
  summary,
  header,
  footer,
  pageCopy,
  methodology,
  navigation,
}: Readonly<{
  mode: PublicMarketPageMode;
  config: PublicMarketConfig;
  summary: PublicMarketSummary;
  header: SiteHeaderModel;
  footer: SiteFooterModel;
  pageCopy: Readonly<Record<PublicMarketPageMode, Readonly<{
    eyebrow: string;
    heading: string;
    description: string;
  }>>>;
  methodology: Readonly<{ label: string; disclosure: string }>;
  navigation: Readonly<{
    label: string;
    links: readonly Readonly<{ href: string; label: string }>[];
  }>;
}>) {
  const currentCopy = pageCopy[mode];

  return (
    <div id="top" className={styles.publicPage}>
      <SiteHeader copy={header} />
      <main className={styles.publicMain}>
        <header className={styles.publicHero}>
          <p>{currentCopy.eyebrow}</p>
          <h1>{currentCopy.heading}</h1>
          <p>{currentCopy.description}</p>
        </header>

        <section className={styles.publicEvidence} aria-labelledby="public-evidence-heading">
          <div className={styles.publicSectionHeading}>
            <p>01 / Market evidence</p>
            <h2 id="public-evidence-heading">
              {summary.published ? 'Verified distribution' : 'Publication withheld'}
            </h2>
          </div>
          {mode === 'area' ? (
            <BoxPlot
              summary={summary}
              axis={config.axis}
              formatValue={formatter(config)}
            />
          ) : (
            <QuoteInput config={config} summary={summary} />
          )}
        </section>

        <section className={styles.publicDisclosure} aria-labelledby="public-source-heading">
          <div className={styles.publicSectionHeading}>
            <p>02 / Source and method</p>
            <h2 id="public-source-heading">Read the boundary with the number.</h2>
          </div>
          <dl>
            <div>
              <dt>Registry</dt>
              <dd>{config.registryLabel}</dd>
            </div>
            <div>
              <dt>Completed period</dt>
              <dd>{summary.period}</dd>
            </div>
            <div>
              <dt>Publication rule</dt>
              <dd>Money is withheld when fewer than 5 compatible contracts are present.</dd>
            </div>
            <div>
              <dt>Quote method</dt>
              <dd>{methodology.label}</dd>
            </div>
          </dl>
          <p>
            Official reported contracts are not current listings, an appraisal or legal advice.
            {' '}{methodology.disclosure}
          </p>
        </section>

        <nav className={styles.publicLinks} aria-label={navigation.label}>
          {navigation.links.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}</Link>
          ))}
        </nav>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
