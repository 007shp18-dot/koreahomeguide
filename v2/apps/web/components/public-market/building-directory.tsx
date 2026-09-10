import Link from 'next/link';

import type { KoreaBuildingDirectoryEntry } from '@/lib/public-market/korea-building-index-policy';

import styles from './building-directory.module.css';

export function BuildingDirectory({
  districtName,
  entries,
}: Readonly<{
  districtName: string;
  entries: readonly KoreaBuildingDirectoryEntry[];
}>) {
  if (entries.length === 0) return null;

  return (
    <nav className={styles.directory} aria-labelledby="building-directory-heading">
      <h2 id="building-directory-heading">Buildings published for {districtName}</h2>
      <p className={styles.summary}>
        {entries.length} buildings have reported transaction histories.{' '}
        Counts show the largest available transaction group. Price summaries require at least five contracts.
      </p>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.buildingId}>
            <Link className={styles.link} href={entry.href}>
              <span className={styles.identity}>
                <strong>{entry.name}</strong>
                <span>{entry.neighborhoodName}</span>
              </span>
              <span className={styles.contracts}>
                {entry.contracts.toLocaleString('en-US')} contracts
              </span>
            </Link>
            <Link className={styles.translation} lang="ko" href={`/ko${entry.href}`}>
              {entry.name} 한국어 실거래가
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
