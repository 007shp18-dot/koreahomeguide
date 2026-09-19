import Link from 'next/link';

import type { EditorialPortfolioRecord } from '../../content/portfolio-types';
import styles from './newsroom.module.css';

export function EditorialPortfolioIndex({ locale, records, section }: Readonly<{
  locale: 'en' | 'zh-CN';
  records: readonly EditorialPortfolioRecord[];
  section: 'news' | 'guides';
}>) {
  const chinese = locale === 'zh-CN';
  const markets: Record<string, string> = chinese
    ? { 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' }
    : { 'kr-seoul': 'Seoul', 'sg-singapore': 'Singapore', 'ae-dubai': 'Dubai', 'jp-tokyo': 'Tokyo' };
  const types: Record<string, string> = chinese
    ? { 'news-brief': '新闻简报', 'policy-update': '政策更新', 'market-brief': '市场简报', 'data-story': '数据分析', guide: '指南' }
    : { 'news-brief': 'News brief', 'policy-update': 'Policy update', 'market-brief': 'Market brief', 'data-story': 'Data story', guide: 'Guide' };
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date));
  const copy = section === 'news'
    ? chinese
      ? { eyebrow: 'SignedPrice 新闻与数据', title: '政策变化与市场数据，都回到原始依据。', deck: '首尔与新加坡的政策更新、市场简报和数据故事。' }
      : { eyebrow: 'SignedPrice Newsroom', title: 'Property change, checked against evidence.', deck: 'Policy updates, market reporting and data analysis.' }
    : chinese
      ? { eyebrow: 'SignedPrice 指南', title: '先理解本地流程，再作跨境决定。', deck: '围绕租房、买房与成交数据的实用指南。' }
      : { eyebrow: 'SignedPrice Guides', title: 'Understand the process before deciding.', deck: 'Guides to renting, buying and reading transaction prices.' };
  return <main className={styles.index} lang={locale}>
    <header className={styles.indexHero}><p>{copy.eyebrow}</p><h1>{copy.title}</h1><span>{copy.deck}</span></header>
    <section className={styles.latest} aria-labelledby="portfolio-list-title">
      <div className={styles.sectionHeading}><p>{records.length} {chinese ? '篇文章' : 'articles'}</p><h2 id="portfolio-list-title">{chinese ? '按读者问题开始' : 'Start with the reader question'}</h2></div>
      <ol data-editorial-portfolio-list="rows">{records.map((record) => <li key={record.id}>
        <div><span>{types[record.type] ?? record.type} · {markets[record.marketId ?? ''] ?? (chinese ? '跨城市' : 'Across cities')}</span><time dateTime={record.updatedAt}>{formatDate(record.updatedAt)}</time></div>
        <h3><Link href={record.canonicalHref}>{record.title}</Link></h3>
        <p>{record.deck}</p>
      </li>)}</ol>
    </section>
  </main>;
}
