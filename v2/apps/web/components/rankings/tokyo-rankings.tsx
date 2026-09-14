import { rankingText, rankingCopy, rankingPath, rankingDate, type RankingLocale } from '../../lib/rankings/ranking-locale';
import Link from 'next/link';
import data from '../../data/tokyo-ranking-2026-q1.json';
import { RankingControls } from './ranking-controls';
import styles from './contract-rankings.module.css';

export function TokyoRankings({ locale = 'en' }: { locale?: RankingLocale } = {}) {
  const t = (text: string) => rankingText(locale,text);
  const title = rankingCopy(locale,'Tokyo resale condos · highest reported sale prices','도쿄 중고 맨션 · 최고 신고 매매가격','东京二手公寓 · 最高申报成交价');
  return <section className={styles.section} aria-labelledby="tokyo-ranking-title">
    <RankingControls locale={locale} city="tokyo" kind="sale" order="highest" />
    <div className={styles.heading}><h2 id="tokyo-ranking-title">{title}</h2><span>TOP 50</span></div>
    <p className={styles.meta}><strong>{data.period}</strong> · 1,297 {rankingCopy(locale,'eligible records · JPY · Checked','건의 집계 대상 계약 · JPY · 확인일','笔符合条件的记录 · JPY · 核查日期')} {rankingDate(locale,data.checkedAt)}</p>
    <p className={styles.note}>{rankingCopy(locale,'Total reported prices · Anonymous district records · January–March 2026.','신고 총액 · 단지가 식별되지 않는 지역 단위 거래 · 2026년 1–3월.','申报总价 · 无法识别项目的匿名区域记录 · 2026年1–3月。')}</p>
    <div className={styles.tableWrap} role="region" aria-label="Tokyo reported sales" tabIndex={0}><table>
      <caption>{title} — 2026 Q1 · JPY</caption>
      <thead><tr><th scope="col">{t("Position")}</th><th scope="col">{t("District / ward")}</th><th scope="col">{t("Area, m²")}</th><th scope="col">{t("Sale price")}</th><th scope="col">{t("Period")}</th></tr></thead>
      <tbody>{data.rows.map(row => <tr key={row.recordReference}>
        <td className={styles.rank}>{row.order <= 3 ? <span className={styles.rankBadge} data-rank={row.order}>TOP<br />{row.order}</span> : row.order.toString().padStart(2, '0')}</td>
        <th scope="row"><details><summary>{row.district}</summary><div className={styles.detail}><p>{row.floorPlan || t('Not disclosed')} · {rankingCopy(locale,'Built','건축연도','建造年份')} {row.buildingYear || t('Not disclosed')} · {row.structure || t('Not disclosed')}</p><Link href={`${rankingPath(locale,'/jp/tokyo/explore/')}?city=${row.municipalityCode}`}>{t("Explore ward evidence →")}</Link></div></details><small>{row.municipality}</small></th>
        <td data-label={t("Area, m²")}>{row.areaSqm}</td>
        <td data-label={t("Sale price")} className={styles.price}>JPY {row.price.toLocaleString('en-US')}</td>
        <td data-label={t("Period")}>{data.period}</td>
      </tr>)}</tbody>
    </table></div>
    <p className={styles.unitGuide}>{t("JPY = Japanese yen. Full amounts shown; no multiplier needed.")}</p>
    <details id="tokyo-ranking-source" className={styles.method}><summary>{t("Sources, coverage and ranking rules")}</summary><div>
      <p>{t("Source:")}<a href={data.source}>Ministry of Land, Infrastructure, Transport and Tourism, Japan — Real Estate Information Library</a>. Edited and ranked by SignedPrice; this is not an official government ranking.</p>
      <p>{t("Selected from 1,297 questionnaire-derived resale-condominium records across Tokyo’s 23 wards. These anonymous district records do not identify buildings and are not a complete sales registry.")}</p>
      <p>{t("Equal prices are ordered by area, largest first, then ward, district and source reference. Numbers show display order. Positions 10 and 11 both report JPY 450,000,000.")}</p>
      <p>{t("Observation period: 2026 Q1. Acquired 10 September 2026; checked 12 September 2026. This was the newest quarter selectable on the official source at that check. Only this highest-price snapshot is published for Tokyo.")}</p>
      <p>Information may be incomplete, inaccurate or revised. <a href="https://www.reinfolib.mlit.go.jp/help/termsOfUse/">Source terms and limitations</a>.</p>
    </div></details>
  </section>;
}
