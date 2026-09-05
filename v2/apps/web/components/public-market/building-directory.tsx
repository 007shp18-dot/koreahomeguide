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
        {entries.length} buildings meet the current evidence publication threshold.{' '}
        Counts show contracts in each building’s widest published cohort.
      </p>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.buildingId}>
            <Link className={styles.link} href={entry.href}>
              <span className={styles.identity}>
                <strong>{entry.name}</strong>
                <span>{entry.neighborhoodName}</span>
              </span>
              <span className={styles.contracts}>{entry.contracts.toLocaleString('en-US')} contracts</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
