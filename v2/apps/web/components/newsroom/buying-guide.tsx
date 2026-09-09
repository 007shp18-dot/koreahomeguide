'use client';

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics/react';
import { createBuyingGuideEvent, guideJourney, type GuideAction } from '../../lib/analytics/buying-guide-events';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import type { BuyingGuideData } from '../../content/en/buying-guide-data';
import styles from './buying-guide.module.css';
import { formatKrwKo } from '../../lib/locale/ko';

export function buyingGuideBsd(price: number): number {
  let remaining = price;
  let total = 0;
  for (const [width, rate] of [[180000, .01], [180000, .02], [640000, .03], [500000, .04], [1500000, .05], [Infinity, .06]]) {
    const amount = Math.min(remaining, width!);
    total += amount * rate!;
    remaining -= amount;
    if (remaining <= 0) break;
  }
  return Math.floor(total);
}

export function buyingGuideCosts(currency: string, price: number, profile: number): readonly (readonly [string, number])[] {
  if (currency === 'KRW') return [['Property price', price], ['Basic acquisition tax example', price * (price <= 600000000 ? .01 : price <= 900000000 ? (price / 100000000 * 2 / 3 - 3) / 100 : .03)]];
  if (currency === 'SGD') return [['Property price', price], ['BSD', buyingGuideBsd(price)], ['ABSD', price * ([.60, .05, 0][profile] ?? .60)]];
  return [['Property price', price], ['Buyer registration share (2%)', price * .02], ['Service partner fee before VAT', 4000]];
}

