import type { Metadata } from 'next';

import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import styles from '../../components/trust/trust.module.css';
import { indexableMetadata } from '../../lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/trust/',
  title: 'Trust and evidence | signedprice',
  description: 'How SignedPrice handles sources, periods, rights, publication limits and corrections.',
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Trust navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Trust', href: '/trust/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Global property evidence with its limits shown.',
  navigationLabel: 'Trust footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul corrections', href: '/kr/seoul/corrections/' },
  ],
  status: 'Evidence policy. No accuracy or outcome guarantee.',
};

const policies = [
  {
    title: 'Evidence states',
    copy: 'Ready, insufficient, incomplete, not loaded, rights blocked, source unavailable and invalid remain distinct states. Missing evidence is never replaced with zero or a market average.',
  },
  {
    title: 'Freshness',
    copy: 'Periods and generation times come from validated source artifacts. Pages do not hardcode a date that can drift away from the installed evidence.',
  },
  {
    title: 'Rights',
    copy: 'Every source carries a rights policy. Display, commercial use and indexing stay blocked unless the relevant operation is explicitly permitted.',
  },
  {
    title: 'Corrections',
    copy: 'A fixed item records a change. An upheld item records a reviewed report whose published evidence was retained. An empty ledger is valid.',
  },
  {
    title: 'Accuracy',
    copy: 'No model-accuracy figure is currently published. A future figure requires a reproducible artifact naming its sample, folds, training window and scoring window.',
  },
] as const;

export default function TrustPage() {
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <main className={styles.policyPage}>
        <header className={styles.policyHero} data-product-intro="true">
          <p>SignedPrice · Global Trust</p>
          <h1>How SignedPrice publishes evidence</h1>
          <p>
            Property evidence is useful only when its source, period, method, rights and
            publication boundary travel with the number.
          </p>
        </header>
        <section className={styles.policyGrid} aria-label="Evidence publication policy">
          {policies.map((policy, index) => (
            <article key={policy.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h2>{policy.title}</h2>
              <p>{policy.copy}</p>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
