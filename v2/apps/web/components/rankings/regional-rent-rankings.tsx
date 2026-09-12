import Link from 'next/link';
import { rankRegions, regionName, RENT_AREAS, rentCohortLabel, type RentCohort, type RegionalRentRow } from '../../lib/rankings/regional-rent-query';
import type { RankingOrder } from '../../lib/rankings/contract-ranking-query';
import styles from './contract-rankings.module.css';

export function RegionalRentRankings({ rows, cohort, order, checkedAt }: {
 rows: RegionalRentRow[] | null; cohort: RentCohort; order: RankingOrder; checkedAt?: string;
}) {
 const ranked=rankRegions(rows ?? [],order);
 const kr=cohort.city==='seoul';
 const money=(value:number)=>`${kr?'₩':'S$'}${Number(value).toLocaleString('en-US',{maximumFractionDigits:2})}`;
 return <section className={styles.section} aria-labelledby="regional-rent-title">
  <nav className={styles.tabs} aria-label="Transaction rankings">{(['seoul','singapore'] as const).flatMap(city=>(['sale','rent'] as const).map(kind=><Link key={city+kind} href={`/rankings/?city=${city}&kind=${kind}&order=${order}`} aria-current={city===cohort.city&&kind==='rent'?'page':undefined}>{city==='seoul'?'Seoul':'Singapore'} {kind==='sale'?'sales':'rents'}</Link>))}</nav>
  <div className={styles.heading}><div><p>COMPARABLE RENTAL CONTRACTS</p><h2 id="regional-rent-title">{kr?'Seoul':'Singapore'} · district rent rankings</h2></div></div>
  <form className={styles.filters} action="/rankings/" method="get">
   <input type="hidden" name="city" value={cohort.city}/><input type="hidden" name="kind" value="rent"/>
   <label>Floor area<select name="area" defaultValue={cohort.area}>{Object.entries(RENT_AREAS[cohort.city]).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   {kr?<label>Deposit<select name="deposit" defaultValue={cohort.deposit}><option value="under-100m">Below ₩100 million</option><option value="100-300m">₩100 to below ₩300 million</option><option value="300m-plus">₩300 million or more</option></select></label>:<label>Bedrooms<select name="beds" defaultValue={cohort.beds}>{['1','2','3'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
   <label>Order<select name="order" defaultValue={order}><option value="lowest">Lowest median rent</option><option value="highest">Highest median rent</option></select></label><button type="submit">Compare districts</button>
  </form>
  <p className={styles.note}>{rentCohortLabel(cohort)}. {kr?'Apartments · Seoul administrative districts':'Private condos · Singapore postal districts'}. At least 10 matched contracts per district.</p>
  {ranked.length>0?<>
   <p className={styles.meta}>Contract month: <strong>{ranked[0]!.month}</strong> · {ranked.length} qualifying districts · Checked {checkedAt?.slice(0,10)} (UTC)</p>
   <div className={styles.tableWrap} role="region" aria-label="District monthly rent medians" tabIndex={0}><table>
    <caption>District median monthly rent for the selected cohort</caption>
    <thead><tr><th scope="col">Rank</th><th scope="col">District</th><th scope="col">Median rent / month</th>{kr&&<th scope="col">Median deposit</th>}<th scope="col">Middle 50% / month</th><th scope="col">Contracts</th></tr></thead>
    <tbody>{ranked.map(row=><tr key={row.region}>
     <td className={styles.rank}>{row.rank<=3?<span className={styles.rankBadge} data-rank={row.rank}>TOP<br/>{row.rank}</span>:row.rank}</td>
     <th scope="row">{regionName(row)}<small>{kr?<Link href={`/kr/seoul/explore/${row.region}/?transaction=monthly&propertyType=apartment`}>Explore district →</Link>:<Link href="/sg/singapore/explore/">Explore Singapore →</Link>}</small></th>
     <td data-label="Median rent / month" className={styles.price}>{money(row.amount)}</td>
     {kr&&<td data-label="Median deposit">{row.median_deposit===null?'Not disclosed':money(row.median_deposit)}</td>}
     <td data-label="Middle 50% / month">{money(row.p25)}–{money(row.p75)}</td><td data-label="Contracts">{row.n}</td>
    </tr>)}</tbody>
   </table></div>
   <p className={styles.caution}>These are reported contracts, not currently available offers. Matching size{kr?' and deposit bands':' and bedroom count'} improves comparability, but lease terms, condition and eligibility still vary.{kr?' Median rent and median deposit are separate statistics, not a single available lease.':''}</p>
   <details className={styles.method}><summary>Sources and calculation</summary><div>
    <p>{kr?<a href="https://rt.molit.go.kr/">MOLIT</a>:<a href="https://www.ura.gov.sg/">URA</a>} · Active/corrected records, latest source-key version. Latest completed calendar month with data for this source is selected before cohort filtering; sparse cohorts do not silently switch to an older month. Districts with fewer than 10 matching contracts are omitted. Equal medians share a rank.</p>
    <p>{kr?'Exclusive floor area uses an open lower and closed upper limit: 40 < area ≤ 60 m² or 60 < area ≤ 85 m². Deposit intervals are [0,100 million), [100 million,300 million), and [300 million,+∞) KRW. Zero-monthly-rent jeonse is excluded.':'Only original URA area bands wholly within the selected interval are included; no midpoint estimates are used. Bedrooms must match exactly. Non-landed rentals are matched to condominium-classified sale evidence; unmatched projects, URA apartments, EC, landed homes and HDB are excluded.'}</p>
    <p>Middle 50% is the 25th–75th percentile. Coverage is limited to eligible records held by SignedPrice; late filings and corrections can change rankings. Source collected: {[...new Set(ranked.map(row=>row.source_as_of.slice(0,10)))].join(', ')} (UTC).</p>
   </div></details>
  </>:<p className={styles.empty}>{rows===null?'Verified rental rankings are temporarily unavailable. Please try again shortly.':'No district has 10 matching contracts in the latest source month. Adjust the area or other conditions.'}</p>}
 </section>;
}
