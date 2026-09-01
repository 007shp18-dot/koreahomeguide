import Link from 'next/link';

import type { NewsCardModel } from '../../lib/news/news-card-model';
import styles from './detail-news-list.module.css';

const date = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function DetailNewsList({ news }: Readonly<{ news: readonly NewsCardModel[] }>) {
  return (
    <section className={styles.news} aria-labelledby="detail-news-heading">
      <header className={styles.heading}>
        <p>Verified context</p>
        <h2 id="detail-news-heading">Latest verified News</h2>
      </header>

      {news.length === 0 ? (
        <p className={styles.empty}>
          No evidence-ready brief is available for this view. SignedPrice does not substitute an unverified number.
        </p>
      ) : (
        <ol className={styles.list}>
          {news.map((record) => (
            <li key={record.id}>
              <article>
                <time dateTime={record.publishedAt}>
                  {date.format(new Date(record.publishedAt))}
                </time>
                <h3><Link href={record.href}>{record.title}</Link></h3>
                <p>{record.summary}</p>
                <p className={styles.evidence} data-news-evidence={record.evidenceStatus}>
                  <strong>Our data:</strong> {record.evidenceLine}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}

      <Link className={styles.allNews} href="/kr/seoul/news/">Read all Seoul News</Link>
    </section>
  );
}
