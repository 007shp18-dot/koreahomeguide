import Link from 'next/link';

import type { KoreaNeighborhoodDirectoryEntry } from '@/lib/public-market/korea-building-index-policy';

import styles from './building-directory.module.css';

export function NeighborhoodDirectory({
  districtName,
  entries,
}: Readonly<{
  districtName: string;
  entries: readonly KoreaNeighborhoodDirectoryEntry[];
}>) {
  if (entries.length === 0) return null;

  return (
    <nav className={styles.directory} aria-labelledby="neighborhood-directory-heading">
      <h2 id="neighborhood-directory-heading">
        Neighborhood building directories in {districtName}
      </h2>
      <p className={styles.summary}>
        {entries.length} neighborhoods contain buildings that meet the current evidence publication threshold.
      </p>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.neighborhoodId}>
            <Link className={styles.link} href={entry.href}>
              <span className={styles.identity}>
                <strong lang="ko">{entry.name}</strong>
                <span>Published building evidence</span>
              </span>
              <span className={styles.contracts}>
                {entry.buildings.toLocaleString('en-US')} buildings
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
