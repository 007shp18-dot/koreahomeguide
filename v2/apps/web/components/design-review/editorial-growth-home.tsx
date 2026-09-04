import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '@/components/market-representative-photo';
import styles from './editorial-growth-review.module.css';

const COPY = Object.freeze({
  en: {
    eyebrow: 'Korea rental intelligence',
    title: 'Understand the real cost of renting in Korea.',
    lead: 'Reported contracts, clear comparison boundaries, and practical guides for decisions made from abroad.',
    primary: 'Check a price',
    secondary: 'Explore Seoul',
    evidence: 'Current evidence',
    markets: 'Choose a market',
    marketsTitle: 'Property intelligence across three cities',
    marketItems: [
      { index: '01', name: 'Seoul', href: '/kr/seoul/', scope: 'Sale, jeonse and monthly-rent evidence', state: 'Full decision tools' },
      { index: '02', name: 'Singapore', href: '/sg/', scope: 'Private homes and HDB evidence', state: 'Transaction data live' },
      { index: '03', name: 'Dubai', href: '/ae/dubai/', scope: 'Market structure and decision context', state: 'Data-rights work in progress' },
    ],
    insight: 'Latest from the data desk',
    guides: 'Start with the essentials',
    guidesTitle: 'Guides for renting and buying',
    method: 'How this evidence works',
    methodBody: 'SignedPrice separates reported contract evidence from editorial explanation. Period, sample, and publication limits stay visible wherever a figure appears.',
    unavailable: 'Official Seoul evidence is temporarily unavailable.',
    read: 'Read report',
  },
  'zh-CN': {
    eyebrow: '韩国租房数据指南',
    title: '在韩国租房前，先看真实成交依据。',
    lead: '把已申报合同、可比范围和实用指南放在同一条决策路径上，帮助海外用户判断。',
    primary: '查询价格',
    secondary: '探索首尔',
    evidence: '当前数据',
    markets: '选择市场',
    marketsTitle: '覆盖三个城市的房地产信息',
    marketItems: [
      { index: '01', name: '首尔 Seoul', href: '/kr/seoul/', scope: '买卖、全租和月租成交数据', state: '完整决策工具' },
      { index: '02', name: '新加坡 Singapore', href: '/sg/', scope: '私人住宅与 HDB 数据', state: '成交数据已上线' },
      { index: '03', name: '迪拜 Dubai', href: '/ae/dubai/', scope: '市场结构与决策背景', state: '数据展示权仍在确认' },
    ],
    insight: '数据编辑部最新文章',
    guides: '从基础指南开始',
    guidesTitle: '韩国租房与购房指南',
    method: '这些数据如何使用',
    methodBody: 'SignedPrice 将已申报合同数据与编辑说明分开。每个数字旁边都会显示期间、样本和发布限制。',
    unavailable: '首尔官方数据暂时无法使用。',
    read: '阅读报告',
  },
});

export function EditorialGrowthHome({ model, hrefs }: Readonly<{
  model: EditorialGrowthReviewModel;
  hrefs?: Readonly<{ content: string; check: string; explore: string }>;
}>) {
  const copy = COPY[model.locale];
  const query = `locale=${model.locale}&state=${model.state}&ad=${model.ad}`;
  const links = hrefs ?? {
    content: `/design-review/editorial-growth/content/?${query}`,
    check: `/design-review/editorial-growth/check/?${query}`,
    explore: `/design-review/editorial-growth/explore/?${query}`,
  };

  return (
    <main className={styles.homePage}>
      <section className={styles.homeHero}>
        <div className={styles.homeHeroCopy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.display}>{copy.title}</h1>
          <p className={`${styles.lead} ${styles.homeLead}`}>{copy.lead}</p>
          <div className={styles.heroActions}>
            <Link
              className={styles.primaryAction}
              data-primary-action="check"
              href={links.check}
            >
              {copy.primary}
            </Link>
            <Link className={styles.textAction} href={links.explore}>
              {copy.secondary}<span aria-hidden="true"> ↗</span>
            </Link>
          </div>
        </div>
        <div className={styles.homeHeroMedia} data-home-hero-media="market-photo">
          <MarketRepresentativePhoto photo={MARKET_PHOTOS.seoul} eager />
          <p>Seoul · Residential market</p>
        </div>
      </section>

      <section className={styles.evidenceStrip} aria-labelledby="home-evidence-title">
        <div>
          <p className={styles.eyebrow}>{model.seoulStatus}</p>
          <h2 className={styles.subheading} id="home-evidence-title">{copy.evidence}</h2>
        </div>
        {model.headlineMetric ? (
          <dl className={styles.headlineMetric}>
            <div>
              <dt>{model.headlineMetric.label}</dt>
              <dd>{model.headlineMetric.value}</dd>
            </div>
            <p>{model.headlineMetric.context}</p>
          </dl>
        ) : (
          <p className={styles.evidenceUnavailable}>{copy.unavailable}</p>
        )}
      </section>

      <section className={styles.marketSection} data-home-section="markets" aria-labelledby="home-markets-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>{copy.markets}</p>
          <h2 className={styles.sectionTitle} id="home-markets-title">{copy.marketsTitle}</h2>
        </div>
        <ol className={styles.marketIndex}>
          {copy.marketItems.map((market) => (
            <li key={market.href}>
              <Link href={market.href}>
                <span className={styles.marketNumber}>{market.index}</span>
                <strong>{market.name}</strong>
                <span>{market.scope}</span>
                <small>{market.state}</small>
                <span className={styles.marketArrow} aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.homeInsight} data-home-section="insight" aria-labelledby="home-insight-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>{copy.insight}</p>
          <h2 className={styles.sectionTitle} id="home-insight-title">{model.article.title}</h2>
        </div>
        <div className={styles.insightBody}>
          <p className={styles.lead}>{model.article.summary}</p>
          <p className={styles.articleMeta}>{model.article.market} · Updated {model.article.updated}</p>
          <Link className={styles.textAction} href={links.content}>
            {copy.read}<span aria-hidden="true"> →</span>
          </Link>
        </div>
      </section>

      <section className={styles.guideSection} aria-labelledby="home-guides-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>{copy.guides}</p>
          <h2 className={styles.sectionTitle} id="home-guides-title">{copy.guidesTitle}</h2>
        </div>
        <ol className={styles.guideList}>
          {model.guides.slice(0, 5).map((guide) => (
            <li key={guide.href}>
              <Link href={guide.href}>
                <span className={styles.guideStage}>{guide.stage}</span>
                <strong>{guide.title}</strong>
                <span>{guide.summary}</span>
                <small>Updated {guide.updated}</small>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.methodNote} aria-labelledby="home-method-title">
        <p className={styles.eyebrow}>Method &amp; provenance</p>
        <h2 className={styles.subheading} id="home-method-title">{copy.method}</h2>
        <p>{copy.methodBody}</p>
      </section>
    </main>
  );
}
