import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { homepageCopy } from '../../lib/site-copy';
import frame from '../global-product-hub.module.css';
import styles from './contract-rankings.module.css';

type Locale = 'en' | 'ko' | 'zh-CN';

export function RankingMarketsHub({ locale = 'en', children, query = {} }: Readonly<{ locale?: Locale; children: ReactNode; query?: Record<string,string | string[] | undefined> }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const rankingPrefix = ko ? '/ko' : '';
  const search = new URLSearchParams();
  for (const key of ['city','kind','order','stage','area','deposit','beds']) {
    const value = query[key];
    if (typeof value === 'string') search.set(key,value);
  }
  const currentHref = `${prefix}/rankings/${search.size ? `?${search}` : ''}`;
  const header = {
    ...homepageCopy.header,
    homeHref: `${prefix}/`,
    languageLabel: ko ? 'KO' : zh ? 'ZH' : 'EN',
    languageSwitch: ko || zh
      ? { label: 'EN', href: '/rankings/', hrefLang: 'en' as const }
      : { label: 'KO', href: '/ko/rankings/', hrefLang: 'ko' as const },
    links: [{ label: ko ? '순위' : zh ? '排行榜' : 'Rankings', href: currentHref, isCurrent: true }],
  };
  return <div id="top" lang={locale}>
    <SiteHeader copy={header} />
    <main className={frame.main}>
      <header className={styles.pageHeading}><h1>{ko ? '가격 순위' : zh ? '房产价格排行' : 'Property rankings'}</h1><Link href={`${prefix}/guides/`}>{ko ? '읽는 방법' : zh ? '阅读指南' : 'How to read'}</Link></header>
      {children}
      <details className={styles.method}><summary>{ko ? '건물·단지별 비교 더 보기' : zh ? '更多楼宇与项目比较' : 'More building and project comparisons'}</summary><nav className={styles.moreLinks} aria-label="Additional ranking comparisons">
        <Link href={`${rankingPrefix}/kr/seoul/rankings/`}>{ko ? '서울 · 건물별 매매·전세·월세' : zh ? '首尔 · 楼宇买卖与租金' : 'Seoul · buildings — Sale, jeonse and rent by building'}</Link>
        <Link href={`${prefix}/sg/singapore/rankings/`}>{ko ? '싱가포르 · 단지별 가격' : zh ? '新加坡 · 项目价格' : 'Singapore · project prices'}</Link>
        <Link href={`${prefix}/jp/tokyo/explore/`}>{ko ? '도쿄 · 지역별 거래' : zh ? '东京 · 区域成交' : 'Tokyo · area transactions'}</Link>
      </nav></details>
    </main>
    <SiteFooter copy={homepageCopy.footer} locale={locale} />
  </div>;
}
