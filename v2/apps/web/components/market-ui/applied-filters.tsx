import Link from 'next/link';
import styles from './explore-controls.module.css';

export type AppliedFilter = Readonly<{ id: string; label: string; href: string }>;

export function AppliedFilters({ items, label, removeLabel, clearLabel, clearHref }: {
  items: readonly AppliedFilter[]; label: string; removeLabel: string; clearLabel: string; clearHref: string;
}) {
  if (!items.length) return null;
  return <nav className={styles.filters} aria-label={label}>
    {items.map(item => <Link key={item.id} href={item.href} className={styles.chip}
      prefetch={false} scroll={false} aria-label={`${removeLabel}: ${item.label}`}>
      <span>{item.label}</span><span aria-hidden="true">×</span>
    </Link>)}
    <Link href={clearHref} className={styles.clear} prefetch={false} scroll={false}>{clearLabel}</Link>
  </nav>;
}

/** State-backed explorers use the same removable conditions as URL-backed results. */
export function AppliedFilterButtons({ items, label, removeLabel, clearLabel, onClear }: {
  items: readonly Readonly<{ id: string; label: string; onRemove: () => void }>[];
  label: string; removeLabel: string; clearLabel: string; onClear: () => void;
}) {
  if (!items.length) return null;
  return <nav className={styles.filters} aria-label={label}>
    {items.map(item => <button key={item.id} type="button" className={styles.chip}
      onClick={item.onRemove} aria-label={`${removeLabel}: ${item.label}`}>
      <span>{item.label}</span><span aria-hidden="true">×</span>
    </button>)}
    <button type="button" className={styles.clear} onClick={onClear}>{clearLabel}</button>
  </nav>;
}
