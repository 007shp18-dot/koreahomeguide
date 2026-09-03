'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { HomeMarketVisual } from '../lib/home-market-visuals.server';
import { GoogleBuildingStreetView } from './maps/google-building-street-view';
import { NaverBuildingStreetView } from './maps/naver-building-street-view';
import styles from './home-editorial.module.css';

export function shuffleFeaturedBuildings(
  buildings: readonly HomeMarketVisual[],
  random: () => number = Math.random,
): readonly HomeMarketVisual[] {
  const next = [...buildings];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}

function MarketVisual({ visual, naverMapClientId, googleMapsBrowserKey }: Readonly<{
  visual: HomeMarketVisual;
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  if (visual.provider === 'google') return <GoogleBuildingStreetView
    browserKey={googleMapsBrowserKey}
    buildingName={visual.name}
    latitude={visual.latitude}
    longitude={visual.longitude}
    address={visual.addressQuery}
    mapHref={visual.mapHref}
  />;
  return <NaverBuildingStreetView
    clientId={naverMapClientId}
    buildingName={visual.name}
    latitude={visual.latitude}
    longitude={visual.longitude}
    addressQuery={visual.addressQuery}
    mapHref={visual.mapHref}
  />;
}

function shouldRotate() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function RotatingHeroBuilding({
  buildings,
  naverMapClientId,
  googleMapsBrowserKey,
}: Readonly<{
  buildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  const [order, setOrder] = useState(buildings);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const shuffleTimer = window.setTimeout(() => {
      setOrder(shuffleFeaturedBuildings(buildings));
      setIndex(0);
    }, 0);
    const timer = buildings.length < 2 || !shouldRotate()
      ? undefined
      : window.setInterval(() => setIndex((current) => (current + 1) % buildings.length), 9000);
    return () => {
      window.clearTimeout(shuffleTimer);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [buildings]);

  const featured = order[index % Math.max(1, order.length)];
  if (featured === undefined) return null;

  return (
    <div className={styles.rotatingHero} key={featured.id} data-featured-building={featured.id}>
      <MarketVisual visual={featured} naverMapClientId={naverMapClientId} googleMapsBrowserKey={googleMapsBrowserKey} />
      <div className={styles.heroMediaCaption} aria-live="polite">
        <span>{featured.countryCode} · {featured.market} · place context</span>
        <h2>{featured.name}</h2>
        <p>{featured.location} · {featured.observationLabel}</p>
        <Link href={featured.href}>View building →</Link>
      </div>
      {order.length > 1 ? (
        <div className={styles.heroMediaControls} aria-label="Featured buildings">
          <button type="button" onClick={() => setIndex((current) => (current - 1 + order.length) % order.length)} aria-label="Previous building">←</button>
          <span>{index + 1} / {order.length}</span>
          <button type="button" onClick={() => setIndex((current) => (current + 1) % order.length)} aria-label="Next building">→</button>
        </div>
      ) : null}
    </div>
  );
}

export function RotatingBuildingGrid({
  buildings,
  naverMapClientId,
  googleMapsBrowserKey,
}: Readonly<{
  buildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  const [order, setOrder] = useState(buildings);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const shuffleTimer = window.setTimeout(() => {
      setOrder(shuffleFeaturedBuildings(buildings));
      setOffset(0);
    }, 0);
    const timer = buildings.length <= 3 || !shouldRotate()
      ? undefined
      : window.setInterval(() => setOffset((current) => (current + 3) % buildings.length), 12000);
    return () => {
      window.clearTimeout(shuffleTimer);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [buildings]);

  const visible = Array.from(
    { length: Math.min(3, order.length) },
    (_, index) => order[(offset + index) % order.length]!,
  );

  return (
    <div className={styles.buildingGrid} data-building-rotation="automatic">
      {visible.map((building) => (
        <article className={styles.buildingCard} key={building.id} data-featured-building={building.id}>
          <div className={styles.buildingMedia}>
            <MarketVisual visual={building} naverMapClientId={naverMapClientId} googleMapsBrowserKey={googleMapsBrowserKey} />
          </div>
          <div><span>{building.market.toUpperCase()}</span><h3>{building.name}</h3><p>{building.location}</p><strong>{building.observationLabel}</strong><small>{building.periodLabel}</small><Link href={building.href}>Open market →</Link></div>
        </article>
      ))}
    </div>
  );
}
