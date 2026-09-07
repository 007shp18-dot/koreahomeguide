'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { calculatePropertyScenario, type PropertyScenario } from '../../lib/research/property-research';
import styles from './property-scenario.module.css';
import {sendToolEvent} from '../tools/tool-analytics';
import type {ToolDimensions} from '../../lib/analytics/tool-events';

export function PropertyScenarioCalculator({ price, currency, locale = 'en', analytics }: Readonly<{
  price: number | null; currency: 'KRW' | 'SGD' | 'AED'; locale?: 'en' | 'ko'; analytics?: Pick<ToolDimensions,'market'|'surface'>;
}>) {
  const id = useId();
  const started = useRef(false);
  const completed = useRef(false);
  const edit = (key: keyof PropertyScenario, value: string) => {
    if (!started.current && analytics) { started.current = true; sendToolEvent('tool_start', {...analytics, tool: 'property-scenario'}); }
    setInputs(current => ({...current,[key]:value}));
  };
  const ko = locale === 'ko';
  const [inputs, setInputs] = useState<Record<keyof PropertyScenario, string>>({
    price: price === null ? '' : String(Math.round(price)), acquisitionCosts: '', monthlyRent: '', annualCosts: '', vacancyMonths: '',
  });
  const ready = Object.values(inputs).every((value) => value.trim() !== '');
  const scenario = ready ? calculatePropertyScenario({ price: Number(inputs.price), acquisitionCosts: Number(inputs.acquisitionCosts), monthlyRent: Number(inputs.monthlyRent), annualCosts: Number(inputs.annualCosts), vacancyMonths: Number(inputs.vacancyMonths) }) : null;
  useEffect(() => {
    if (scenario !== null && !completed.current && started.current && analytics) {
      completed.current = true; sendToolEvent('tool_complete', {...analytics, tool:'property-scenario'});
    }
  }, [scenario, analytics]);
  const money = (value: number) => new Intl.NumberFormat(ko ? 'ko-KR' : 'en', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0 }).format(value);
  const fields: readonly [keyof PropertyScenario, string][] = [
    ['price', ko ? '매입 가격' : 'Purchase price'], ['acquisitionCosts', ko ? '취득세·중개·법무 등 취득 비용 합계' : 'Acquisition costs, including taxes and fees'],
    ['monthlyRent', ko ? '예상 월 임대료' : 'Expected monthly rent'], ['annualCosts', ko ? '연간 관리·보수·세금 등 운영 비용' : 'Annual operating costs, including taxes'],
    ['vacancyMonths', ko ? '연간 예상 공실 개월' : 'Expected vacant months per year'],
  ];
  return <section className={styles.section} aria-labelledby={`${id}-heading`} data-property-scenario={currency}>
    <h2 id={`${id}-heading`}>{ko ? '매입 비용과 임대 수익 계산' : 'Purchase and rental scenario'}</h2>
    <p>{ko ? '매입 가격은 공개된 매매 중앙값을 시작값으로 사용합니다. 나머지는 직접 입력하세요. 세율이나 임대료를 자동 추정하지 않습니다.' : 'The published sale median is a starting price, where available. Enter your own costs, rent and vacancy assumptions; taxes and rents are not estimated automatically.'}</p>
    <div className={styles.workspace}><div className={styles.inputPanel}><h3>{ko ? '매입·임대 조건' : 'Your assumptions'}</h3><div className={styles.form}>{fields.map(([key, label]) => <label key={key} htmlFor={`${id}-${key}`}>{label}{key === 'vacancyMonths' ? '' : ` (${currency})`}<input id={`${id}-${key}`} type="number" inputMode="decimal" min="0" max={key === 'vacancyMonths' ? 12 : undefined} step="any" value={inputs[key]} placeholder={key === 'price' ? undefined : (ko ? '직접 입력 · 해당 없으면 0' : 'Enter assumption; 0 if none')} onChange={(event) => edit(key,event.target.value)} /></label>)}</div></div><div className={styles.resultPanel}><h3>{ko ? '계산 결과' : 'Your scenario'}</h3>
    {scenario ? <dl className={styles.results} aria-live="polite">
      <div className={styles.primaryResult}><dt>{ko ? '취득 비용 대비 운영 수익률' : 'Operating yield on total cost'}</dt><dd>{scenario.netYield.toFixed(2)}<span>%</span></dd></div>
      <div><dt>{ko ? '총 취득 비용' : 'Total acquisition outlay'}</dt><dd>{money(scenario.totalCost)}</dd></div>
      <div><dt>{ko ? '연간 순운영 수입' : 'Annual net operating income'}</dt><dd>{money(scenario.netIncome)}</dd></div>
    </dl> : <p className={styles.empty} role="status">{ko ? '모든 가정을 입력하면 계산 결과가 표시됩니다. 해당 없는 비용은 0을 입력하세요.' : 'Complete every assumption to calculate. Enter 0 for costs that do not apply.'}</p>}</div></div>
    <p className={styles.method}>{ko ? '계산식: (월 임대료 × (12 − 공실 개월) − 연 운영 비용) ÷ (매입 가격 + 취득 비용). 차입금·이자·양도차익·개인 소득세·환율 변화는 반영하지 않습니다. 실제 수익률 예측이 아닙니다.' : 'Formula: (monthly rent × (12 − vacant months) − annual operating costs) ÷ (price + acquisition costs). Excludes financing, capital gains, personal income tax and exchange-rate changes. Results reflect only the assumptions entered.'}</p>
  </section>;
}
