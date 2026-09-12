
import type {
  DubaiTopTenResult,
  TokyoTopTenResult,
} from '../../lib/rankings/top-ten.server';
import type {
  RankedDubaiProject,
  RankedTokyoTransaction,
} from '../../lib/rankings/top-ten';
import styles from './top-ten.module.css';

type Locale = 'en' | 'ko';

export function TopTenPreview({
  locale = 'en',
  dubai,
  tokyo,
}: Readonly<{
  locale?: Locale;
  dubai: DubaiTopTenResult;
  tokyo: TokyoTopTenResult | null;
}>) {
  const ko = locale === 'ko';
  const retrievedDate = tokyo
    ? new Date(tokyo.retrievedAt).toLocaleDateString(ko ? 'ko-KR' : 'en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : null;

  return <section className={styles.section} aria-labelledby="top-ten-title" aria-describedby="top-ten-intro">
    <div className={styles.intro}>
      <div>
        <p className={styles.eyebrow}>{ko ? '첫 번째 미리보기' : 'FIRST PREVIEW'}</p>
        <h2 id="top-ten-title">{ko ? '두바이·도쿄 TOP 10' : 'Dubai + Tokyo TOP 10'}</h2>
      </div>
      <p id="top-ten-intro" className={styles.lede}>{ko
        ? '공식 공개 자료에서 같은 의미의 숫자만 골라, 두 시장의 상위 10개 항목을 먼저 공개합니다.'
        : 'A first look at the ten highest reported entries from official public data, with the unit of ranking made explicit.'}</p>
    </div>

    <div className={styles.grid}>
      <article className={styles.market} data-top-ten-market="dubai">
        <header className={styles.marketHeader}>
          <div>
            <p className={styles.eyebrow}>DUBAI · DLD</p>
            <h3>{ko ? '프로젝트별 거래 중앙값' : 'Project median prices'}</h3>
          </div>
          <span className={styles.badge}>TOP 10</span>
        </header>
        <p className={styles.meta}>
          {dubai.comparisonPeriod.from} – {dubai.comparisonPeriod.to}
          {' · '}{dubai.projectCount.toLocaleString('en-US')} {ko ? '개 프로젝트' : 'projects'}
          {' · n ≥ '}{dubai.minimumSample}
        </p>
        <div className={styles.tableWrap} role="region" aria-label={ko ? '두바이 프로젝트 TOP 10' : 'Dubai project top ten'} tabIndex={0}>
          <table className={styles.table}>
            <caption>{ko ? '두바이 DLD 프로젝트 거래 중앙값 TOP 10' : 'Dubai DLD project median transaction price top ten'}</caption>
            <thead><tr>
              <th scope="col">{ko ? '순위' : 'Rank'}</th>
              <th scope="col">{ko ? '프로젝트·지역' : 'Project · area'}</th>
              <th scope="col">{ko ? '중앙 거래가' : 'Median price'}</th>
              <th scope="col">AED / m²</th>
              <th scope="col">n</th>
            </tr></thead>
            <tbody>{dubai.rows.map((row: RankedDubaiProject) => <tr key={row.id}>
              <td className={styles.rank}>{row.rank}</td>
              <th scope="row"><strong>{row.name}</strong><span className={styles.subline}>{row.areaSlug.replaceAll('-', ' ')} · {row.housing} · {row.stage}</span></th>
              <td className={styles.price} data-label={ko ? '중앙 거래가' : 'Median price'}>AED {row.medianPriceAed.toLocaleString('en-US')}</td>
              <td data-label="AED / m²">{row.medianPricePerSqmAed.toLocaleString('en-US')}</td>
              <td data-label="n">{row.n.toLocaleString('en-US')}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className={styles.note}>{ko
          ? 'DLD가 제공한 거래에서 프로젝트별 중앙값을 계산한 순위입니다. 개별 최고가 거래나 매물 호가 순위가 아니며, 표본 수가 30건 미만인 프로젝트는 제외했습니다.'
          : 'This ranks project-level medians calculated from DLD transactions. It is not a ranking of individual highest contracts or asking prices; projects with fewer than 30 records are excluded.'}</p>
        <details className={styles.method}><summary>{ko ? '원천·집계 방식' : 'Source and method'}</summary>
          <p>{ko ? '원천: ' : 'Source: '}<a href={dubai.sourceUrl}>Dubai Land Department open data</a>. {ko ? '비교 기간과 표본 기준은 위에 표시했으며, 현재는 프로젝트 스냅샷을 먼저 공개합니다.' : 'The comparison period and minimum sample are shown above; this first release uses the reviewed project snapshot.'}</p>
        </details>
      </article>

      <article className={styles.market} data-top-ten-market="tokyo">
        <header className={styles.marketHeader}>
          <div>
            <p className={styles.eyebrow}>TOKYO · MLIT</p>
            <h3>{ko ? '익명화된 콘도 거래 총액' : 'Anonymised condo transaction totals'}</h3>
          </div>
          <span className={styles.badge}>TOP 10</span>
        </header>
        {tokyo ? <>
          <p className={styles.meta}>
            {tokyo.period} · {tokyo.sampleCount.toLocaleString('en-US')} {ko ? '건 중' : 'eligible records'} · {ko ? '수집' : 'retrieved'} {retrievedDate}
          </p>
          <div className={styles.tableWrap} role="region" aria-label={ko ? '도쿄 거래 TOP 10' : 'Tokyo transaction top ten'} tabIndex={0}>
            <table className={styles.table}>
              <caption>{ko ? '도쿄 MLIT 콘도 거래 총액 TOP 10' : 'Tokyo MLIT condominium transaction total top ten'}</caption>
              <thead><tr>
                <th scope="col">{ko ? '순위' : 'Rank'}</th>
                <th scope="col">{ko ? '구·동네' : 'Ward · neighbourhood'}</th>
                <th scope="col">{ko ? '거래 총액' : 'Total price'}</th>
                <th scope="col">{ko ? '면적·평면' : 'Area · plan'}</th>
                <th scope="col">{ko ? '준공·구조' : 'Built · structure'}</th>
              </tr></thead>
              <tbody>{tokyo.rows.map((row: RankedTokyoTransaction) => <tr key={row.recordReference}>
                <td className={styles.rank}>{row.rank}</td>
                <th scope="row"><strong>{row.municipality}</strong><span className={styles.subline}>{row.district}</span></th>
                <td className={styles.price} data-label={ko ? '거래 총액' : 'Total price'}>¥{row.price.toLocaleString('en-US')}</td>
                <td data-label={ko ? '면적·평면' : 'Area · plan'}>{row.areaSqm === null ? (ko ? '면적 미공개' : 'Area not disclosed') : row.areaSqm.toLocaleString('en-US') + ' m²'}<span className={styles.subline}>{row.floorPlan || (ko ? '평면 미공개' : 'Plan not disclosed')}</span></td>
                <td data-label={ko ? '준공·구조' : 'Built · structure'}>{row.buildingYear || (ko ? '준공연도 미공개' : 'Year not disclosed')}{row.structure ? ' · ' + row.structure : ''}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className={styles.note}>{ko
            ? '국토교통성 MLIT의 23구 공통 공개 분기에서 신고된 중고 콘도 거래를 총액순으로 정렬했습니다. 지역이 익명화된 거래라 특정 건물이나 매물의 순위가 아닙니다.'
            : 'This sorts reported pre-owned condominium transactions from the latest quarter published for all 23 wards. Areas are anonymised, so this is not a building or listing ranking.'}</p>
          <details className={styles.method}><summary>{ko ? '원천·집계 방식' : 'Source and method'}</summary>
            <p>{ko ? '원천: ' : 'Source: '}<a href={tokyo.sourceUrl}>Japan MLIT XIT001</a>. {ko ? '가격은 엔화 총액이며, 23개 구 모두에 공개된 가장 최근 분기만 사용했습니다.' : 'Prices are total JPY amounts; only the latest quarter available for all 23 wards is used.'}</p>
          </details>
        </> : <p className={styles.empty} role="status">{ko
          ? '도쿄 공개 거래 자료를 잠시 불러오지 못했습니다.'
          : 'Tokyo public transaction data is temporarily unavailable.'}</p>}
      </article>
    </div>
  </section>;
}
