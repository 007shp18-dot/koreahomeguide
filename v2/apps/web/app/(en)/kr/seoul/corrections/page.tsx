import type { Metadata } from 'next';
import Link from 'next/link';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CorrectionLedger } from '@/components/trust/correction-ledger';
import styles from '@/components/trust/trust.module.css';
import type { SiteFooterModel, SiteHeaderModel } from '@/lib/site-copy';
import { listCorrections } from '@/lib/trust/correction-ledgers.server';

export const metadata: Metadata = {
  title: 'Seoul evidence corrections | signedprice',
  description: 'Published corrections and reviewed reports for SignedPrice Seoul evidence.',
  robots: { index: false, follow: true },
};

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul correction navigation',
  links: [
    { label: 'Global Trust', href: '/trust/' },
    { label: 'Explore', href: '/kr/seoul/explore/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul evidence with its correction history shown.',
  navigationLabel: 'Correction footer navigation',
  links: [
    { label: 'Trust', href: '/trust/' },
    { label: 'Explore', href: '/kr/seoul/explore/' },
    { label: 'Rankings', href: '/kr/seoul/rankings/' },
  ],
  status: 'An empty ledger means no correction has been published.',
};

export default function KoreaCorrectionsPage() {
  const corrections = listCorrections('kr-seoul');
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <main className={styles.correctionsPage}>
        <ResearchPageHeading title="Corrections" description="Seoul · Changes to published data and explanations." actions={<Link href="mailto:contact@signedprice.com?subject=Seoul%20data%20correction">Report an issue</Link>} />
        <div className={styles.ledgerWrap}>
          <CorrectionLedger corrections={corrections} />
          <nav className={styles.relatedLinks} aria-label="Related Seoul evidence">
            <Link href="/kr/seoul/explore/">Explore</Link>
            <Link href="/kr/seoul/rankings/">Rankings</Link>
          </nav>
        </div>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
