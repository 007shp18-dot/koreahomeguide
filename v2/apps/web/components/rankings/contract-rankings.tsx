import Link from 'next/link';
import { rankingHref, rankingMoney, formatRankingDate, type RankingOrder, type ContractRankingRow } from '../../lib/rankings/contract-ranking-query';
import { buildingDisplayName } from '../../lib/public-market/seoul-display-names';
import styles from './contract-rankings.module.css';
import { RankingControls } from './ranking-controls';

export function ContractRankings({ rows, checkedAt, city, kind, order = 'highest' }: {
 rows: ContractRankingRow[] | null; checkedAt?: string; city: 'seoul' | 'singapore'; kind: 'sale' | 'rent'; order?: RankingOrder;
}) {
 const selected = rows?.filter(row => row.city === city && row.kind === kind) ?? [];
 const first = selected[0];
 const title = `${city === 'seoul' ? 'Seoul apartments' : 'Singapore condos'} · ${order} ${kind === 'sale' ? 'sale prices' : 'monthly rents'}`;
 return <section className={styles.section} aria-labelledby="contract-ranking-title">
  <RankingControls city={city} kind={kind} order={order} />
  <div className={styles.heading}><div><h2 id="contract-ranking-title">{title}</h2></div><span>TOP 50</span></div>
  {first ? <>
   <p className={styles.meta}>Contract month: <strong>{first.month}</strong> · {first.sample.toLocaleString('en-US')} eligible records · Checked: {formatRankingDate(checkedAt)} (UTC)</p>
   <p className={styles.note}>Total reported prices · {city === 'seoul' ? 'Seoul apartments' : 'Singapore condominiums'}.</p>
   <div className={styles.tableWrap} role="region" aria-label={title} tabIndex={0}><table>
    <caption>{title} — {first.month}. Amounts in {city === 'seoul' ? 'KRW' : 'SGD'}.</caption>
    <thead><tr><th scope="col">Rank</th><th scope="col">Property / district</th><th scope="col">Area, m²</th><th scope="col">{kind === 'sale' ? 'Sale price' : 'Rent / month'}</th>{city === 'seoul' && kind === 'rent' && <th scope="col">Deposit</th>}<th scope="col">Contract</th></tr></thead>
    <tbody>{selected.map(row => <tr key={row.id}>
     <td className={styles.rank}>{row.rank <= 3 ? <span className={styles.rankBadge} data-rank={row.rank}>TOP<br />{row.rank}</span> : row.rank.toString().padStart(2,'0')}</td>
     <th scope="row"><details><summary>{city === 'seoul' ? buildingDisplayName(row.name, 'en') : row.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</summary><div className={styles.detail}>
      <p>Reported {kind === 'sale' ? 'sale' : 'rent'} · {row.contract_date}<br />{row.floor_value !== null ? `Floor ${row.floor_value}` : row.floor_range ? `Floor range ${row.floor_range}` : 'Floor not disclosed'}{row.bedrooms !== null ? ` · ${Number(row.bedrooms)} bedrooms` : ''}</p>
      <Link href={rankingHref(row)}>View property evidence →</Link>
     </div></details><small>{city === 'seoul' ? row.district_slug : `District ${row.district}`}</small></th>
     <td data-label="Area, m²">{row.area_range ?? (row.area === null ? 'Not disclosed' : Number(row.area).toLocaleString('en-US', {maximumFractionDigits:3}))}</td>
     <td data-label={kind === 'sale' ? 'Sale price' : 'Rent / month'} className={styles.price}>{rankingMoney(row)}{kind === 'rent' ? '/mo' : ''}</td>
     {city === 'seoul' && kind === 'rent' && <td data-label="Deposit" className={styles.deposit}>{row.deposit === null ? 'Not disclosed' : rankingMoney(row,row.deposit)}</td>}
     <td data-label="Contract">{row.contract_date}</td>
    </tr>)}</tbody>
   </table></div>
   <p className={styles.unitGuide}>{city === 'seoul' ? '₩ = South Korean won. Full amounts shown; no multiplier needed.' : 'S$ = Singapore dollars. Full amounts shown; no multiplier needed.'}</p>
   <details className={styles.method}><summary>Sources, coverage and ranking rules</summary><div>
   <p className={styles.note}>Ranked by {kind === 'sale' ? 'total sale price, not price per m²' : 'monthly rent, not total housing cost'}. {city === 'seoul' && kind === 'rent' ? 'Refundable deposits are shown separately.' : ''} Latest available completed calendar month; late filings and corrections may change this list.</p>
   {order === 'lowest' && <p className={styles.caution}>Lowest reported amounts are not available offers or affordability recommendations. Compare floor area{kind === 'rent' ? ', deposits and eligibility requirements' : ', tenure and transaction conditions'}. Special terms may apply; the source does not establish open-market availability.</p>}
<p>Source collected: {formatRankingDate(first.source_as_of)}</p>
    <p>Source: {city === 'seoul' ? <a href="https://rt.molit.go.kr/">MOLIT Real Estate Transaction Disclosure System</a> : <a href="https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties">Urban Redevelopment Authority</a>}. SignedPrice ranks the eligible records held in its current dataset, not asking prices or valuations. This is not a guarantee of complete market coverage.</p>
    <p>Only active or corrected records are included; the latest version of each source business key is used. Separate contracts at the same property remain separate. Equal amounts share a rank; contract date and record ID decide display order. At most 50 records are displayed, including only as many tied records as fit that limit.</p>
    <p>{city === 'seoul' ? 'Apartments only. Areas are reported exclusive areas. Rent rankings exclude zero-monthly-rent jeonse contracts. Deposits are not converted into rent equivalents.' : 'Private condominiums only; HDB, executive condominiums, landed homes and URA-classified apartments are excluded. Sales are single-unit transactions. Rental records are limited to non-landed projects also identified as condominiums in the available sale data; unmatched projects are excluded. Rental areas remain the original reported ranges, not midpoint estimates. URA dates are shown at month precision.'}</p>
   </div></details>
  </> : <p className={styles.empty}>{rows === null ? 'Verified contract rankings are temporarily unavailable. Please try again shortly.' : 'No eligible contracts are available for this category yet.'}</p>}
 </section>;
}
