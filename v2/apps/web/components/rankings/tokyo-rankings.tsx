import Link from 'next/link';
import data from '../../data/tokyo-ranking-2026-q1.json';
import styles from './tokyo-rankings.module.css';

export function TokyoRankings() {
  return <section className={styles.section} aria-labelledby="tokyo-ranking-title">
    <nav className={styles.nav} aria-label="Transaction ranking markets">
      <Link href="/rankings/?city=seoul">Seoul</Link>
      <Link href="/rankings/?city=singapore">Singapore</Link>
      <Link href="/rankings/?city=tokyo" aria-current="page">Tokyo</Link>
    </nav>
    <p className={styles.eyebrow}>TOKYO · REPORTED SALES · {data.period}</p>
    <h2 id="tokyo-ranking-title">50 highest reported resale-condo prices</h2>
    <p>Tokyo’s 23 wards · January–March 2026 · Source snapshot checked {data.checkedAt}.</p>
    <p>Selected from 1,297 MLIT questionnaire-derived resale-condominium records. Locations are anonymous districts; the same district can appear more than once. This is not a complete sales registry.</p>
    <p><a href="#tokyo-ranking-source">Source and ordering</a> · <Link href="/jp/tokyo/explore/">Explore Tokyo neighbourhoods</Link></p>
    <ol className={styles.list}>
      {data.rows.map(row => <li key={row.recordReference} className={styles.row}>
        <span className={styles.badge} data-top={row.order <= 3 ? row.order : undefined} aria-label={`Display order ${row.order}`}><small>TOP</small>{row.order}</span>
        <div className={styles.content}>
          <strong className={styles.price}>JPY {row.price.toLocaleString('en-US')}</strong>
          <h3>{row.district} <span>· {row.municipality}</span></h3>
          <p>{row.areaSqm} m² · {row.floorPlan || 'Layout not stated'} · Built {row.buildingYear || 'year not stated'} · {data.period}</p>
        </div>
      </li>)}
    </ol>
    <aside id="tokyo-ranking-source" className={styles.source}>
      <h3>Source and ordering</h3>
      <p>Source: <a href={data.source}>Ministry of Land, Infrastructure, Transport and Tourism, Japan — Real Estate Information Library</a>. Edited and ranked by SignedPrice; this is not an official government ranking.</p>
      <p>Prices are full Japanese yen amounts. Equal prices are ordered by area, largest first, then ward, district and source reference. Numbers show display order. The records at positions 10 and 11 both report JPY 450,000,000.</p>
      <p>Observation period: 2026 Q1. Acquired 10 September 2026; checked 12 September 2026. This was the newest quarter selectable on the official source at that check. New reports and corrections can change the results.</p>
      <p>The source anonymizes individual properties. Reported information may be incomplete or inaccurate and does not identify a particular building. <a href="https://www.reinfolib.mlit.go.jp/help/termsOfUse/">Source terms and limitations</a>.</p>
    </aside>
  </section>;
}
