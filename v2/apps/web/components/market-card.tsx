import type { MarketCardModel } from '../lib/site-copy';
import { StatusLabel } from './status-label';

type MarketCardProps = {
  market: MarketCardModel;
  intentLabel?: string;
  intentHref?: string;
  intentCapability?: MarketCardModel['intentCapabilities'][keyof MarketCardModel['intentCapabilities']];
};

export function MarketCard({
  market,
  intentLabel,
  intentHref,
  intentCapability,
}: MarketCardProps) {
  const headingId = `market-${market.id}`;
  const isFullProduct = market.productDepth === 'Full product';
  const primaryHref = isFullProduct && intentHref ? intentHref : market.overviewHref;
  const primaryLabel = isFullProduct && intentLabel
    ? `${intentLabel} in ${market.cityName}`
    : market.overviewLabel;

  return (
    <article className="market-card" aria-labelledby={headingId}>
      <header className="market-card__header">
        <p className="market-card__currency">{market.currency}</p>
        <div className="market-card__title-row">
          <h3 id={headingId}>
            <a href={market.overviewHref} aria-label={market.overviewLabel}>
              {market.cityName}
            </a>
          </h3>
          <span
            className={`market-tier${isFullProduct ? ' market-tier--full' : ' market-tier--intelligence'}`}
          >
            {market.productDepth}
          </span>
        </div>
        <p className="market-card__summary">{market.dataLabel}</p>
      </header>

      <div className="market-card__rights">
        <p className="market-card__label">{market.dataRightsLabel}</p>
        <ul>
          {intentCapability ? (
            <li key={`${intentCapability.label}-${intentCapability.state}`}>
              <span>{intentCapability.label}</span>
              <StatusLabel
                state={intentCapability.state}
                label={intentCapability.stateLabel}
              />
            </li>
          ) : null}
          {market.dataCapabilities.map((capability) => (
            <li key={`${capability.label}-${capability.state}`}>
              <span>{capability.label}</span>
              <StatusLabel state={capability.state} label={capability.stateLabel} />
            </li>
          ))}
        </ul>
      </div>

      <div className="market-card__limits">
        <p>{market.limitationsLabel}</p>
        <ul>
          {market.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>

      <div className="market-card__actions">
        <a className="market-card__intent-link" href={primaryHref}>
          {primaryLabel}
          <span aria-hidden="true">{isFullProduct ? '→' : '↗'}</span>
        </a>
      </div>
    </article>
  );
}
