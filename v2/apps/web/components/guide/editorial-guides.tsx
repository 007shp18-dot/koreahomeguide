import Image from 'next/image';
import Link from 'next/link';
import { getJourneyArticle } from '../../content/city-journey-articles';
import { journeyArticleHref, localIssueHref } from '../../content/city-journey-routes';
import type { StoryCity } from '../../content/city-stories';
import { guideDirectory } from '../../content/guide-directory';
import { REGIONAL_RESOURCES, RESOURCE_TYPES, RESOURCE_LABELS, regionalResourceHref } from '../../content/regional-guide-resources';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { MARKET_PHOTOS } from '../market-representative-photo';
import styles from './editorial-guides.module.css';

const cities = { seoul: 'Seoul', tokyo: 'Tokyo', singapore: 'Singapore', dubai: 'Dubai' } as const;
const explore = { seoul: '/kr/seoul/explore/', tokyo: '/jp/tokyo/explore/', singapore: '/sg/singapore/explore/', dubai: '/ae/dubai/explore/' } as const;
const toolMarkets = { seoul: { market: 'kr-seoul', currency: 'KRW' }, singapore: { market: 'sg-singapore', currency: 'SGD' }, dubai: { market: 'ae-dubai', currency: 'AED' } } as const;
type Entry = { id: string; title: string; deck: string; href: string; label: string };

export function EditorialGuides({ market, query = '' }: Readonly<{ market: StoryCity; query?: string }>) {
  const city = cities[market];
  const photo = MARKET_PHOTOS[market];
  const search = query.trim().toLocaleLowerCase('en');
  const matches = (entry: Entry) => !search || `${entry.title} ${entry.deck} ${entry.label}`.toLocaleLowerCase('en').includes(search);
  const before: Entry[] = [
    { id: 'can-i-buy', label: 'Eligibility & budget' },
    { id: 'which-home', label: 'Compare homes' },
    { id: 'make-it-happen', label: 'Contracts & completion' },
  ].flatMap(({ id, label }) => {
    const article = getJourneyArticle(market, id);
    return article ? [{ id, label, title: article.title.en, deck: article.deck.en, href: journeyArticleHref(market, id) }] : [];
  });
  const owning: Entry[] = [
    { id: 'cost-analysis', label: 'Local analysis', title: 'Understand the costs behind the price', deck: 'Read the local trade-offs before deciding what ownership could mean for you.', href: localIssueHref(market) },
    ...(market === 'tokyo' ? [] : [{ id: 'cost-tool', label: 'Calculator', title: 'Build your ownership-cost scenario', deck: 'Work through purchase outlay and rental income using your own assumptions.', href: createPropertyScenarioHref({ locale: 'en', ...toolMarkets[market] }) }]),
  ];
  const essential: Entry[] = market === 'tokyo'
    ? ['why-buy', 'where'].flatMap(id => {
      const article = getJourneyArticle(market, id);
      return article ? [{ id, title: article.title.en, deck: article.deck.en, href: journeyArticleHref(market, id), label: 'Buying in Tokyo' }] : [];
    })
    : guideDirectory('en', market).map(entry => ({ ...entry, label: entry.group === 'buy' ? 'Buying' : 'Renting' }));
  const groups = [
    { id: 'before-buying', title: 'Before you buy', entries: before },
    { id: 'owning', title: 'Owning & ongoing costs', entries: owning },
    { id: 'essential', title: `Essential ${city} guides`, entries: essential },
    { id: 'resources', title: 'Reference & checklists', entries: RESOURCE_TYPES.map(resource => ({ id: resource, label: RESOURCE_LABELS[resource].en, title: `${city} ${RESOURCE_LABELS[resource].en.toLowerCase()}`, deck: resource === 'checklist' ? REGIONAL_RESOURCES[market].intro.en : 'Local ownership, contracts, taxes, financing and building-management terms, with checks to make for each.', href: regionalResourceHref(market, resource) })) },
  ].map(group => ({ ...group, entries: group.entries.filter(matches) }));

  return <main className={styles.page}>
    <header className={styles.heading}>
      <h1>Guides</h1>
      <p>Practical steps for buying, owning and renting a home.</p>
    </header>
    <nav className={styles.tabs} aria-label="Guide cities">
      {(Object.keys(cities) as StoryCity[]).map(key => <Link key={key} href={`/guides/?market=${key}`} aria-current={key === market ? 'page' : undefined}>{cities[key]}</Link>)}
    </nav>
    <form className={styles.search} action="/guides/" method="get" role="search">
      <input type="hidden" name="market" value={market} />
      <label htmlFor="guide-query">Find a {city} guide</label>
      <div><input id="guide-query" name="q" type="search" defaultValue={query} placeholder="What do you need help with?" maxLength={120} /><button type="submit">Search</button></div>
    </form>
    <section className={styles.intro} aria-labelledby="city-guide-title">
      <div className={styles.photo}><Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 640px) calc(100vw - 40px), 360px" style={{ objectFit: 'cover', objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }} /></div>
      <div><p className={styles.label}>{city} · Practical guidance</p><h2 id="city-guide-title">Your next steps in {city}</h2><p>Check your buying conditions, compare homes and plan the costs before you commit.</p></div>
    </section>
    {search && <p className={styles.searchStatus}>Results for “{query.trim()}” in {city}. <Link href={`/guides/?market=${market}`}>Clear search</Link></p>}
    {groups.every(group => !group.entries.length) && <p className={styles.empty}>No matching guides. Try “cost”, “buy” or a different city.</p>}
    {groups.filter(group => group.entries.length).map(group => <section key={group.id} className={styles.section} aria-labelledby={group.id}>
      <h2 id={group.id}>{group.title}</h2>
      <ul className={group.id === 'essential' || group.id === 'resources' ? styles.rows : styles.cards}>{group.entries.map(entry => <li key={entry.id}>
        <Link href={entry.href} className={styles.entry}>
          <span className={styles.label}>{entry.label}</span><h3>{entry.title}</h3><p>{entry.deck}</p><span className={styles.read}>{entry.label === 'Calculator' ? 'Open calculator' : 'Read more'} <span aria-hidden="true">→</span></span>
        </Link>
      </li>)}</ul>
    </section>)}
    <nav className={styles.next} aria-label="Continue exploring"><Link href={explore[market]}>Explore {city} <span aria-hidden="true">→</span></Link><Link href={`/news/?market=${market}`}>Read {city} insights <span aria-hidden="true">→</span></Link></nav>
  </main>;
}
