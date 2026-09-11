import Link from 'next/link';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CorrectionLedger } from './correction-ledger';
import { homepageCopy } from '@/lib/site-copy';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { listCorrections } from '@/lib/trust/correction-ledgers.server';
import styles from './trust.module.css';

const copy = {
  en: { title: 'Seoul data corrections', description: 'Published changes to Seoul property data and explanations. This is a correction history, not a price adjustment.', report: 'Report a data issue', explore: 'Explore Seoul', rankings: 'Seoul rankings', related: 'Related Seoul pages' },
  ko: { title: '서울 데이터 정정 이력', description: '서울 부동산 자료와 설명에서 공개적으로 정정한 내용을 확인하는 페이지입니다. 가격 보정이나 가격 조정을 뜻하지 않습니다.', report: '데이터 오류 신고', explore: '서울 탐색', rankings: '서울 순위', related: '서울 관련 페이지' },
  'zh-CN': { title: '首尔数据更正记录', description: '查看首尔房地产数据及说明中已公布的更正。本页记录数据更正，不表示价格调整。', report: '报告数据错误', explore: '探索首尔', rankings: '首尔排名', related: '首尔相关页面' },
} as const;

export function SeoulCorrectionsPage({ locale = 'en' }: { locale?: SiteLocale }) {
  const t = copy[locale];
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  const href = `${prefix}/kr/seoul/corrections/`;
  return <div id="top">
    <SiteHeader copy={{ ...homepageCopy.header, homeHref: `${prefix}/`, languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', links: [{ label: t.title, href, isCurrent: true }] }} />
    <main className={styles.correctionsPage}>
      <ResearchPageHeading title={t.title} description={t.description} actions={<Link href="mailto:contact@signedprice.com?subject=Seoul%20data%20correction">{t.report}</Link>} />
      <div className={styles.ledgerWrap}>
        <CorrectionLedger corrections={listCorrections('kr-seoul')} locale={locale} />
        <nav className={styles.relatedLinks} aria-label={t.related}>
          <Link href={`${prefix}/kr/seoul/explore/`}>{t.explore}</Link>
          <Link href={`${prefix}/rankings/?market=seoul`}>{t.rankings}</Link>
        </nav>
      </div>
    </main>
    <SiteFooter copy={homepageCopy.footer} locale={locale} />
  </div>;
}
