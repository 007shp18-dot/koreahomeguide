import { SingaporePage } from '@/components/singapore/singapore-shell';
import { singaporeMetadata } from '@/lib/locale/singapore-copy';
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

export const metadata: Metadata = singaporeMetadata({
  title: 'Singapore evidence corrections | signedprice',
  description: 'SignedPrice 싱가포르 자료의 공개 정정 내역과 검토된 제보.',
  alternates: { canonical: 'https://www.signedprice.com/ko/sg/singapore/corrections/' },
  robots: { index: false, follow: true },
});

export default function SingaporeCorrectionsPage() {
  const corrections = listCorrections('sg-singapore');
  return (
    <SingaporePage locale="ko" currentHref="/ko/sg/singapore/corrections/" unframed>
      
      <section className={trustStyles.correctionsPage}>
        <ResearchPageHeading title="정정 내역" description="싱가포르 · 공개 자료와 설명의 변경 내역" actions={<Link href="mailto:contact@signedprice.com?subject=Singapore%20data%20correction">오류 제보</Link>} />
        <div className={trustStyles.ledgerWrap}>
          <CorrectionLedger locale="ko" corrections={corrections} />
          <nav className={trustStyles.relatedLinks} aria-label="관련 싱가포르 자료">
            <Link href="/ko/sg/singapore/explore/">둘러보기</Link>
            <Link href="/ko/trust/">자료 이용 방법</Link>
          </nav>
        </div>
      </section>
      
    </SingaporePage>
  );
}
