import Link from 'next/link';
import { CITY_STORIES, STORY_STEPS, cityStoryHref, type CityStory, type StoryLocale } from '../../content/city-stories';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import { languageDestinations } from '../../lib/navigation/site-navigation';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import { CityStoryPhoto } from './city-story-photo';
import styles from './newsroom-journey.module.css';

export function storyLinkHref(href: string, locale: StoryLocale): string {
  if (locale === 'en' || !href.startsWith('/')) return href;
  const path = href.split('?')[0]!;
  const original = listPortfolioRecords('en').find(item => item.canonicalHref === path);
  if (original) return listPortfolioRecords('ko').find(item => item.translationGroupId === original.translationGroupId)?.canonicalHref ?? href;
  return languageDestinations(path, href.includes('?') ? `?${href.split('?')[1]}` : '').ko ?? href;
}

export function CityStoryArticle({ story, locale }: Readonly<{ story: CityStory; locale: StoryLocale }>) {
  const ko = locale === 'ko';
  const href = cityStoryHref(story.city, locale);
  const next = CITY_STORIES[(CITY_STORIES.indexOf(story) + 1) % CITY_STORIES.length]!;
  return <main className={styles.article} lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({ '@context': 'https://schema.org', '@type': 'Article', headline: story.title[locale], description: story.deck[locale], inLanguage: locale, datePublished: '2026-09-08', dateModified: '2026-09-08', mainEntityOfPage: publicCanonical(href as `/${string}`), author: { '@type': 'Organization', name: 'SignedPrice' }, publisher: { '@type': 'Organization', name: 'SignedPrice' }, citation: story.sources.map(source => source.href), isAccessibleForFree: true }) }} />
    <Link className={styles.readLink} href={`${ko ? '/ko' : ''}/news/?market=${story.city}`}>← {ko ? '뉴스 & 인사이트' : 'News & Insights'}</Link>
    <header><p className={styles.eyebrow}>{story.name[locale]} · City Stories · <time dateTime="2026-09-08">2026.09.08</time></p><h1>{story.title[locale]}</h1><p>{story.deck[locale]}</p></header>
    <CityStoryPhoto city={story.city} locale={locale} eager />
    <div className={styles.articleBody}>
      <nav aria-label={ko ? '이 글의 순서' : 'In this article'}>{STORY_STEPS.map(step => <Link key={step.id} href={`#${step.id}`}>{step.label[locale]}</Link>)}</nav>
      {story.sections.map((section, index) => <section key={section.id} id={section.id}>
        <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} · {STORY_STEPS[index]!.label[locale]}</p><h2>{section.title[locale]}</h2>
        {section.paragraphs[locale].map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {story.city === 'seoul' && index === 0 && <CityStoryPhoto city="seoul" locale={locale} forest />}
        <div className={styles.articleLinks}>{section.links.map(link => <Link key={link.href} href={storyLinkHref(link.href, locale)} {...(link.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.label[locale]} ↗</Link>)}</div>
      </section>)}
      <section className={styles.sources}><h2>{ko ? '관련 자료' : 'Further reading'}</h2><ul>{story.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></section>
      <section className={styles.sources}><p className={styles.eyebrow}>{ko ? '다른 도시의 이야기' : 'Discover another city'}</p><h2><Link href={cityStoryHref(next.city, locale)}>{next.title[locale]}</Link></h2><Link className={styles.readLink} href={ko ? '/ko/passport/' : '/passport/'}>{ko ? '같은 예산으로 도시 비교하기' : 'Compare cities with your budget'} ↗</Link></section>
    </div>
  </main>;
}
