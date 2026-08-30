import type {
  MarketOverviewRowModel,
  NavigationActionModel,
} from '../lib/route-model';
import { StatusLabel } from './status-label';

export interface IntentDecisionRowsProps {
  readonly rows: readonly MarketOverviewRowModel[];
  readonly actions: readonly NavigationActionModel[];
  readonly actionsLabel: string;
}

export function IntentDecisionRows({
  rows,
  actions,
  actionsLabel,
}: IntentDecisionRowsProps) {
  return (
    <section className="intent-decision site-shell" aria-label="Decision details">
      <div className="intent-decision-rows">
        {rows.map((row) => (
          <article className="intent-decision-row" key={row.number}>
            <header className="intent-decision-row__label">
              <span className="intent-decision-row__number">{row.number}</span>
              <h2>{row.title}</h2>
            </header>
            <div className="intent-decision-row__content">
              <div className="intent-decision-row__summary">
                <p>{row.description}</p>
                <StatusLabel state={row.state} label={row.stateLabel} />
              </div>
              {row.items.length > 0 ? (
                <ul className="intent-decision-row__items">
                  {row.items.map((item) => (
                    <li key={`${item.label}-${item.state ?? 'plain'}`}>
                      <div>
                        <strong>{item.label}</strong>
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
              className={`market-overview-action ${index === 0 ? 'market-overview-action--primary' : 'market-overview-action--secondary'}`}
              href={action.href}
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
