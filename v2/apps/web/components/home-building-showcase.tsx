'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { HomeMarketVisual } from '../lib/home-market-visuals.server';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from './market-representative-photo';
import styles from './home-editorial.module.css';

export function shuffleFeaturedBuildings(
  buildings: readonly HomeMarketVisual[],
  random: () => number = Math.random,
): readonly HomeMarketVisual[] {
  const shuffle = (items: readonly HomeMarketVisual[]) => {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
    }
    return next;
  };
  const marketRepresentatives = buildings.filter((building, index) => (
    buildings.findIndex((candidate) => candidate.market === building.market) === index
  ));
  const markets = shuffle(marketRepresentatives).map((building) => building.market);
  const groups = new Map(markets.map((market) => [market, shuffle(buildings.filter((building) => building.market === market))]));
  const next: HomeMarketVisual[] = [];
  let remaining = buildings.length;
  while (remaining > 0) {
    for (const market of markets) {
      const item = groups.get(market)?.shift();
      if (item === undefined) continue;
      next.push(item);
      remaining -= 1;
    }
  }
  return next;
}

function MarketVisual({ visual, naverMapClientId, googleMapsBrowserKey }: Readonly<{
  visual: HomeMarketVisual;
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>) {
  void naverMapClientId;
  void googleMapsBrowserKey;
  const photo = visual.market === 'Seoul'
    ? MARKET_PHOTOS.seoul
    : visual.market === 'Singapore'
      ? MARKET_PHOTOS.singapore
      : MARKET_PHOTOS.dubai;
  return <MarketRepresentativePhoto photo={photo} />;
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
        <ul>{featured.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
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
          <div><span>{building.market.toUpperCase()}</span><h3>{building.name}</h3><p>{building.location}</p><strong>{building.observationLabel}</strong><small>{building.periodLabel}</small><ul>{building.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul><Link href={building.href}>View details →</Link></div>
        </article>
      ))}
    </div>
  );
}
