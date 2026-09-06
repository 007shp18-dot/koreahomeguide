import type { Metadata } from 'next';
import Link from 'next/link';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CorrectionLedger } from '@/components/trust/correction-ledger';
import trustStyles from '@/components/trust/trust.module.css';
import {
  singaporeFooter,
  singaporeHeader,
} from '@/components/singapore/singapore-shell';
import { listCorrections } from '@/lib/trust/correction-ledgers.server';

export const metadata: Metadata = {
  title: 'Singapore evidence corrections | signedprice',
  description: 'Published corrections and reviewed reports for SignedPrice Singapore evidence.',
  robots: { index: false, follow: true },
};

export default function SingaporeCorrectionsPage() {
  const corrections = listCorrections('sg-singapore');
  return (
    <div id="top">
      <SiteHeader copy={singaporeHeader} />
      <main className={trustStyles.correctionsPage}>
        <ResearchPageHeading title="Corrections" description="Singapore · Changes to published data and explanations." actions={<Link href="mailto:contact@signedprice.com?subject=Singapore%20data%20correction">Report an issue</Link>} />
        <div className={trustStyles.ledgerWrap}>
          <CorrectionLedger corrections={corrections} />
          <nav className={trustStyles.relatedLinks} aria-label="Related Singapore evidence">
            <Link href="/sg/singapore/explore/">Explore</Link>
            <Link href="/trust/">Method</Link>
          </nav>
        </div>
      </main>
      <SiteFooter copy={singaporeFooter} />
    </div>
  );
}
