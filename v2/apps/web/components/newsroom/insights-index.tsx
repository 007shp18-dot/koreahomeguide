import Image from 'next/image';
import Link from 'next/link';
import { listNeighbourhoodStories, neighbourhoodHref, type NeighbourhoodPhoto } from '../../content/neighbourhood-stories';
import { CITY_JOURNEY_ARTICLES } from '../../content/city-journey-articles';
import { journeyArticlePhoto } from '../../content/journey-article-photos';
import { isInsightReference } from '../../content/insight-curation';
import { journeyArticleHref } from '../../content/city-journey-routes';
import { BUDGET_GUIDE_SLUGS } from '../../content/guide-directory';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import type { PublishedContentArticle } from '../../lib/content/content-types';
import { MARKET_PHOTOS } from '../market-representative-photo';
import type { NewsroomMarketFilter } from './newsroom-index';
import styles from './insights-index.module.css';

const cities = ['seoul', 'tokyo', 'singapore', 'dubai'] as const;
type City = typeof cities[number];
const cityNames = { seoul: 'Seoul', tokyo: 'Tokyo', singapore: 'Singapore', dubai: 'Dubai' };
const marketIds = { seoul: 'kr-seoul', tokyo: 'jp-tokyo', singapore: 'sg-singapore', dubai: 'ae-dubai' };
type Insight = { id: string; title: string; deck: string; href: string; date: string; city: City | null; topic: string; type: string; photo?: NeighbourhoodPhoto; requiresLocalPhoto?: boolean };

function topicFor(title: string, type: string) {
  if (/maintenance|holding|ownership|ten years|costs|service charge/i.test(title)) return 'Ownership costs';
  if (/budget|premium|afford|JPY|price|rent|jeonse/i.test(title)) return 'Housing prices & costs';
  if (type === 'policy-update' || /eligibility|tax|buying rule/i.test(title)) return 'Buying rules';
  if (type === 'neighborhood') return 'Neighborhood living';
  return 'Housing market';
}

export function buildInsightItems(articles: readonly PublishedContentArticle[], market: NewsroomMarketFilter): Insight[] {
  const notebook: Insight[] = listNeighbourhoodStories().map(item => ({ id: `en:${item.slug}`, title: item.title, deck: item.deck, href: neighbourhoodHref(item.slug), date: item.publishedAt, city: item.city as City, topic: 'Neighborhood living', type: 'guide', photo: item.hero }));
  const local: Insight[] = CITY_JOURNEY_ARTICLES.filter(item => item.kind !== 'journey').map(item => ({ id: `en:city-article-${item.city}-${item.id}`, title: item.title.en, deck: item.deck.en, href: journeyArticleHref(item.city, item.id, 'en'), date: item.checkedAt, city: item.city, topic: topicFor(item.title.en, item.kind), type: item.kind === 'neighborhood' ? 'guide' : 'data-story', photo: journeyArticlePhoto(item.city, item.id), requiresLocalPhoto: item.kind === 'neighborhood' }));
  const records = [...articles, ...listPortfolioRecords('en').filter(item => item.type !== 'guide' || BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug))].filter(item => !isInsightReference(item.slug));
  const analysis: Insight[] = records.filter(item => item.status === 'published' && item.evidenceState !== 'withdrawn' && item.type !== 'news-brief' && (item.type !== 'guide' || BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug))).map(item => ({ id: item.id, title: item.title, deck: item.deck, href: 'canonicalHref' in item ? String(item.canonicalHref) : `/news/${item.type === 'policy-update' ? 'policy/' : ''}${item.slug}/`, date: item.publishedAt, city: cities.find(city => marketIds[city] === item.marketId) ?? null, topic: topicFor(item.title, item.type), type: item.type }));
  const seen = new Set<string>();
  const now = Date.now();
  return [...notebook, ...local, ...analysis].filter(item => {
    if (!Number.isFinite(Date.parse(item.date)) || Date.parse(item.date) > now) return false;
    if ((market !== 'all' && item.city !== market) || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).sort((a, b) => b.date.slice(0, 10).localeCompare(a.date.slice(0, 10)));
}

function StoryPhoto({ item, eager = false }: { item: Insight; eager?: boolean }) {
  const photo = item.photo ?? (!item.requiresLocalPhoto && item.city ? MARKET_PHOTOS[item.city] : undefined);
  if (!photo) return null;
  return <figure className={styles.photo}>
    <Link href={item.href} data-editorial-event="article_open" aria-label={item.title} tabIndex={-1}>
      <Image src={photo.src} alt={photo.alt} fill priority={eager} sizes={eager ? '(max-width: 760px) calc(100vw - 40px), 700px' : '(max-width: 600px) calc(100vw - 40px), (max-width: 960px) 45vw, 380px'} />
    </Link>
    {item.photo && <details className={styles.credit}><summary aria-label="Photo credit">Photo</summary><span><a href={item.photo.source}>{item.photo.author}</a> · <a href={item.photo.licenseUrl}>{item.photo.license}</a></span></details>}
  </figure>;
}

function StoryCard({ item, hero = false }: { item: Insight; hero?: boolean }) {
  const Heading = hero ? 'h2' : 'h3';
  return <article className={`${hero ? styles.hero : styles.card} ${item.requiresLocalPhoto && !item.photo ? styles.textStory : ''}`} data-newsroom-lead={hero ? "Featured story" : undefined} data-editorial-content-id={item.id} data-editorial-content-type={item.type} data-editorial-locale="en" data-editorial-market={item.city ? marketIds[item.city] : undefined}>
    <StoryPhoto item={item} eager={hero} />
    <div className={styles.copy}><p className={styles.topic}>{item.city ? cityNames[item.city] : 'Across cities'} <span>·</span> {item.topic}</p>
      <Heading><Link href={item.href} data-editorial-event="article_open">{item.title}</Link></Heading><p className={styles.deck}>{item.deck}</p>
      {hero && <Link className={styles.read} href={item.href} data-editorial-event="article_open">Read the story <span aria-hidden="true">→</span></Link>}
    </div>
  </article>;
}

export function InsightsIndex({ articles, market }: { articles: readonly PublishedContentArticle[]; market: NewsroomMarketFilter }) {
  const [hero, ...items] = buildInsightItems(articles, market);
  return <main className={styles.index} data-newsroom-layout="insights" lang="en">
    <header className={styles.header}><h1>Insights</h1><p>Places, prices and the changes that matter to your next home.</p></header>
    <nav className={styles.filters} aria-label="Insight cities">{(['all', ...cities] as const).map(city => <Link key={city} href={city === 'all' ? '/news/' : `/news/?market=${city}`} aria-current={market === city ? 'page' : undefined}>{city === 'all' ? 'All' : cityNames[city]}</Link>)}</nav>
    {hero && <StoryCard item={hero} hero />}
    <section className={styles.latest} aria-labelledby="latest-insights"><h2 id="latest-insights">Latest stories</h2><div className={styles.grid}>{items.slice(0, 6).map(item => <StoryCard key={item.href} item={item} />)}</div>
      {items.length > 6 && <details className={styles.more}><summary>More stories <span aria-hidden="true">+</span></summary><div className={styles.grid}>{items.slice(6).map(item => <StoryCard key={item.href} item={item} />)}</div></details>}
    </section>
  </main>;
}
