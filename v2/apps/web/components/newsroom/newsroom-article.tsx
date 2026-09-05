import Link from 'next/link';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { Infographic } from '../infographics/infographic';
import styles from './newsroom.module.css';

const typeLabels = Object.freeze({
  'news-brief': 'News Brief',
  'policy-update': 'Policy Update',
  'market-brief': 'Market Brief',
  'data-story': 'Data Story',
  guide: 'Guide',
});

function sections(body: string): readonly Readonly<{ heading: string; body: string }>[] {
  return Object.freeze(body.split(/^## /mu).map((block) => block.trim()).filter(Boolean).map((block) => {
    const [heading = '', ...bodyParts] = block.split(/\n\n+/u);
    return Object.freeze({ heading, body: bodyParts.join('\n\n') });
  }).filter(({ heading, body: paragraph }) => heading.length > 0 && paragraph.length > 0));
}

export function NewsroomArticle({ article }: Readonly<{
  article: PublishedContentArticle & Readonly<{ infographic?: InfographicSpec | null }>;
}>) {
  const contentSections = sections(article.bodyMarkdown);
  const section = article.type === 'guide'
    ? { label: 'Guides', href: '/guides/' }
    : { label: 'News', href: '/news/' };
  const market = article.marketId === 'kr-seoul' ? 'Seoul'
    : article.marketId === 'sg-singapore' ? 'Singapore' : 'Global';
  const relatedEvent = article.relatedHref?.includes('/check') ? 'article_to_check' : 'article_to_explore';
  return <main
    className={styles.article}
    data-editorial-content-id={article.id}
    data-editorial-content-type={article.type}
    data-editorial-locale={article.locale}
    data-editorial-market={article.marketId ?? undefined}
  >
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={section.href}>{section.label}</Link><span>{typeLabels[article.type]}</span></nav>
    <header className={styles.articleHero}>
      <p>{typeLabels[article.type]} · {market}</p>
      <h1>{article.title}</h1>
      <div className={styles.deck}>{article.deck}</div>
      <dl className={styles.byline}>
        <div><dt>Author</dt><dd>{article.authorName}</dd></div>
        <div><dt>Reviewer</dt><dd>{article.reviewedBy}</dd></div>
        <div><dt>Published</dt><dd><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time></dd></div>
        <div><dt>Updated</dt><dd><time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></dd></div>
      </dl>
    </header>
    <section className={styles.leadEvidence} aria-labelledby="lead-evidence-title">
      <p>Lead evidence</p><h2 id="lead-evidence-title">{article.sources.length} reviewed source{article.sources.length === 1 ? '' : 's'}</h2>
      <span>Evidence state · {article.evidenceState}</span>
    </section>
    <aside className={styles.takeaways} aria-label="Key takeaways">
      {contentSections.slice(0, 3).map((section) => <p key={section.heading} data-article-takeaway="true"><strong>{section.heading}</strong><span>{section.body.split('\n')[0]}</span></p>)}
    </aside>
    {article.infographic == null ? null : <Infographic spec={article.infographic} />}
    <article className={styles.articleBody}>
      {contentSections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.body.split(/\n\n+/u).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
    </article>
    <section className={styles.sources} aria-labelledby="article-sources-title" data-editorial-event="article_complete">
      <h2 id="article-sources-title">Sources and review boundary</h2>
      <ol>{article.sources.map((source) => <li key={source.id}><span>{source.kind}</span><a href={source.href} rel="noreferrer" data-editorial-event="policy_source_open">{source.publisher} · {source.title}</a><small>Checked {source.checkedAt.slice(0, 10)}</small></li>)}</ol>
    </section>
    {article.relatedHref === null ? null : <aside className={styles.relatedAction}><p>Continue with the evidence</p><Link href={article.relatedHref} data-editorial-event={relatedEvent}>Open the related tool <span aria-hidden="true">→</span></Link></aside>}
  </main>;
}
