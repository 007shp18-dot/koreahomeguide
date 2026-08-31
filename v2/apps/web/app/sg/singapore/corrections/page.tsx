import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import { CorrectionLedger } from '../../../../components/trust/correction-ledger';
import trustStyles from '../../../../components/trust/trust.module.css';
import {
  singaporeFooter,
  singaporeHeader,
} from '../../../../components/singapore/singapore-shell';
import { listCorrections } from '../../../../lib/trust/correction-ledgers.server';

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
      <main className={trustStyles.policyPage}>
        <header className={trustStyles.policyHero}>
          <p>Singapore · Evidence accountability</p>
          <h1>Singapore evidence corrections</h1>
          <p>Fixed and upheld reports appear here. The ledger is never pre-filled with examples.</p>
        </header>
        <div className={trustStyles.ledgerWrap}>
          <CorrectionLedger corrections={corrections} />
          <nav className={trustStyles.relatedLinks} aria-label="Related Singapore evidence">
            <Link href="/sg/singapore/explore/">Open Singapore Explore</Link>
            <Link href="/trust/">Review Global Trust</Link>
          </nav>
        </div>
      </main>
      <SiteFooter copy={singaporeFooter} />
    </div>
  );
}
