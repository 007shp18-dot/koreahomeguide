'use client';

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics/react';
import { createBuyingGuideEvent, guideJourney, type GuideAction } from '../../lib/analytics/buying-guide-events';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import type { BuyingGuideData } from '../../content/en/buying-guide-data';
import styles from './buying-guide.module.css';

export function buyingGuideBsd(price: number): number {
  let remaining = price;
  let total = 0;
  for (const [width, rate] of [[180000, .01], [180000, .02], [640000, .03], [500000, .04], [1500000, .05], [Infinity, .06]]) {
    const amount = Math.min(remaining, width!);
    total += amount * rate!;
    remaining -= amount;
    if (remaining <= 0) break;
  }
  return Math.floor(total);
}

export function buyingGuideCosts(currency: string, price: number, profile: number): readonly (readonly [string, number])[] {
  if (currency === 'KRW') return [['Property price', price], ['Basic acquisition tax example', price * (price <= 600000000 ? .01 : price <= 900000000 ? (price / 100000000 * 2 / 3 - 3) / 100 : .03)]];
  if (currency === 'SGD') return [['Property price', price], ['BSD', buyingGuideBsd(price)], ['ABSD', price * ([.60, .05, 0][profile] ?? .60)]];
  return [['Property price', price], ['Buyer registration share (2%)', price * .02], ['Service partner fee before VAT', 4000]];
}

