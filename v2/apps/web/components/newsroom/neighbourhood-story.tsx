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

function Photo({ photo, hero = false }: { photo: NeighbourhoodPhoto; hero?: boolean }) {
  return <figure className={`${layout.scenePhoto} ${hero ? styles.hero : styles.photo}`}>
    <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} unoptimized loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : undefined} />
    <figcaption>{photo.caption}<details className={layout.photoCredit}><summary>Photo credit</summary><span><a href={photo.source}>{photo.author}</a> · <a href={photo.licenseUrl}>{photo.license}</a></span></details></figcaption>
  </figure>;
}

export function NeighbourhoodStoryCards({ city = 'all', exclude }: { city?: string; exclude?: string }) {
  const stories = listNeighbourhoodStories(city).filter(story => story.slug !== exclude).slice(0, 4);
  if (!stories.length) return null;
  return <section className={styles.latest} aria-label="Neighbourhood notebook" data-neighbourhood-notebook>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>NEIGHBOURHOOD NOTEBOOK</p><h2>{exclude ? 'Related reading' : 'A little closer to local life'}</h2></div><p>Streets, small stops, and places to call home.</p></div>
    <div className={styles.cards}>{stories.map(story => <article key={story.slug} data-editorial-content-id={`en:${story.slug}`} data-editorial-content-type="guide" data-editorial-locale="en" data-editorial-market={markets[story.city as keyof typeof markets]}>
      <Link data-editorial-event="article_open" href={neighbourhoodHref(story.slug)} className={styles.cardImage} aria-label={story.title}><Image src={story.hero.src} width={story.hero.width} height={story.hero.height} alt={story.hero.alt} unoptimized loading="lazy" /></Link>
      <p className={styles.eyebrow}>{story.cityName} · <time dateTime={story.publishedAt}>{story.publishedAt}</time></p>
      <h3><Link data-editorial-event="article_open" href={neighbourhoodHref(story.slug)}>{story.title}</Link></h3><p>{story.deck}</p>
    </article>)}</div>
  </section>;
}

export function NeighbourhoodArticle({ story }: { story: NeighbourhoodStory }) {
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: story.title,
    description: story.deck, datePublished: story.publishedAt, dateModified: story.publishedAt,
    inLanguage: 'en', mainEntityOfPage: publicCanonical(neighbourhoodHref(story.slug)),
    image: publicCanonical(story.hero.src as `/${string}`), author: { '@type': 'Organization', name: 'SignedPrice' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: story.sources.map(source => source.href) };
  return <main className={layout.article} lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <nav className={layout.breadcrumb} aria-label="Breadcrumb"><Link href="/news/">Insights</Link><span>/</span><Link href={`/news/?market=${story.city}`}>{story.cityName}</Link></nav>
    <article data-editorial-content-id={`en:${story.slug}`} data-editorial-content-type="guide" data-editorial-locale="en" data-editorial-market={markets[story.city as keyof typeof markets]}>
      <EditorialArticleHeader topic={`${story.cityName} · Neighborhood living`} title={story.title} deck={story.deck}>
        <span>SignedPrice</span><time dateTime={story.publishedAt}>{story.publishedAt}</time><a href="#article-sources">{story.sources.length} sources</a>
      </EditorialArticleHeader>
      <Photo photo={story.hero} hero />
      <div className={layout.contents}><ArticleContents items={[...story.sections.map((section, index) => ({ id: `section-${index + 1}`, title: section.title })), { id: 'living-here', title: 'Picture an ordinary weekday' }]} /></div>
      <div className={layout.body}><p className={styles.intro}>{story.intro}</p><p className={styles.walk}><strong>Your loose plan</strong><br />{story.route}</p>
        {story.sections.map((section, index) => <section key={section.title} id={`section-${index + 1}`}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<Photo photo={section.photo} /></section>)}
        <section className={styles.living} id="living-here"><p className={styles.eyebrow}>IF THIS WERE YOUR NEIGHBOURHOOD</p><h2>Picture an ordinary weekday</h2><p>{story.living}</p></section>
        <nav className={layout.nextAction} aria-label="Continue in this city" data-editorial-event="article_complete"><h2>Explore homes in {story.cityName}</h2><p><Link href={explores[story.city as keyof typeof explores] ?? '/prices/'} data-editorial-event="article_to_explore">Explore recorded transactions</Link> · <Link href={journeyArticleHref(story.city as keyof typeof markets, 'where', 'en')} data-editorial-event="article_open">Compare neighbourhoods</Link></p></nav>
        <section className={layout.sources} id="article-sources"><h2>Sources and further reading</h2><ol>{story.sources.map(source => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ol></section>
      </div>
    </article>
    <NeighbourhoodStoryCards exclude={story.slug} />
  </main>;
}
