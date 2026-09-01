import Link from 'next/link';

import {
  PUBLIC_MARKET_COPY,
  localizedSeoulHref,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './public-market.module.css';

const destinations = [
  { id: 'check', label: 'Check', href: '/kr/seoul/check/' },
  { id: 'explore', label: 'Explore', href: '/kr/seoul/explore/' },
  { id: 'news', label: 'News', href: '/kr/seoul/news/' },
  { id: 'guide', label: 'Guide', href: '/kr/seoul/guide/' },
] as const;

export function PublicSectionTabs({
  current,
  locale = 'en',
}: Readonly<{
  current: 'check' | 'explore' | 'news' | 'guide';
  locale?: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].tabs;
  return (
    <nav className={styles.publicSectionTabs} aria-label={copy.ariaLabel}>
      <ul>
        {destinations.map((destination) => (
          <li key={destination.id}>
            <Link
              className={styles.publicSectionTabLink}
              href={localizedSeoulHref(destination.href, locale)}
              data-public-tab={destination.id}
              aria-current={destination.id === current ? 'page' : undefined}
            >
              {copy.labels[destination.id]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