export function BuyingGuide({ guide }: Readonly<{ guide: BuyingGuideData }>) {
  const journey = guideJourney(guide.slug);
  function record(action: GuideAction) {
    const { event, ...properties } = createBuyingGuideEvent(guide.slug, action);
    sendGoogleEvent(event, properties);
    try { track(event, properties); } catch { /* Analytics never blocks the guide. */ }
  }
  const [selected, setSelected] = useState(1);
  const [profile, setProfile] = useState(0);
  const budget = guide.bands[selected] ?? guide.bands[0]!;
  const money = (value: number) => `${guide.currency === 'SGD' ? 'S$' : guide.currency + ' '}${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const costs = buyingGuideCosts(guide.currency, budget.cap, profile);
  const subtotal = costs.reduce((sum, [, value]) => sum + value, 0);
  const maximumArea = Math.max(...budget.examples.map(example => example.area[1]!));
  return <div className={styles.guide}>
    <p className={styles.meta}>{guide.period} transactions · Historical examples, not current listings</p>
    <section aria-labelledby="buying-examples">
      <h2 id="buying-examples">01 · What fits the purchase-price budget?</h2>
      <div className={styles.budgets} role="group" aria-label="Purchase-price ceiling">{guide.bands.map((band, index) => <button type="button" key={band.cap} aria-pressed={index === selected} onClick={() => { setSelected(index); record('budget_select'); }}>{money(band.cap)}</button>)}</div>
      <p>The ceiling is the property price, not total cash or a lending limit.</p>
      {journey ? <p><Link href={journey.explore} onClick={() => record('explore_open')}>Search {journey.city} transaction records</Link>{' · '}<Link href={journey.check} onClick={() => record('check_open')}>Already have a quote? Check its comparables</Link></p> : null}
      <div aria-live="polite"><h3>Examples at {money(budget.cap * .8)}–{money(budget.cap)}</h3>
      <p className={styles.meta}>Three projects with repeated records. Areas are observed ranges, not the maximum or average size available at this budget. Seoul project names follow the original Korean records.</p>
      <div className={styles.examples}>{budget.examples.map(example => <div className={styles.example} key={`${selected}-${example.name}-${example.band}`}>
        <p className={styles.meta}>{example.region}</p><h3>{example.name.trim()}</h3><p className={styles.meta}>{example.detail}</p>
        <strong className={styles.areaValue}>{example.area[0]!.toFixed(1)}{example.area[0] === example.area[1] ? '' : `–${example.area[1]!.toFixed(1)}`} m²</strong>
        <div className={styles.areaBar} style={{ width: `${example.area[1]! / maximumArea * 100}%` }} role="img" aria-label={`Observed upper area ${example.area[1]} square metres; common scale across three examples`} />
        <p className={styles.meta}>Upper observed area · shared scale</p><strong>{money(example.price[0]!)}–{money(example.price[1]!)}</strong>
        <p className={styles.meta}>{example.n} in range / {example.total} in the same group<br />Latest record {example.latest}</p>
        <details onToggle={event => { if (event.currentTarget.open) record('evidence_open'); }}><summary>View transaction evidence</summary><p className={styles.meta}>Same-project {example.band}–&lt;{example.band + 20} m² group. Only records in the selected price range are listed.</p><div className={styles.tableScroll}><table><thead><tr><th>Date</th><th>m²</th><th>Price</th></tr></thead><tbody>{example.records.map((record, index) => <tr key={index}><td>{record.date}</td><td>{record.area.toFixed(2)}</td><td>{money(record.price)}</td></tr>)}</tbody></table></div></details>
      </div>)}</div></div>
    </section>
    <section aria-labelledby="buying-costs"><h2 id="buying-costs">02 · Budget beyond the price</h2>
      {guide.currency === 'SGD' ? <label className={styles.profile}>Buyer profile<select value={profile} onChange={event => { setProfile(Number(event.target.value)); record('cost_profile_change'); }}><option value={0}>Foreign individual · no remission</option><option value={1}>Singapore PR · first home</option><option value={2}>Singapore citizen · first home</option></select></label> : null}
      <div aria-live="polite"><div className={styles.costBar} role="img" aria-label={costs.map(([label, value]) => `${label}: ${money(value)}`).join('; ')}>{costs.map(([label, value], index) => <span key={label} className={index === 0 ? styles.priceFill : index === 1 ? styles.taxFill : styles.additionalFill} style={{ width: `${value / subtotal * 100}%` }} />)}</div>
      <dl className={styles.costRows}>{costs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}<div><dt>Subtotal of displayed items</dt><dd>{money(subtotal)}</dd></div></dl></div>
      <p className={styles.meta}>{guide.currency === 'KRW' ? 'Basic residential acquisition-tax rates only. Surcharges, relief, local education tax, rural special tax, brokerage, registration and financing costs are excluded. This is not your total purchase cost.' : guide.currency === 'SGD' ? 'Assumes the taxable value equals the price. Actual BSD and ABSD use the higher of price and market value. Joint ownership, existing properties and remissions can change treatment. Legal, valuation and financing costs are excluded. Qualifying FTA buyers should check remission separately.' : `DLD lists a seller share of 2% and buyer share of 2%. The subtotal includes the buyer share and the service partner base fee for sales of at least AED 500,000. VAT, certificate/map fees, knowledge/innovation fees, brokerage, NOC and financing are excluded. If the contract assigns the full 4% registration charge to the buyer, add ${money(budget.cap * .02)}.`}</p><a href="#article-sources-title">Official fee and tax sources</a>
    </section>
    <section aria-labelledby="buying-eligibility"><h2 id="buying-eligibility">03 · Can you buy the property?</h2><p className={styles.callout}>{guide.eligibility}</p><a href="#article-sources-title">Official ownership sources</a></section>
    <section aria-labelledby="buying-checklist"><h2 id="buying-checklist">04 · Before you commit</h2>{guide.checks.map(check => <label className={styles.check} key={check}><input type="checkbox" />{check}</label>)}<p className={styles.meta}>Checklist selections are not saved.</p>
      {journey ? <p><Link href={journey.report} onClick={() => record('report_open')}>What changed in {journey.city}? Read the September 2026 transaction report</Link></p> : null}</section>
    <details className={styles.method}><summary>Sources, selection and limitations</summary><p>{guide.method}</p><p>{budget.eligible} groups passed the screen at this budget. Cost calculations are partial illustrations, not quotations or lending approvals. Official rules checked September 7, 2026.</p></details>
  </div>;
}
