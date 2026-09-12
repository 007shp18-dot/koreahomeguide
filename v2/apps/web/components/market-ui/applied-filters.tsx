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
