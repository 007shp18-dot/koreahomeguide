'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { ThreeMarketHomeModel } from '../../lib/home/three-market-home-model';
import {
  advanceHomeMarket,
  selectHomeMarket,
  type ThreeMarketHeroState,
} from '../../lib/home/three-market-hero-state';
import styles from './three-market-hero.module.css';

const INITIAL_STATE: ThreeMarketHeroState = Object.freeze({ activeIndex: 0, autoRotate: true });

export function ThreeMarketHero({ model }: Readonly<{ model: ThreeMarketHomeModel }>) {
  const [state, setState] = useState(INITIAL_STATE);
  const active = model.markets[state.activeIndex] ?? model.markets[0]!;
  const stopRotation = () => setState((current) => (
    current.autoRotate ? Object.freeze({ ...current, autoRotate: false }) : current
  ));

  useEffect(() => {
    if (!state.autoRotate || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = globalThis.setInterval(() => {
      setState((current) => advanceHomeMarket(current, model.markets.length));
    }, 7_000);
    return () => globalThis.clearInterval(timer);
  }, [model.markets.length, state.autoRotate]);

  return (
    <section
      className={styles.hero}
      aria-labelledby="three-market-home-title"
      onMouseEnter={stopRotation}
      onFocusCapture={stopRotation}
      onTouchStart={stopRotation}
    >
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Property evidence · three cities</p>
        <h1 id="three-market-home-title">{model.headline}</h1>
        <p>{model.lead}</p>
      </header>

      <div className={styles.stage} data-active-market={active.id}>
        <figure className={styles.media} data-home-hero-media="market-photo">
          <Image
            key={active.photo.src}
            src={active.photo.src}
            alt={active.photo.alt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, (max-width: 1200px) 62vw, 720px"
            style={{ objectFit: 'cover', objectPosition: active.photo.position ?? 'center' }}
          />
          <figcaption>
            {active.city} · Editorial city photograph · not an exact-property claim
          </figcaption>
        </figure>

        <article
          className={styles.marketPanel}
          id="home-market-panel"
          role="tabpanel"
          aria-labelledby={`home-market-tab-${active.id}`}
        >
          <div className={styles.marketHeading}>
            <span>{active.position}</span>
            <div>
              <p>{active.city}</p>
              <h2>{active.summary}</h2>
            </div>
          </div>

          <div className={styles.evidence} data-evidence-state={active.evidenceState}>
            <span>{active.evidenceState.replace('_', ' ')}</span>
            <p>{active.evidenceTitle}</p>
            {active.evidenceValue === null ? null : <strong>{active.evidenceValue}</strong>}
            <small>{active.evidenceNote}</small>
          </div>

          <div className={styles.actions}>
            <Link
              className={styles.primaryAction}
              href={active.primaryAction.href}
              data-primary-action="explore"
            >
              {active.primaryAction.label}
            </Link>
            {active.secondaryAction === null ? null : (
              <Link className={styles.secondaryAction} href={active.secondaryAction.href}>
                {active.secondaryAction.label}
              </Link>
            )}
          </div>
        </article>
      </div>

      <div className={styles.marketTabs} role="tablist" aria-label="Choose a property market">
        {model.markets.map((market, index) => (
          <button
            key={market.id}
            id={`home-market-tab-${market.id}`}
            type="button"
            role="tab"
            aria-selected={index === state.activeIndex}
            aria-controls="home-market-panel"
            data-market-id={market.id}
            onClick={() => setState((current) => selectHomeMarket(current, index))}
          >
            <span>{market.position}</span>
            <strong>{market.city}</strong>
            <small>{market.evidenceState.replace('_', ' ')}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
