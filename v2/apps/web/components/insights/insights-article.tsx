import Link from 'next/link';

import { editorialMarketLabel, type EditorialArticle } from '../../lib/insights/editorial-content';
import { EditorialMarkdown } from './editorial-markdown';
import styles from './insights.module.css';

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

const marketActions = {
  seoul: [
    { label: 'Explore Seoul evidence', href: '/kr/seoul/explore/' },
    { label: 'Check a Seoul price', href: '/kr/seoul/check/' },
    { label: 'Use the Korea guides', href: '/kr/seoul/guide/' },
  ],
  singapore: [
    { label: 'Explore Singapore evidence', href: '/sg/singapore/explore/' },
    { label: 'Check a Singapore price', href: '/sg/singapore/check/' },
    { label: 'Compare Singapore areas', href: '/sg/singapore/rankings/' },
  ],
  dubai: [
    { label: 'Explore Dubai evidence', href: '/ae/dubai/explore/' },
    { label: 'Check a Dubai price', href: '/ae/dubai/check/' },
    { label: 'Use the Dubai purchase guide', href: '/ae/dubai/guide/' },
  ],
  global: [
    { label: 'Choose a market', href: '/markets/' },
    { label: 'Explore available prices', href: '/prices/' },
  ],
} as const;

export function InsightsArticle({ article }: Readonly<{ article: EditorialArticle }>) {
  const relatedActions = article.marketKey === null ? marketActions.global : marketActions[article.marketKey];
  return (
    <main className={styles.main} data-editorial-content-id={`en:${article.slug}`} data-editorial-content-type="market-brief" data-editorial-locale="en" data-editorial-market={article.marketKey === 'seoul' ? 'kr-seoul' : article.marketKey === 'singapore' ? 'sg-singapore' : article.marketKey === 'dubai' ? 'ae-dubai' : 'global'}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/insights/">Insights</Link><span aria-hidden="true">/</span><span>{editorialMarketLabel(article.marketKey)}</span>
      </nav>
      <article className={styles.document}>
        <header className={styles.documentHero}>
          <div className={styles.articleMeta}>
            <span>{editorialMarketLabel(article.marketKey)}</span><span>Analysis</span><span>{article.readMinutes} min read</span>
          </div>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
          <div className={styles.byline}><strong>Published by SignedPrice</strong><time dateTime={article.publishedAt}>{date.format(new Date(article.publishedAt))}</time></div>
        </header>
        <div className={styles.documentLayout}>
          <div>
            <EditorialMarkdown source={article.bodyMarkdown} />
            {article.sources.length > 0 ? (
              <section className={styles.sources} aria-labelledby="article-sources">
                <h2 id="article-sources">Sources and verification date</h2>
                <ul>
                  {article.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} rel="noreferrer">{source.publisher} · {source.label}</a>
                      <span>Checked {source.checkedAt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          <aside className={styles.documentRail}>
            <p>How to read this report</p>
            <strong>Evidence before conclusion.</strong>
            <p>Check the market, period, property type and sample boundary before applying a statement to one property.</p>
            <Link href="/trust/">Read methodology →</Link>
          </aside>
        </div>
      </article>
      <nav className={styles.articleActions} aria-label="Related SignedPrice products">
        {relatedActions.map((action) => <Link href={action.href} key={action.href} data-editorial-event={action.href.includes('/check/') ? 'article_to_check' : action.href.includes('/explore/') ? 'article_to_explore' : undefined}>{action.label}</Link>)}
        <Link href="/insights/">All reports</Link>
      </nav>
    </main>
  );
}
