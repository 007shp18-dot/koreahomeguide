import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import type { ReactNode } from 'react';
import { CITY_STORIES, cityStoryHref, type StoryLocale } from '../../content/city-stories';
import { getJourneyArticle, journeyArticleActions, type JourneyArticle as Article } from '../../content/city-journey-articles';
import { SEOUL_NEIGHBORHOODS, STORY_STEPS, journeyArticleHref } from '../../content/city-journey-routes';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import { ArticleContents } from './article-contents';
import { NeighbourhoodPhoto, PHOTO_ESSAYS } from './neighbourhood-photo';
import { CityStoryPhoto } from './city-story-photo';
import { EditorialArticleHeader } from './editorial-article-header';
import { PracticalTool } from './practical-tool';
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
  const photoEssay = PHOTO_ESSAYS[`${article.city}/${article.id}`];
  const city = CITY_STORIES.find(story => story.city === article.city)!;
  const step = STORY_STEPS.find(item => item.id === article.id);
  const kind = article.kind === 'local-issue' ? (ko ? '현지 이슈 분석' : 'Local Issues') : article.kind === 'neighborhood' ? (ko ? '동네 선택' : 'Neighbourhood guide') : step!.label[locale];
  const href = journeyArticleHref(article.city, article.id, locale);
  const actions = journeyArticleActions(article, locale);
  const exploreHref = { seoul: '/kr/seoul/explore/', singapore: '/sg/singapore/explore/', dubai: '/ae/dubai/explore/', tokyo: '/jp/tokyo/explore/' }[article.city];
  const photoExplore = photoEssay && article.kind !== 'local-issue';
  const nextHref = photoExplore ? `${ko && article.city !== 'tokyo' ? '/ko' : ''}${exploreHref}` : actions.primary.href;
  const nextEvent = nextHref.includes('/explore') ? 'article_to_explore' : /\/(check|tools|passport)\//.test(nextHref) ? 'article_to_check' : 'article_open';
  const minutes = Math.max(3, Math.ceil(article.sections.flatMap(section => section.paragraphs[locale]).join(' ').length / (ko ? 550 : 1100)));
  const photoScene = article.id === 'where' || article.id === 'which-home' ? 'comparison' : 'neighborhood';
  return <main className={styles.article} lang={locale} data-journey-article={`${article.city}/${article.id}`} data-editorial-content-id={`${locale}:${article.city}-${article.id}`} data-editorial-content-type="guide" data-editorial-locale={locale} data-editorial-market={{seoul:'kr-seoul',singapore:'sg-singapore',dubai:'ae-dubai',tokyo:'jp-tokyo'}[article.city]}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title[locale], description: article.deck[locale], inLanguage: locale, mainEntityOfPage: publicCanonical(href), author: { '@type': 'Organization', name: 'SignedPrice' }, publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: article.sources.map(source => source.href), isAccessibleForFree: true }) }} />
    <nav className={styles.breadcrumb} aria-label={ko ? '현재 위치' : 'Breadcrumb'}><Link href={`${ko ? '/ko' : ''}/news/?market=${article.city}`}>{ko ? '인사이트' : 'Insights'}</Link><span aria-hidden="true">/</span><Link href={cityStoryHref(article.city, locale)}>{city.name[locale]}</Link><span aria-hidden="true">/</span><span>{kind}</span></nav>
    <EditorialArticleHeader topic={`${city.name[locale]} · ${kind}`} title={article.title[locale]} deck={article.deck[locale]}>
      <span>SignedPrice</span><span>{ko ? `${minutes}분 읽기` : `${minutes} min read`}</span><a href="#article-sources">{ko ? `출처 ${article.sources.length}개` : `${article.sources.length} sources`}</a>
    </EditorialArticleHeader>
    {article.id === 'which-home' && (article.city === 'tokyo' || article.city === 'singapore') && <PracticalTool key={`${locale}:${article.city}`} kind={article.city === 'tokyo' ? 'japan' : 'singapore'} locale={locale} />}
    {(photoEssay || article.kind !== 'neighborhood') && <div className={styles.hero}>{photoEssay
      ? <NeighbourhoodPhoto id={photoEssay.hero} eager context={article.kind === 'local-issue'} locale={locale} />
      : <CityStoryPhoto city={article.city} locale={locale} scene={article.city === 'seoul' && article.id === 'discover' ? undefined : photoScene} forest={article.city === 'seoul' && article.id === 'discover'} eager />}</div>}
    <div className={styles.contents}><ArticleContents locale={locale} items={article.sections.map(section => ({ id: section.id, title: section.title[locale] }))} /></div>
    <article className={styles.body}>
      {article.sections.map((section, sectionIndex) => <section key={section.id} id={section.id}>
        <h2>{section.title[locale]}</h2>
        {section.paragraphs[locale].map((paragraph, index) => <p key={index}><InlineCopy text={paragraph} /></p>)}
        {section.table && <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={section.table.title[locale]}><table><caption>{section.table.title[locale]}</caption><thead><tr>{section.table.columns[locale].map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{section.table.rows[locale].map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}><InlineCopy text={cell} /></td>)}</tr>)}</tbody></table><p className={styles.tableNote}>{section.table.note[locale]}</p></div>}
        {photoEssay?.sections[sectionIndex] && <NeighbourhoodPhoto id={photoEssay.sections[sectionIndex]!} locale={locale} />}
        {article.kind !== 'neighborhood' && section.sourceIds.length > 0 && <p className={styles.references}>{ko ? '근거 자료' : 'Sources'} {section.sourceIds.map(id => <a key={id} href={`#source-${id}`} aria-label={`${ko ? '출처' : 'Source'} ${article.sources.findIndex(source => source.id === id) + 1}`}>[{article.sources.findIndex(source => source.id === id) + 1}]</a>)}</p>}
      </section>)}
      {article.city === 'seoul' && article.id === 'where' && <section className={styles.neighborhoods}><h2>{ko ? '세 동네를 더 자세히' : 'Take a closer look at each neighbourhood'}</h2><ul>{SEOUL_NEIGHBORHOODS.map(id => <li key={id}><Link href={journeyArticleHref('seoul', id, locale)}>{getJourneyArticle('seoul', id)!.title[locale]} <UiIcon name="arrow-right" /></Link></li>)}</ul></section>}
      <section className={styles.nextAction} data-editorial-event="article_complete" aria-label={ko ? '다음 단계' : 'Next step'}><p className={styles.eyebrow}>{ko ? '다음으로 해볼 일' : 'Your next step'}</p><h2><Link href={nextHref} data-editorial-event={nextEvent}>{photoExplore ? (ko ? `${city.name.ko} 지역 살펴보기` : `Explore ${city.name.en}`) : actions.primary.label[locale]} <UiIcon name="arrow-right" /></Link></h2></section>
      {article.kind === 'journey' && <details className={styles.journeyLinks}><summary>{ko ? '도시 구매 여정' : 'City buying journey'}</summary><nav className={styles.stages} aria-label={ko ? '도시 구매 여정' : 'City buying journey'}>{STORY_STEPS.map((item, index) => <Link key={item.id} href={journeyArticleHref(article.city, item.id, locale)} aria-current={item.id === article.id ? 'page' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{item.label[locale]}</Link>)}</nav></details>}
      <aside className={styles.related} aria-label={ko ? '함께 읽기' : 'Related reading'}><h2>{ko ? '함께 읽기' : 'Related reading'}</h2><ul>{actions.related.map(link => <li key={link.href}><Link href={link.href}>{link.label[locale]} <UiIcon name="arrow-right" /></Link></li>)}</ul></aside>
      <section className={styles.sources} id="article-sources"><h2>{ko ? '출처와 참고 자료' : 'Sources and further reading'}</h2><ol>{article.sources.map(source => <li key={source.id} id={`source-${source.id}`}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ol></section>
    </article>
  </main>;
}
