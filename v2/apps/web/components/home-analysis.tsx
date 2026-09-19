import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { getPortfolioRecord } from '@/content/portfolio-manifest';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import defaultStyles from './design-review/editorial-growth-home.module.css';

const reports = ['seoul-monthly-2026-09', 'singapore-monthly-2026-09', 'dubai-monthly-2026-09'] as const;
const copy = {
  en: { heading: 'What the transactions tell us', lead: 'Our monthly reports compare recorded sales, separate changes in activity from changes in price, and explain what to check next.', read: 'Read the analysis', all: 'All insights', published: 'Published', cities: ['Seoul', 'Singapore', 'Dubai'] },
  ko: { heading: '실거래에서 읽은 시장의 변화', lead: '거래가 늘어난 지역과 가격이 달라진 지역을 구분하고, 집을 비교할 때 확인할 점을 짚었습니다.', read: '분석 읽기', all: '인사이트 전체 보기', published: '발행', cities: ['서울', '싱가포르', '두바이'] },
  'zh-CN': { heading: '成交数据告诉我们什么', lead: '比较各地区的成交变化，区分交易活跃度与价格变化，并说明看房时需要核实的事项。', read: '阅读分析', all: '全部洞察', published: '发布', cities: ['首尔', '新加坡', '迪拜'] },
};

export function HomeAnalysis({ locale, classNames: styles = defaultStyles, photos }: { locale: SiteLocale; classNames?: typeof defaultStyles; photos?: readonly Readonly<{ src: string; alt: string }>[] }) {
  const text = copy[locale];
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const articles = reports.flatMap((slug, index) => {
    const record = getPortfolioRecord(locale, slug);
    return record ? [{ record, city: text.cities[index], photo: photos?.[index] }] : [];
  });
  if (!articles.length) return null;
  return <section className={`${styles.section} ${styles.analysis}`} aria-labelledby="home-analysis-title" data-home-region="analysis">
    <div className={styles.analysisHeading}><div><h2 id="home-analysis-title">{text.heading}</h2><p>{text.lead}</p></div><Link href={`${prefix}/news/`}>{text.all} →</Link></div>
    <div className={styles.analysisGrid}>{articles.map(({ record, city, photo }) => <article key={record.id}>
      {photo ? <div className={styles.analysisPhoto}><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 40vw" style={{ objectFit: 'cover' }} /></div> : null}
      <p className={styles.kicker}>{city} · <time dateTime={record.publishedAt}>{text.published} {new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale === 'ko' ? 'ko-KR' : 'zh-CN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(record.publishedAt))}</time></p>
      <h3><Link href={record.canonicalHref}>{record.title}</Link></h3>
      <p>{record.deck}</p>
      <Link className={styles.analysisLink} href={record.canonicalHref}>{text.read} →</Link>
    </article>)}</div>
  </section>;
}
