import type { MarketHeroModel } from '../lib/route-model';

export interface MarketHeroProps {
  readonly model: MarketHeroModel;
}

export function MarketHero({ model }: MarketHeroProps) {
  const headingId = 'market-page-heading';

  return (
    <section className="market-hero site-shell" aria-labelledby={headingId}>
      <div className="market-hero__statement">
        <p className="section-eyebrow">{model.eyebrow}</p>
        <h1 id={headingId}>{model.heading}</h1>
        <p className="market-hero__description">{model.description}</p>
      </div>
      <dl className="market-hero__facts" aria-label={model.sectionLabel}>
        {model.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
