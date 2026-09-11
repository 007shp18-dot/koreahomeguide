import Link from 'next/link';

import type { NewsCardModel } from '../../lib/news/news-card-model';
import type { ProductLocale } from '../../lib/locale/product-copy';
import styles from './detail-news-list.module.css';

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
};

export function DetailNewsList({ news, locale = 'en' }: Readonly<{ news: readonly NewsCardModel[]; locale?: ProductLocale }>) {
  const date = new Intl.DateTimeFormat(locale, dateOptions);
  return (
    <section className={styles.news} aria-labelledby="detail-news-heading">
      <header className={styles.heading}>
        <p>{locale === 'ko' ? '관련 소식' : locale === 'zh-CN' ? '已核验背景' : 'Verified context'}</p>
        <h2 id="detail-news-heading">{locale === 'ko' ? '최근 확인된 소식' : locale === 'zh-CN' ? '最新核验新闻' : 'Latest verified News'}</h2>
      </header>

      {news.length === 0 ? (
        <p className={styles.empty}>
          {locale === 'ko' ? '이 조건에 맞는 검증된 소식이 없습니다. 확인되지 않은 수치를 대신 표시하지 않습니다.' : locale === 'zh-CN' ? '暂无符合当前范围且证据完备的简报。SignedPrice不会以未核验数字替代。' : 'No evidence-ready brief is available for this view. SignedPrice does not substitute an unverified number.'}
        </p>
      ) : (
        <ol className={styles.list}>
          {news.map((record) => (
            <li key={record.id}>
              <article>
                <time dateTime={record.publishedAt}>
                  {date.format(new Date(record.publishedAt))}
                </time>
                <h3><Link href={record.href}>{record.title}{locale === 'ko' ? ' (영문)' : locale === 'zh-CN' ? '（英文）' : ''}</Link></h3>
                <p>{record.summary}</p>
                <p className={styles.evidence} data-news-evidence={record.evidenceStatus}>
                  <strong>{locale === 'ko' ? '자료 기준:' : locale === 'zh-CN' ? '数据依据：' : 'Our data:'}</strong> {record.evidenceLine}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}

      <Link className={styles.allNews} href={locale === 'ko' ? '/ko/news/?market=seoul' : locale === 'zh-CN' ? '/zh-cn/news/?market=seoul' : '/kr/seoul/news/'}>{locale === 'ko' ? '서울 소식 모두 보기' : locale === 'zh-CN' ? '查看全部首尔新闻' : 'Read all Seoul News'}</Link>
    </section>
  );
}
