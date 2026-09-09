import type { ReactNode } from 'react';
import styles from './market-summary.module.css';

export type MarketSummaryProps = Readonly<{
  title: string;
  location: string;
  context: string;
  metric: Readonly<{ label: string; value: string; note?: string; secondary?: string }>;
  facts: readonly Readonly<{ label: string; value: string }>[];
  actions?: ReactNode;
  trend?: ReactNode;
  id?: string;
  kind?: 'building' | 'project' | 'area';
  locale?: 'en' | 'ko';
}>;

/** Presentational only: each market supplies the meaning, scope and available facts. */
export function MarketSummary({ title, location, context, metric, facts, actions, trend, id, kind = 'building', locale = 'en' }: MarketSummaryProps) {
  return <section id={id} className={styles.card} data-building-summary={kind === 'building' ? 'true' : undefined} data-market-summary="true" data-summary-kind={kind} data-building-section={kind === 'building' ? 'identity' : undefined} data-identity-hero="true" lang={locale}>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
    <div className={styles.overview} data-has-trend={Boolean(trend)}>
      <header className={styles.identity} data-detail-order="identity">
        <p className={styles.context}>{context}</p>
        <h1>{title}</h1>
        <p className={styles.location}>{location}</p>
      </header>
      <div className={styles.price} data-detail-order="current-evidence">
        <p className={styles.metricLabel}>{metric.label}</p>
        <strong className={styles.metricValue}>{metric.value}</strong>
        {metric.secondary ? <p className={styles.secondary}>{metric.secondary}</p> : null}
        {metric.note ? <p className={styles.metricNote}>{metric.note}</p> : null}
      </div>
      {trend ? <div className={styles.trend}>{trend}</div> : null}
    </div>
    {facts.length ? <dl className={styles.facts}>{facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
  </section>;
}
