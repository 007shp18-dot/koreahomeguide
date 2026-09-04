import Link from 'next/link';

import { editorialMarketLabel, type EditorialArticle } from '../../lib/insights/editorial-content';
import styles from './insights.module.css';

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
});

function ArticleCard({ article, index, lead = false }: Readonly<{
  article: EditorialArticle;
  index: number;
  lead?: boolean;
}>) {
  return (
    <article className={lead ? styles.leadCard : styles.articleCard} data-editorial-market={article.marketKey ?? 'global'}>
      <div className={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</div>
      <div className={styles.articleMeta}>
        <span>{editorialMarketLabel(article.marketKey)}</span>
        <span>Analysis</span>
        <time dateTime={article.publishedAt}>{date.format(new Date(article.publishedAt))}</time>
        <span>{article.readMinutes} min</span>
      </div>
      <h2><Link href={`/insights/${article.slug}/`}>{article.title}</Link></h2>
      <p>{article.summary}</p>
      <Link className={styles.readLink} href={`/insights/${article.slug}/`}>Read report →</Link>
    </article>
  );
}

export function InsightsIndex({ articles, activeMarket = 'all' }: Readonly<{
  articles: readonly EditorialArticle[];
  activeMarket?: 'all' | 'global' | 'seoul' | 'singapore' | 'dubai';
}>) {
  const [lead, ...rest] = articles;
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div>
          <p>SignedPrice · Original reporting</p>
          <h1>Property evidence, explained.</h1>
        </div>
        <p>Planned reports, market analysis and field guides written by the SignedPrice data desk. External headlines stay in News; our own reporting lives here.</p>
      </header>

      <nav className={styles.deskNav} aria-label="Editorial desk sections">
        <Link aria-current={activeMarket === 'all' ? 'page' : undefined} href="/insights/">All reports</Link>
        <Link aria-current={activeMarket === 'global' ? 'page' : undefined} href="/insights/?market=global">Global</Link>
        <Link aria-current={activeMarket === 'seoul' ? 'page' : undefined} href="/insights/?market=seoul">Seoul</Link>
        <Link aria-current={activeMarket === 'singapore' ? 'page' : undefined} href="/insights/?market=singapore">Singapore</Link>
        <Link aria-current={activeMarket === 'dubai' ? 'page' : undefined} href="/insights/?market=dubai">Dubai</Link>
        <Link href="/news/">External news</Link>
      </nav>

      {lead === undefined ? (
        <section className={styles.empty}><h2>No published reports yet.</h2><p>Drafts remain private until an editor publishes them.</p></section>
      ) : (
        <>
          <section className={styles.leadSection} aria-label="Lead report">
            <ArticleCard article={lead} index={0} lead />
          </section>
          <section className={styles.reportSection} aria-labelledby="all-reports-heading">
            <div className={styles.sectionHeading}><p>Report ledger</p><h2 id="all-reports-heading">Latest analysis</h2></div>
            <div className={styles.articleGrid}>
              {rest.map((article, index) => <ArticleCard article={article} index={index + 1} key={article.slug} />)}
            </div>
          </section>
        </>
      )}

      <aside className={styles.editorialBoundary}>
        <strong>Editorial boundary</strong>
        <p>SignedPrice reports separate verified transaction evidence, external reporting and interpretation. Missing values are not reconstructed as facts, and published articles retain their source and period boundaries.</p>
      </aside>
    </main>
  );
}
