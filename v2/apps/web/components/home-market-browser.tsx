'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { HomepageMarketModel } from '../lib/site-copy';
import { NaverBuildingStreetView } from './maps/naver-building-street-view';
import styles from './home-editorial.module.css';

type HomeMarketBrowserProps = Readonly<{
  copy: {
    hero: { headline: string; description: string };
    markets: { sectionLabel: string };
  };
  markets: readonly HomepageMarketModel[];
  seoul: SeoulLiveModel;
  featuredBuildings: readonly HomeFeaturedBuilding[];
  naverMapClientId: string | null;
}>;

type DecisionIntent = 'rent' | 'buy' | 'invest';
const intents = ['rent', 'buy', 'invest'] as const satisfies readonly DecisionIntent[];
const number = new Intl.NumberFormat('en-US');

function DecisionEntry({ intent }: Readonly<{ intent: DecisionIntent }>) {
  if (intent === 'rent') {
    return (
      <div className={styles.decisionActions} aria-live="polite">
        <form className={styles.searchForm} action="/kr/seoul/explore/" method="get" role="search">
          <label htmlFor="home-building-search">Search a city, district or building</label>
          <div>
            <input id="home-building-search" name="q" type="search" autoComplete="off" placeholder="Try Mapo-gu or Gongdeok" />
            <button type="submit" aria-label="Search signed prices">→</button>
          </div>
        </form>
        <Link href="/kr/seoul/check/">Compare two rent offers →</Link>
      </div>
    );
  }

  const staged = intent === 'buy'
    ? { title: 'Sale evidence is available.', description: 'Check completed sale records without treating them as active listings.', href: '/kr/seoul/buy/', label: 'Open the Buy evidence path' }
    : { title: 'Investment service is preparing.', description: 'Personalized recommendations stay closed while cost, rights and operating gates are reviewed.', href: '/invest/', label: 'See what is being prepared' };

  return (
    <div className={styles.decisionUnavailable} aria-live="polite">
      <span className={styles.preparing}>{intent === 'invest' ? 'Service preparing' : 'Evidence only'}</span>
      <strong>{staged.title}</strong>
      <p>{staged.description}</p>
      <Link href={staged.href}>{staged.label} →</Link>
    </div>
  );
}

function MarketPulse({ market, index, seoul }: Readonly<{
  market: HomepageMarketModel;
  index: number;
  seoul: SeoulLiveModel;
}>) {
  const available = market.slots.filter((slot) => slot.state === 'available').length;
  const href = market.tabId === 'seoul' ? '/kr/seoul/' : market.tabId === 'singapore' ? '/sg/' : '/ae/dubai/';
  const headline = market.tabId === 'seoul' && seoul.status === 'ready'
    ? number.format(seoul.totalCount)
    : market.tabId === 'seoul'
      ? 'Evidence status'
    : market.tabId === 'singapore'
      ? `${available} live layer${available === 1 ? '' : 's'}`
      : 'Rights review';
  const detail = market.tabId === 'seoul' && seoul.status === 'ready'
    ? `Verified contracts · ${seoul.period}`
    : market.tabId === 'seoul'
      ? 'Open Explore for the current data state'
    : market.tabId === 'singapore'
      ? 'URA-linked market intelligence'
      : 'No unsupported transaction figures';

  return (
    <Link href={href} className={`${styles.pulseCard} ${styles[`pulse${index + 1}`]}`}>
      <span>{market.cityName}</span>
      <strong>{headline}</strong>
      <small>{detail}</small>
    </Link>
  );
}

