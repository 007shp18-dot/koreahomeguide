'use client';

import { useId, useState, type FormEvent } from 'react';
import { calculatePractical, PRACTICAL_DEFAULTS, type PracticalKind } from '../../lib/practical-tools';
import styles from './practical-tool.module.css';

function CopyText({ text, ko }: { text: string; ko: boolean }) {
  const [status, setStatus] = useState('');
  const id = useId();
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus(ko ? '복사했어요.' : 'Copied.'); }
    catch { setStatus(ko ? '아래 텍스트를 선택해 직접 복사해 주세요.' : 'Select the text below and copy it manually.'); }
  }
  return <div><button type="button" onClick={copy} data-editorial-event="article_tool_use">{ko ? '질문 복사하기' : 'Copy questions'}</button><p role="status">{status}</p><label htmlFor={id} className={styles.note}>{ko ? '매물에 맞게 수정해서 보내세요.' : 'Adapt these questions to your listing before sending.'}</label><textarea id={id} value={text} readOnly onFocus={event => event.currentTarget.select()} /></div>;
}

export function PracticalTool({ kind, locale }: { kind: PracticalKind; locale: 'en' | 'ko' }) {
  const ko = locale === 'ko';
  const t = (en: string, kr: string) => ko ? kr : en;
  const id = useId();
  const [values, setValues] = useState([...PRACTICAL_DEFAULTS[kind]]);
  const [submitted, setSubmitted] = useState(false);
  const [checked, setChecked] = useState([false, false, false]);
  const format = (n: number, digits = 0) => n.toLocaleString(ko ? 'ko-KR' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const title = {
    korea: t('Build your monthly rent budget', '내 월 주거비 계산하기'),
    japan: t('Check the building behind the renovation', '리모델링 뒤의 건물 관리 확인하기'),
    singapore: t('Compare two homes on the same basis', '같은 기준으로 두 매물 비교하기'),
    dubai: t('Put your own costs into the yield', '내 비용을 넣어 임대수익률 계산하기'),
  }[kind];
  const labels = {
    korea: [t('Deposit (KRW)', '보증금 (원)'), t('Monthly rent (KRW)', '월세 (원)'), t('Monthly management fee (KRW)', '월 관리비 (원)'), t('Additional monthly utilities (KRW)', '별도 월 공과금 (원)')],
    japan: [],
    singapore: [t('Home A · price (SGD)', '매물 A · 가격 (SGD)'), t('Home A · area (sq ft)', '매물 A · 면적 (sq ft)'), t('Home B · price (SGD)', '매물 B · 가격 (SGD)'), t('Home B · area (sq ft)', '매물 B · 면적 (sq ft)')],
    dubai: [t('Purchase price (AED)', '매입 가격 (AED)'), t('Potential annual rent (AED)', '공실 전 연 임대료 (AED)'), t('Vacant months per year (0–12)', '연 공실 개월 수 (0–12)'), t('Annual service charges (AED)', '연 서비스 비용 (AED)'), t('Agent management fee (% of collected rent)', '관리 수수료 (수취 임대료의 %)'), t('Annual repairs & other owner costs (AED)', '연 수리비·기타 소유자 비용 (AED)'), t('One-time acquisition costs (AED)', '일회성 취득 비용 (AED)')],
  }[kind];
  const descriptions = {
    korea: t('Replace the example amounts with your quote. Use full won amounts, not units of 10,000 won.', '예시를 실제 견적 금액으로 바꾸세요. 만원 단위가 아닌 원 단위로 입력합니다.'),
    japan: t('Tick a document after reading the current version and checking amounts for the exact unit.', '최신 문서를 읽고 해당 호실의 금액까지 확인한 항목만 체크하세요.'),
    singapore: t('Hypothetical homes. Use the same area definition for both; lower price per square foot does not mean a lower total price.', '가상의 두 매물 예시입니다. 면적 정의를 맞춰 비교하세요. 면적당 가격이 낮아도 총액은 더 높을 수 있습니다.'),
    dubai: t('Illustrative inputs, not market averages or a forecast. Replace unknown costs with explicit estimates and test a higher-cost case.', '입력값은 시장 평균이나 전망이 아닌 예시입니다. 모르는 비용은 추정값을 명시하고 비용이 더 큰 경우도 계산하세요.'),
  }[kind];
  const documents = [
    [t('Long-term repair plan', '장기 수선계획'), t('What work is planned, when, and how will it be funded?', '어떤 공사가 언제 예정되어 있고, 재원은 어떻게 마련하나요?')],
    [t('Latest reserve accounts & unit statement', '최신 수선적립금 회계·호실 명세'), t('Check the fund balance, your unit’s contribution and outstanding amounts.', '기금 잔액, 해당 호실의 납부액과 미납액을 확인하세요.')],
    [t('Recent owners’ meeting minutes', '최근 관리조합 회의록'), t('Separate approved increases or special assessments from proposals. Ask for amounts and dates.', '승인된 인상·추가 분담금과 제안 단계의 안건을 구분하고 금액·날짜를 확인하세요.')],
  ];
  const questions = kind === 'korea'
    ? '안녕하세요. 이 매물의 보증금과 월세를 원 단위로 확인 부탁드립니다.\n1. 관리비는 월 얼마이며 어떤 항목이 포함되나요?\n2. 전기·가스·수도·인터넷 중 별도 납부 항목은 무엇인가요? 최근 고지서를 볼 수 있나요?\n3. 계약 전·입주일에 납부할 금액을 항목별로 받을 수 있나요?\n4. 보증금 외 비용의 환불 여부와 조건을 서면으로 받을 수 있나요?'
    : t('For this exact unit, could you share:\n1. The current long-term repair plan and funding assumptions.\n2. The latest reserve accounts, current monthly unit contribution and outstanding amounts.\n3. Recent owners’ meeting minutes identifying approved versus proposed fee increases or special assessments, with amounts and dates.', '이 호실에 대해 다음 자료를 부탁드립니다.\n1. 최신 장기 수선계획과 재원 가정\n2. 최신 수선적립금 회계, 호실 월 납부액과 미납액\n3. 관리비 인상·추가 분담금의 승인 여부, 금액과 날짜를 확인할 최근 관리조합 회의록');
  const result = submitted ? calculatePractical(kind, values) : null;
  const resultLabels = {
    korea: [t('Monthly rent + fees + entered utilities', '월세 + 관리비 + 입력한 공과금'), t('Deposit · separate upfront cash', '보증금 · 별도 초기 자금')],
    japan: [],
    singapore: [t('Home A · SGD / sq ft', '매물 A · SGD / sq ft'), t('Home B · SGD / sq ft', '매물 B · SGD / sq ft'), t('Total price difference · B minus A (SGD)', '총 가격 차이 · B − A (SGD)')],
    dubai: [t('Rent after vacancy (AED)', '공실 반영 수취 임대료 (AED)'), t('Agent management fee (AED)', '관리 수수료 (AED)'), t('Annual income after entered operating costs (AED)', '입력한 운영비 차감 후 연 소득 (AED)'), t('Income ÷ purchase price', '연 소득 ÷ 매입 가격'), t('Income ÷ (price + acquisition costs)', '연 소득 ÷ (매입 가격 + 취득 비용)')],
  }[kind];
  function calculate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true); }
  function reset() { setValues([...PRACTICAL_DEFAULTS[kind]]); setSubmitted(false); }
  return <section id="practical-tool" className={styles.panel} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title}</h2><p>{descriptions}</p>
    {kind === 'japan' ? <>
      <ul className={styles.checks}>{documents.map(([heading, detail], index) => <li key={heading}><label><input type="checkbox" checked={checked[index]} data-editorial-event="article_tool_use" onChange={event => setChecked(previous => previous.map((value, i) => i === index ? event.target.checked : value))} /><span><strong>{heading}</strong>{detail}</span></label></li>)}</ul>
      <p role="status">{t(`${checked.filter(Boolean).length} of 3 documents checked.`, `3개 중 ${checked.filter(Boolean).length}개 확인.`)}</p>
      <p className={styles.note}>{t('Checks last for this page visit. Completing the list is not an assessment of the building’s condition.', '체크 상태는 이 페이지를 보는 동안만 유지됩니다. 모두 체크해도 건물 상태가 검증된 것은 아닙니다.')}</p>
      <CopyText text={questions} ko={ko} />
    </> : <>
      <form onSubmit={calculate} onReset={reset}>
        <div className={styles.fields}>{labels.map((label, index) => <label className={styles.field} key={label} htmlFor={`${id}-${index}`}>{label}<input id={`${id}-${index}`} type="number" inputMode="decimal" required min={kind === 'singapore' || (kind === 'dubai' && index === 0) ? '0.01' : '0'} max={kind === 'dubai' && index === 2 ? '12' : kind === 'dubai' && index === 4 ? '100' : '1000000000000'} step="any" value={values[index]} onChange={event => { setValues(previous => previous.map((value, i) => i === index ? event.target.value : value)); setSubmitted(false); }} /></label>)}</div>
        <div className={styles.actions}><button type="submit" data-editorial-event="article_tool_use">{t('Calculate', '계산하기')}</button><button type="reset">{t('Reset example', '예시로 초기화')}</button></div>
      </form>
      <div className={styles.result} aria-live="polite">{result ? <dl>{result.map((value, index) => <div key={resultLabels[index]}><dt>{resultLabels[index]}</dt><dd>{kind === 'korea' ? 'KRW ' : ''}{format(value, (kind === 'dubai' && index >= 3) || (kind === 'singapore' && index < 2) ? 2 : 0)}{kind === 'dubai' && index >= 3 ? '%' : ''}</dd></div>)}</dl> : <p className={styles.note}>{submitted ? t('Check your inputs. Amounts must be finite and non-negative; prices and areas must be positive.', '입력값을 확인하세요. 유효한 0 이상의 금액과 0보다 큰 가격·면적이 필요합니다.') : t('Review the inputs, then calculate.', '입력값을 확인한 뒤 계산해 보세요.')}</p>}</div>
      <p className={styles.note}>{kind === 'korea' ? t('Utilities start at zero as a placeholder, not an estimate. Avoid double-counting items included in the management fee. Moving, brokerage, deposit funding and other one-time costs are excluded.', '공과금의 초기값 0은 자리표시자이며 추정치가 아닙니다. 관리비 포함 항목은 중복 입력하지 마세요. 이사·중개·보증금 조달 비용 등은 제외됩니다.') : kind === 'singapore' ? t('Price-only comparison, before duties, fees and financing. Confirm area basis, tenure, condition and recurring charges before choosing.', '세금·수수료·금융 비용 전 가격 비교입니다. 면적 기준, 보유 기간 조건, 상태와 반복 비용을 확인하세요.') : t('Before financing, tax and sale costs; no capital appreciation assumed. Acquisition costs enter the denominator once. Display values are rounded; calculations use full precision. Check service-charge inclusions to avoid counting costs twice.', '대출·세금·매각 비용 전 계산이며 가격 상승은 가정하지 않습니다. 취득 비용은 분모에 한 번 반영합니다. 표시는 반올림하며 계산은 원래 정밀도를 유지합니다. 서비스 비용의 포함 항목을 확인해 중복을 피하세요.')}</p>
      {kind === 'korea' && <><p>{t('Ask your agent in Korean', '중개사에게 확인할 질문')}</p><p className={styles.note}>{t('The message asks for full-won deposit/rent, fee inclusions, utility bills, an itemized payment schedule and refund terms.', '금액·관리비 포함 항목·고지서·납부 일정·환불 조건을 확인하는 질문입니다.')}</p><CopyText text={questions} ko={ko} /></>}
    </>}
  </section>;
}
