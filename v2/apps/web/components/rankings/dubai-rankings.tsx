import { rankingText, rankingCopy, rankingPath, rankingDate, type RankingLocale } from '../../lib/rankings/ranking-locale';
import Link from 'next/link';
import type { DubaiEvidenceContext } from '../../lib/dubai/evidence-repository.server';
import type { DubaiProjectEvidence } from '../../lib/dubai/project-evidence';
import type { RankingOrder } from '../../lib/rankings/contract-ranking-query';
import { rankDubaiProjects } from '../../lib/rankings/dubai-ranking';
import { DubaiSourceNotice } from '../dubai/dubai-source-notice';
import { RankingControls } from './ranking-controls';
import styles from './contract-rankings.module.css';

export function DubaiRankings({ projects, context, order, stage = 'off-plan', locale = 'en' }: {
 stage?: 'ready' | 'off-plan'; locale?: RankingLocale; projects: readonly DubaiProjectEvidence[]; context: DubaiEvidenceContext | null; order: RankingOrder;
}) {
 const t = (text: string) => rankingText(locale,text);
 const rows = rankDubaiProjects(projects,order,stage);
 const stageLabel = t(stage === 'ready' ? 'Ready' : 'Off-Plan');
 const title = rankingCopy(locale,`Dubai ${stageLabel} apartments · ${order} project median prices`, `두바이 ${stageLabel} 아파트 · 단지별 중앙값 ${order === 'highest' ? '높은' : '낮은'} 순`, `迪拜${stageLabel}公寓 · 项目中位价${order === 'highest' ? '从高到低' : '从低到高'}`);
 return <section className={styles.section} aria-labelledby="dubai-ranking-title">
  <RankingControls locale={locale} city="dubai" kind="sale" order={order}><label>{t('Completion')}<select key={stage} name="stage" defaultValue={stage}><option value="off-plan">{t('Off-Plan')}</option><option value="ready">{t('Ready')}</option></select></label></RankingControls>
  <div className={styles.heading}><h2 id="dubai-ranking-title">{title}</h2>{rows.length > 0 && <span>TOP {rows.length}</span>}</div>
  <p className={styles.note}>{rankingCopy(locale,'One row per project · Median reported sale price, not an individual contract or asking price. At least 30 sales per project; completion stages are ranked separately and villas excluded.','단지당 1행 · 개별 계약이나 호가가 아닌 신고 매매가격 중앙값입니다. 단지별 30건 이상이며 준공·분양을 별도 집계하고 빌라는 제외합니다.','每个项目一行，以申报成交价中位数排名，并非单笔合同或挂牌价。每个项目至少30笔成交；现房与期房分别排名，不含别墅。')}</p>
  {context && <p className={styles.meta}>{rankingCopy(locale,'Comparison period:','비교 기간:','比较期间：')} {rankingDate(locale,context.comparisonPeriod.from)}–{rankingDate(locale,context.comparisonPeriod.to)} · AED · {rankingCopy(locale,'Data as of','자료 기준일','数据截至')} {rankingDate(locale,context.asOfDate)}</p>}
  {!context ? <p className={styles.empty}>{t("Verified Dubai rankings are temporarily unavailable. Please try again shortly.")}</p>
   : rows.length === 0 ? <p className={styles.empty}>{t("No eligible project rankings are available for this publication.")}</p>
   : <div className={styles.tableWrap} role="region" aria-label={title} tabIndex={0}><table>
    <caption>{title} · AED</caption>
    <thead><tr><th scope="col">{t("Rank")}</th><th scope="col">{t("Project / area")}</th><th scope="col">{t("Median sale price")}</th><th scope="col">{t("Reported sales")}</th></tr></thead>
    <tbody>{rows.map(row => <tr key={row.projectNumber}>
     <td className={styles.rank}>{row.rank <= 3 ? <span className={styles.rankBadge} data-rank={row.rank}>TOP<br/>{row.rank}</span> : String(row.rank).padStart(2,'0')}</td>
     <th scope="row"><Link href={`${rankingPath(locale,'/ae/dubai/explore/')}?area=${encodeURIComponent(row.areaSlug)}&project=${encodeURIComponent(row.id)}&housing=apartment&stage=${stage}`}>{row.name}</Link><small>{row.areaSlug.replaceAll('-',' ')}</small></th>
     <td data-label={t("Median sale price")} className={styles.price}>AED {row.medianPriceAed.toLocaleString('en-US')}</td>
     <td data-label={t("Reported sales")}>{row.n.toLocaleString('en-US')}</td>
    </tr>)}</tbody>
   </table></div>}
  <p className={styles.note}>{t("Homes differ in size and condition. Equal medians share a rank. Up to 50 unique projects are shown; this is not a complete market ranking.")}</p>
  {context && <DubaiSourceNotice locale={locale} sourceUrl={context.sourceUrl} licenseUrl={context.licenseUrl} period={`${context.comparisonPeriod.from}–${context.comparisonPeriod.to}`}/>}
 </section>;
}
