import Link from 'next/link';

import styles from './market-shell.module.css';
import detailStyles from './detail-layout.module.css';
import { ResponsiveResultsPanel, type ResultsPanelLabels } from './responsive-results-panel';
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

export function MarketExploreShell({ locale = 'en',  eyebrow, title, period, layers, discovery, spatial, discoveryPanel, priceGuide, history, related }: Readonly<{
  eyebrow: string;
  title: string;
  period: React.ReactNode;
  layers: React.ReactNode;
  discovery: React.ReactNode;
  spatial?: React.ReactNode;
  discoveryPanel?: ResultsPanelLabels;
  priceGuide?: React.ReactNode;
  history?: React.ReactNode;
  related?: React.ReactNode;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <div className={styles.explore} data-market-explore-shell="true">
    <header className="explore-page-heading">
      <h1>{t(title)}</h1>
      <p>{t(eyebrow)}{t(" · ")}{t(period)}</p>
    </header>
    {priceGuide}
    {t(layers)}
    {history}
    <div className={styles.exploreGrid} data-layout={spatial == null ? 'list' : 'split'}>
      <section className={styles.discovery} data-market-shell-region="discovery">{discoveryPanel
        ? <ResponsiveResultsPanel labels={discoveryPanel}>{t(discovery)}</ResponsiveResultsPanel>
        : t(discovery)}</section>
      {spatial == null ? null : <section className={styles.spatial} data-market-shell-region="spatial">{t(spatial)}</section>}
    </div>
    {related}
  </div>;
}

export function MarketDetailShell({ locale = 'en',  breadcrumb, identity, metric, evidence, rail, media, summary, sections, related }: Readonly<{
  breadcrumb: React.ReactNode;
  sections?: readonly Readonly<{ id: string; label: string }>[];
  identity?: React.ReactNode;
  metric?: React.ReactNode;
  summary?: React.ReactNode;
  evidence: React.ReactNode;
  rail: React.ReactNode;
  media?: React.ReactNode;
  related?: React.ReactNode;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <article className={`${styles.detail} ${detailStyles.root}`} data-detail-layout="unified" data-market-detail-shell="true">
    <div className={styles.breadcrumb}>{t(breadcrumb)}</div>
    {summary ? <>
      <div id="detail-overview">{summary}</div>
      {media ? <div className={styles.summaryMedia} data-detail-media="true">{t(media)}</div> : null}
    </> : <header className={styles.identity} data-has-media={media ? "true" : "false"}><div>{t(identity)}</div>{media ? <div className={styles.heroMedia}>{t(media)}</div> : null}</header>}
    <nav className={styles.detailTabs} aria-label={t("Detail sections")}>{(sections ?? [
      { id: 'detail-overview', label: 'Overview' },
      { id: 'detail-evidence', label: 'Transactions' },
      { id: 'detail-source', label: 'Source' },
    ]).map(section => <a key={section.id} href={`#${section.id}`}>{t(section.label)}</a>)}</nav>
    {metric ? <section className={styles.detailSummary} id={summary ? undefined : "detail-overview"}><div>{t(metric)}</div></section> : null}
    <div className={styles.detailGrid}>
      <div className={styles.detailMain}>
        <div id="detail-evidence">{t(evidence)}</div>
      </div>
      <aside className={styles.detailRail} id="detail-source">{t(rail)}</aside>
    </div>
    {related}
  </article>;
}
