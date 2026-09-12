import Link from 'next/link';
import data from '../../data/tokyo-ranking-2026-q1.json';
import { RankingControls } from './ranking-controls';
import styles from './contract-rankings.module.css';

export function TokyoRankings() {
  const title = 'Tokyo resale condos · highest reported sale prices';
  return <section className={styles.section} aria-labelledby="tokyo-ranking-title">
    <RankingControls city="tokyo" kind="sale" order="highest" />
    <div className={styles.heading}><h2 id="tokyo-ranking-title">{title}</h2><span>TOP 50</span></div>
    <p className={styles.meta}><strong>{data.period}</strong> · 1,297 eligible records · JPY · Checked {data.checkedAt}</p>
    <p className={styles.note}>Total reported prices · Anonymous district records · January–March 2026.</p>
    <div className={styles.tableWrap} role="region" aria-label="Tokyo reported sales" tabIndex={0}><table>
      <caption>{title} — 2026 Q1. Full amounts in JPY.</caption>
      <thead><tr><th scope="col">Position</th><th scope="col">District / ward</th><th scope="col">Area, m²</th><th scope="col">Sale price</th><th scope="col">Period</th></tr></thead>
      <tbody>{data.rows.map(row => <tr key={row.recordReference}>
        <td className={styles.rank}>{row.order <= 3 ? <span className={styles.rankBadge} data-rank={row.order}>TOP<br />{row.order}</span> : row.order.toString().padStart(2, '0')}</td>
        <th scope="row"><details><summary>{row.district}</summary><div className={styles.detail}><p>{row.floorPlan || 'Layout not stated'} · Built {row.buildingYear || 'year not stated'} · {row.structure || 'Structure not stated'}</p><Link href={`/jp/tokyo/explore/?city=${row.municipalityCode}`}>Explore ward evidence →</Link></div></details><small>{row.municipality}</small></th>
        <td data-label="Area, m²">{row.areaSqm}</td>
        <td data-label="Sale price" className={styles.price}>JPY {row.price.toLocaleString('en-US')}</td>
        <td data-label="Period">{data.period}</td>
      </tr>)}</tbody>
    </table></div>
    <p className={styles.unitGuide}>JPY = Japanese yen. Full amounts shown; no multiplier needed.</p>
    <details id="tokyo-ranking-source" className={styles.method}><summary>Sources, coverage and ranking rules</summary><div>
      <p>Source: <a href={data.source}>Ministry of Land, Infrastructure, Transport and Tourism, Japan — Real Estate Information Library</a>. Edited and ranked by SignedPrice; this is not an official government ranking.</p>
      <p>Selected from 1,297 questionnaire-derived resale-condominium records across Tokyo’s 23 wards. These anonymous district records do not identify buildings and are not a complete sales registry.</p>
      <p>Equal prices are ordered by area, largest first, then ward, district and source reference. Numbers show display order. Positions 10 and 11 both report JPY 450,000,000.</p>
      <p>Observation period: 2026 Q1. Acquired 10 September 2026; checked 12 September 2026. This was the newest quarter selectable on the official source at that check. Only this highest-price snapshot is published for Tokyo.</p>
      <p>Information may be incomplete, inaccurate or revised. <a href="https://www.reinfolib.mlit.go.jp/help/termsOfUse/">Source terms and limitations</a>.</p>
    </div></details>
  </section>;
}
