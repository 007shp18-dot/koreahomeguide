'use client';

import type { Intent } from '@signedprice/market-core';
import { useState } from 'react';
import type { IntentGroupModel, MarketCardModel } from '../lib/site-copy';
import { IntentTabs } from './intent-tabs';
import { MarketCard } from './market-card';

type HomeMarketBrowserProps = {
  copy: {
    hero: {
      eyebrow: string;
      headline: string;
      description: string;
      intentHeading: string;
      intentDescription: string;
      intentNavigationLabel: string;
    };
    markets: {
      sectionLabel: string;
      eyebrow: string;
      heading: string;
      description: string;
    };
  };
  groups: readonly IntentGroupModel[];
  markets: readonly MarketCardModel[];
};

export function HomeMarketBrowser({
  copy,
  groups,
  markets,
}: HomeMarketBrowserProps) {
  const [intent, setIntent] = useState<Intent>('rent');
  const activeGroup = groups.find((group) => group.id === intent) ?? groups[0];

  return (
    <>
      <section className="hero site-shell" aria-labelledby="home-headline">
        <div className="hero__copy">
          <div className="hero__statement">
            <h1 id="home-headline">{copy.hero.headline}</h1>
          </div>
          <p className="hero__description">{copy.hero.description}</p>
        </div>
        <div className="hero__intents">
          <div className="hero__intents-heading">
            <h2>{copy.hero.intentHeading}</h2>
            <p>{copy.hero.intentDescription}</p>
          </div>
          <IntentTabs
            label={copy.hero.intentNavigationLabel}
            groups={groups}
            selectedId={intent}
            onSelect={setIntent}
          />
        </div>
      </section>

      <section
        className="markets site-shell"
        id="markets"
        aria-label={copy.markets.sectionLabel}
      >
        <div className="section-heading">
          <div>
            <h2>{activeGroup?.label ?? 'Rent'} — market depth</h2>
          </div>
          <p>{copy.markets.description}</p>
        </div>
        <div className="market-grid">
          {markets.map((market, index) => {
            const destination = activeGroup?.destinations[index];
            const intentCapability = market.intentCapabilities[intent];

            return (
              <MarketCard
                key={market.id}
                market={market}
                intentLabel={activeGroup?.label ?? 'Rent'}
                intentHref={destination?.href ?? market.overviewHref}
                intentCapability={intentCapability}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
