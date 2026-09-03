import Link from 'next/link';

import type { NewsDetailModel } from '../../lib/news/news-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import styles from './news.module.css';

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Official sources paired with SignedPrice evidence checks.',
  navigationLabel: 'News article footer navigation',
  links: [
    { label: 'News', href: '/kr/seoul/news/' },
    { label: 'Explore', href: '/kr/seoul/explore/' },
    { label: 'Guide', href: '/kr/seoul/guide/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

function safeJson(value: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function NewsDetailPage({ model }: Readonly<{ model: NewsDetailModel }>) {
  const { record } = model;
  const header: SiteHeaderModel = {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: 'Seoul News article navigation',
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'Evidence News', href: '/kr/seoul/news/', isCurrent: true },
    ],
  };

  return (
    <div id="top" className={styles.page}>
      <SiteHeader copy={header} />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol>
            <li><Link href="/kr/seoul/news/">Market Briefs</Link></li>
            <li aria-current="page">{record.title}</li>
          </ol>
        </nav>

        <article className={styles.document}>
          <header className={styles.documentHero}>
            <p>Seoul · {record.category.replace('-', ' ')}</p>
            <h1>{record.title}</h1>
            <p>{record.summary}</p>
            <dl>
              <div>
                <dt>Published</dt>
                <dd><time dateTime={record.publishedAt}>{date.format(new Date(record.publishedAt))}</time></dd>
              </div>
              {record.updatedAt === null ? null : (
                <div>
                  <dt>Updated</dt>
                  <dd><time dateTime={record.updatedAt}>{date.format(new Date(record.updatedAt))}</time></dd>
                </div>
              )}
            </dl>
          </header>

          <aside className={styles.evidencePanel} data-news-evidence={record.evidence.status}>
            <p><strong>Our data:</strong> {record.evidence.line}</p>
            <p>Evidence status · {record.evidence.status.replace('-', ' ')}</p>
          </aside>

          <div className={styles.body}>
            {record.body.map((block, index) => {
              if (block.type === 'heading') return <h2 key={`${index}:${block.text}`}>{block.text}</h2>;
              if (block.type === 'paragraph') return <p key={`${index}:${block.text}`}>{block.text}</p>;
              return (
                <ul key={`${index}:${block.items.join('|')}`}>
                  {block.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              );
            })}
          </div>

          <section className={styles.citation} aria-labelledby="official-source-heading">
            <p>Official source</p>
            <h2 id="official-source-heading">{record.source.title}</h2>
            <p>{record.source.publisher}</p>
            <a href={record.source.url} target="_blank" rel="noopener noreferrer">
              Open the official source
            </a>
          </section>

          <nav className={styles.actions} aria-label="News evidence links">
            <Link href="/kr/seoul/news/">All Market Briefs</Link>
            <Link href="/kr/seoul/check/">Compare a contract</Link>
            <Link href="/kr/seoul/corrections/">Review correction ledger</Link>
          </nav>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJson(model.jsonLd) }}
          />
        </article>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
