import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { cityPhotoLabel } from '@/lib/content/article-photo';
import { homeArticlePhoto } from '@/lib/home/home-article-photo';
import type { EditorialPortfolioRecord } from '../content/portfolio-types';
import { getPortfolioRecord } from '@/content/portfolio-manifest';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import defaultStyles from './design-review/editorial-growth-home.module.css';

const reports = ['seoul-monthly-2026-09', 'singapore-monthly-2026-09', 'dubai-monthly-2026-09'] as const;
const copy = {
  en: { heading: 'Latest analysis', lead: 'New perspectives on prices, ownership costs and your next move.', read: 'Read the analysis', all: 'All insights', published: 'Published', cities: ['Seoul', 'Singapore', 'Dubai'] },
  ko: { heading: '새로 나온 분석', lead: '거래가격과 주거비용을 읽고, 다음에 확인할 조건을 찾아보세요.', read: '분석 읽기', all: '인사이트 전체 보기', published: '발행', cities: ['서울', '싱가포르', '두바이'] },
  'zh-CN': { heading: '最新分析', lead: '比较各地区的成交变化，区分交易活跃度与价格变化，并说明看房时需要核实的事项。', read: '阅读分析', all: '全部洞察', published: '发布', cities: ['首尔', '新加坡', '迪拜'] },
};

export function HomeAnalysis({ locale, articles: latest, classNames: styles = defaultStyles }: { locale: SiteLocale; articles?: readonly EditorialPortfolioRecord[]; classNames?: typeof defaultStyles }) {
  const text = copy[locale];
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const cityNames = locale === 'ko' ? ['서울', '싱가포르', '두바이', '도쿄'] : locale === 'zh-CN' ? ['首尔', '新加坡', '迪拜', '东京'] : ['Seoul', 'Singapore', 'Dubai', 'Tokyo'];
  const ids = ['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'];
  const articles = latest ? latest.slice(0, 3).map(record => ({ record, city: cityNames[ids.indexOf(record.marketId ?? '')] ?? '' })) : reports.flatMap((slug, index) => {
    const record = getPortfolioRecord(locale, slug);
    return record ? [{ record, city: text.cities[index] }] : [];
  });
  if (!articles.length) return null;
  return <section className={`${styles.section} ${styles.analysis}`} aria-labelledby="home-analysis-title" data-home-region="analysis">
    <div className={styles.analysisHeading}><div><h2 id="home-analysis-title">{text.heading}</h2><p>{text.lead}</p></div><Link href={`${prefix}/news/`}>{text.all} →</Link></div>
    <div className={styles.analysisGrid}>{articles.map(({ record, city }) => { const photo = homeArticlePhoto(record); return <article key={record.id} lang={record.locale} data-editorial-content-id={record.id}>
      {photo && <Link className={styles.articlePhoto} href={record.canonicalHref} aria-hidden="true" tabIndex={-1}><Image src={photo.src} alt={photo.alt ?? ""} unoptimized={!photo.src.startsWith("/assets/")} fill sizes="(max-width: 760px) 104px, 25vw" style={{objectFit: photo.portrait ? 'contain' : 'cover'}} /></Link>}
      {photo?.context === 'city' && <small data-photo-context="city">{cityPhotoLabel(locale)}</small>}
      {photo?.context === 'property' && photo.credit && <small data-photo-context="property"><a href={photo.credit.source}>{photo.alt} · {photo.credit.author}</a></small>}
      <p className={styles.kicker}>{city}{record.locale !== locale ? ' · English' : ''} · <time dateTime={record.publishedAt}>{text.published} {new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale === 'ko' ? 'ko-KR' : 'zh-CN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(record.publishedAt))}</time></p>
      <h3><Link href={record.canonicalHref}>{record.title}</Link></h3>
      <p>{record.deck}</p>
      <Link className={styles.analysisLink} href={record.canonicalHref}>{text.read} →</Link>
    </article>; })}</div>
  </section>;
}
