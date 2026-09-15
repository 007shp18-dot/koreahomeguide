'use client';

import Link from 'next/link';
import { panelCopy } from '../../lib/brief/panel-copy';
import { useId } from 'react';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { marketHref } from '../../lib/locale/market-localization';
import type { PropertyReview } from '../../lib/research/property-review';
import type { DecisionPriceContext } from '../../lib/research/property-decision-price';
import { DECISION_PERSONAS, getPropertyDecision, type DecisionPersona, type DecisionItem } from '../../lib/research/property-decision';
import { getAreaDecision } from '../../lib/research/area-decision';
import { BUILDING_MANUAL } from '../../content/brief/buildings';
import { repeatedResidentItems } from '../../lib/brief/manual';
import { actualDetailHref, allReviewLocations } from '../../lib/research/property-review-locations';
import styles from './property-decision-workspace.module.css';
import { PropertyOverviewCard } from './property-overview-card';

export function PropertyDecisionReport({ showOverview = true, review, priceContext, analysisScope = 'property', locale, persona, onPersonaChange }: { showOverview?: boolean; review: PropertyReview; priceContext?: DecisionPriceContext; analysisScope?: 'property' | 'area'; locale: MarketLocale; persona: DecisionPersona; onPersonaChange: (persona: DecisionPersona) => void }) {
  const decide = analysisScope === 'area' ? getAreaDecision : getPropertyDecision;
  const report = decide(review, 'family', locale);
  const perspective = decide(review, persona, locale);
  const manual = BUILDING_MANUAL[review.id];
  const residentItems = manual ? repeatedResidentItems(manual) : [];
  const groupId = useId();
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const signingQuestions = {
    'kr-seoul': [
      t('등기부의 동·호수와 확인한 집이 같은가요?', 'Does the title identify the apartment you inspected?', '登记文件是否对应已查验的住宅？'),
      t('최신 관리비 내역과 예정된 추가 납부액을 받았나요?', 'Have you received current charges and planned additional contributions?', '是否已取得最新管理费用与计划追加缴款？'),
      t('기존 임대차와 실제 입주 가능일을 확인했나요?', 'Have existing tenancy terms and the occupation date been confirmed?', '是否已核实现有租约与实际可入住日期？'),
    ],
    'sg-singapore': [
      t('계약 세대의 평면과 소유 기간을 확인했나요?', 'Have you checked the contracted unit plan and tenure?', '是否已核实合同住宅的户型与产权期限？'),
      t('최신 관리조합 고지서와 별도 시설 이용료를 받았나요?', 'Have you received current MCST charges and separate amenity fees?', '是否已取得最新管理委员会费用与设施另收费明细？'),
      t('임차인이 있다면 계약 종료와 인도 조건을 확인했나요?', 'If tenanted, have lease expiry and possession terms been confirmed?', '如有租户，是否已核实租约到期与交付条件？'),
    ],
    'ae-dubai': [
      t('DLD 등록 번호가 계약할 프로젝트·세대와 일치하나요?', 'Does the DLD registration match the contracted project and unit?', 'DLD登记编号是否与合同项目及住宅一致？'),
      t('남은 납입 일정과 관리비 근거를 서면으로 받았나요?', 'Have you received the remaining payment schedule and basis for service charges?', '是否已取得余款支付安排与服务费依据？'),
      t('실제 인도 상태와 하자 확인 절차를 확인했나요?', 'Have you verified handover status and the defect-inspection procedure?', '是否已核实实际交付状态与缺陷检查程序？'),
    ],
    'jp-tokyo': [
      t('토지 권리와 임대차가 있다면 남은 기간을 확인했나요?', 'Have you verified land rights and any remaining lease term?', '是否已核实土地权利及剩余租赁期限？'),
      t('관리비와 수선적립금, 예정 인상액을 서면으로 받았나요?', 'Have you received management and reserve charges, including planned increases?', '是否已取得管理费、维修储备金及计划上调金额？'),
      t('임차인이 있는지와 실제 입주 가능일을 확인했나요?', 'Have you confirmed tenancy status and the actual move-in date?', '是否已核实租赁状态及实际可入住日期？'),
    ],
  }[review.marketId];
  const personaLabels: Record<DecisionPersona, string> = { family: t('자녀 있는 실거주', 'With children', '有子女自住'), couple: t('신혼·1인', 'Couple / solo', '夫妻 · 单身'), investor: t('임대·투자', 'Rental / investment', '出租 · 投资') };
  const marketBase = { 'kr-seoul': '/kr/seoul', 'sg-singapore': '/sg/singapore', 'ae-dubai': '/ae/dubai', 'jp-tokyo': '/jp/tokyo' }[review.marketId];
  const date = new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: locale === 'en' ? 'short' : 'numeric', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${report.checkedOn}T00:00:00Z`));
  const money = (amount: number) => priceContext?.currency === 'KRW' && locale === 'ko'
    ? `${new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 2 }).format(amount)}원`
    : new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', { style: 'currency', currency: priceContext?.currency ?? 'KRW', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(amount);
  const body = (item: DecisionItem) => <p lang={item.originalLanguage}>{item.body}{item.originalLanguage && locale === 'zh-CN' ? <small className={styles.languageNote}> · 英文资料</small> : null}</p>;
  const items = (values: DecisionItem[]) => <ul className={styles.points}>{values.map(item => <li key={item.id}><h4>{item.title}</h4>{body(item)}</li>)}</ul>;
  return <div className={styles.report} data-property-decision={review.id} data-decision-persona={persona}>
    {panelCopy(priceContext, locale, money).length > 0 && <section className={styles.section} aria-label={t('거래에서 읽은 내용', 'Reading these transactions', '成交数据解读')}>{panelCopy(priceContext, locale, money).map(line => <p key={line}>{line}</p>)}</section>}
    {showOverview && analysisScope === 'property' && <PropertyOverviewCard id={review.id} checkedOn={review.checkedOn} editorial={review.editorial} locale={locale} />}
    <fieldset className={styles.personas}>
      <legend>{t('누구의 관점으로 볼까요', 'Your perspective', '您的购房目的')}</legend>
      <div>{DECISION_PERSONAS.map(value => <label key={value} className={styles.persona}>
        <input type="radio" name={groupId} value={value} checked={persona === value} onChange={() => onPersonaChange(value)} />
        <span>{personaLabels[value]}</span>
      </label>)}</div>
    </fieldset>
    {analysisScope === 'area' && <p className={styles.scopeNote}>{t('지역 가격과 생활권을 분석합니다. 아래 단지별 생활 사례는 해당 단지의 조건이며 지역 전체에 적용되는 것은 아닙니다.', 'This report covers area prices and everyday life. Named-property examples describe those properties, not every home in the area.', '本报告分析区域价格与生活圈。具体楼盘的生活案例仅适用于该项目，并不代表区域内所有住宅。')}</p>}
    {manual?.commute.length ? <section className={styles.section}><h3>{t('출근 경로', 'Commuting', '通勤')}</h3><table><tbody>{manual.commute.map(item => <tr key={item.to.en}><th>{item.to[locale === 'ko' ? 'ko' : 'en']}</th><td>{item.route[locale === 'ko' ? 'ko' : 'en']}</td><td>{item.minutes}{t('분', ' min', '分钟')}</td><td><a href={item.source}>{item.queriedAt}</a></td></tr>)}</tbody></table></section> : null}
    {manual?.schools.length ? <section className={styles.section}><h3>{t('학교까지의 거리', 'Nearby school records', '附近学校记录')}</h3><table><tbody>{manual.schools.map(item => <tr key={item.name.en}><th>{item.name[locale === 'ko' ? 'ko' : 'en']}</th><td>{item.distanceM === undefined ? '' : `${item.distanceM} m`}</td><td><a href={item.source}>{item.queriedAt}</a></td></tr>)}</tbody></table><p>{t('학교 배정은 정확한 주소와 해당 학년도 기준으로 확인해주세요.', 'Confirm admission arrangements for the exact address and school year.', '请按具体地址及入学年份核实入学安排。')}</p></section> : null}
    {manual?.residents && residentItems.length > 0 && <section className={styles.section}><h3>{t('후기에서 반복된 이야기', 'Recurring observations in reviews', '评论中反复出现的观察')}</h3>{residentItems.map(item => <p key={item.topic}>{item.text[locale === 'ko' ? 'ko' : 'en']}{item.verified && <> <a href={item.verified.source}>{item.verified.value} {item.verified.unit} · {item.verified.queriedAt}</a></>}</p>)}<p>{manual.residents.sourceLabel[locale === 'ko' ? 'ko' : 'en']} · {manual.residents.reviewCount} · {manual.residents.readAt}</p><p>{t('후기는 작성자의 경험입니다. 여러 후기에서 겹친 내용만 남겼으며 사실 확인이 끝난 진술로 취급하지 않습니다.', 'These are personal experiences that recur in multiple reviews. They remain unverified observations.', '这些是多篇评论中重复出现的个人经验，仍属未经核实的观察。')}</p></section>}
    <div className={styles.tradeoffs} data-decision-fit aria-live="polite">
      <section><h3>{t('맞을 것 같은 경우', 'May suit you', '可能适合的情况')}</h3>{items(perspective.pros)}</section>
      <section><h3>{t('확인이 더 필요한 경우', 'Needs a closer check', '需要进一步核查的情况')}</h3>{items(perspective.cons)}</section>
    </div>
    <section className={styles.section} data-decision-price={priceContext?.scope ?? 'unavailable'}><h3>{t('이 값이 조건에 맞나', 'Does the price fit?', '价格与条件相符吗')}</h3>
      {priceContext && <div className={styles.priceContext}>
        <p>{priceContext.label}</p>
        {priceContext.amount !== null && priceContext.amount > 0 ? <strong>{money(priceContext.amount)}{priceContext.unit === 'per-sqm' ? ' / ㎡' : ''}</strong> : <p>{priceContext.basis}</p>}
        {priceContext.count !== null && <p>{priceContext.count.toLocaleString(locale)}{t('건', ' records', ' 笔')} {priceContext.period ? `· ${priceContext.period}` : ''}</p>}
        {priceContext.amount !== null && <p>{priceContext.basis}</p>}
        {priceContext.range && <p>{t('거래 가운데 50%', 'Middle 50% of contracts', '中间 50% 的成交')} · {money(priceContext.range.low)} – {money(priceContext.range.high)}</p>}
        {priceContext.note && <p className={styles.muted}>{priceContext.note}</p>}
      </div>}
      <h4 className={styles.priceTitle}>{report.price.title}</h4>{body(report.price)}</section>
    {report.comparisons.length > 0 && <section className={styles.section}>
      <h3>{t('같이 볼 대안', 'Alternatives to weigh', '值得比较的选择')}</h3>
      <ul className={styles.comparisons}>{report.comparisons.map(item => {
        const match = allReviewLocations().find(location => location.name && Object.values(location.name).includes(item.name));
        const href = match ? actualDetailHref(locale, match.reviewId) : null;
        return <li key={item.name}><h4>{href ? <Link href={href}>{item.name} <span aria-hidden="true">↗</span></Link> : item.name}</h4><p>{item.reason}</p><p className={styles.muted}>{item.condition}</p></li>;
      })}</ul>
    </section>}
    <section className={styles.checklist} data-signing-checklist><h3>{t('계약 전에 물어볼 것', 'Before signing', '签约前的问题')}</h3><ul className={styles.points}>{signingQuestions.map(question => <li key={question}><h4>{question}</h4></li>)}</ul></section>
    <p className={styles.method}>{t('자료 확인', 'Evidence checked', '资料核查')} {date} · {t('개별 세대의 적정가·수익률을 산정한 보고서는 아닙니다.', 'This report does not estimate a unit’s fair value or rental yield.', '本报告不估算单套住宅的合理价格或租金收益率。')}</p>
    <details className={styles.sources} data-report-sources>
      <summary>{t('자료 출처', 'Sources', '资料来源')}</summary>
      <ul>{review.sources.map(source => <li key={source.id}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
        <p>{source.note[locale === 'ko' ? 'ko' : 'en']}</p>
      </li>)}</ul>
    </details>
    <footer className={styles.reportFooter}><Link className={styles.primaryButton} href={marketHref(locale, `${marketBase}/shortlist/`)}>{analysisScope === 'area' ? t('다른 후보와 비교', 'Compare alternatives', '比较其他选择') : t('다른 단지와 비교', 'Compare alternatives', '比较其他项目')} <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
