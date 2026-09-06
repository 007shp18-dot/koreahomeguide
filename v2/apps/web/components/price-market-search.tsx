'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './price-market-search.module.css';

const markets = {
  seoul: { label: 'Seoul', href: '/kr/seoul/explore/', searchable: true, placeholder: 'District, neighborhood or building', description: 'Search reported sale, jeonse and monthly-rent records.' },
  singapore: { label: 'Singapore', href: '/sg/singapore/explore/', searchable: true, placeholder: 'Project, street or district number', description: 'Search private residential projects. HDB evidence is available separately in Explore.' },
} as const;

export function PriceMarketSearch() {
  const [market, setMarket] = useState<keyof typeof markets>('seoul');
  const selected = markets[market];
  return <section className={styles.search} aria-label="Property price search">
    <form action={selected.href} method="get" role="search">
      <label>Market<select value={market} onChange={(event) => setMarket(event.currentTarget.value as keyof typeof markets)}>{Object.entries(markets).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}</select></label>
      {selected.searchable ? <label className={styles.query}>Find a property<input key={market} name="q" type="search" placeholder={selected.placeholder} /></label> : null}
      <button type="submit">{selected.searchable ? 'Explore prices' : 'Open market research'}</button>
    </form>
    <p aria-live="polite">{selected.description}</p>
    <nav aria-label="Market price destinations">
      <Link href={markets.seoul.href}>Seoul Explore</Link><Link href={markets.singapore.href}>Singapore Explore</Link>
    </nav>
  </section>;
}
