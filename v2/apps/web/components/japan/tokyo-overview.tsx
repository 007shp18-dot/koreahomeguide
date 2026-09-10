import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '@/components/market-representative-photo';
import { TokyoNavigation } from '@/components/japan/tokyo-navigation';
import TokyoExplorer from '@/components/japan/tokyo-explorer';
import styles from '../../app/(en)/jp/tokyo/tokyo.module.css';
import {tokyoHref,type TokyoLocale} from './tokyo-copy';

type Params = Record<string, string | string[] | undefined>;
export default async function TokyoOverview({ searchParams, locale = 'en' }: { searchParams: Promise<Params>; locale?:TokyoLocale }) {
  const params = await searchParams;
  const href=(path:string)=>tokyoHref(locale,path);
  const text=(en:string,ko:string,zh:string)=>locale==='ko'?ko:locale==='zh-CN'?zh:en;
  // Keep older bookmarked searches functional without losing their filters.
  if (Object.keys(params).some(key => ['q', 'city', 'year', 'quarter', 'type', 'minArea', 'maxArea', 'page', 'release'].includes(key))) {
    return <TokyoExplorer locale={locale} searchParams={Promise.resolve(params)} />;
  }
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, homeHref:locale==='ko'?'/ko/':locale==='zh-CN'?'/zh-cn/':'/',marketLabel: text('Tokyo','도쿄','东京'),languageLabel:locale==='ko'?'KO':locale==='zh-CN'?'ZH':'EN', links: [{ label: 'Overview', href: href('/jp/tokyo/'), isCurrent: true }] }} />
    <main className={styles.main}>
      <div className={styles.overviewHero}>
        <div><p className={styles.eyebrow}>JAPAN / TOKYO</p><h1>{text('Find your part of Tokyo.','내게 맞는 도쿄의 동네를 찾아보세요.','找到适合你的东京社区。')}</h1><p className={styles.intro}>{text('Explore neighbourhoods through recorded prices, home sizes and quarterly sales.','분기별 실거래가와 주택 면적으로 동네를 비교하세요.','通过季度成交价格与住房面积比较社区。')}</p><Link className={styles.exploreAction} href={href('/jp/tokyo/explore/')}>{text('Explore Tokyo','도쿄 탐색','探索东京')}</Link></div>
        <MarketRepresentativePhoto photo={MARKET_PHOTOS.tokyo} context="city" cityLabel="Tokyo" eager />
      </div>
      <TokyoNavigation locale={locale} current="overview" />
      <section className={styles.overviewFacts} aria-label="Tokyo coverage">
        <div><h2>{text('Neighbourhood prices','동네별 실거래가','社区成交价格')}</h2><p>{text('Filter by ward, area, layout and quarter. Each result retains the information disclosed in the source.','구·면적·구조·분기별로 원본에 공개된 거래 정보를 확인하세요.','按区、面积、户型和季度筛选，保留来源公开的信息。')}</p></div>
        <div><h2>{text('Japanese yen','일본 엔화','日元')}</h2><p>{text('Compare recorded purchase prices in JPY. Taxes, financing and other acquisition costs are separate.','엔화 기준 실거래가입니다. 세금·대출·매입 부대비용은 별도로 계산하세요.','以日元比较成交价格，税费、融资和其他购置费用另计。')}</p></div>
        <div><h2>{text('Official transactions','정부 공개 거래','政府公开成交')}</h2><p>{text('MLIT records are anonymous. They are not current listings or identified building sales.','국토교통성 거래 자료는 익명입니다. 현재 매물이나 특정 건물의 거래를 의미하지 않습니다.','国土交通省成交记录匿名公开，不代表在售房源或已识别的楼宇交易。')}</p></div>
      </section>
    </main>
    <SiteFooter locale={locale} copy={homepageCopy.footer} />
  </>;
}
