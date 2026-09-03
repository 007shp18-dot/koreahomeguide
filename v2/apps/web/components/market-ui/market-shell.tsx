import Link from 'next/link';

import styles from './market-shell.module.css';

export type MarketLayerItem = Readonly<{
  id: string;
  label: string;
  href: string;
  current?: boolean;
}>;

export function MarketLayerControl({ label, items }: Readonly<{
  label: string;
  items: readonly MarketLayerItem[];
}>) {
  return <nav className={styles.layers} aria-label={label}>
    {items.map((item) => <Link
      key={item.id}
      href={item.href}
      aria-current={item.current ? 'page' : undefined}
    >{item.label}</Link>)}
  </nav>;
}

export function MarketExploreShell({ eyebrow, title, period, layers, discovery, spatial }: Readonly<{
  eyebrow: string;
  title: string;
  period: React.ReactNode;
  layers: React.ReactNode;
  discovery: React.ReactNode;
  spatial: React.ReactNode;
}>) {
  return <div className={styles.explore} data-market-explore-shell="true">
    <header className={styles.exploreHeader}>
      <div><p>{eyebrow}</p><h1>{title}</h1></div>
      <div className={styles.period}>{period}</div>
    </header>
    {layers}
    <div className={styles.exploreGrid}>
      <section className={styles.discovery} data-market-shell-region="discovery">{discovery}</section>
      <section className={styles.spatial} data-market-shell-region="spatial">{spatial}</section>
    </div>
  </div>;
}

export function MarketDetailShell({ breadcrumb, identity, metric, evidence, rail }: Readonly<{
  breadcrumb: React.ReactNode;
  identity: React.ReactNode;
  metric: React.ReactNode;
  evidence: React.ReactNode;
  rail: React.ReactNode;
}>) {
  return <article className={styles.detail} data-market-detail-shell="true">
    <div className={styles.breadcrumb}>{breadcrumb}</div>
    <div className={styles.detailGrid}>
      <main className={styles.detailMain}>
        <header className={styles.identity}><div>{identity}</div><div className={styles.metric}>{metric}</div></header>
        {evidence}
      </main>
      <aside className={styles.detailRail}>{rail}</aside>
    </div>
  </article>;
}
