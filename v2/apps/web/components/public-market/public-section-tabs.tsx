import Link from 'next/link';

import styles from './public-market.module.css';

const destinations = [
  { id: 'check', label: 'Check', href: '/kr/' },
  { id: 'explore', label: 'Explore', href: '/kr/seoul/explore/' },
] as const;

export function PublicSectionTabs({
  current,
}: Readonly<{ current: 'check' | 'explore' }>) {
  return (
    <nav className={styles.publicSectionTabs} aria-label="Public evidence sections">
      <ul>
        {destinations.map((destination) => (
          <li key={destination.id}>
            <Link
              className={styles.publicSectionTabLink}
              href={destination.href}
              data-public-tab={destination.id}
              aria-current={destination.id === current ? 'page' : undefined}
            >
              {destination.label}
            </Link>
          </li>
        ))}
        {(['news', 'guide'] as const).map((id) => (
          <li key={id}>
            <span
              className={styles.publicSectionTabFuture}
              data-public-tab={id}
              aria-disabled="true"
            >
              <span>{id === 'news' ? 'News' : 'Guide'}</span>
              <small>Future</small>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
