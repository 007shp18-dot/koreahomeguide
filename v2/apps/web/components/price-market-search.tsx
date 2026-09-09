'use client';

import { useState } from 'react';
import { ExploreLink } from './market-ui/explore-link';
import Form from 'next/form';
import styles from './price-market-search.module.css';

const markets = {
  seoul: { label: 'Seoul', href: '/kr/seoul/explore/', searchable: true, placeholder: 'District, neighborhood or building', description: 'Search reported sale, jeonse and monthly-rent records.' },
  singapore: { label: 'Singapore', href: '/sg/singapore/explore/', searchable: true, placeholder: 'Project, street or district number', description: 'Search private residential projects. HDB evidence is available separately in Explore.' },
  dubai: { label: 'Dubai', href: '/ae/dubai/explore/', searchable: true, placeholder: 'Area or project', description: 'Compare Ready and Off-Plan prices, annual rents and yields by area.' },
  tokyo: { label: 'Tokyo', href: '/jp/tokyo/explore/', searchable: true, placeholder: 'Neighbourhood, layout or built year', description: 'Explore recorded transactions by ward, neighbourhood, floor area and quarter.' },
} as const;

export function PriceMarketSearch() {
  const [market, setMarket] = useState<keyof typeof markets>('seoul');
  const selected = markets[market];
  return <section className={styles.search} aria-label="Property price search">
    <Form action={selected.href} role="search">
      <label>Market<select value={market} onChange={(event) => setMarket(event.currentTarget.value as keyof typeof markets)}>{Object.entries(markets).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}</select></label>
      {selected.searchable ? <label className={styles.query}>Find a property<input key={market} name="q" type="search" placeholder={selected.placeholder} /></label> : null}
      <button type="submit">Explore prices</button>
    </Form>
    <p aria-live="polite">{selected.description}</p>
    <nav aria-label="Market price destinations">
      {Object.entries(markets).map(([id, value]) => <ExploreLink key={id} href={value.href}>{value.label}</ExploreLink>)}
    </nav>
  </section>;
}
