import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import styles from './editorial-growth-review.module.css';

const COPY = Object.freeze({
  en: {
    eyebrow: 'SignedPrice Journal',
    title: 'Property evidence, explained.',
    lead: 'Original reporting and practical guides for cross-border renters and buyers.',
    featured: 'Lead report',
    latest: 'More from the desk',
    desk: 'SignedPrice Data Desk',
    published: 'Published',
    updated: 'Updated',
    method: 'Source & method',
    methodBody: 'Figures remain tied to their named market, reporting period, and compatible cohort. A market median is context, not an individual valuation.',
    action: 'Check this market',
    minutes: 'min read',
  },
  'zh-CN': {
    eyebrow: 'SignedPrice 专栏',
    title: '在韩国租房前，先看真实成交依据',
    lead: '面向跨境租客与买家的原创报道和实用指南。',
    featured: '重点报告',
    latest: '数据编辑部更多文章',
    desk: 'SignedPrice 数据编辑部',
    published: '发布于',
    updated: '更新于',
    method: '来源与方法',
    methodBody: '所有数字都对应明确的市场、申报期间和可比样本。市场中位数只提供背景，不是单套住宅估值。',
    action: '查询这个市场',
    minutes: '分钟阅读',
  },
});

const FILTERS = Object.freeze({
  en: Object.freeze(['Renting', 'Buying', 'Neighborhoods', 'Market data']),
  'zh-CN': Object.freeze(['租房', '购房', '社区', '市场数据']),
});

export function EditorialGrowthContent({ model }: Readonly<{ model: EditorialGrowthReviewModel }>) {
  const copy = COPY[model.locale];
  const firstSection = model.article.sections[0];
  const remainingSections = model.article.sections.slice(1);
  const query = `locale=${model.locale}&state=${model.state}&ad=${model.ad}`;

  return (
    <main className={styles.contentPage}>
      <header className={styles.contentMasthead}>
        <div>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.display}>{copy.title}</h1>
        </div>
        <p className={`${styles.lead} ${styles.contentLead}`}>{copy.lead}</p>
      </header>

      <nav className={styles.topicNav} aria-label="Editorial topics">
        {FILTERS[model.locale].map((filter, index) => (
          <button aria-pressed={index === 0} className={styles.controlText} key={filter} type="button">
            {filter}
          </button>
        ))}
      </nav>

      <section className={styles.reportIndex} aria-labelledby="lead-report-title">
        <article className={styles.leadReport}>
          <p className={styles.eyebrow}>{copy.featured} · {model.article.market}</p>
          <h2 className={styles.sectionTitle} id="lead-report-title">{model.article.title}</h2>
          <p className={styles.lead}>{model.article.summary}</p>
          <p className={styles.articleMeta}>{copy.updated} {model.article.updated} · {model.article.readMinutes} {copy.minutes}</p>
        </article>
        <aside className={styles.latestReports} aria-labelledby="latest-reports-title">
          <h2 className={styles.subheading} id="latest-reports-title">{copy.latest}</h2>
          <ol>
            {model.articles.filter((article) => article.title !== model.article.title).slice(0, 4).map((article) => (
              <li key={`${article.market}-${article.title}`}>
                <span>{article.market} · {copy.updated} {article.updated}</span>
                <strong>{article.title}</strong>
                <small>{article.readMinutes} {copy.minutes}</small>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <article className={styles.articleFeature} data-content-region="article">
        <header className={`${styles.readingColumn} ${styles.articleHeader}`}>
          <p className={styles.eyebrow}>{model.article.market} · Analysis</p>
          <h2 className={styles.sectionTitle}>{model.article.title}</h2>
          <p className={styles.lead}>{model.article.summary}</p>
          <div className={styles.bylineRow}>
            <strong>{copy.desk}</strong>
            <span>{copy.published} {model.article.published}</span>
            <span>{copy.updated} {model.article.updated}</span>
          </div>
        </header>

        <div className={`${styles.readingColumn} ${styles.articleBody}`} data-article-body>
          {firstSection ? (
            <section>
              <h3 className={styles.subheading}>{firstSection.heading}</h3>
              <p data-article-paragraph="1">{firstSection.body}</p>
            </section>
          ) : null}

          <aside
            className={model.ad === 'loaded' ? styles.adSlot : styles.adSlotEmpty}
            data-ad-slot="article-1"
            data-ad-state={model.ad}
          >
            {model.ad === 'loaded' ? <span>Advertisement</span> : null}
          </aside>

          <aside className={styles.sourceNote}>
            <strong>{copy.method}</strong>
            <p>{copy.methodBody}</p>
          </aside>

          {remainingSections.map((section) => (
            <section key={section.heading}>
              <h3 className={styles.subheading}>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}

          <Link className={styles.primaryAction} href={`/design-review/editorial-growth/check/?${query}`}>
            {copy.action}
          </Link>
        </div>
      </article>
    </main>
  );
}
