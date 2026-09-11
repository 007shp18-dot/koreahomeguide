'use client';
import { useState } from 'react';
import { ExploreLink } from './market-ui/explore-link';
import Form from 'next/form';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { priceMarkets, pricesCopy, pricesLocalePrefix } from '@/lib/locale/prices-copy';
import styles from './price-market-search.module.css';
export function PriceMarketSearch({ locale = 'en' }: { locale?: SiteLocale }) {
  const [market, setMarket] = useState('seoul');
  const t = pricesCopy(locale);
  const prefix = pricesLocalePrefix(locale);
  const index = Math.max(0, priceMarkets.findIndex(item => item.id === market));
  const selected = priceMarkets[index]!;
  const copy = t.markets[index]!;
  return <section className={styles.search} aria-label={t.search}>
    <Form action={`${prefix}${selected.href}`} role="search">
      <label>{t.market}<select value={market} onChange={(event) => setMarket(event.currentTarget.value)}>{priceMarkets.map((item, i) => <option key={item.id} value={item.id}>{t.markets[i]![0]}</option>)}</select></label>
      <label className={styles.query}>{t.property}<input key={market} name="q" type="search" placeholder={copy[3]} /></label>
      <button type="submit">{t.submit}</button>
    </Form>
    <p aria-live="polite">{copy[4]}</p>
    <nav aria-label={t.destinations}>{priceMarkets.map((item, i) => <ExploreLink key={item.id} href={`${prefix}${item.href}`}>{t.markets[i]![0]}</ExploreLink>)}</nav>
  </section>;
}
