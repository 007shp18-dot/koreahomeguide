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
  return (
    <section className="market-overview site-shell" aria-label="Market overview details">
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
