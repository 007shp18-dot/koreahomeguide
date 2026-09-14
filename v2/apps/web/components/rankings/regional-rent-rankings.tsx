import { rankingText, rankingCopy, rankingPath, rankingDate, type RankingLocale } from '../../lib/rankings/ranking-locale';
import Link from 'next/link';
import { rankRegions, regionName, RENT_AREAS, rentCohortLabel, type RentCohort, type RegionalRentRow } from '../../lib/rankings/regional-rent-query';
import { formatRankingDate, type RankingOrder } from '../../lib/rankings/contract-ranking-query';
import styles from './contract-rankings.module.css';
import { RankingFields } from './ranking-controls';

export function RegionalRentRankings({ rows, cohort, order, checkedAt, locale = 'en' }: {
 locale?: RankingLocale; rows: RegionalRentRow[] | null; cohort: RentCohort; order: RankingOrder; checkedAt?: string;
}) {
 const t = (text: string) => rankingText(locale,text);
 const ranked=rankRegions(rows ?? [],order);
 const kr=cohort.city==='seoul';
 const money=(value:number)=>`${kr?'₩':'S$'}${Number(value).toLocaleString('en-US',{maximumFractionDigits:2})}`;
 return <section className={styles.section} aria-labelledby="regional-rent-title">
  <form key={JSON.stringify(cohort) + order} className={styles.filters} action={rankingPath(locale)} method="get">
   <RankingFields locale={locale} city={cohort.city} kind="rent" order={order} />
   <label>{t("Floor area")}<select name="area" defaultValue={cohort.area}>{Object.entries(RENT_AREAS[cohort.city]).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   {kr?<label>{t("Deposit")}<select name="deposit" defaultValue={cohort.deposit}><option value="under-100m">{t("Below ₩100 million")}</option><option value="100-300m">{t("₩100 to below ₩300 million")}</option><option value="300m-plus">{t("₩300 million or more")}</option></select></label>:<label>{t("Bedrooms")}<select name="beds" defaultValue={cohort.beds}>{['1','2','3'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
   <button type="submit">{t("Compare districts")}</button>
  </form>
  <div className={styles.heading}><div><h2 id="regional-rent-title">{kr?t("Seoul"):t("Singapore")} · {rankingCopy(locale,'district rent rankings','지역별 월세 순위','区域租金排行')}</h2></div></div>

  <p className={styles.note}>{locale === 'en' ? rentCohortLabel(cohort) : `${cohort.area.replace('-','–')} ㎡ · ${kr ? `${t('Deposit')} ${t(cohort.deposit === 'under-100m' ? 'Below ₩100 million' : cohort.deposit === '300m-plus' ? '₩300 million or more' : '₩100 to below ₩300 million')}` : `${t('Bedrooms')} ${cohort.beds}`}`}. {rankingCopy(locale,kr?'Apartments · Seoul administrative districts. At least 10 matched contracts per district.':'Private condos · Singapore postal districts. At least 10 matched contracts per district.',kr?'아파트 · 서울 자치구 기준. 지역별 조건에 맞는 계약 10건 이상.':'민간 콘도 · 싱가포르 우편구역 기준. 지역별 조건에 맞는 계약 10건 이상.',kr?'公寓 · 首尔行政区。每区至少10笔匹配合同。':'私人公寓 · 新加坡邮政区。每区至少10笔匹配合同。')}</p>
  {ranked.length>0?<>
   <p className={styles.meta}>{rankingCopy(locale,'Contract month:','계약 월:','合同月份：')} <strong>{rankingDate(locale,ranked[0]!.month)}</strong> · {ranked.length} {rankingCopy(locale,'qualifying districts · Checked','개 지역 · 확인일','个符合条件的区域 · 核查日期')} {rankingDate(locale,checkedAt)} (UTC)</p>
   <div className={styles.tableWrap} role="region" aria-label="District monthly rent medians" tabIndex={0}><table>
    <caption>{rankingCopy(locale,'District median monthly rent for the selected cohort','선택 조건에 맞는 지역별 월세 중앙값','所选条件下各区域的月租中位数')}</caption>
    <thead><tr><th scope="col">{t("Rank")}</th><th scope="col">{t("District")}</th><th scope="col">{t("Median rent / month")}</th>{kr&&<th scope="col">{t("Median deposit")}</th>}<th scope="col">{t("Middle 50% / month")}</th><th scope="col">{t("Contracts")}</th></tr></thead>
    <tbody>{ranked.map(row=><tr key={row.region}>
     <td className={styles.rank}>{row.rank<=3?<span className={styles.rankBadge} data-rank={row.rank}>TOP<br/>{row.rank}</span>:row.rank}</td>
     <th scope="row">{regionName(row)}<small>{kr?<Link href={`${rankingPath(locale,'/kr/seoul/explore/')}${row.region}/?transaction=monthly&propertyType=apartment`}>{t("Explore district →")}</Link>:<Link href={rankingPath(locale,"/sg/singapore/explore/")}>{t("Explore Singapore →")}</Link>}</small></th>
     <td data-label={t("Median rent / month")} className={styles.price}>{money(row.amount)}</td>
     {kr&&<td data-label={t("Median deposit")}>{row.median_deposit===null?t("Not disclosed"):money(row.median_deposit)}</td>}
     <td data-label={t("Middle 50% / month")}>{money(row.p25)}–{money(row.p75)}</td><td data-label={t("Contracts")}>{row.n}</td>
    </tr>)}</tbody>
   </table></div>
   <p className={styles.caution}>{locale === 'en' ? <>These are reported contracts, not currently available offers. Matching size{kr?' and deposit bands':' and bedroom count'} improves comparability, but lease terms, condition and eligibility still vary.{kr?' Median rent and median deposit are separate statistics, not a single available lease.':''}</> : rankingCopy(locale,'',"현재 구할 수 있는 매물이 아닌 신고 계약입니다. 면적과 보증금 구간 또는 침실 수를 맞춰 비교하지만 계약 조건·주택 상태·자격 요건은 다릅니다. 월세 중앙값과 보증금 중앙값은 각각의 통계이며 하나의 임대 계약을 뜻하지 않습니다.","这些是已申报合同，而非当前可租房源。面积及押金区间或卧室数匹配可提高可比性，但租约条款、房况及资格仍有差异。月租与押金中位数是独立统计，并非同一份租约。")}</p>
   <details className={styles.method}><summary>{t("Sources and calculation")}</summary><div>
    <p>{kr?<a href="https://rt.molit.go.kr/">MOLIT</a>:<a href="https://www.ura.gov.sg/">URA</a>} · Active/corrected records, latest source-key version. Latest completed calendar month with data for this source is selected before cohort filtering; sparse cohorts do not silently switch to an older month. Districts with fewer than 10 matching contracts are omitted. Equal medians share a rank.</p>
    <p>{kr?t("Exclusive floor area uses an open lower and closed upper limit: 40 < area ≤ 60 m² or 60 < area ≤ 85 m². Deposit intervals are [0,100 million), [100 million,300 million), and [300 million,+∞) KRW. Zero-monthly-rent jeonse is excluded."):t("Only original URA area bands wholly within the selected interval are included; no midpoint estimates are used. Bedrooms must match exactly. Non-landed rentals are matched to condominium-classified sale evidence; unmatched projects, URA apartments, EC, landed homes and HDB are excluded.")}</p>
    <p>Middle 50% is the 25th–75th percentile. Coverage is limited to eligible records held by SignedPrice; late filings and corrections can change rankings. Source collected: {[...new Set(ranked.map(row=>formatRankingDate(row.source_as_of)))].join(', ')} (UTC).</p>
   </div></details>
  </>:<p className={styles.empty}>{rows===null?t("Verified rental rankings are temporarily unavailable. Please try again shortly."):t("No district has 10 matching contracts in the latest source month. Adjust the area or other conditions.")}</p>}
 </section>;
}
