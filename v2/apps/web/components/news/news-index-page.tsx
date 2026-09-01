import Link from 'next/link';

import type { NewsIndexModel } from '../../lib/news/news-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../lib/site-copy';
import { PublicSectionTabs } from '../public-market/public-section-tabs';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import styles from './news.module.css';

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul News navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Evidence News', href: '/kr/seoul/news/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Official sources paired with SignedPrice evidence checks.',
  navigationLabel: 'News footer navigation',
  links: [
    { label: 'Contract Check', href: '/kr/' },
    { label: 'Explore', href: '/kr/seoul/explore/' },
    { label: 'Guide', href: '/kr/seoul/guide/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const categoryLabels = {
  'official-update': 'Official update',
  'data-brief': 'Data brief',
  methodology: 'Methodology',
  correction: 'Correction',
} as const;

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

export function NewsIndexPage({ model }: Readonly<{ model: NewsIndexModel }>) {
  return (
    <div id="top" className={styles.page}>
      <SiteHeader copy={header} />
      <PublicSectionTabs current="news" />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p>Seoul · Source-checked reporting</p>
          <h1>Seoul evidence briefs</h1>
          <p>Official updates and SignedPrice data notes, each published with its source and an explicit evidence status.</p>
        </header>

        <section className={styles.feed} aria-labelledby="news-feed-heading">
          <div className={styles.sectionHeading}>
            <p>01 / Latest</p>
            <h2 id="news-feed-heading">Read the source and our data boundary together.</h2>
          </div>
          <ol className={styles.cards}>
            {model.records.map((record, index) => (
              <li key={record.id}>
                <article className={styles.card} data-news-record={record.id}>
                  <div className={styles.cardMeta}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{categoryLabels[record.category]}</p>
                    <time dateTime={record.publishedAt}>{date.format(new Date(record.publishedAt))}</time>
                  </div>
                  <div className={styles.cardBody}>
                    <h3><Link href={`/kr/seoul/news/${record.slug}/`}>{record.title}</Link></h3>
                    <p>{record.summary}</p>
                    <p className={styles.evidence} data-news-evidence={record.evidence.status}>
                      <strong>Our data:</strong> {record.evidence.line}
                    </p>
                    <p className={styles.source}>
                      <span>Official source</span>
                      <a href={record.source.url} target="_blank" rel="noopener noreferrer">
                        {record.source.publisher} · {record.source.title}
                      </a>
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.boundary} aria-label="News publication boundary">
          <strong>Publication boundary</strong>
          <p>SignedPrice does not reproduce source articles or fill missing comparisons with estimates. A verified brief disappears if its declared artifact no longer reconciles.</p>
        </aside>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
