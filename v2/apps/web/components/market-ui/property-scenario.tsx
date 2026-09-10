'use client';
import {bases} from '../../lib/evidence-pool/contract';
import type {ScenarioCostOption} from '../../lib/evidence-pool/costs';
import toolSurface from '../tools/tool-surface.module.css';


import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { calculatePropertyScenario, type PropertyScenario } from '../../lib/research/property-research';
import styles from './property-scenario.module.css';
import { AmountInput } from '../amount-input';
import { acquisitionCosts, COST_RULES_CHECKED, COST_SOURCES, type CostProfile } from '../../lib/tools/acquisition-costs';
import {sendToolEvent} from '../tools/tool-analytics';
import type {ToolDimensions} from '../../lib/analytics/tool-events';
import { ToolResearchShare} from '../tools/tool-research-share';
import {createPropertyScenarioResearchSnapshot} from '../../lib/tool-research/client';

export function PropertyScenarioCalculator({ price, currency, annualRent, locale = 'en', analytics, rentSource, areaSqm, areaBand, housingType, costOptions = [], costState }: Readonly<{
  costOptions?: readonly ScenarioCostOption[]; costState?: 'ready' | 'unavailable';
  price: number | null; currency: 'KRW' | 'SGD' | 'AED'; locale?: 'en' | 'ko'; analytics?: Pick<ToolDimensions,'market'|'surface'>;
  annualRent?: number | null; rentSource?: string; areaSqm?: number | null; areaBand?: string; housingType?: string | null;
}>) {
  const id = useId();
  const started = useRef(false);
  const completed = useRef(false);
  const edit = (key: keyof PropertyScenario, value: string) => {
    if (!started.current && analytics) { started.current = true; sendToolEvent('tool_start', {...analytics, tool: 'property-scenario'}); }
    setInputs(current => ({...current,[key]:value}));
  };
  const ko = locale === 'ko';
  const [areaConfirmed, setAreaConfirmed] = useState(areaSqm != null);
  const [profile, setProfile] = useState<CostProfile>({ koreaRate: 'standard', over85: (areaSqm ?? 85) > 85, singaporeBuyer: 'foreigner', owned: 0, taxBase: 0, dubaiBuyerShare: 4, brokerPct: 2 });
  const [inputs, setInputs] = useState<Record<keyof PropertyScenario, string>>({
    price: price === null ? '' : String(Math.round(price)), acquisitionCosts: '', monthlyRent: annualRent == null ? '' : String(annualRent / 12), annualCosts: '', vacancyMonths: '0',
  });
  const residential = currency !== 'KRW' || housingType == null || ['apartment','villa_multifamily','detached'].includes(housingType);
  const fees = residential && (currency !== 'KRW' || areaConfirmed) ? acquisitionCosts(Number(inputs.price), currency, profile) : null;
  const resolved = { ...inputs, acquisitionCosts: inputs.acquisitionCosts || (fees ? String(fees.total) : '') };
  const ready = Object.values(resolved).every(value => value.trim() !== '');
  const scenario = ready ? calculatePropertyScenario({ price: Number(resolved.price), acquisitionCosts: Number(resolved.acquisitionCosts), monthlyRent: Number(resolved.monthlyRent), annualCosts: Number(resolved.annualCosts), vacancyMonths: Number(resolved.vacancyMonths) }) : null;
  const researchSnapshot = scenario === null ? null : createPropertyScenarioResearchSnapshot({
    currency,
    purchasePrice: Number(resolved.price),
    acquisitionCosts: Number(resolved.acquisitionCosts),
    monthlyRent: Number(resolved.monthlyRent),
    annualOperatingCosts: Number(resolved.annualCosts),
    yieldPct: scenario.netYield,
    areaSqm,
    housingType,
  });
  const researchRevision = scenario === null ? 'no-result' : JSON.stringify({ resolved, scenario });
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
  return <section className={`${styles.section} ${toolSurface.surface}`} aria-labelledby={`${id}-heading`} data-property-scenario={currency}>
    {!residential && <p>{ko ? '오피스텔 등 비주택의 취득 비용은 주택 세율을 적용하지 않습니다. 확인한 비용을 직접 입력하세요.' : 'Housing tax defaults do not apply to officetels and other non-housing property. Enter verified acquisition costs below.'}</p>}<h2 id={`${id}-heading`}>{ko ? '매입 비용과 임대 수익 계산' : 'Purchase and rental scenario'}</h2>
    {annualRent == null ? null : <p>{rentSource ? `${rentSource} · ` : ''}{ko ? `연 임대료 시작값 ${money(annualRent)}를 월 임대료로 환산했습니다. 직접 수정할 수 있습니다.` : `The annual rent starting point of ${money(annualRent)} has been divided by 12 to fill monthly rent. You can edit it below.`}</p>}
    <p>{ko ? '확인된 가격·임대료와 아래 조건별 취득 비용을 시작값으로 사용합니다. 취득 비용 합계는 직접 수정할 수 있습니다. 운영비는 확인한 금액을 입력하고 공실 가정도 검토하세요.' : 'Start with available prices, rent and the acquisition-cost rules below. You can override the cost subtotal. Enter verified operating costs and review the vacancy assumption.'}</p>
    {costState && <details className={styles.costRules}><summary>{ko ? '승인된 운영비 자료 · 조건 확인 후 사용' : 'Approved operating-cost evidence · check conditions'}</summary>
      <p>{ko ? '같은 이름·유형·면적 조건의 자료입니다. 지역과 적용 조건을 확인하세요. 한 항목의 금액을 연간 비용 시작값으로 넣으며, 다른 관리·수선·세금 비용은 직접 더해야 합니다. 자동 합산하지 않습니다.' : 'Candidates match the building name, home type and area requirements. Confirm the location and conditions. A selection replaces the annual-cost starting point; add other maintenance, repair and tax costs yourself. Items are not automatically summed.'}</p>
      {costState === 'unavailable' ? <p role="status">{ko ? '비용 자료를 불러오지 못했습니다. 확인한 금액을 직접 입력하세요.' : 'Cost evidence is unavailable. Enter verified costs manually.'}</p> : costOptions.length === 0 ? <p>{ko ? '이 조건에 맞는 승인 자료가 없습니다. 비용이 0이라는 뜻은 아닙니다.' : 'No approved evidence matches these conditions. This does not mean costs are zero.'}</p> : costOptions.map(option => <article key={option.id}>
        <p><strong>{option.building} · {option.area}</strong> · {option.metric === 'service_charge' ? (ko ? '관리비' : 'Service charge') : (ko ? '수선비' : 'Repair cost')} · {ko ? bases[option.basis] : option.basis}</p>
        <p>{money(option.originalAmount)} / {option.originalUnit}{option.billingPeriod ? ` · ${option.billingPeriod}` : ''} → {money(option.annualAmount)} / {ko ? '년' : 'year'}</p>
        <p>{option.conditions}</p><p>{ko ? '자료 기준일' : 'Observed'} {option.observedLabel} · {ko ? '검토 유효기한' : 'Review expires'} {option.expiresOn} · <a href={option.url} target="_blank" rel="noreferrer">{option.sourceName}</a></p>
        <button type="button" onClick={() => edit('annualCosts', String(option.annualAmount))}>{ko ? '지역·조건 확인 · 연간 비용 시작값으로 사용' : 'Confirm location and conditions · use as annual-cost starting point'}</button>
      </article>)}
    </details>}
    <details className={styles.costRules} open><summary>{ko ? '취득 비용 조건 · 가정을 바꾸세요' : 'Acquisition costs · change the assumptions'}</summary><div className={styles.form}>
      {currency === 'KRW' && <><label>{ko ? '주택 취득세 적용 구분' : 'Residential acquisition-tax treatment'}<select value={profile.koreaRate} onChange={e => setProfile({ ...profile, koreaRate: e.target.value as CostProfile['koreaRate'] })}><option value="standard">{ko ? '일반 1~3% · 감면·중과 없음' : 'Standard 1–3% · no relief or surcharge'}</option><option value="8">{ko ? '중과 8% 적용 대상' : 'Confirmed 8% surcharge category'}</option><option value="12">{ko ? '중과 12% 적용 대상' : 'Confirmed 12% surcharge category'}</option></select></label><label>{ko ? '전용면적' : 'Net area'}<select value={areaConfirmed ? (profile.over85 ? 'over' : 'under') : ''} onChange={e => { setAreaConfirmed(e.target.value !== ''); setProfile({ ...profile, over85: e.target.value === 'over' }); }}><option value="" disabled>{ko ? '전용면적을 확인해 선택하세요' : 'Confirm the net area'}</option><option value="under">85 m² {ko ? '이하' : 'or less'}</option><option value="over">85 m² {ko ? '초과' : 'over'}</option></select></label></>}
      {currency === 'SGD' && <><label>{ko ? '구매자 신분' : 'Buyer profile'}<select value={profile.singaporeBuyer} onChange={e => setProfile({ ...profile, singaporeBuyer: e.target.value as CostProfile['singaporeBuyer'] })}><option value="foreigner">{ko ? '외국인 · 감면 전' : 'Foreigner · before remission'}</option><option value="citizen">{ko ? '싱가포르 시민' : 'Singapore citizen'}</option><option value="pr">{ko ? '싱가포르 영주권자' : 'Singapore PR'}</option></select></label><label>{ko ? '현재 보유 주택 수' : 'Homes already owned'}<input type="number" min="0" step="1" value={profile.owned} onChange={e => setProfile({ ...profile, owned: Number(e.target.value) })} /></label><label>{ko ? '인지세 과세기준 · 매입가 이상' : 'Stamp-duty value · at least purchase price'}<AmountInput min={Number(inputs.price) || 0} value={profile.taxBase || inputs.price} onValueChange={value => setProfile({ ...profile, taxBase: Number(value) })} /></label></>}
      {currency === 'AED' && <><label>{ko ? '구매자의 DLD 등록비 부담' : 'Buyer share of DLD registration'}<select value={profile.dubaiBuyerShare} onChange={e => setProfile({ ...profile, dubaiBuyerShare: Number(e.target.value) as 2 | 4 })}><option value="4">{ko ? '4% 전액 부담 가정' : '4% · buyer assumes both shares'}</option><option value="2">{ko ? '공식 구매자 몫 2%' : '2% · official buyer share'}</option></select></label><label>{ko ? '중개보수 가정 · 법정 고정요율 아님 (%)' : 'Brokerage assumption · negotiable (%)'}<input type="number" min="0" max="10" step="0.1" value={profile.brokerPct} onChange={e => setProfile({ ...profile, brokerPct: Number(e.target.value) })} /></label></>}
    </div>
    {currency === 'KRW' && !areaConfirmed && <p role="status">{ko ? '선택한 거래는 면적 구간의 표본입니다. 개별 주택의 전용면적을 확인하면 취득 비용을 계산합니다.' : 'The selected transactions represent a size range. Confirm the individual home’s net area to calculate acquisition costs.'}{areaBand ? ` (${areaBand === 'all' ? (ko ? '전체 면적' : 'All sizes') : areaBand.replace('-plus', '+').replace('under-', '< ') + ' m²'})` : ''}</p>}
    {fees && <><dl className={styles.costLines}>{fees.lines.map(line => <div key={line.en}><dt>{ko ? line.ko : line.en}</dt><dd>{money(line.amount)}</dd></div>)}</dl><p>{ko ? '자동 계산 합계' : 'Calculated subtotal'}: {money(fees.total)} · {ko ? '법무·대출·추가 비용은 아래 합계에 더하세요.' : 'Add legal, financing and other costs to the total below.'}</p>{inputs.acquisitionCosts && <button type="button" onClick={() => setInputs({ ...inputs, acquisitionCosts: '' })}>{ko ? '자동 계산값으로 되돌리기' : 'Restore calculated subtotal'}</button>}</>}
    <p>{currency === 'KRW' ? (ko ? '일반 주택 매매 기준이며 생애최초·일시적 2주택 등 감면을 자동 판정하지 않습니다. 중과 여부는 주택 수·조정대상지역·예외 조건을 확인해 선택하세요. 중개보수는 상한이며 부가세·법무·채권 비용은 별도입니다.' : 'Residential sale before relief. Select surcharge treatment after checking household count, regulated-area status and exceptions. Brokerage is a cap; VAT, legal and bond costs are additional.') : currency === 'SGD' ? (ko ? '개인 단독 주택 매입 기준. 매입가와 법정 시장가치 중 높은 금액이 과세기준입니다. 공동매수·신탁·법인·FTA 및 부부 감면은 자동 반영하지 않습니다.' : 'Single individual residential purchase. Duty uses the higher of purchase price and statutory market value. Joint buyers, trusts, entities, FTA and married-couple remissions need separate checks.') : (ko ? '아파트·빌라 매매 등록 기준. 공식 등록비는 매도자 2%·매수자 2%이며 실제 부담은 계약을 확인하세요. 중개보수 2%는 변경 가능한 가정입니다.' : 'Apartment/villa sale registration. The official schedule assigns 2% each to buyer and seller; confirm contractual allocation. The 2% brokerage input is an editable assumption.')}</p>
    <p>{ko ? '정책 변경 감지는 검토 요청으로만 반영됩니다. 계산 규칙은 검토·배포된 버전을 사용합니다.' : 'Detected policy changes await review. Calculations use the reviewed, deployed rules.'}</p>
    <p>{ko ? '기준 확인' : 'Rules checked'} {COST_RULES_CHECKED} · {COST_SOURCES[currency].map(([label,href], index) => <Fragment key={href}>{index === 0 ? null : ' · '}<a href={href} target="_blank" rel="noreferrer">{label}</a></Fragment>)}</p></details>
    <div data-tool-layout className={styles.workspace}><div data-tool-input className={styles.inputPanel}><h3>{ko ? '매입·임대 조건' : 'Your assumptions'}</h3><div className={styles.form}>{fields.map(([key, label]) => <label key={key} htmlFor={`${id}-${key}`}>{label}{key === 'vacancyMonths' ? '' : ` (${currency})`}<AmountInput id={`${id}-${key}`} min="0" max={key === 'vacancyMonths' ? 12 : undefined} step="any" value={resolved[key]} placeholder={key === 'price' ? undefined : (ko ? '직접 입력 · 해당 없으면 0' : 'Enter assumption; 0 if none')} onValueChange={(value) => edit(key,value)} /></label>)}</div></div><div data-tool-result className={styles.resultPanel}><h3>{ko ? '계산 결과' : 'Your scenario'}</h3>
    {scenario ? <dl className={styles.results} aria-live="polite">
      <div className={styles.primaryResult}><dt>{ko ? '총매입 비용 대비 임대수익률' : 'Operating yield on total cost'}</dt><dd>{scenario.netYield.toFixed(2)}<span>%</span></dd></div>
      <div><dt>{ko ? '총 취득 비용' : 'Total acquisition outlay'}</dt><dd>{money(scenario.totalCost)}</dd></div>
      <div><dt>{ko ? '연간 임대수입 · 운영비 차감 후' : 'Annual net operating income'}</dt><dd>{money(scenario.netIncome)}</dd></div>
    </dl> : <p className={styles.empty} role="status">{ko ? '비용과 임대 조건을 모두 입력하면 결과가 표시됩니다. 해당 없는 항목은 0을 입력하세요.' : 'Complete every assumption to calculate. Enter 0 for costs that do not apply.'}</p>}</div></div>
    <ToolResearchShare locale={locale} resultRevision={researchRevision} snapshot={researchSnapshot} />
    <p className={styles.method}>{ko ? '계산식: (월 임대료 × (12 − 공실 개월) − 연 운영 비용) ÷ (매입 가격 + 취득 비용). 차입금·이자·양도차익·개인 소득세·환율 변화는 반영하지 않습니다. 실제 수익률 예측이 아닙니다.' : 'Formula: (monthly rent × (12 − vacant months) − annual operating costs) ÷ (price + acquisition costs). Excludes financing, capital gains, personal income tax and exchange-rate changes. Results reflect only the assumptions entered.'}</p>
  </section>;
}
