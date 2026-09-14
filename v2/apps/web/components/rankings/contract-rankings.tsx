import { rankingText, rankingCopy, rankingPath, rankingDate, type RankingLocale } from '../../lib/rankings/ranking-locale';
import Link from 'next/link';
import { rankingHref, rankingMoney, type RankingOrder, type ContractRankingRow } from '../../lib/rankings/contract-ranking-query';
import { buildingDisplayName } from '../../lib/public-market/seoul-display-names';
import styles from './contract-rankings.module.css';
import { RankingControls } from './ranking-controls';

export function ContractRankings({ rows, checkedAt, city, kind, order = 'highest', locale = 'en' }: {
 locale?: RankingLocale; rows: ContractRankingRow[] | null; checkedAt?: string; city: 'seoul' | 'singapore'; kind: 'sale' | 'rent'; order?: RankingOrder;
}) {
 const t = (text: string) => rankingText(locale,text);
 const selected = rows?.filter(row => row.city === city && row.kind === kind) ?? [];
 const first = selected[0];
 const seoulName = (row: ContractRankingRow) => {
  const name = buildingDisplayName(row.name, locale);
  const district = row.district_slug?.replace(/^./, c => c.toUpperCase());
  return name === row.name && district ? `${row.name} · ${district}` : name;
 };
 const title = rankingCopy(locale, `${city === 'seoul' ? 'Seoul apartments' : 'Singapore condos'} · ${order} ${kind === 'sale' ? 'sale prices' : 'monthly rents'}`, `${city === 'seoul' ? '서울 아파트' : '싱가포르 콘도'} · ${order === 'highest' ? '최고' : '최저'} ${kind === 'sale' ? '매매가격' : '월세'} 순위`, `${city === 'seoul' ? '首尔公寓' : '新加坡公寓'} · ${order === 'highest' ? '最高' : '最低'}${kind === 'sale' ? '成交价格' : '月租'}排行`);
 return <section className={styles.section} aria-labelledby="contract-ranking-title">
  <RankingControls locale={locale} city={city} kind={kind} order={order} />
  <div className={styles.heading}><div><h2 id="contract-ranking-title">{title}</h2></div><span>TOP 50</span></div>
  {first ? <>
   <p className={styles.meta}>{rankingCopy(locale,'Contract month:','계약 월:','合同月份：')} <strong>{rankingDate(locale,first.month)}</strong> · {first.sample.toLocaleString('en-US')} {rankingCopy(locale,'eligible records · Checked:','건의 집계 대상 계약 · 확인일:','笔符合条件的合同 · 核查日期：')} {rankingDate(locale,checkedAt)} (UTC)</p>
   <p className={styles.note}>{rankingCopy(locale,`Total reported prices · ${city === 'seoul' ? 'Seoul apartments' : 'Singapore condominiums'}.`, '신고된 매매 총액 기준입니다.', '以申报成交总价为准。')}</p>
   <p className={styles.note}>{t("This ranking uses individual reported contracts from the latest available completed calendar month. Building and district pages use a wider comparison period.")}</p>
   <p className={styles.note}>{rankingCopy(locale,`One contract per property: its ${order} reported price in this month. Later cancellations or corrections may change this ranking.`, `단지마다 해당 월의 ${order === 'highest' ? '최고가' : '최저가'} 계약 1건을 표시합니다. 취소·정정에 따라 순위가 바뀔 수 있습니다.`, `每个项目仅显示当月${order === 'highest' ? '最高价' : '最低价'}合同一笔。后续撤销或更正可能改变排名。`)}</p>
   <div className={styles.tableWrap} role="region" aria-label={title} tabIndex={0}><table>
    <caption>{title} — {rankingDate(locale,first.month)} · {city === 'seoul' ? 'KRW' : 'SGD'}</caption>
    <thead><tr><th scope="col">{t("Rank")}</th><th scope="col">{t("Property / district")}</th><th scope="col">{t("Area, m²")}</th><th scope="col">{kind === 'sale' ? t("Sale price") : t("Rent / month")}</th>{city === 'seoul' && kind === 'rent' && <th scope="col">{t("Deposit")}</th>}<th scope="col">{t("Contract")}</th></tr></thead>
    <tbody>{selected.map(row => <tr key={row.id}>
     <td className={styles.rank}>{row.rank <= 3 ? <span className={styles.rankBadge} data-rank={row.rank}>TOP<br />{row.rank}</span> : row.rank.toString().padStart(2,'0')}</td>
     <th scope="row"><details><summary>{city === 'seoul' ? seoulName(row) : row.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</summary><div className={styles.detail}>
      <p>{kind === 'sale' ? t('Sale price') : t('Rent / month')} · {row.contract_date}<br />{rankingCopy(locale,'Floor','층','楼层')} {row.floor_value ?? row.floor_range ?? t('Not disclosed')}{row.bedrooms !== null ? ` · ${t('Bedrooms')} ${Number(row.bedrooms)}` : ''}</p>
      <Link href={rankingPath(locale, rankingHref(row))}>{t("View property evidence →")}</Link>
     </div></details><small>{city === 'seoul' ? row.district_slug : `${t('District')} ${row.district}`}</small></th>
     <td data-label={t("Area, m²")}>{row.area_range ?? (row.area === null ? t("Not disclosed") : Number(row.area).toLocaleString('en-US', {maximumFractionDigits:3}))}</td>
     <td data-label={kind === 'sale' ? t("Sale price") : t("Rent / month")} className={styles.price}>{rankingMoney(row)}{kind === 'rent' ? '/mo' : ''}</td>
     {city === 'seoul' && kind === 'rent' && <td data-label={t("Deposit")} className={styles.deposit}>{row.deposit === null ? t("Not disclosed") : rankingMoney(row,row.deposit)}</td>}
     <td data-label={t("Contract")}>{row.contract_date}<small>{t("One contract per property")}</small></td>
    </tr>)}</tbody>
   </table></div>
   <p className={styles.unitGuide}>{city === 'seoul' ? t("₩ = South Korean won. Full amounts shown; no multiplier needed.") : t("S$ = Singapore dollars. Full amounts shown; no multiplier needed.")}</p>
   <details className={styles.method}><summary>{t("Sources, coverage and ranking rules")}</summary><div>
   <p className={styles.note}>{locale === 'en' ? <>Ranked by {kind === 'sale' ? 'total sale price, not price per m²' : 'monthly rent, not total housing cost'}. {city === 'seoul' && kind === 'rent' ? 'Refundable deposits are shown separately.' : ''} Latest available completed calendar month; late filings and corrections may change this list.</> : rankingCopy(locale,'',"매매는 ㎡당 가격이 아닌 총액, 임대는 전체 주거비가 아닌 월세로 정렬합니다. 보증금은 별도로 표시합니다. 최근 완료 월 기준이며 늦은 신고·정정으로 변경될 수 있습니다.","买卖按总价而非每平方米价格、租赁按月租而非总住房成本排序。押金单独显示。以最新完整月份为准，延迟申报或更正可能改变结果。")}</p>
   {order === 'lowest' && <p className={styles.caution}>{locale === 'en' ? <>Lowest reported amounts are not available offers or affordability recommendations. Compare floor area{kind === 'rent' ? ', deposits and eligibility requirements' : ', tenure and transaction conditions'}. Special terms may apply; the source does not establish open-market availability.</> : rankingCopy(locale,'',"낮은 신고가격이 현재 구할 수 있는 매물이나 저렴한 주택을 의미하지는 않습니다. 면적·소유 조건·보증금·거래 조건을 함께 확인하세요. 특별 조건이 적용될 수 있으며 일반 매물 여부는 원본에서 확인되지 않습니다.","低申报价不代表当前可购房源或可负担性推荐。请结合面积、产权、押金和交易条件比较；可能存在特殊条款，来源并未确认公开市场可售性。")}</p>}
<p>{rankingCopy(locale,'Source collected:','자료 수집일:','来源采集日期：')} {rankingDate(locale,first.source_as_of)}</p>
    <p>Source: {city === 'seoul' ? <a href="https://rt.molit.go.kr/">MOLIT Real Estate Transaction Disclosure System</a> : <a href="https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties">Urban Redevelopment Authority</a>}. SignedPrice ranks the eligible records held in its current dataset, not asking prices or valuations. This is not a guarantee of complete market coverage.</p>
    <p>{locale === 'en' ? <>Only active or corrected records are included; the latest version of each source business key is used. Before ranking, each property ID contributes only its {order} priced contract in the selected month. Equal amounts share a rank; contract date and record ID decide display order and which tied contract represents a property. At most 50 distinct properties are displayed, including only as many tied records as fit that limit. The eligible record count includes contracts before property deduplication.</> : rankingCopy(locale,'',"유효·정정 계약의 최신 원본 버전만 사용합니다. 선택한 월에 단지 ID별로 정렬 방향에 맞는 최고가 또는 최저가 계약 1건을 선택한 뒤 순위를 계산합니다. 같은 가격은 공동 순위이며 계약일·레코드 ID로 대표 계약과 표시 순서를 정합니다. 동가 계약도 50개 한도 안에서만 표시합니다. 집계 대상 계약 수는 단지 중복 제거 전 건수입니다.","仅使用有效或更正合同的最新来源版本。先按项目ID选择当月符合排序方向的最高价或最低价合同一笔，再计算排名。同价并列，合同日期和记录ID决定代表合同及显示顺序。并列记录也受50项上限限制。符合条件合同数为项目去重前的数量。")}</p>
    <p>{city === 'seoul' ? t("Apartments only. Areas are reported exclusive areas. Rent rankings exclude zero-monthly-rent jeonse contracts. Deposits are not converted into rent equivalents.") : t("Private condominiums only; HDB, executive condominiums, landed homes and URA-classified apartments are excluded. Sales are single-unit transactions. Rental records are limited to non-landed projects also identified as condominiums in the available sale data; unmatched projects are excluded. Rental areas remain the original reported ranges, not midpoint estimates. URA dates are shown at month precision.")}</p>
   </div></details>
  </> : <p className={styles.empty}>{rows === null ? t("Verified contract rankings are temporarily unavailable. Please try again shortly.") : t("No eligible contracts are available for this category yet.")}</p>}
 </section>;
}
