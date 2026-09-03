'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import { NaverBuildingStreetView } from './maps/naver-building-street-view';
import styles from './home-editorial.module.css';

export function shuffleFeaturedBuildings(
  buildings: readonly HomeFeaturedBuilding[],
  random: () => number = Math.random,
): readonly HomeFeaturedBuilding[] {
  const next = [...buildings];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}

function shouldRotate() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function RotatingHeroBuilding({
  buildings,
  naverMapClientId,
}: Readonly<{
  buildings: readonly HomeFeaturedBuilding[];
  naverMapClientId: string | null;
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
      <NaverBuildingStreetView
        clientId={naverMapClientId}
        buildingName={featured.name}
        latitude={featured.latitude}
        longitude={featured.longitude}
        addressQuery={featured.addressQuery}
        mapHref={featured.href}
      />
      <div className={styles.heroMediaCaption} aria-live="polite">
        <span>Featured building evidence · Seoul</span>
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
}: Readonly<{
  buildings: readonly HomeFeaturedBuilding[];
  naverMapClientId: string | null;
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
            <NaverBuildingStreetView
              clientId={naverMapClientId}
              buildingName={building.name}
              latitude={building.latitude}
              longitude={building.longitude}
              addressQuery={building.addressQuery}
              mapHref={building.href}
            />
          </div>
          <div><span>SEOUL</span><h3>{building.name}</h3><p>{building.location}</p><strong>{building.observationLabel}</strong><small>{building.periodLabel}</small><Link href={building.href}>View evidence →</Link></div>
        </article>
      ))}
    </div>
  );
}
