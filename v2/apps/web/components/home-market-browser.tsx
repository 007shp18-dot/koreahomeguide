'use client';

import { type KeyboardEvent, useState } from 'react';

import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomepageMarketModel, HomepageProductSlotModel } from '../lib/site-copy';

type HomeMarketBrowserProps = Readonly<{
  copy: {
    hero: {
      headline: string;
      description: string;
    };
    markets: {
      sectionLabel: string;
    };
  };
  markets: readonly HomepageMarketModel[];
  seoul: SeoulLiveModel;
}>;

const number = new Intl.NumberFormat('en-US');

function seoulSlotHref(
  slot: HomepageProductSlotModel,
  seoul: SeoulLiveModel,
): string | undefined {
  return seoul.links.find((link) => link.label === slot.label)?.href;
}

function MarketProduct({
  cityName,
  slot,
  href,
}: Readonly<{
  cityName: HomepageMarketModel['cityName'];
  slot: HomepageProductSlotModel;
  href?: string;
}>) {
  const contents = (
    <>
      <strong>{slot.label}</strong>
      <span>{slot.description}</span>
      <small>{slot.stateLabel}</small>
    </>
  );

  if (href !== undefined) {
    return (
      <a
        className="market-product market-product--available"
        href={href}
        aria-label={`${slot.label} ${cityName}`}
      >
        {contents}
      </a>
    );
  }

  return (
    <div
      className={`market-product market-product--${slot.state}`}
      aria-disabled="true"
    >
      {contents}
    </div>
  );
}

function SeoulEvidence({ model }: Readonly<{ model: SeoulLiveModel }>) {
  if (model.status === 'unavailable') {
    return (
      <div className="market-evidence market-evidence--unavailable" data-evidence-state="unavailable">
        <strong>{model.message}</strong>
        <span>The product routes stay open without substituting figures.</span>
      </div>
    );
  }

  return (
    <dl className="market-evidence-stats" aria-label={`Official contract counts for ${model.period}`}>
      <div className="market-evidence-stats__primary">
        <dt>All eligible</dt>
        <dd>{number.format(model.totalCount)}</dd>
      </div>
      <div>
        <dt>New contracts</dt>
        <dd>{number.format(model.newCount)}</dd>
      </div>
      <div>
        <dt>Renewals</dt>
        <dd>{number.format(model.renewalCount)}</dd>
      </div>
      <div>
        <dt>Unknown type</dt>
        <dd>{number.format(model.unknownCount)}</dd>
      </div>
      <div className="market-evidence-stats__period">
        <dt>Completed period</dt>
        <dd>{model.period}</dd>
      </div>
    </dl>
  );
}

export function HomeMarketBrowser({ copy, markets, seoul }: HomeMarketBrowserProps) {
  const [selectedId, setSelectedId] = useState(markets[0]?.tabId ?? 'seoul');

  function selectAndFocus(tabId: HomepageMarketModel['tabId']) {
    setSelectedId(tabId);
    document.getElementById(`market-tab-${tabId}`)?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % markets.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + markets.length) % markets.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = markets.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextMarket = markets[nextIndex];
    if (nextMarket !== undefined) selectAndFocus(nextMarket.tabId);
  }

  return (
    <section className="hero site-shell" aria-labelledby="home-headline">
      <div className="hero__copy">
        <div className="hero__statement">
          <h1 id="home-headline">{copy.hero.headline}</h1>
        </div>
        <p className="hero__description">{copy.hero.description}</p>
      </div>

      <div className="market-tabs" id="markets">
        <div
          className="market-tabs__list"
          role="tablist"
          aria-label="Choose a city"
        >
          {markets.map((market, index) => {
            const selected = market.tabId === selectedId;
            return (
              <button
                className={`market-tabs__trigger${selected ? ' market-tabs__trigger--active' : ''}`}
                id={`market-tab-${market.tabId}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`market-panel-${market.tabId}`}
                tabIndex={selected ? 0 : -1}
                type="button"
                key={market.id}
                onClick={() => setSelectedId(market.tabId)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {market.cityName}
              </button>
            );
          })}
        </div>

        {markets.map((market) => {
          const selected = market.tabId === selectedId;
          return (
            <section
              className="market-tabs__panel"
              id={`market-panel-${market.tabId}`}
              role="tabpanel"
              aria-labelledby={`market-tab-${market.tabId}`}
              hidden={!selected}
              tabIndex={0}
              data-seoul-live={market.tabId === 'seoul' ? seoul.status : undefined}
              key={market.id}
            >
              <header className="market-panel__header">
                <div>
                  <p>{market.eyebrow}</p>
                  <h2>{market.heading}</h2>
                </div>
                <p>{market.description}</p>
              </header>

              {market.tabId === 'seoul' ? <SeoulEvidence model={seoul} /> : null}

              <div className="home-market-products market-products" aria-label={`${market.cityName} product slots`}>
                {market.slots.map((slot) => (
                  <MarketProduct
                    cityName={market.cityName}
                    slot={slot}
                    href={market.tabId === 'seoul' ? seoulSlotHref(slot, seoul) : slot.href}
                    key={slot.id}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
