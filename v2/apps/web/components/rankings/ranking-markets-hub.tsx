import Link from 'next/link';

import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { ResearchPageHeading } from '../market-ui/research-page-heading';
import { homepageCopy } from '../../lib/site-copy';
import styles from '../global-product-hub.module.css';

type Locale = 'en' | 'ko' | 'zh-CN';

export function RankingMarketsHub({ locale = 'en' }: Readonly<{ locale?: Locale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const rankingPrefix = ko ? '/ko' : ''; // Chinese uses the same English market ranking screens.
  const currentHref = `${prefix}/rankings/`;
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
    <main className={styles.main}>
      <ResearchPageHeading
        title={ko ? '가격 순위' : zh ? '房产成交排行榜' : 'Property price rankings'}
        description={ko
          ? '서울 건물과 싱가포르 단지의 신고 가격을 자료 기간별로 높은 순서부터 비교해 보세요.'
          : zh ? '按公开数据期间，比较首尔楼宇和新加坡项目的申报成交价格。' : 'Compare reported prices across Seoul buildings and Singapore projects, ranked from highest to lowest for each source period.'}
        actions={<Link href={`${prefix}/guides/`}>{ko ? '지역 비교 가이드' : zh ? '如何阅读排行榜' : 'How to read rankings'}</Link>}
      />
      <section className={styles.section} aria-labelledby="ranking-markets-title">
        <div className={styles.sectionHeading}><p>{ko ? '시장별 순위' : zh ? '各市场排行' : 'Market rankings'}</p><h2 id="ranking-markets-title">{ko ? '시장별 실거래를 비교하세요.' : zh ? '按市场比较实际成交。' : 'Compare reported sales by market.'}</h2></div>
        <div className={styles.productGrid}>
          <Link href={`${rankingPrefix}/kr/seoul/rankings/`}><span>{ko ? '서울 · 건물' : zh ? '首尔 · 楼宇' : 'Seoul · buildings'}</span><h3>{ko ? '건물별 매매·전세·월세 중앙값' : zh ? '楼宇买卖、全租与月租' : 'Sale, jeonse and rent by building'}</h3><p>{ko ? '각 순위에 표시된 기간의 국토교통부 신고 자료로 건물별 가격을 비교하고 자치구별 집계도 확인합니다.' : zh ? '根据韩国国土交通部申报记录比较楼宇价格，同时查看区域背景及数据期间。' : 'Compare building prices from MOLIT filings, with district context and the source period shown.'}</p><strong>{ko ? '서울 순위 보기 →' : zh ? '查看首尔排行 →' : 'Open Seoul rankings →'}</strong></Link>
          <Link href={`${rankingPrefix}/sg/singapore/rankings/`}><span>{ko ? '싱가포르 · 단지' : zh ? '新加坡 · 项目' : 'Singapore · projects'}</span><h3>{ko ? '민간주택 단지별 매매 가격' : zh ? '私人住宅项目成交价格' : 'Private home prices by project'}</h3><p>{ko ? '각 순위에 표시된 기간의 URA 신고 자료로 단지 가격과 제곱피트당 가격을 비교합니다.' : zh ? '根据市区重建局申报资料，比较项目成交价格及每平方英尺价格，并显示数据期间。' : 'Compare project prices and prices per square foot from URA filings for the source period shown.'}</p><strong>{ko ? '싱가포르 순위 보기 →' : zh ? '查看新加坡排行 →' : 'Open Singapore rankings →'}</strong></Link>
          <Link href={`${prefix}/jp/tokyo/explore/`}><span>{ko ? '도쿄 · 구와 동네' : zh ? '东京 · 区与街区' : 'Tokyo · wards and neighbourhoods'}</span><h3>{ko ? '공식 주택 거래 살펴보기' : zh ? '查看官方住宅成交记录' : 'Explore official housing transactions'}</h3><p>{ko ? '국토교통성 공개 자료의 구·동네별 주택 거래를 확인하세요. 익명 지역 거래이며 건물별 순위는 아닙니다.' : zh ? '按区和街区查看日本国土交通省住宅成交记录。资料经过匿名处理，不代表楼宇排名。' : 'Review MLIT housing transactions by ward and neighbourhood. These are anonymised area transactions, not building rankings.'}</p><strong>{ko ? '도쿄 거래 보기 →' : zh ? '查看东京成交 →' : 'Open Tokyo transactions →'}</strong></Link>
        </div>
      </section>
    </main>
    <SiteFooter copy={{ ...homepageCopy.footer, descriptor: ko ? '신고 가격 순위와 자료 기간, 집계 범위를 함께 확인할 수 있습니다.' : zh ? '申报成交排行榜，附数据期间和覆盖范围说明。' : 'Reported price rankings with source periods and coverage notes.' }} locale={locale} />
  </div>;
}
