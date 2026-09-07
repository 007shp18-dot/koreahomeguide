import Image from 'next/image';
import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import { PassportEntry } from '@/components/passport/passport-entry';
import { createThreeMarketHomeModel } from '@/lib/home/three-market-home-model';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import styles from './editorial-growth-home.module.css';

const COPY = {
  en: { markets: 'Explore a city', analysis: 'Latest analysis', all: 'View all', read: 'Read analysis', guides: 'Buying & renting guides', method: 'How our data works', resources: 'Useful links', cities: { 'kr-seoul': 'Seoul', 'sg-singapore': 'Singapore', 'ae-dubai': 'Dubai' } },
  'zh-CN': { markets: '探索城市', analysis: '最新分析', all: '查看全部', read: '阅读分析', guides: '购房与租房指南', method: '了解数据来源', resources: '实用链接', cities: { 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜' } },
} as const;

export function EditorialGrowthHome({ model }: Readonly<{
  model: EditorialGrowthReviewModel;
  hrefs?: Readonly<{ content: string; check: string; explore: string }>;
}>) {
  const copy = COPY[model.locale];
  const prefix = model.locale === 'en' ? '' : '/zh-cn';
  const markets = createThreeMarketHomeModel({ locale: model.locale, seoulMetric: model.headlineMetric }).markets;
  const research = listPortfolioRecords(model.locale)
    .filter(({ type }) => type === 'data-story' || type === 'market-brief')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // Lead with the newest available analysis for each city, then fill any remaining slots.
  const cityResearch = markets.flatMap(({ id }) => {
    const article = research.find(({ marketId }) => marketId === id);
    return article ? [article] : [];
  });
  const featuredResearch = [...cityResearch, ...research.filter(article => !cityResearch.includes(article))]
    .slice(0, 3).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return <main className={styles.homePage}>
    <PassportEntry locale={model.locale} />
    <section className={styles.section} data-home-region="markets" aria-labelledby="home-markets-title">
      <h2 id="home-markets-title">{copy.markets}</h2>
      <ol className={styles.marketGrid}>
        {markets.map(market => <li className={styles.marketCard} key={market.id} data-market-id={market.id} data-contextual-action={market.id}>
          <div className={styles.photo}>
            <Image src={market.photo.src} alt={market.photo.alt} fill sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1168px) 33vw, 360px" style={{ objectPosition: `${market.photo.focalPoint.x}% ${market.photo.focalPoint.y}%` }} />
          </div>
          <div className={styles.marketBody}>
            <h3>{market.city}</h3>
            <p>{market.summary}</p>
            <Link href={market.primaryAction.href} className={styles.marketAction} data-primary-action="explore" aria-label={`${market.primaryAction.label} ${market.city}`}>
              {market.primaryAction.label}<span aria-hidden="true">↗</span>
            </Link>
          </div>
        </li>)}
      </ol>
    </section>
    <section className={styles.section} data-home-region="analysis" data-home-section="insight" aria-labelledby="home-analysis-title">
      <div className={styles.sectionHeading}>
        <h2 id="home-analysis-title">{copy.analysis}</h2>
        <Link href={`${prefix}/news/?type=analysis`}>{copy.all}<span aria-hidden="true"> →</span></Link>
      </div>
      <ol className={styles.researchGrid}>
        {featuredResearch.map(article => <li key={article.id} className={styles.researchCard}
          data-editorial-content-id={article.id} data-editorial-content-type={article.type}
          data-editorial-locale={article.locale} data-editorial-market={article.marketId}>
          <p className={styles.meta}><span>{article.marketId !== null && article.marketId in copy.cities ? copy.cities[article.marketId as keyof typeof copy.cities] : 'Global'}</span><time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></p>
          <h3><Link href={article.canonicalHref} data-editorial-event="article_open">{article.title}</Link></h3>
          <p className={styles.deck}>{article.deck}</p>
        </li>)}
      </ol>
      <nav className={styles.resources} aria-label={copy.resources}>
        <Link href={`${prefix}/guides/`}>{copy.guides}<span aria-hidden="true"> →</span></Link>
        <Link href="/trust/">{copy.method}<span aria-hidden="true"> →</span></Link>
      </nav>
    </section>
  </main>;
}