export function BuyingGuide({ guide, locale = 'en' }: Readonly<{ guide: BuyingGuideData; locale?: 'en' | 'ko' }>) {
  const ko = locale === 'ko';
  const t = (english: string, korean: string) => ko ? korean : english;
  const localHref = (href: string) => ko && href.startsWith('/kr/seoul/') ? `/ko${href}` : href;
  const costLabels: Record<string, string> = { 'Property price': '매매가격', 'Basic acquisition tax example': '기본 취득세 예시', 'Buyer registration share (2%)': '매수자 등록비 부담분 (2%)', 'Service partner fee before VAT': '등록 대행 수수료 · 부가세 별도', BSD: '매수 인지세 (BSD)', ABSD: '추가 매수 인지세 (ABSD)' };
  const costLabel = (label: string) => ko ? costLabels[label] ?? label : label;
  const journey = guideJourney(guide.slug);
  function record(action: GuideAction) {
    const { event, ...properties } = createBuyingGuideEvent(guide.slug, action);
    sendGoogleEvent(event, properties);
    try { track(event, properties); } catch { /* Analytics never blocks the guide. */ }
  }
  const [selected, setSelected] = useState(1);
  const [profile, setProfile] = useState(0);
  const budget = guide.bands[selected] ?? guide.bands[0]!;
  const money = (value: number) => ko && guide.currency === 'KRW' ? formatKrwKo(Math.round(value)) : `${guide.currency === 'SGD' ? 'S$' : guide.currency + ' '}${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const costs = buyingGuideCosts(guide.currency, budget.cap, profile);
  const subtotal = costs.reduce((sum, [, value]) => sum + value, 0);
  const maximumArea = Math.max(...budget.examples.map(example => example.area[1]!));
  return <div className={styles.guide}>
    <p className={styles.meta}>{guide.period}{t(" transactions · Historical examples, not current listings", " 거래 · 현재 매물이 아닌 과거 거래 사례입니다")}</p>
    <section aria-labelledby="buying-examples">
      <h2 id="buying-examples">{t("01 \u00b7 What fits the purchase-price budget?", "01 · 이 예산으로 어떤 집이 거래됐을까?")}</h2>
      <div className={styles.budgets} role="group" aria-label={t("Purchase-price ceiling", "매매가격 예산 상한")}>{guide.bands.map((band, index) => <button type="button" key={band.cap} aria-pressed={index === selected} onClick={() => { setSelected(index); record('budget_select'); }}>{money(band.cap)}</button>)}</div>
      <p>{t("The ceiling is the property price, not total cash or a lending limit.", "선택한 예산은 집값 기준입니다. 세금·수수료를 포함한 총예산이나 대출 한도가 아닙니다.")}</p>
      {journey ? <p><Link href={localHref(journey.explore)} onClick={() => record('explore_open')}>{ko ? `${guide.city} 실거래가 보기${guide.currency === "KRW" ? "" : " (영문)"}` : `Search ${journey.city} transaction records`}</Link>{' · '}<Link href={localHref(journey.check)} onClick={() => record('check_open')}>{ko ? `관심 매물 가격 비교${guide.currency === "KRW" ? "" : " (영문)"}` : "Already have a quote? Check its comparables"}</Link></p> : null}
      <div aria-live="polite"><h3>{money(budget.cap * .8)}–{money(budget.cap)} {t("examples", "거래 사례")}</h3>
      <p className={styles.meta}>{t("Three projects with repeated records. Areas are observed ranges, not the maximum or average size available at this budget.", "비슷한 가격대에서 거래가 반복된 단지 3곳입니다. 면적은 해당 거래의 범위로, 이 예산에서 살 수 있는 최대 면적이나 평균 면적은 아닙니다.")}{guide.currency === 'KRW' && !ko ? ' Seoul project names follow the original Korean records.' : ''}</p>
      <div className={styles.examples}>{budget.examples.map(example => <div className={styles.example} key={`${selected}-${example.name}-${example.band}`}>
        <p className={styles.meta}>{example.region}</p><h3>{example.name.trim()}</h3><p className={styles.meta}>{example.detail}</p>
        <strong className={styles.areaValue}>{example.area[0]!.toFixed(1)}{example.area[0] === example.area[1] ? '' : `–${example.area[1]!.toFixed(1)}`} m²</strong>
        <div className={styles.areaBar} style={{ width: `${example.area[1]! / maximumArea * 100}%` }} role="img" aria-label={ko ? `거래 면적 최댓값 ${example.area[1]} 제곱미터 · 세 사례에 같은 눈금 적용` : `Observed upper area ${example.area[1]} square metres; common scale across three examples`} />
        <p className={styles.meta}>{t("Upper observed area \u00b7 shared scale", "거래 면적의 최댓값 · 세 사례에 같은 눈금 적용")}</p><strong>{money(example.price[0]!)}–{money(example.price[1]!)}</strong>
        <p className={styles.meta}>{ko ? `해당 가격대 ${example.n}건 / 같은 그룹 전체 ${example.total}건` : `${example.n} in range / ${example.total} in the same group`}<br />{t("Latest record", "가장 최근 거래")} {example.latest}</p>
        <details onToggle={event => { if (event.currentTarget.open) record('evidence_open'); }}><summary>{t("View transaction evidence", "실제 거래 내역 보기")}</summary><p className={styles.meta}>{ko ? `같은 단지의 ${example.band}㎡ 이상~${example.band + 20}㎡ 미만 그룹 중 선택한 가격대의 거래만 표시합니다.` : `Same-project ${example.band}–<${example.band + 20} m² group. Only records in the selected price range are listed.`}</p><div className={styles.tableScroll}><table><thead><tr><th>{t("Date", "계약일")}</th><th>m²</th><th>{t("Price", "거래가격")}</th></tr></thead><tbody>{example.records.map((record, index) => <tr key={index}><td>{record.date}</td><td>{record.area.toFixed(2)}</td><td>{money(record.price)}</td></tr>)}</tbody></table></div></details>
      </div>)}</div></div>
    </section>
    <section aria-labelledby="buying-costs"><h2 id="buying-costs">{t("02 \u00b7 Budget beyond the price", "02 · 집값 외에 필요한 비용")}</h2>
      {guide.currency === 'SGD' ? <label className={styles.profile}>{t("Buyer profile", "매수자 구분")}<select value={profile} onChange={event => { setProfile(Number(event.target.value)); record('cost_profile_change'); }}><option value={0}>{t("Foreign individual \u00b7 no remission", "외국인 개인 · 감면 미적용")}</option><option value={1}>{t("Singapore PR \u00b7 first home", "싱가포르 영주권자 · 첫 주택")}</option><option value={2}>{t("Singapore citizen \u00b7 first home", "싱가포르 시민권자 · 첫 주택")}</option></select></label> : null}
      <div aria-live="polite"><div className={styles.costBar} role="img" aria-label={costs.map(([label, value]) => `${costLabel(label)}: ${money(value)}`).join('; ')}>{costs.map(([label, value], index) => <span key={label} className={index === 0 ? styles.priceFill : index === 1 ? styles.taxFill : styles.additionalFill} style={{ width: `${value / subtotal * 100}%` }} />)}</div>
      <dl className={styles.costRows}>{costs.map(([label, value]) => <div key={label}><dt>{costLabel(label)}</dt><dd>{money(value)}</dd></div>)}<div><dt>{t("Subtotal of displayed items", "위 항목 합계")}</dt><dd>{money(subtotal)}</dd></div></dl></div>
      <p className={styles.meta}>{ko ? (guide.currency === 'KRW' ? '주택 취득세 기본세율만 적용한 예시입니다. 중과·감면, 지방교육세, 농어촌특별세, 중개·등기·금융 비용은 제외해 실제 총매입 비용과 다릅니다.' : guide.currency === 'SGD' ? '과세 기준 금액이 집값과 같다고 가정했습니다. 실제 BSD·ABSD는 매매가격과 시가 중 높은 금액을 기준으로 합니다. 공동명의, 보유 주택과 감면 여부에 따라 달라지며 법률·감정·금융 비용은 제외했습니다. FTA에 따른 감면 대상 여부도 별도로 확인하세요.' : `DLD 안내상 등록비는 매도자 2%, 매수자 2%입니다. 위 합계는 매수자 부담분과 AED 50만 이상 거래의 등록 대행 기본 수수료를 포함합니다. 부가세, 증서·지도 발급비, 지식·혁신 수수료, 중개·NOC·금융 비용은 제외했습니다. 계약상 매수자가 등록비 4% 전액을 부담한다면 ${money(budget.cap * .02)}를 추가해야 합니다.`) : guide.currency === 'KRW' ? 'Basic residential acquisition-tax rates only. Surcharges, relief, local education tax, rural special tax, brokerage, registration and financing costs are excluded. This is not your total purchase cost.' : guide.currency === 'SGD' ? 'Assumes the taxable value equals the price. Actual BSD and ABSD use the higher of price and market value. Joint ownership, existing properties and remissions can change treatment. Legal, valuation and financing costs are excluded. Qualifying FTA buyers should check remission separately.' : `DLD lists a seller share of 2% and buyer share of 2%. The subtotal includes the buyer share and the service partner base fee for sales of at least AED 500,000. VAT, certificate/map fees, knowledge/innovation fees, brokerage, NOC and financing are excluded. If the contract assigns the full 4% registration charge to the buyer, add ${money(budget.cap * .02)}.`}</p><a href="#article-sources-title">{t("Official fee and tax sources", "세금·수수료 공식 자료")}</a>
    </section>
    <section aria-labelledby="buying-eligibility"><h2 id="buying-eligibility">{t("03 \u00b7 Can you buy the property?", "03 · 매수 자격 확인")}</h2><p className={styles.callout}>{guide.eligibility}</p><a href="#article-sources-title">{t("Official ownership sources", "소유권 관련 공식 자료")}</a></section>
    <section aria-labelledby="buying-checklist"><h2 id="buying-checklist">{t("04 \u00b7 Before you commit", "04 · 계약 전 체크리스트")}</h2>{guide.checks.map(check => <label className={styles.check} key={check}><input type="checkbox" />{check}</label>)}<p className={styles.meta}>{t("Checklist selections are not saved.", "체크한 항목은 저장되지 않습니다.")}</p>
      {journey ? <p><Link href={journey.report} onClick={() => record('report_open')}>{ko ? `${guide.city} 2026년 9월 거래 보고서 보기 (영문)` : `What changed in ${journey.city}? Read the September 2026 transaction report`}</Link></p> : null}</section>
    <details className={styles.method}><summary>{t("Sources, selection and limitations", "출처·선정 기준·유의사항")}</summary><p>{guide.method}</p><p>{ko ? `이 예산에서 ${budget.eligible}개 그룹이 선정 기준을 충족했습니다. 비용은 일부 항목을 계산한 예시이며 실제 견적이나 대출 승인이 아닙니다. 원문 공식 자료 확인일: 2026년 9월 7일.` : `${budget.eligible} groups passed the screen at this budget. Cost calculations are partial illustrations, not quotations or lending approvals. Official rules checked September 7, 2026.`}</p></details>
  </div>;
}
