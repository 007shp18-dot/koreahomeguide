import type { MarketCardModel } from '../lib/site-copy';

type MarketCardProps = {
  market: MarketCardModel;
};

export function MarketCard({ market }: MarketCardProps) {
  const headingId = `market-${market.id}`;

  return (
    <article className="market-card" aria-labelledby={headingId}>
      <header className="market-card__header">
        <p className="market-card__currency">{market.currency}</p>
        <h3 id={headingId}>{market.cityName}</h3>
        <p className="market-card__summary">{market.dataLabel}</p>
      </header>

      <dl className="market-card__depth">
        <div>
          <dt>{market.productDepthLabel}</dt>
          <dd>{market.productDepth}</dd>
        </div>
      </dl>

      <div className="market-card__rights">
        <p className="market-card__label">{market.dataRightsLabel}</p>
        <ul>
          {market.dataCapabilities.map((capability) => (
            <li key={`${capability.label}-${capability.state}`}>
              <span>{capability.label}</span>
              <span className={`market-status market-status--${capability.state}`}>
                {capability.stateLabel}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className="market-card__limits">
        <summary>{market.limitationsLabel}</summary>
        <ul>
          {market.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>

      <a className="market-card__link" href={market.overviewHref}>
        {market.overviewLabel}
        <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
