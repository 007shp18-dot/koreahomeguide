'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { HomeMarketVisual } from '../lib/home-market-visuals.server';
import { GooglePlacePhoto } from './maps/google-place-photo';
import {
  MARKET_PHOTOS,
  MarketRepresentativePhoto,
} from './market-representative-photo';
import styles from './home-editorial.module.css';

function MarketVisual({ visual, googleMapsBrowserKey }: Readonly<{
  visual: HomeMarketVisual;
  googleMapsBrowserKey: string | null;
}>) {
  const fallback = <div className={styles.representativeMedia} data-home-media="representative">
    <MarketRepresentativePhoto photo={MARKET_PHOTOS[visual.market === 'Seoul' ? 'seoul' : visual.market === 'Singapore' ? 'singapore' : 'dubai']} />
    <span>Representative {visual.market} image</span>
  </div>;
  if (visual.addressQuery === undefined) return fallback;
  return (
    <GooglePlacePhoto
      browserKey={googleMapsBrowserKey}
      buildingName={visual.name}
      address={visual.addressQuery}
      registryKey={visual.photoRegistryKey ?? (visual.market === 'Seoul'
        ? `kr-seoul:${visual.id}`
        : visual.market === 'Singapore'
          ? `sg-project:${visual.id}`
          : `market:${visual.market}:${visual.id}`)}
      fallback={fallback}
    />
  );
}

export function RotatingHeroBuilding({
  buildings,
  googleMapsBrowserKey,
}: Readonly<{
  buildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  const [index, setIndex] = useState(0);
  const featured = buildings[index % Math.max(1, buildings.length)];
  if (featured === undefined) return null;

  return (
    <div className={styles.rotatingHero} key={featured.id} data-featured-building={featured.id}>
      <MarketVisual visual={featured} googleMapsBrowserKey={googleMapsBrowserKey} />
      <div className={styles.heroMediaCaption} aria-live="polite">
        <span>{featured.countryCode} · {featured.market} · verified building identity</span>
        <h2>{featured.name}</h2>
        <p>{featured.location} · {featured.observationLabel}</p>
        <ul>{featured.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
        <Link href={featured.href}>View building →</Link>
      </div>
      {buildings.length > 1 ? (
        <div className={styles.heroMediaControls} aria-label="Featured buildings">
          <button type="button" onClick={() => setIndex((current) => (current - 1 + buildings.length) % buildings.length)} aria-label="Previous building">←</button>
          <span>{index + 1} / {buildings.length}</span>
          <button type="button" onClick={() => setIndex((current) => (current + 1) % buildings.length)} aria-label="Next building">→</button>
        </div>
      ) : null}
    </div>
  );
}

export function RotatingBuildingGrid({
  buildings,
  googleMapsBrowserKey,
}: Readonly<{
  buildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  const visible = buildings.slice(0, 3);

  return (
    <div className={styles.buildingGrid} data-building-rotation="manual">
      {visible.map((building) => (
        <article className={styles.buildingCard} key={building.id} data-featured-building={building.id}>
          <div className={styles.buildingMedia}>
            <MarketVisual visual={building} googleMapsBrowserKey={googleMapsBrowserKey} />
          </div>
          <div><span>{building.market.toUpperCase()}</span><h3>{building.name}</h3><p>{building.location}</p><strong>{building.observationLabel}</strong><small>{building.periodLabel}</small><ul>{building.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul><Link href={building.href}>View details →</Link></div>
        </article>
      ))}
    </div>
  );
}
