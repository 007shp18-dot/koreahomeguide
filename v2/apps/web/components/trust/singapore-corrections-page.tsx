import Link from 'next/link';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CorrectionLedger } from './correction-ledger';
import { homepageCopy } from '@/lib/site-copy';
import { listCorrections } from '@/lib/trust/correction-ledgers.server';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import styles from './trust.module.css';
const copy = {
 en: { title: 'Singapore data corrections', description: 'Published changes to Singapore property data and explanations.', report: 'Report a data issue', explore: 'Explore Singapore', sources: 'Data & sources', related: 'Related Singapore pages' },
 ko: { title: '싱가포르 데이터 정정 이력', description: '싱가포르 부동산 자료와 설명의 공개 정정 내용을 확인하세요.', report: '데이터 오류 신고', explore: '싱가포르 탐색', sources: '데이터와 출처', related: '싱가포르 관련 페이지' },
 'zh-CN': { title: '新加坡数据更正记录', description: '查看新加坡房地产数据及说明中已公布的更正。', report: '报告数据错误', explore: '探索新加坡', sources: '数据与来源', related: '新加坡相关页面' },
} as const;
export function SingaporeCorrectionsPage({ locale = 'en' }: { locale?: SiteLocale }) {
 const t = copy[locale];
 const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
 return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, homeHref: `${prefix}/`, languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', links: [{ label: t.title, href: `${prefix}/sg/singapore/corrections/`, isCurrent: true }] }} />
  <main className={styles.correctionsPage}><ResearchPageHeading title={t.title} description={t.description} actions={<Link href="mailto:contact@signedprice.com?subject=Singapore%20data%20correction">{t.report}</Link>} />
  <div className={styles.ledgerWrap}><CorrectionLedger locale={locale} corrections={listCorrections('sg-singapore')} /><nav className={styles.relatedLinks} aria-label={t.related}><Link href={`${prefix}/sg/singapore/explore/`}>{t.explore}</Link><Link href="/trust/">{t.sources}</Link></nav></div>
  </main><SiteFooter copy={homepageCopy.footer} locale={locale} /></div>;
}
