import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import type { ReactNode } from 'react';
import { CITY_STORIES, cityStoryHref, type StoryLocale } from '../../content/city-stories';
import { getJourneyArticle, journeyArticleActions, type JourneyArticle as Article } from '../../content/city-journey-articles';
import { SEOUL_NEIGHBORHOODS, STORY_STEPS, journeyArticleHref } from '../../content/city-journey-routes';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import { ArticleContents } from './article-contents';
import { CityStoryPhoto } from './city-story-photo';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import styles from './journey-article.module.css';

// Research copy supports links, without accepting HTML or arbitrary markup.
function InlineCopy({ text }: Readonly<{ text: string }>) {
  const nodes: ReactNode[] = [];
  const links = /\[([^\]]+)\]\((https:\/\/[^\s]+?)\)(?=\s|[.,;:]|$)/g;
  let cursor = 0;
  for (const match of text.matchAll(links)) {
    const index = match.index!;
    if (cursor < index) nodes.push(text.slice(cursor, index));
    nodes.push(<a key={index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>);
    cursor = index + match[0].length;
  }
  nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

export function JourneyArticle({ article, locale }: Readonly<{ article: Article; locale: StoryLocale }>) {
  const ko = locale === 'ko';
  const city = CITY_STORIES.find(story => story.city === article.city)!;
  const step = STORY_STEPS.find(item => item.id === article.id);
  const kind = article.kind === 'local-issue' ? (ko ? '현지 이슈 분석' : 'Local Issues') : article.kind === 'neighborhood' ? (ko ? '동네 선택' : 'Neighbourhood guide') : step!.label[locale];
  const href = journeyArticleHref(article.city, article.id, locale);
  const actions = journeyArticleActions(article, locale);
  const minutes = Math.max(3, Math.ceil(article.sections.flatMap(section => section.paragraphs[locale]).join(' ').length / (ko ? 550 : 1100)));
  const photoScene = article.id === 'where' || article.id === 'which-home' ? 'comparison' : 'neighborhood';
  return <main className={styles.article} lang={locale} data-journey-article={`${article.city}/${article.id}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title[locale], description: article.deck[locale], inLanguage: locale, mainEntityOfPage: publicCanonical(href), author: { '@type': 'Organization', name: 'SignedPrice' }, publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: article.sources.map(source => source.href), isAccessibleForFree: true }) }} />
    <nav className={styles.breadcrumb} aria-label={ko ? '현재 위치' : 'Breadcrumb'}><Link href={`${ko ? '/ko' : ''}/news/?market=${article.city}`}>{ko ? '뉴스 & 인사이트' : 'News & Insights'}</Link><span aria-hidden="true">/</span><Link href={cityStoryHref(article.city, locale)}>{city.name[locale]}</Link><span aria-hidden="true">/</span><span>{kind}</span></nav>
    <header className={styles.header}>
      <p className={styles.eyebrow}>{city.name[locale]} · {kind}</p>
      <h1>{article.title[locale]}</h1><p className={styles.deck}>{article.deck[locale]}</p>
      <div className={styles.meta}><span>SignedPrice</span><span>{ko ? `${minutes}분 읽기` : `${minutes} min read`}</span><a href="#article-sources">{ko ? `출처 ${article.sources.length}개` : `${article.sources.length} sources`}</a></div>
    </header>
    <nav className={styles.stages} aria-label={ko ? '도시 구매 여정' : 'City buying journey'}>{STORY_STEPS.map((item, index) => <Link key={item.id} href={journeyArticleHref(article.city, item.id, locale)} aria-current={item.id === article.id ? 'page' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{item.label[locale]}</Link>)}</nav>
    <div className={styles.contents}><ArticleContents locale={locale} items={article.sections.map(section => ({ id: section.id, title: section.title[locale] }))} /></div>
    <div className={styles.hero}>{article.id === 'wangsimni' || article.id === 'mangwon'
      ? <MarketRepresentativePhoto photo={MARKET_PHOTOS.seoul} cityLabel={city.name[locale]} context="city" locale={locale} eager />
      : <CityStoryPhoto city={article.city} locale={locale} scene={article.city === 'seoul' && (article.id === 'discover' || article.id === 'seongsu') ? undefined : photoScene} forest={article.city === 'seoul' && (article.id === 'discover' || article.id === 'seongsu')} eager />}</div>
    <article className={styles.body}>
      {article.sections.map(section => <section key={section.id} id={section.id}>
        <h2>{section.title[locale]}</h2>
        {section.paragraphs[locale].map((paragraph, index) => <p key={index}><InlineCopy text={paragraph} /></p>)}
        {section.table && <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={section.table.title[locale]}><table><caption>{section.table.title[locale]}</caption><thead><tr>{section.table.columns[locale].map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{section.table.rows[locale].map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}><InlineCopy text={cell} /></td>)}</tr>)}</tbody></table><p className={styles.tableNote}>{section.table.note[locale]}</p></div>}
        {section.sourceIds.length > 0 && <p className={styles.references}>{ko ? '근거 자료' : 'Sources'} {section.sourceIds.map(id => <a key={id} href={`#source-${id}`} aria-label={`${ko ? '출처' : 'Source'} ${article.sources.findIndex(source => source.id === id) + 1}`}>[{article.sources.findIndex(source => source.id === id) + 1}]</a>)}</p>}
      </section>)}
      {article.city === 'seoul' && article.id === 'where' && <section className={styles.neighborhoods}><h2>{ko ? '세 동네를 더 자세히' : 'Take a closer look at each neighbourhood'}</h2><ul>{SEOUL_NEIGHBORHOODS.map(id => <li key={id}><Link href={journeyArticleHref('seoul', id, locale)}>{getJourneyArticle('seoul', id)!.title[locale]} <UiIcon name="arrow-right" /></Link></li>)}</ul></section>}
      <section className={styles.nextAction} aria-label={ko ? '다음 단계' : 'Next step'}><p className={styles.eyebrow}>{ko ? '다음으로 해볼 일' : 'Your next step'}</p><h2><Link href={actions.primary.href} data-editorial-event="journey_next">{actions.primary.label[locale]} <UiIcon name="arrow-right" /></Link></h2></section>
      <aside className={styles.related} aria-label={ko ? '함께 읽기' : 'Related reading'}><h2>{ko ? '함께 읽기' : 'Related reading'}</h2><ul>{actions.related.map(link => <li key={link.href}><Link href={link.href}>{link.label[locale]} <UiIcon name="arrow-right" /></Link></li>)}</ul></aside>
      <section className={styles.sources} id="article-sources"><h2>{ko ? '출처와 참고 자료' : 'Sources and further reading'}</h2><ol>{article.sources.map(source => <li key={source.id} id={`source-${source.id}`}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ol></section>
    </article>
  </main>;
}
