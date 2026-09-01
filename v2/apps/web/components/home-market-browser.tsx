'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomepageMarketModel, HomepageProductSlotModel } from '../lib/site-copy';
import styles from './home-editorial.module.css';

type HomeMarketBrowserProps = Readonly<{
  copy: {
    hero: { headline: string; description: string };
    markets: { sectionLabel: string };
  };
  markets: readonly HomepageMarketModel[];
  seoul: SeoulLiveModel;
}>;

type DecisionIntent = 'rent' | 'buy' | 'invest';

const number = new Intl.NumberFormat('en-US');
const decisionIntents = ['rent', 'buy', 'invest'] as const satisfies readonly DecisionIntent[];

function seoulSlotHref(slot: HomepageProductSlotModel, seoul: SeoulLiveModel): string | undefined {
  return seoul.links.find((link) => link.label === slot.label)?.href;
}

function MarketProduct({ cityName, slot, href }: Readonly<{
  cityName: HomepageMarketModel['cityName'];
  slot: HomepageProductSlotModel;
  href?: string;
}>) {
  const contents = <><strong>{slot.label}</strong><span>{slot.description}</span><small>{slot.stateLabel}</small></>;
  if (href !== undefined) {
    return <Link className={styles.productLink} href={href} aria-label={`${slot.label} ${cityName}`}>{contents}</Link>;
  }
  return <div className={styles.productUnavailable} aria-disabled="true">{contents}</div>;
}

function SeoulEvidence({ model }: Readonly<{ model: SeoulLiveModel }>) {
  if (model.status === 'unavailable') {
    return (
      <div className={styles.evidenceUnavailable} data-evidence-state="unavailable">
        <strong>{model.message}</strong>
        <span>The decision routes stay open without substituted figures.</span>
      </div>
    );
  }
  return (
    <>
      <div className={styles.evidenceVisualTop}><span>Seoul evidence pulse</span><strong>{model.period}</strong></div>
      <div className={styles.evidenceCanvas} aria-label={`Official contract evidence for ${model.period}`}>
        <span className={styles.evidenceRiver} aria-hidden="true" />
        <span className={`${styles.evidenceNode} ${styles.nodeOne}`} aria-hidden="true" />
        <span className={`${styles.evidenceNode} ${styles.nodeTwo}`} aria-hidden="true" />
        <span className={`${styles.evidenceNode} ${styles.nodeThree}`} aria-hidden="true" />
        <div className={styles.evidenceCount}>
          <small>Verified contracts</small><strong>{number.format(model.totalCount)}</strong>
          <span>New {number.format(model.newCount)} · Renewal {number.format(model.renewalCount)}</span>
        </div>
      </div>
      <div className={styles.evidenceVisualBottom}><span>Official source</span><strong>Contract evidence, not listing claims</strong></div>
    </>
  );
}

function DecisionEntry({ intent, selectedCity }: Readonly<{
  intent: DecisionIntent;
  selectedCity: HomepageMarketModel['tabId'];
}>) {
  if (selectedCity !== 'seoul') {
    return (
      <div className={styles.decisionUnavailable} aria-live="polite">
        <strong>Decision entry is not public for this market.</strong>
        <span>Use the market panel to see the current evidence and rights state.</span>
      </div>
    );
  }
  if (intent === 'rent') {
    return (
      <div className={styles.decisionActions} aria-live="polite">
        <form className={styles.searchForm} action="/kr/seoul/explore/" method="get" role="search">
          <label htmlFor="home-building-search">Building, district or neighborhood</label>
          <div><input id="home-building-search" name="q" type="search" autoComplete="off" /><button type="submit">Explore evidence</button></div>
        </form>
        <Link href="/kr/seoul/check/">Compare two rent offers →</Link>
      </div>
    );
  }
  const staged = intent === 'buy'
    ? { title: 'Buy evidence is being connected.', description: 'The public route explains what is available without borrowing Rent figures.', href: '/kr/seoul/buy/', label: 'Preview the Buy decision path' }
    : { title: 'Investment evidence is the next layer.', description: 'Yield and momentum stay unpublished until every input is supported.', href: '/kr/seoul/invest/', label: 'Preview the Invest decision path' };
  return (
    <div className={styles.decisionUnavailable} aria-live="polite">
      <strong>{staged.title}</strong><span>{staged.description}</span><Link href={staged.href}>{staged.label} →</Link>
    </div>
  );
}

export function HomeMarketBrowser({ copy, markets, seoul }: HomeMarketBrowserProps) {
  const [intent, setIntent] = useState<DecisionIntent>('rent');
  const seoulMarket = markets.find(({ tabId }) => tabId === 'seoul') ?? markets[0];

  return (
    <>
      <section className={styles.hero} id="home-decision" aria-labelledby="home-headline">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Official contract evidence · Updated by market</p>
            <h1 id="home-headline">{copy.hero.headline}</h1>
            <p className={styles.deck}>{copy.hero.description}</p>
            <div className={styles.intentTabs} role="group" aria-label="Choose a property decision">
              {decisionIntents.map((candidate) => (
                <button type="button" aria-pressed={intent === candidate} onClick={() => setIntent(candidate)} key={candidate}>
                  {candidate[0]!.toUpperCase() + candidate.slice(1)}
                </button>
              ))}
            </div>
            <DecisionEntry intent={intent} selectedCity="seoul" />
          </div>
          <div className={styles.marketPanels}>
            {seoulMarket === undefined ? null : (
              <section className={styles.marketPanel} data-home-market="seoul" data-seoul-live={seoul.status}>
                <div className={styles.marketPanelLead}><SeoulEvidence model={seoul} /></div>
                <div className={styles.productStrip} aria-label="Seoul product slots">
                  {seoulMarket.slots.map((slot) => <MarketProduct cityName="Seoul" slot={slot} href={seoulSlotHref(slot, seoul)} key={slot.id} />)}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
      <section className={styles.liveStrip} id="home-evidence" aria-label="Current Seoul evidence">
        {seoul.status === 'ready' ? (
          <><div><span>All eligible</span><strong>{number.format(seoul.totalCount)}</strong></div><div><span>New</span><strong>{number.format(seoul.newCount)}</strong></div><div><span>Renewal</span><strong>{number.format(seoul.renewalCount)}</strong></div><div><span>Unknown</span><strong>{number.format(seoul.unknownCount)}</strong></div><div><span>Completed period</span><strong>{seoul.period}</strong></div></>
        ) : <div className={styles.liveUnavailable}><span>Seoul evidence</span><strong>{seoul.message}</strong></div>}
        <Link href="/trust/">See methodology →</Link>
      </section>
    </>
  );
}
