'use client';

import Link from 'next/link';
import { useId } from 'react';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { marketHref } from '../../lib/locale/market-localization';
import type { PropertyReview } from '../../lib/research/property-review';
import type { DecisionPriceContext } from '../../lib/research/property-decision-price';
import { DECISION_PERSONAS, getPropertyDecision, type DecisionPersona, type DecisionItem } from '../../lib/research/property-decision';
import { getAreaDecision } from '../../lib/research/area-decision';
import { getCommunitySignals } from '../../lib/research/community-signals';
import { actualDetailHref, allReviewLocations } from '../../lib/research/property-review-locations';
import styles from './property-decision-workspace.module.css';
import { PropertyOverviewCard } from './property-overview-card';

export function PropertyDecisionReport({ showOverview = true, review, priceContext, analysisScope = 'property', locale, persona, onPersonaChange }: { showOverview?: boolean; review: PropertyReview; priceContext?: DecisionPriceContext; analysisScope?: 'property' | 'area'; locale: MarketLocale; persona: DecisionPersona; onPersonaChange: (persona: DecisionPersona) => void }) {
  const report = analysisScope === 'area' ? getAreaDecision(review, persona, locale) : getPropertyDecision(review, persona, locale);
  const communityChecks = getCommunitySignals(review, persona, locale, analysisScope);
  const groupId = useId();
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const personaLabels: Record<DecisionPersona, string> = { family: t('자녀 있는 실거주', 'With children', '有子女自住'), couple: t('신혼·1인', 'Couple / solo', '夫妻 · 单身'), investor: t('임대·투자', 'Rental / investment', '出租 · 投资') };
  const marketBase = { 'kr-seoul': '/kr/seoul', 'sg-singapore': '/sg/singapore', 'ae-dubai': '/ae/dubai', 'jp-tokyo': '/jp/tokyo' }[review.marketId];
  const date = new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: locale === 'en' ? 'short' : 'numeric', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${report.checkedOn}T00:00:00Z`));
  const money = (amount: number) => priceContext?.currency === 'KRW' && locale === 'ko'
    ? `${new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 2 }).format(amount)}원`
    : new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', { style: 'currency', currency: priceContext?.currency ?? 'KRW', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(amount);
  const body = (item: DecisionItem) => <p lang={item.originalLanguage}>{item.body}{item.originalLanguage && locale === 'zh-CN' ? <small className={styles.languageNote}> · 英文资料</small> : null}</p>;
  const items = (values: DecisionItem[]) => <ul className={styles.points}>{values.map(item => <li key={item.id}><h4>{item.title}</h4>{body(item)}</li>)}</ul>;
  return <div className={styles.report} data-property-decision={review.id} data-decision-persona={persona}>
    {showOverview && analysisScope === 'property' && <PropertyOverviewCard id={review.id} checkedOn={review.checkedOn} locale={locale} />}
    <fieldset className={styles.personas}>
      <legend>{t('누구의 관점으로 볼까요', 'Your perspective', '您的购房目的')}</legend>
      <div>{DECISION_PERSONAS.map(value => <label key={value} className={styles.persona}>
        <input type="radio" name={groupId} value={value} checked={persona === value} onChange={() => onPersonaChange(value)} />
        <span>{personaLabels[value]}</span>
      </label>)}</div>
    </fieldset>
    <section className={styles.verdict} aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>{t('내 상황에 맞춰 보기', 'For your situation', '结合您的情况')}</p>
      <h3>{report.verdict.label}</h3>
      <p>{report.summary}</p>
    </section>
    {analysisScope === 'area' && <p className={styles.scopeNote}>{t('지역 가격과 생활권을 분석합니다. 아래 단지별 생활 사례는 해당 단지의 조건이며 지역 전체에 적용되는 것은 아닙니다.', 'This report covers area prices and everyday life. Named-property examples describe those properties, not every home in the area.', '本报告分析区域价格与生活圈。具体楼盘的生活案例仅适用于该项目，并不代表区域内所有住宅。')}</p>}
    <section className={styles.section}>
      <div className={styles.sectionHeading}><h3>{t(`먼저 볼 ${report.priorities.length}가지`, `${report.priorities.length} priorities for this ${analysisScope === 'area' ? 'area' : 'property'}`, `优先考虑的 ${report.priorities.length} 个问题`)}</h3></div>
      <ol className={styles.priorities}>{report.priorities.map((item, index) => <li key={item.id}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><div><h4>{item.title}</h4>{body(item)}</div></li>)}</ol>
    </section>
    {communityChecks.length > 0 && <section className={styles.section} data-community-checks={review.id}>
      <h3>{t('방문 때 확인할 생활 조건', 'Everyday conditions to test at a viewing', '看房时要验证的生活条件')}</h3>
      <p className={styles.scopeNote}>{analysisScope === 'area'
        ? t('개별 생활 경험에서 찾은 질문입니다. 이 지역에서도 위치와 시간대에 따라 달라질 수 있습니다.', 'Questions from individual experiences; conditions within this area can vary by location and time.', '这些问题来自个别生活经验，同一区域内也会因位置和时段而不同。')
        : t('개별 생활 경험에서 찾은 질문입니다. 위치와 시간대에 따라 달라질 수 있어 방문 때 확인하세요.', 'Questions from individual experiences; test them at a viewing as conditions vary by location and time.', '这些问题来自个别生活经验，请在看房时验证，具体情况会因位置和时段而不同。')}</p>
      <ul className={styles.points}>{communityChecks.map(check => <li key={check.id} data-community-signal={check.id}>
        <h4>{check.title}</h4><p>{check.body}</p>
        <p><strong>{t('현장 질문', 'At the viewing', '现场要问')} · </strong>{check.question}</p>
      </li>)}</ul>
    </section>}
    <div className={styles.tradeoffs}>
      <section><h3>{t('살 이유', 'Reasons to buy', '购买理由')}</h3>{items(report.pros)}</section>
      <section><h3>{t('망설일 이유', 'Reasons to pause', '犹豫之处')}</h3>{items(report.cons)}</section>
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
    <section className={styles.section}><h3>{t('판단이 바뀌는 조건', 'What would change the decision', '什么会改变判断')}</h3>{items(report.reversals)}</section>
    <section className={styles.checklist}><h3>{t('계약 전에 물어볼 것', 'Before signing', '签约前的问题')}</h3>{items(report.checklist)}</section>
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
