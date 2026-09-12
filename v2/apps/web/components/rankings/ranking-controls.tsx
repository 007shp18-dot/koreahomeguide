import type { RankingOrder } from '../../lib/rankings/contract-ranking-query';
import styles from './contract-rankings.module.css';
import { RankingCitySelect } from './ranking-city-select';

export function RankingFields({ city, kind, order }: { city: 'seoul' | 'singapore' | 'tokyo'; kind: 'sale' | 'rent'; order: RankingOrder }) {
  return <>
    <RankingCitySelect city={city} kind={kind} order={order} />
    <label>Ranking<select name="kind" defaultValue={kind}><option value="sale">Sales</option>{city !== 'tokyo' && <option value="rent">District rents</option>}</select></label>
    <label>Order<select name="order" defaultValue={city === 'tokyo' ? 'highest' : order}><option value="highest">Highest first</option>{city !== 'tokyo' && <option value="lowest">Lowest first</option>}</select></label>
  </>;
}

export function RankingControls(props: { city: 'seoul' | 'singapore' | 'tokyo'; kind: 'sale' | 'rent'; order: RankingOrder }) {
  return <form key={`${props.city}-${props.kind}-${props.order}`} className={styles.filters} action="/rankings/" method="get" aria-label="Ranking filters"><RankingFields {...props} /><button type="submit">Show rankings</button></form>;
}
