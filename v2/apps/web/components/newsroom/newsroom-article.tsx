import Link from 'next/link';
import { EditorialMarkdown } from '../insights/editorial-markdown';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { RESEARCH_FIGURES } from '../../content/en/research-figures';
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
  return body.split(/(?=^## )/mu).map(block => {
    const text = block.trim();
    if (!text.startsWith('## ')) return { heading: '', body: text };
    const end = text.indexOf('\n');
    return { heading: text.slice(3, end < 0 ? undefined : end).trim(), body: end < 0 ? '' : text.slice(end).trim() };
  }).filter(section => section.body.length > 0);
}

export function NewsroomArticle({ article }: Readonly<{
  article: PublishedContentArticle & Readonly<{ infographic?: InfographicSpec | null }>;
}>) {
  const figure = article.infographic ?? (article.locale === 'en' ? RESEARCH_FIGURES[article.slug] : undefined);
  const contentSections = sections(article.bodyMarkdown);
  const section = article.type === 'guide'
    ? { label: 'Guides', href: '/guides/' }
    : { label: 'News', href: '/news/' };
  const market = article.marketId === 'kr-seoul' ? 'Seoul'
    : article.marketId === 'sg-singapore' ? 'Singapore' : article.marketId === 'ae-dubai' ? 'Dubai' : 'Global';
  const reading = article.marketId === 'ae-dubai'
    ? [{ label: 'Property analysis', href: '/news/?type=analysis' }]
    : article.marketId === 'sg-singapore'
    ? [{ label: 'Singapore buying and transaction guide', href: '/guides/read-singapore-private-transactions/' }, { label: 'Singapore market analysis', href: '/news/singapore-private-market-quarterly-brief/' }]
    : [{ label: 'Buying property in Korea', href: '/guides/buy-property-in-korea-as-foreigner/' }, { label: 'Comparing Seoul sale transactions', href: '/guides/read-seoul-sale-transactions/' }];
  const relatedEvent = article.relatedHref?.includes('/check') ? 'article_to_check' : article.relatedHref?.includes('/explore') ? 'article_to_explore' : 'article_open';
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
        <div><dt>Publisher</dt><dd>SignedPrice</dd></div>
        <div><dt>Published</dt><dd><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time></dd></div>
        <div><dt>Sources</dt><dd><a href="#article-sources-title">{article.sources.length} source{article.sources.length === 1 ? '' : 's'}</a></dd></div>
        <div><dt>Updated</dt><dd><time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></dd></div>
      </dl>
    </header>
    {article.type === 'guide' && article.marketId ? <div className={styles.articlePhoto}><MarketRepresentativePhoto context="city" photo={article.marketId === 'kr-seoul' ? MARKET_PHOTOS.seoul : article.marketId === 'sg-singapore' ? MARKET_PHOTOS.singapore : article.marketId === 'ae-dubai' ? MARKET_PHOTOS.dubai : null} cityLabel={market} /></div> : null}
    {figure == null ? null : <Infographic spec={figure} />}
    {contentSections.length < 5 ? null : <nav className={styles.contents} aria-label="In this article"><p>In this article</p>{contentSections.map((item, index) => item.heading ? <a href={`#section-${index + 1}`} key={item.heading}>{item.heading}</a> : null)}</nav>}
    <article className={styles.articleBody}>
      {contentSections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}>{section.heading ? <h2>{section.heading}</h2> : null}<EditorialMarkdown source={section.body} /></section>)}
    </article>
    <section className={styles.sources} aria-labelledby="article-sources-title" data-editorial-event="article_complete">
      <h2 id="article-sources-title">Sources</h2>
      <ol>{article.sources.map((source) => <li key={source.id}><span>{source.kind}</span><a href={source.href} rel="noreferrer" data-editorial-event="policy_source_open">{source.publisher} · {source.title}</a><small>Checked {source.checkedAt.slice(0, 10)}</small></li>)}</ol>
    </section>
    {article.relatedHref === null ? null : <aside className={styles.relatedAction}><p>Related reading and tools</p><Link href={article.relatedHref} data-editorial-event={relatedEvent}>{article.relatedHref.includes('/check') ? 'Check a price' : article.relatedHref.includes('/explore') ? 'Explore transaction records' : article.relatedHref.includes('/tools/') ? 'Open calculator' : 'Read related analysis'}</Link>{reading.filter(({ href }) => !href.endsWith(`/${article.slug}/`)).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</aside>}
  </main>;
}
