import Link from 'next/link';

import styles from './market-shell.module.css';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';


export type MarketLayerItem = Readonly<{
  id: string;
  label: string;
  href: string;
  current?: boolean;
}>;

export function MarketLayerControl({ locale = 'en',  label, items }: Readonly<{
  label: string;
  items: readonly MarketLayerItem[];
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <nav className={styles.layers} aria-label={t(label)}>
    {items.map((item) => <Link
      key={item.id}
      href={marketHref(locale, item.href)}
      aria-current={item.current ? 'page' : undefined}
    >{t(item.label)}</Link>)}
  </nav>;
}

export function MarketExploreShell({ locale = 'en',  eyebrow, title, period, layers, discovery, spatial }: Readonly<{
  eyebrow: string;
  title: string;
  period: React.ReactNode;
  layers: React.ReactNode;
  discovery: React.ReactNode;
  spatial: React.ReactNode;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <div className={styles.explore} data-market-explore-shell="true">
    <header className="explore-page-heading">
      <h1>{t(title)}</h1>
      <p>{t(eyebrow)}{t(" · ")}{t(period)}</p>
    </header>
    {t(layers)}
    <div className={styles.exploreGrid}>
      <section className={styles.discovery} data-market-shell-region="discovery">{t(discovery)}</section>
      <section className={styles.spatial} data-market-shell-region="spatial">{t(spatial)}</section>
    </div>
  </div>;
}

export function MarketDetailShell({ locale = 'en',  breadcrumb, identity, metric, evidence, rail, media }: Readonly<{
  breadcrumb: React.ReactNode;
  identity: React.ReactNode;
  metric: React.ReactNode;
  evidence: React.ReactNode;
  rail: React.ReactNode;
  media?: React.ReactNode;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <article className={styles.detail} data-market-detail-shell="true">
    <div className={styles.breadcrumb}>{t(breadcrumb)}</div>
    <header className={styles.identity} data-has-media={media ? "true" : "false"}><div>{t(identity)}</div><div className={styles.heroMedia}>{t(media ?? metric)}</div></header>
    <nav className={styles.detailTabs} aria-label={t("Detail sections")}><a href={marketHref(locale, "#detail-overview")}>{t("Overview")}</a><a href={marketHref(locale, "#detail-evidence")}>{t("Transactions")}</a><a href={marketHref(locale, "#detail-source")}>{t("Source")}</a></nav>
    <section className={styles.detailSummary} id="detail-overview"><div>{t(metric)}</div><p>{t("Reported transaction history. See the source and reporting period below.")}</p></section>
    <div className={styles.detailGrid}>
      <div className={styles.detailMain}>
        <div id="detail-evidence">{t(evidence)}</div>
      </div>
      <aside className={styles.detailRail} id="detail-source">{t(rail)}</aside>
    </div>
  </article>;
}
