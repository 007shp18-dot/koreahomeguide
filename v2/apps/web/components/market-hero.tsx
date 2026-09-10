import type { ReactNode } from 'react';

import type { MarketHeroModel } from '../lib/route-model';
import { StatusLabel } from './status-label';
import styles from './market-dashboard.module.css';

export interface MarketHeroProps {
  readonly model: MarketHeroModel;
  readonly media?: ReactNode;
}

export function MarketHero({ model, media }: MarketHeroProps) {
  const headingId = 'market-page-heading';

  return (
    <section
      className={styles.hero}
      aria-labelledby={headingId}
      data-product-intro="true"
      data-market-hero="overview"
    >
      <div className={styles.statement}>
        <div className={styles.kicker}>
          <p className={styles.eyebrow}>{model.eyebrow}</p>
          {model.tier ? (
            <span className={styles.tier} data-market-tier="true">
              <StatusLabel state={model.tier.state} label={model.tier.label} />
            </span>
          ) : null}
        </div>
        <h1 id={headingId}>{model.heading}</h1>
        <p>{model.description}</p>
      </div>
      <div className={styles.media}>
        {media ?? <div className={styles.mediaFallback}><strong>{model.heading} property market</strong></div>}
      </div>
      {model.facts.length > 0 ? (
        <dl className={styles.facts} aria-label={model.sectionLabel}>
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
