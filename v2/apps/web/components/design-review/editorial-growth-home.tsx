import Image from 'next/image';
import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { PassportEntry } from '@/components/passport/passport-entry';
import { HomeSearch } from '@/components/home/home-search';
import { createThreeMarketHomeModel } from '@/lib/home/three-market-home-model';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import styles from './editorial-growth-home.module.css';

const COPY = {
  en: { title: 'Somewhere worth knowing.', lead: 'Discover the homes. Understand the price.', markets: 'Explore a city', analysis: 'Latest insights', all: 'View all', guides: 'Buying & renting guides', method: 'Sources & methodology', resources: 'Useful links', rankLabel: 'THE PRICE LIST', rankTitle: 'The upper end.', rankNote: 'Compare recorded price levels, with the evidence behind them.', rankAction: 'View rankings', newsLabel: 'NEWS & INSIGHTS', newsTitle: 'Look a little closer.', newsNote: 'Market stories, with the numbers behind them.', newsAction: 'Read the latest', cities: { 'kr-seoul': 'Seoul', 'sg-singapore': 'Singapore', 'ae-dubai': 'Dubai', 'jp-tokyo': 'Tokyo' } },
  ko: { title: '살고 싶은 곳, 알고 싶은 가격.', lead: '집을 살펴보고, 실거래로 가격을 이해하세요.', markets: '도시 탐색', analysis: '최근 인사이트', all: '전체 보기', guides: '매입·임대 가이드', method: '데이터 출처·방법론', resources: '관련 정보', rankLabel: '가격 랭킹', rankTitle: '높은 가격부터.', rankNote: '공개된 거래 근거와 함께 지역별 가격을 비교하세요.', rankAction: '랭킹 보기', newsLabel: '뉴스·인사이트', newsTitle: '한 걸음 더 자세히.', newsNote: '숫자로 읽는 부동산 시장 이야기.', newsAction: '최근 글 보기', cities: { 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' } },
  'zh-CN': { title: '发现值得了解的家。', lead: '探索住宅，读懂成交价格。', markets: '探索城市', analysis: '最新洞察', all: '查看全部', guides: '购房与租房指南', method: '数据来源与方法', resources: '实用链接', rankLabel: '价格排行', rankTitle: '从高价开始。', rankNote: '依据已公布的成交资料比较价格水平。', rankAction: '查看排行 · English', newsLabel: '新闻与洞察', newsTitle: '再看深一步。', newsNote: '读懂市场故事背后的数字。', newsAction: '阅读最新内容', cities: { 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' } },
} as const;
const COUNTRIES = { 'kr-seoul': 'SOUTH KOREA', 'sg-singapore': 'SINGAPORE', 'ae-dubai': 'UNITED ARAB EMIRATES', 'jp-tokyo': 'JAPAN' } as const;
const KOREAN_SUMMARY = { 'kr-seoul': '매매·전세·월세', 'sg-singapore': '민간 주택·HDB', 'ae-dubai': '완공·분양 주택', 'jp-tokyo': '지역별 분기 거래 · 영문' } as const;

export function EditorialGrowthHome({ model }: Readonly<{
  model: Pick<EditorialGrowthReviewModel, 'locale'>;
  hrefs?: Readonly<{ content: string; check: string; explore: string }>;
}>) {
  return <PropertyHome locale={model.locale} />;
}

export function PropertyHome({ locale }: Readonly<{ locale: SiteLocale }>) {
  const copy = COPY[locale];
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  const markets = createThreeMarketHomeModel({ locale: locale === 'zh-CN' ? locale : 'en', seoulMetric: null }).markets;
  const research = listPortfolioRecords(locale)
    .filter(({ type }) => type === 'data-story' || type === 'market-brief')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const cityResearch = markets.flatMap(({ id }) => {
    const article = research.find(({ marketId }) => marketId === id);
    return article ? [article] : [];
  });
  const featuredResearch = [...cityResearch, ...research.filter(article => !cityResearch.includes(article))]
    .slice(0, 3).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return <main className={styles.homePage}>
    <section className={`${styles.section} ${styles.hero}`} aria-labelledby="home-title">
      <p className={styles.kicker}>SEOUL / SINGAPORE / DUBAI / TOKYO</p>
      <h1 id="home-title">{copy.title}</h1>
      <div className={styles.heroBottom}><p>{copy.lead}</p><HomeSearch locale={locale} /></div>
    </section>
    <section className={`${styles.section} ${styles.cities}`} data-home-region="markets" aria-label={copy.markets}>
      <ol className={styles.marketGrid}>
        {markets.map(market => {
          const city = copy.cities[market.id];
          const href = `${locale === 'ko' && market.id !== 'jp-tokyo' ? '/ko' : ''}${market.primaryAction.href}`;
          return <li className={styles.marketCard} key={market.id} data-market-id={market.id} data-contextual-action={market.id}>
            <Link href={href} className={styles.cityLink} prefetch={false} data-primary-action="explore" aria-label={`${locale === 'ko' ? '탐색' : 'Explore'} ${city}`}>
              <div className={styles.photo}><Image src={market.photo.src} alt={market.photo.alt} fill
                sizes="(max-width: 700px) 46vw, (max-width: 1416px) 23vw, 314px" style={{ objectPosition: `${market.photo.focalPoint.x}% ${market.photo.focalPoint.y}%` }} />
                <span>{COUNTRIES[market.id]}</span>
              </div>
              <div className={styles.marketBody}><h3>{city}</h3><span aria-hidden="true">↗</span></div>
              <p>{locale === 'ko' ? KOREAN_SUMMARY[market.id] : market.summary}</p>
            </Link>
          </li>;
        })}
      </ol>
    </section>
    <section className={`${styles.section} ${styles.featureLinks}`} aria-label={locale === 'ko' ? '랭킹과 인사이트' : 'Rankings and insights'}>
      <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/rankings/`}><span className={styles.kicker}>{copy.rankLabel}</span><h2>{copy.rankTitle}</h2><p>{copy.rankNote}</p><span className={styles.underLink}>{copy.rankAction}<span aria-hidden="true">→</span></span></Link>
      <Link href={`${prefix}/news/`}><span className={styles.kicker}>{copy.newsLabel}</span><h2>{copy.newsTitle}</h2><p>{copy.newsNote}</p><span className={styles.underLink}>{copy.newsAction}<span aria-hidden="true">→</span></span></Link>
    </section>
    <section className={styles.section} data-home-region="analysis" data-home-section="insight" aria-labelledby="home-analysis-title">
      <div className={styles.sectionHeading}><h2 id="home-analysis-title">{copy.analysis}</h2><Link href={`${prefix}/news/`}>{copy.all}<span aria-hidden="true"> →</span></Link></div>
      <ol className={styles.researchGrid}>
        {featuredResearch.map(article => <li key={article.id} className={styles.researchCard}
          data-editorial-content-id={article.id} data-editorial-content-type={article.type}
          data-editorial-locale={article.locale} data-editorial-market={article.marketId}>
          <p className={styles.meta}><span>{article.marketId !== null && article.marketId in copy.cities ? copy.cities[article.marketId as keyof typeof copy.cities] : 'Global'}</span><time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></p>
          <h3><Link href={article.canonicalHref} data-editorial-event="article_open">{article.title}</Link></h3>
          <p className={styles.deck}>{article.deck}</p>
        </li>)}
      </ol>
    </section>
    <div className={styles.passport}><PassportEntry locale={locale} headingLevel={2} /></div>
    <nav className={`${styles.section} ${styles.resources}`} aria-label={copy.resources}>
      <Link href={`${prefix}/guides/`}>{copy.guides}<span aria-hidden="true"> →</span></Link>
      <Link href="/trust/">{copy.method}<span aria-hidden="true"> →</span></Link>
    </nav>
  </main>;
}