export function HomeMarketBrowser({ copy, markets, seoul, featuredBuildings, naverMapClientId }: HomeMarketBrowserProps) {
  const [intent, setIntent] = useState<DecisionIntent>('rent');
  const [selectedBuildingId, setSelectedBuildingId] = useState(featuredBuildings[0]?.id ?? null);
  const seoulMarket = markets.find(({ tabId }) => tabId === 'seoul') ?? markets[0];
  const selectedBuilding = featuredBuildings.find(({ id }) => id === selectedBuildingId)
    ?? featuredBuildings[0];

  return (
    <>
      <section className={styles.hero} id="home-decision" aria-labelledby="home-headline">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Global property intelligence</p>
            <h1 id="home-headline">{copy.hero.headline}</h1>
            <p className={styles.deck}>{copy.hero.description}</p>
            <div className={styles.intentTabs} role="group" aria-label="Choose a property decision">
              {intents.map((candidate) => (
                <button type="button" aria-pressed={intent === candidate} onClick={() => setIntent(candidate)} key={candidate}>
                  {candidate[0]!.toUpperCase() + candidate.slice(1)}
                </button>
              ))}
            </div>
            <DecisionEntry intent={intent} />
            <nav className={styles.marketShortcuts} aria-label="Quick market links">
              <Link href="/kr/seoul/">Korea →</Link>
              <Link href="/sg/">Singapore →</Link>
              <Link href="/ae/dubai/">Dubai →</Link>
            </nav>
          </div>

          <div className={styles.marketPanels} id="home-market-preview">
            <section className={styles.marketPanel} data-home-market="seoul" data-seoul-live={seoul.status}>
              {selectedBuilding === undefined ? <div className={styles.globalVisual} aria-label="Seoul, Singapore and Dubai market coverage">
                <span className={styles.orbitOne} aria-hidden="true" />
                <span className={styles.orbitTwo} aria-hidden="true" />
                <span className={styles.orbitThree} aria-hidden="true" />
                <span className={styles.citySeoul}>SEOUL</span>
                <span className={styles.citySingapore}>SINGAPORE</span>
                <span className={styles.cityDubai}>DUBAI</span>
                {markets.map((market, index) => <MarketPulse key={market.id} market={market} index={index} seoul={seoul} />)}
              </div> : (
                <div className={styles.featuredBuildingVisual}>
                  <NaverBuildingStreetView
                    key={selectedBuilding.id}
                    clientId={naverMapClientId}
                    buildingName={selectedBuilding.name}
                    latitude={selectedBuilding.latitude}
                    longitude={selectedBuilding.longitude}
                    addressQuery={selectedBuilding.addressQuery}
                    mapHref={selectedBuilding.href}
                  />
                  <div className={styles.featuredBuildingCaption}>
                    <span>Seoul · Verified building identity</span>
                    <h2>{selectedBuilding.name}</h2>
                    <p>{selectedBuilding.location}</p>
                    <strong>{selectedBuilding.observationLabel} · {selectedBuilding.periodLabel}</strong>
                    <Link href={selectedBuilding.href}>Open building evidence →</Link>
                  </div>
                </div>
              )}
              {featuredBuildings.length > 1 ? (
                <div className={styles.buildingSelector} aria-label="Featured Seoul buildings">
                  {featuredBuildings.map((building) => (
                    <button
                      type="button"
                      aria-pressed={building.id === selectedBuilding?.id}
                      onClick={() => setSelectedBuildingId(building.id)}
                      key={building.id}
                    >
                      <span>{building.location}</span>
                      <strong>{building.name}</strong>
                      <small>{building.observationLabel}</small>
                    </button>
                  ))}
                </div>
              ) : seoulMarket === undefined ? null : (
                <div className={styles.productStrip} aria-label="Seoul product slots">
                  {seoulMarket.slots.map((slot) => (
                    slot.state === 'available' && slot.href !== undefined ? (
                      <Link className={styles.productLink} href={slot.href} key={slot.id}>
                        <strong>{slot.label}</strong><small>{slot.stateLabel}</small>
                      </Link>
                    ) : (
                      <div className={styles.productUnavailable} key={slot.id}>
                        <strong>{slot.label}</strong><small>{slot.stateLabel}</small>
                      </div>
                    )
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      <section className={styles.liveStrip} id="home-evidence" aria-label="Current Seoul evidence">
        {seoul.status === 'ready' ? (
          <>
            <div><span>Eligible contracts</span><strong>{number.format(seoul.totalCount)}</strong></div>
            <div><span>New</span><strong>{number.format(seoul.newCount)}</strong></div>
            <div><span>Renewal</span><strong>{number.format(seoul.renewalCount)}</strong></div>
            <div><span>Unknown</span><strong>{number.format(seoul.unknownCount)}</strong></div>
            <div><span>Completed period</span><strong>{seoul.period}</strong></div>
          </>
        ) : <div className={styles.liveUnavailable}><span>Seoul evidence</span><strong>{seoul.message}</strong></div>}
        <Link href="/trust/">See methodology →</Link>
      </section>
    </>
  );
}
