import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { homepageCopy, type SiteHeaderModel } from '@/lib/site-copy';
import styles from '@/components/trust/trust.module.css';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({ path: '/trust/', title: 'Data & sources | signedprice', description: 'Where SignedPrice prices come from, how to read them, when they are updated and how to report an error.' });

const header: SiteHeaderModel = {
  ...homepageCopy.header,
  navigationLabel: 'Data and sources navigation',
  links: [{ label: 'Data & sources', href: '/trust/', isCurrent: true }],
};

const policies = [
  {
    title: 'Where do the prices come from?',
    copy: 'Each dataset identifies its provider, reporting period and coverage. Follow the source link beside the data to check the original publication. Coverage differs by city and property type, so a number should always be read with its source and period.',
  },
  {
    title: 'How should I read a price?',
    copy: 'Check whether the figure is a recorded transaction or a summary, and compare the same property type, size and period. The calculation method belongs with the figure. Missing records are never replaced with zero or a city average. We do not publish an accuracy score or promise that a comparison predicts a sale price; any future score would need a reproducible evaluation describing the sample and evaluation periods.',
  },
  {
    title: 'When is the data updated?',
    copy: 'The reporting period and update time shown with a dataset come from the source data used for that release. They may differ from today’s date. An update does not mean every property has a recent transaction, so check the period on the result you are using.',
  },
  {
    title: 'Why are some prices unavailable?',
    copy: 'There may be too few comparable records, incomplete data, an unavailable source or a restriction on publication. These reasons are kept separate and explained beside the result. Display, commercial use and search indexing are allowed only where the source rights explicitly permit each use.',
  },
  {
    title: 'How can I report an error?',
    copy: 'Share the affected page and the source that supports your correction. A review may result in a change or an explanation of why the published information was retained. The correction record shows the outcome; an empty record means there are no published corrections to display.',
  },
] as const;

export default function TrustPage() {
  return <div id="top">
    <SiteHeader copy={header} />
    <main className={styles.policyPage}>
      <header className={styles.policyHero} data-product-intro="true">
        <p>Help</p>
        <h1>Data & sources</h1>
        <p>Know what a price represents before using it to compare homes.</p>
      </header>
      <section className={styles.policyGrid} aria-label="How to use SignedPrice data">
        {policies.map(policy => <article key={policy.title}><h2>{policy.title}</h2><p>{policy.copy}</p></article>)}
      </section>
      <nav className={styles.policyLinks} aria-label="Data corrections and contact"><Link href="/kr/seoul/corrections/">Seoul data corrections</Link><Link href="/contact/">Contact SignedPrice</Link></nav>
    </main>
    <SiteFooter copy={homepageCopy.footer} />
  </div>;
}
