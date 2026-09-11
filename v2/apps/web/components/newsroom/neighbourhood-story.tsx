import Image from 'next/image';
import Link from 'next/link';
import { listNeighbourhoodStories, neighbourhoodHref, type NeighbourhoodPhoto, type NeighbourhoodStory } from '../../content/neighbourhood-stories';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import { journeyArticleHref } from '../../content/city-journey-routes';
import { EditorialArticleHeader } from './editorial-article-header';
import { ArticleContents } from './article-contents';
import layout from './journey-article.module.css';
import styles from './neighbourhood-story.module.css';

const markets = {seoul:'kr-seoul',singapore:'sg-singapore',dubai:'ae-dubai',tokyo:'jp-tokyo'} as const;
const explores = {seoul:'/kr/seoul/explore/',singapore:'/sg/singapore/explore/',dubai:'/ae/dubai/explore/',tokyo:'/jp/tokyo/explore/'} as const;

function Photo({ photo, hero = false, locale = 'en' }: { photo: NeighbourhoodPhoto; hero?: boolean; locale?: 'en' | 'ko' }) {
  return <figure className={`${layout.scenePhoto} ${hero ? styles.hero : styles.photo}`}>
    <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} unoptimized loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : undefined} />
    <figcaption>{photo.caption}<details className={layout.photoCredit}><summary>{locale === 'ko' ? '사진 출처' : 'Photo credit'}</summary><span><a href={photo.source}>{photo.author}</a> · <a href={photo.licenseUrl}>{photo.license}</a></span></details></figcaption>
  </figure>;
}

export function NeighbourhoodStoryCards({ city = 'all', exclude, locale = 'en' }: { city?: string; exclude?: string; locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko';
  const stories = listNeighbourhoodStories(city, locale).filter(story => story.slug !== exclude).slice(0, 4);
  if (!stories.length) return null;
  return <section className={styles.latest} aria-label={ko ? '동네 이야기' : 'Neighbourhood notebook'} data-neighbourhood-notebook>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{ko ? '동네 이야기' : 'NEIGHBOURHOOD NOTEBOOK'}</p><h2>{ko ? (exclude ? '함께 읽기' : '동네의 일상 가까이') : (exclude ? 'Related reading' : 'A little closer to local life')}</h2></div><p>{ko ? '골목과 쉼터, 살아보고 싶은 동네.' : 'Streets, small stops, and places to call home.'}</p></div>
    <div className={styles.cards}>{stories.map(story => <article key={story.slug} data-editorial-content-id={`${locale}:${story.slug}`} data-editorial-content-type="guide" data-editorial-locale={locale} data-editorial-market={markets[story.city as keyof typeof markets]}>
      {!story.photosWithheld && <Link data-editorial-event="article_open" href={neighbourhoodHref(story.slug, locale)} className={styles.cardImage} aria-label={story.title}><Image src={story.hero.src} width={story.hero.width} height={story.hero.height} alt={story.hero.alt} unoptimized loading="lazy" /></Link>}
      <p className={styles.eyebrow}>{story.cityName} · <time dateTime={story.publishedAt}>{story.publishedAt}</time></p>
      <h3><Link data-editorial-event="article_open" href={neighbourhoodHref(story.slug, locale)}>{story.title}</Link></h3><p>{story.deck}</p>
    </article>)}</div>
  </section>;
}

export function NeighbourhoodArticle({ story, locale = 'en' }: { story: NeighbourhoodStory; locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko';
  const prefix = ko ? '/ko' : '';
  const livingTitle = ko ? '이곳에서 보내는 평일을 떠올려 보세요' : 'Picture an ordinary weekday';
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: story.title,
    description: story.deck, datePublished: story.publishedAt, dateModified: story.publishedAt,
    inLanguage: locale, mainEntityOfPage: publicCanonical(neighbourhoodHref(story.slug, locale)),
    image: story.photosWithheld ? undefined : publicCanonical(story.hero.src as `/${string}`), author: { '@type': 'Organization', name: 'SignedPrice' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: story.sources.map(source => source.href) };
  return <main className={layout.article} lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <nav className={layout.breadcrumb} aria-label={ko ? '현재 위치' : 'Breadcrumb'}><Link href={`${prefix}/news/`}>{ko ? '인사이트' : 'Insights'}</Link><span>/</span><Link href={`${prefix}/news/?market=${story.city}`}>{story.cityName}</Link></nav>
    <article data-editorial-content-id={`${locale}:${story.slug}`} data-editorial-content-type="guide" data-editorial-locale={locale} data-editorial-market={markets[story.city as keyof typeof markets]}>
      <EditorialArticleHeader topic={`${story.cityName} · ${ko ? '동네 생활' : 'Neighborhood living'}`} title={story.title} deck={story.deck}>
        <span>SignedPrice</span><time dateTime={story.publishedAt}>{story.publishedAt}</time><a href="#article-sources">{ko ? `출처 ${story.sources.length}개` : `${story.sources.length} sources`}</a>
        <Link href={neighbourhoodHref(story.slug, ko ? 'en' : 'ko')} hrefLang={ko ? 'en' : 'ko'}>{ko ? 'English' : '한국어'}</Link>
      </EditorialArticleHeader>
      {!story.photosWithheld && <Photo photo={story.hero} hero locale={locale} />}
      <div className={layout.contents}><ArticleContents locale={locale} items={[...story.sections.map((section, index) => ({ id: `section-${index + 1}`, title: section.title })), { id: 'living-here', title: livingTitle }]} /></div>
      <div className={layout.body}><p className={styles.intro}>{story.intro}</p><p className={styles.walk}><strong>{ko ? '가볍게 잡아보는 동선' : 'Your loose plan'}</strong><br />{story.route}</p>
        {story.sections.map((section, index) => <section key={section.title} id={`section-${index + 1}`}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{!story.photosWithheld && <Photo photo={section.photo} locale={locale} />}</section>)}
        <section className={styles.living} id="living-here"><p className={styles.eyebrow}>{ko ? '이 동네에 산다면' : 'IF THIS WERE YOUR NEIGHBOURHOOD'}</p><h2>{livingTitle}</h2><p>{story.living}</p></section>
        <nav className={layout.nextAction} aria-label={ko ? '이 도시 더 살펴보기' : 'Continue in this city'} data-editorial-event="article_complete"><h2>{ko ? `${story.cityName}의 주거 지역 살펴보기` : `Explore homes in ${story.cityName}`}</h2><p><Link href={`${prefix}${explores[story.city as keyof typeof explores] ?? '/prices/'}`} data-editorial-event="article_to_explore">{ko ? '신고된 거래 살펴보기' : 'Explore recorded transactions'}</Link> · <Link href={journeyArticleHref(story.city as keyof typeof markets, 'where', locale)} data-editorial-event="article_open">{ko ? '동네 비교하기' : 'Compare neighbourhoods'}</Link></p></nav>
        <section className={layout.sources} id="article-sources"><h2>{ko ? '출처와 참고 자료' : 'Sources and further reading'}</h2><ol>{story.sources.map(source => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ol></section>
      </div>
    </article>
    <NeighbourhoodStoryCards exclude={story.slug} locale={locale} />
  </main>;
}
