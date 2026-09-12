import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ContentLocale, PublishedContentArticle } from '../../lib/content/content-types';
import { ExternalHeadlines } from '../news/external-headlines';
import styles from './insights-index.module.css';

const markets = { seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai', tokyo: 'jp-tokyo' } as const;
type City = keyof typeof markets;
const copy = {
  en: { title: 'News', deck: 'What happened. Where it matters. What to read next.', all: 'All', cities: ['Seoul', 'Singapore', 'Dubai', 'Tokyo'], navigation: 'News markets' },
  ko: { title: '뉴스', deck: '도시별 최신 소식과 주택 시장에 미치는 영향을 살펴보세요.', all: '전체', cities: ['서울', '싱가포르', '두바이', '도쿄'], navigation: '뉴스 도시' },
  'zh-CN': { title: '新闻', deck: '了解各城市最新动态，以及对房地产市场的影响。', all: '全部', cities: ['首尔', '新加坡', '迪拜', '东京'], navigation: '新闻城市' },
};

export function NewsFeedIndex({ market, locale = 'en', headlines }: Readonly<{
  articles: readonly PublishedContentArticle[];
  market: City | 'all';
  locale?: ContentLocale;
  headlines?: ReactNode;
}>) {
  const t = copy[locale];
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  return <main className={styles.index} data-newsroom-layout="news" lang={locale}>
    <header className={styles.header}><h1>{t.title}</h1><p>{t.deck}</p></header>
    <nav className={styles.filters} aria-label={t.navigation}>
      {(['all', ...Object.keys(markets)] as (City | 'all')[]).map((city, i) => <Link key={city}
        href={`${prefix}/news/?type=news${city === 'all' ? '' : `&market=${city}`}`}
        aria-current={market === city ? 'page' : undefined}>{city === 'all' ? t.all : t.cities[i - 1]}</Link>)}
    </nav>
    {headlines ?? <ExternalHeadlines market={market} locale={locale} />}
  </main>;
}
