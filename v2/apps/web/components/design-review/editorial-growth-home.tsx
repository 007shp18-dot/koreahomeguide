import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import { ThreeMarketHero } from '@/components/home/three-market-hero';
import { createThreeMarketHomeModel } from '@/lib/home/three-market-home-model';
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
    compareMarkets: 'Compare markets',
    marketItems: [
      { index: '01', name: 'Seoul', href: '/kr/seoul/', scope: 'Sale, jeonse and monthly-rent evidence', state: 'Full decision tools', actions: [
        { label: 'Check', href: '/kr/seoul/check/' }, { label: 'Explore', href: '/kr/seoul/explore/' },
        { label: 'Rankings', href: '/kr/seoul/rankings/' }, { label: 'Guides', href: '/kr/seoul/guide/' },
      ] },
      { index: '02', name: 'Singapore', href: '/sg/', scope: 'Private homes and HDB evidence', state: 'Transaction data live', actions: [
        { label: 'Check', href: '/sg/singapore/check/' }, { label: 'Explore', href: '/sg/singapore/explore/' },
        { label: 'Rankings', href: '/sg/singapore/rankings/' },
      ] },
      { index: '03', name: 'Dubai', href: '/ae/dubai/', scope: 'Market structure and decision context', state: 'Data-rights work in progress', actions: [
        { label: 'Overview', href: '/ae/dubai/' },
      ] },
    ],
    insight: 'Latest from the data desk',
    guides: 'Start with the essentials',
    guidesTitle: 'Guides for renting and buying',
    method: 'How this evidence works',
    methodBody: 'SignedPrice separates reported contract evidence from editorial explanation. Period, sample, and publication limits stay visible wherever a figure appears.',
    unavailable: 'Official Seoul evidence is temporarily unavailable.',
    read: 'Read report',
    updated: 'Updated',
    methodEyebrow: 'Method & provenance',
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
    compareMarkets: '比较市场',
    marketItems: [
      { index: '01', name: '首尔 Seoul', href: '/kr/seoul/', scope: '买卖、全租和月租成交数据', state: '完整决策工具', actions: [
        { label: '查价', href: '/kr/seoul/check/' }, { label: '探索', href: '/kr/seoul/explore/' },
        { label: '排名', href: '/kr/seoul/rankings/' }, { label: '指南', href: '/kr/seoul/guide/' },
      ] },
      { index: '02', name: '新加坡 Singapore', href: '/sg/', scope: '私人住宅与 HDB 数据', state: '成交数据已上线', actions: [
        { label: '查价', href: '/sg/singapore/check/' }, { label: '探索', href: '/sg/singapore/explore/' },
        { label: '排名', href: '/sg/singapore/rankings/' },
      ] },
      { index: '03', name: '迪拜 Dubai', href: '/ae/dubai/', scope: '市场结构与决策背景', state: '数据展示权仍在确认', actions: [
        { label: '概览', href: '/ae/dubai/' },
      ] },
    ],
    insight: '数据编辑部最新文章',
    guides: '从基础指南开始',
    guidesTitle: '韩国租房与购房指南',
    method: '这些数据如何使用',
    methodBody: 'SignedPrice 将已申报合同数据与编辑说明分开。每个数字旁边都会显示期间、样本和发布限制。',
    unavailable: '首尔官方数据暂时无法使用。',
    read: '阅读报告',
    updated: '更新于',
    methodEyebrow: '方法与来源',
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
  const threeMarketHome = createThreeMarketHomeModel({
    locale: model.locale,
    seoulMetric: model.headlineMetric,
  });

  return (
    <main className={styles.homePage}>
      <ThreeMarketHero model={threeMarketHome} />

      <section className={styles.homeInsight} data-home-section="insight" aria-labelledby="home-insight-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>{copy.insight}</p>
          <h2 className={styles.sectionTitle} id="home-insight-title">{model.article.title}</h2>
        </div>
        <div className={styles.insightBody}>
          <p className={styles.lead}>{model.article.summary}</p>
          <p className={styles.articleMeta}>{model.article.market} · {copy.updated} {model.article.updated}</p>
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
                <small>{copy.updated} {guide.updated}</small>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.methodNote} aria-labelledby="home-method-title">
        <p className={styles.eyebrow}>{copy.methodEyebrow}</p>
        <h2 className={styles.subheading} id="home-method-title">{copy.method}</h2>
        <p>{copy.methodBody}</p>
      </section>
    </main>
  );
}
