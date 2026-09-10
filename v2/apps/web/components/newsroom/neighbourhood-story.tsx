import Image from 'next/image';
import Link from 'next/link';
import { listNeighbourhoodStories, neighbourhoodHref, type NeighbourhoodPhoto, type NeighbourhoodStory } from '../../content/neighbourhood-stories';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import styles from './neighbourhood-story.module.css';

function Photo({ photo, hero = false }: { photo: NeighbourhoodPhoto; hero?: boolean }) {
  return <figure className={hero ? styles.hero : styles.photo}>
    <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} unoptimized loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : undefined} />
    <figcaption>{photo.caption} <span>· <a href={photo.source}>{photo.author}</a> / <a href={photo.licenseUrl}>{photo.license}</a></span></figcaption>
  </figure>;
}

export function NeighbourhoodStoryCards({ city = 'all', exclude }: { city?: string; exclude?: string }) {
  const stories = listNeighbourhoodStories(city).filter(story => story.slug !== exclude).slice(0, 4);
  if (!stories.length) return null;
  return <section className={styles.latest} aria-label="Neighbourhood notebook" data-neighbourhood-notebook>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>NEIGHBOURHOOD NOTEBOOK</p><h2>{exclude ? 'Keep wandering' : 'A little closer to local life'}</h2></div><p>Streets, small stops, and places to call home.</p></div>
    <div className={styles.cards}>{stories.map(story => <article key={story.slug}>
      <Link href={neighbourhoodHref(story.slug)} className={styles.cardImage} aria-label={story.title}><Image src={story.hero.src} width={story.hero.width} height={story.hero.height} alt={story.hero.alt} unoptimized loading="lazy" /></Link>
      <p className={styles.eyebrow}>{story.cityName} · <time dateTime={story.publishedAt}>{story.publishedAt}</time></p>
      <h3><Link href={neighbourhoodHref(story.slug)}>{story.title}</Link></h3><p>{story.deck}</p>
    </article>)}</div>
  </section>;
}

export function NeighbourhoodArticle({ story }: { story: NeighbourhoodStory }) {
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: story.title,
    description: story.deck, datePublished: story.publishedAt, dateModified: story.publishedAt,
    inLanguage: 'en', mainEntityOfPage: publicCanonical(neighbourhoodHref(story.slug)),
    image: publicCanonical(story.hero.src as `/${string}`), author: { '@type': 'Organization', name: 'SignedPrice' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: story.sources.map(source => source.href) };
  return <main className={styles.page} lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <nav className={styles.back} aria-label="Breadcrumb"><Link href="/news/">Insights</Link><span>/</span><Link href={`/news/?market=${story.city}`}>{story.cityName}</Link></nav>
    <article>
      <header className={styles.header}><p className={styles.eyebrow}>{story.cityName} / {story.neighbourhood}</p><h1>{story.title}</h1><p className={styles.deck}>{story.deck}</p><p className={styles.meta}>SignedPrice · <time dateTime={story.publishedAt}>{story.publishedAt}</time> · Neighbourhood notebook</p></header>
      <Photo photo={story.hero} hero />
      <div className={styles.body}><p className={styles.intro}>{story.intro}</p><p className={styles.walk}><strong>Your loose plan</strong><br />{story.route}</p>
        {story.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<Photo photo={section.photo} /></section>)}
        <section className={styles.living}><p className={styles.eyebrow}>IF THIS WERE YOUR NEIGHBOURHOOD</p><h2>Picture an ordinary weekday</h2><p>{story.living}</p></section>
        <p className={styles.sources}>Explore further: {story.sources.map((source, i) => <span key={source.href}>{i > 0 && ' · '}<a href={source.href}>{source.label}</a></span>)}</p>
      </div>
    </article>
    <NeighbourhoodStoryCards exclude={story.slug} />
  </main>;
}
