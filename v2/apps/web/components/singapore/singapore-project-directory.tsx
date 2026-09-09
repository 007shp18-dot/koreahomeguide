'use client';

import Link from 'next/link';
import { memo } from 'react';
import { usePassportLocation } from '../passport/passport-journey';
import { retainPassportContext } from '../../lib/passport/journey';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import type { SingaporeSegmentListItem } from '../../lib/singapore/route-types';
import styles from '../public-market/building-directory.module.css';

export const SingaporeProjectDirectory = memo(function SingaporeProjectDirectory({ segments, locale }: Readonly<{
  segments: readonly SingaporeSegmentListItem[]; locale: MarketLocale;
}>) {
  const current = usePassportLocation();
  const href = (path: string) => retainPassportContext(marketHref(locale, path), current, true);
  return <details className={styles.directory}>
    <summary>{sgText(locale, 'All published project prices')}</summary>
    <p className={styles.summary}>{sgText(locale, 'Browse every published project by market region, including projects beyond the current result page.')}</p>
    {segments.map((segment) => <section key={segment.code}>
      <h2>{segment.state === 'published' ? <Link prefetch={false} href={href(segment.href)}>{sgText(locale, segment.code)}{sgText(locale, ' property prices')}</Link> : `${segment.code} projects`}</h2>
      <ul className={styles.list}>
        {(segment.projects ?? []).filter((project) => project.state === 'published').map((project) => <li key={project.id}>
          <Link prefetch={false} className={styles.link} href={href(project.href)}>{project.name}</Link>
        </li>)}
      </ul>
    </section>)}
  </details>;
});
