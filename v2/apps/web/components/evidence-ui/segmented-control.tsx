import Link from 'next/link';

import styles from './evidence-ui.module.css';

export function SegmentedControl<T extends string>({
  label,
  value,
  items,
}: Readonly<{
  label: string;
  value: T;
  items: readonly Readonly<{
    value: T;
    label: string;
    href: string;
  }>[];
}>) {
  return (
    <nav className={styles.segmentedControl} aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          aria-current={item.value === value ? 'page' : undefined}
          scroll={false}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
