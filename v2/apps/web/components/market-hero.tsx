import type { MarketHeroModel } from '../lib/route-model';
import { StatusLabel } from './status-label';

export interface MarketHeroProps {
  readonly model: MarketHeroModel;
}

export function MarketHero({ model }: MarketHeroProps) {
  const headingId = 'market-page-heading';

  return (
    <section
      className={`market-hero${model.layout === 'overview' ? ' market-hero--overview' : ''} site-shell`}
      aria-labelledby={headingId}
    >
      <div className="market-hero__statement">
        <div className="market-hero__kicker">
          <p className="section-eyebrow">{model.eyebrow}</p>
          {model.tier ? (
            <span className="market-hero__tier">
              <StatusLabel state={model.tier.state} label={model.tier.label} />
            </span>
          ) : null}
        </div>
        <h1 id={headingId}>{model.heading}</h1>
        <p className="market-hero__description">{model.description}</p>
      </div>
      {model.facts.length > 0 ? (
        <dl className="market-hero__facts" aria-label={model.sectionLabel}>
          {model.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
