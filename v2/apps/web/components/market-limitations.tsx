import type { MarketLimitationsModel } from '../lib/route-model';

export interface MarketLimitationsProps {
  readonly model: MarketLimitationsModel;
}

export function MarketLimitations({ model }: MarketLimitationsProps) {
  const headingId = `${model.sectionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`;

  return (
    <section className="market-limitations site-shell" aria-labelledby={headingId}>
      <div className="market-limitations__copy">
        <p className="section-eyebrow">{model.eyebrow}</p>
        <h2 id={headingId}>{model.heading}</h2>
        <p>{model.description}</p>
        <ul>
          {model.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <nav className="market-limitations__actions" aria-label={model.actionsLabel}>
        {model.actions.map((action) => (
          <a
            className="route-action"
            href={action.href}
            key={action.href}
            rel={action.external ? 'external noreferrer' : undefined}
          >
            <span>{action.label}</span>
            <small>{action.description}</small>
          </a>
        ))}
      </nav>
    </section>
  );
}
