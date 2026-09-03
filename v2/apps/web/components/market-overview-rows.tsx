import type {
  MarketOverviewRowModel,
  NavigationActionModel,
} from '../lib/route-model';
import { StatusLabel } from './status-label';
import styles from './market-dashboard.module.css';

export interface MarketOverviewRowsProps {
  readonly rows: readonly MarketOverviewRowModel[];
  readonly actions: readonly NavigationActionModel[];
  readonly actionsLabel: string;
  readonly primaryAction: boolean;
  readonly summaryItems?: readonly Readonly<{ label: string; value: string; detail: string }>[];
}

export function MarketOverviewRows({
  rows,
  actions,
  actionsLabel,
  primaryAction,
  summaryItems,
}: MarketOverviewRowsProps) {
  const summaryRows = rows.slice(0, 4);
  const summaries = summaryItems ?? summaryRows.map((row) => ({
    label: row.title,
    value: row.stateLabel,
    detail: row.number === '04' ? `${row.items.length} declared limits` : row.description,
  }));
  const evidenceItems = rows[1]?.items.slice(0, 3) ?? [];
  return (
    <section className={styles.overview} aria-label="Market overview details" data-market-overview="true">
      <nav className={styles.tabs} aria-label="Market overview sections">
        <a href="#overview">Overview</a><a href="#evidence">Evidence</a><a href="#decisions">Decisions</a><a href="#limitations">Limitations</a><a href="#source">Source</a>
      </nav>
      <div className={styles.summary} id="overview" aria-label="Market summary">
        {summaries.slice(0, 4).map((item) => (
          <article key={`summary-${item.label}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>
      <div className={styles.dashboard}>
        <section aria-labelledby="coverage-profile-heading">
          <header><p>Coverage profile</p><h2 id="coverage-profile-heading">Evidence and decision readiness</h2></header>
          <div className={styles.bars}>
            {rows.slice(0, 3).map((row) => (
              <div data-overview-state={row.state} key={`bar-${row.number}`}>
                <span>{row.title}</span><i aria-hidden="true"><b /></i><strong>{row.stateLabel}</strong>
              </div>
            ))}
          </div>
        </section>
        <aside aria-labelledby="market-support-heading">
          <header><p>Market notes</p><h2 id="market-support-heading">What is usable now</h2></header>
          {evidenceItems.length === 0 ? <p>Open the detailed rows for the current publication boundary.</p> : <ul>{evidenceItems.map((item) => <li key={item.label}><span aria-hidden="true" /><p><strong>{item.label}</strong><small>{item.description}</small></p></li>)}</ul>}
        </aside>
      </div>
      <div className={styles.rows}>
        {rows.map((row) => (
          <article className={styles.row} data-overview-row={row.number} id={row.number === '02' ? 'evidence' : row.number === '03' ? 'decisions' : row.number === '04' ? 'limitations' : row.number === '06' ? 'source' : undefined} key={row.number}>
            <header className={styles.rowLabel}>
              <span>{row.number}</span>
              <h2>{row.title}</h2>
            </header>
            <div className={styles.rowContent}>
              <div className={styles.rowSummary}>
                <p>{row.description}</p>
                <StatusLabel state={row.state} label={row.stateLabel} />
              </div>
              {row.items.length > 0 ? (
                <ul>
                  {row.items.map((item) => (
                    <li key={`${item.label}-${item.state ?? 'plain'}`}>
                      <div>
                        {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                        {item.description ? <small>{item.description}</small> : null}
                      </div>
                      {item.state && item.stateLabel ? (
                        <StatusLabel state={item.state} label={item.stateLabel} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <div>
        <nav
          className={styles.actions}
          aria-label={actionsLabel}
        >
          {actions.map((action, index) => (
            <a
              className={primaryAction && index === 0 ? styles.primary : undefined}
              href={action.href}
              aria-label={action.label}
              rel={action.external ? 'external noreferrer' : undefined}
              key={action.href}
            >
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
