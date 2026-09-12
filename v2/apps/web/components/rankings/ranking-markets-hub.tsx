import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { homepageCopy } from '../../lib/site-copy';
import frame from '../global-product-hub.module.css';
import styles from './contract-rankings.module.css';

type Locale = 'en' | 'ko' | 'zh-CN';

export function RankingMarketsHub({ locale = 'en', children }: Readonly<{ locale?: Locale; children?: ReactNode }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const rankingPrefix = ko ? '/ko' : '';
  const header = {
    ...homepageCopy.header,
    homeHref: `${prefix}/`,
    languageLabel: ko ? 'KO' : zh ? 'ZH' : 'EN',
    languageSwitch: ko || zh
      ? { label: 'EN', href: '/rankings/', hrefLang: 'en' as const }
      : { label: 'KO', href: '/ko/rankings/', hrefLang: 'ko' as const },
    links: [{ label: ko ? '순위' : zh ? '排行榜' : 'Rankings', href: `${prefix}/rankings/`, isCurrent: true }],
  };
  const cities = { seoul: ko ? '서울' : zh ? '首尔' : 'Seoul', singapore: ko ? '싱가포르' : zh ? '新加坡' : 'Singapore', tokyo: ko ? '도쿄' : zh ? '东京' : 'Tokyo' };
  return <div id="top" lang={locale}>
    <SiteHeader copy={header} />
    <main className={frame.main}>
      <header className={styles.pageHeading}><h1>{ko ? '가격 순위' : zh ? '房产价格排行' : 'Property rankings'}</h1><Link href={`${prefix}/guides/`}>{ko ? '읽는 방법' : zh ? '阅读指南' : 'How to read'}</Link></header>
      {children || <section aria-label={ko ? '시장별 순위' : zh ? '各市场排行' : 'Market rankings'} className={styles.directory}>
        {(['seoul', 'singapore'] as const).flatMap(city => (['sale', 'rent'] as const).map(kind => <Link key={city + kind} href={`/rankings/?city=${city}&kind=${kind}`}><span>{cities[city]} · {kind === 'sale' ? (ko ? '매매 TOP 50' : zh ? '成交 TOP 50' : 'Sales TOP 50') : (ko ? '지역별 월세' : zh ? '区域租金' : 'District rents')}</span><small>{ko ? '상세 보기 (영어) →' : zh ? '查看详情（英文）→' : 'View rankings →'}</small></Link>))}
        <Link href="/rankings/?city=tokyo"><span>{cities.tokyo} · {ko ? '중고 맨션 TOP 50' : zh ? '二手公寓 TOP 50' : 'Resale condos TOP 50'}</span><small>2026 Q1 →</small></Link>
      </section>}
      <details className={styles.method}><summary>{ko ? '건물·단지별 비교 더 보기' : zh ? '更多楼宇与项目比较' : 'More building and project comparisons'}</summary><nav className={styles.moreLinks} aria-label="Additional ranking comparisons">
        <Link href={`${rankingPrefix}/kr/seoul/rankings/`}>{ko ? '서울 · 건물별 매매·전세·월세' : zh ? '首尔 · 楼宇买卖与租金' : 'Seoul · buildings — Sale, jeonse and rent by building'}</Link>
        <Link href={`${rankingPrefix}/sg/singapore/rankings/`}>{ko ? '싱가포르 · 단지별 가격' : zh ? '新加坡 · 项目价格' : 'Singapore · project prices'}</Link>
        <Link href={`${prefix}/jp/tokyo/explore/`}>{ko ? '도쿄 · 지역별 거래' : zh ? '东京 · 区域成交' : 'Tokyo · area transactions'}</Link>
      </nav></details>
    </main>
    <SiteFooter copy={homepageCopy.footer} locale={locale} />
  </div>;
}
