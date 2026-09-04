import Link from 'next/link';

import { editorialMarketLabel, type EditorialArticle } from '../../lib/insights/editorial-content';
import { EditorialMarkdown } from './editorial-markdown';
import styles from './insights.module.css';

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

export function InsightsArticle({ article }: Readonly<{ article: EditorialArticle }>) {
  return (
    <main className={styles.main}>
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
          <div className={styles.byline}><strong>SignedPrice Data Desk</strong><time dateTime={article.publishedAt}>{date.format(new Date(article.publishedAt))}</time></div>
        </header>
        <div className={styles.documentLayout}>
          <EditorialMarkdown source={article.bodyMarkdown} />
          <aside className={styles.documentRail}>
            <p>How to read this report</p>
            <strong>Evidence before conclusion.</strong>
            <p>Check the market, period, property type and sample boundary before applying a statement to one property.</p>
            <Link href="/trust/">Read methodology →</Link>
          </aside>
        </div>
      </article>
      <nav className={styles.articleActions} aria-label="Related SignedPrice products">
        <Link href="/prices/">Explore prices</Link><Link href="/news/">Read external news</Link><Link href="/insights/">All reports</Link>
      </nav>
    </main>
  );
}
