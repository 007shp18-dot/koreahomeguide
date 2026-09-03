import type {
  MarketOverviewRowModel,
  NavigationActionModel,
} from '../lib/route-model';
import { StatusLabel } from './status-label';

export interface MarketOverviewRowsProps {
  readonly rows: readonly MarketOverviewRowModel[];
  readonly actions: readonly NavigationActionModel[];
  readonly actionsLabel: string;
  readonly primaryAction: boolean;
}

export function MarketOverviewRows({
  rows,
  actions,
  actionsLabel,
  primaryAction,
}: MarketOverviewRowsProps) {
  const summaryRows = rows.slice(0, 4);
  const evidenceItems = rows[1]?.items.slice(0, 3) ?? [];
  return (
    <section className="market-overview site-shell" aria-label="Market overview details">
      <div className="market-overview-summary" aria-label="Market summary">
        {summaryRows.map((row) => (
          <article key={`summary-${row.number}`}>
            <span>{row.title}</span>
            <strong>{row.stateLabel}</strong>
            <small>{row.number === '04' ? `${row.items.length} declared limits` : row.description}</small>
          </article>
        ))}
      </div>
      <div className="market-overview-dashboard">
        <section aria-labelledby="coverage-profile-heading">
          <header><p>Coverage profile</p><h2 id="coverage-profile-heading">Evidence and decision readiness</h2></header>
          <div className="market-overview-bars">
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
      <div className="market-overview-rows">
        {rows.map((row) => (
          <article className="market-overview-row" key={row.number}>
            <header className="market-overview-row__label">
              <span className="market-overview-row__number">{row.number}</span>
              <h2>{row.title}</h2>
            </header>
            <div className="market-overview-row__content">
              <div className="market-overview-row__summary">
                <p>{row.description}</p>
                <StatusLabel state={row.state} label={row.stateLabel} />
              </div>
              {row.items.length > 0 ? (
                <ul className="market-overview-row__items">
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
      <div className="market-overview-actions-wrap">
        <nav
          className="market-overview-actions market-limitations__actions"
          aria-label={actionsLabel}
        >
          {actions.map((action, index) => (
            <a
              className={`market-overview-action ${primaryAction && index === 0 ? 'market-overview-action--primary' : 'market-overview-action--secondary'}`}
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
