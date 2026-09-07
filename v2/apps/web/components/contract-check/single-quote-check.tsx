'use client';
import { BuyerNextSteps } from '../buyer-next-steps';
import { ResultLinkCopy } from './result-link-copy';
import { CheckBuildingSearch } from './check-building-search';

import type { CheckTransaction, SingleQuoteCheckResult } from '@signedprice/market-core';
import { PassportLink as Link } from '../passport/passport-journey';
import { useState } from 'react';

import type { ProductLocale } from '../../lib/locale/product-copy';
import type { SingleQuoteCheckRouteModel } from '../../lib/single-quote-check/route-model.server';
import type { EntityCheckContext } from '../../lib/navigation/explorer-selection';
import { SiteHeader } from '../site-header';
import {
  CHECK_COPY,
  EvidencePositionCard,
  MoneyField,
  TransactionSelect,
  checkHeader,
  completedMonthWindowLabel,
  localizedCheckHref,
} from './contract-check-workspace';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

type QuoteDraft = Readonly<{
  transaction: CheckTransaction;
  salePriceWon: string;
  depositWon: string;
  monthlyRentWon: string;
}>;

function resultReason(
  result: Exclude<SingleQuoteCheckResult, { status: 'ready' }>,
  locale: ProductLocale,
): string {
  if (result.status === 'insufficient') {
    return `Only ${result.sample.count} compatible reported contracts within ${completedMonthWindowLabel(result.evidenceWindow, locale)}; five are required.`;
  }
  return result.message;
}

function SingleResult({ model, locale, entityContext }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale: ProductLocale;
  entityContext: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const result = model.result;
  return (
    <section aria-live="polite" className={styles.resultPanel} data-check-section="verdict" data-result-focus-target="true">
      <header><span>03</span><h2>{c.result}</h2></header>
      {!model.submitted || result === null ? (
        <div className={styles.resultEmpty} data-result-state="blank"><p>{locale === 'ko'
          ? '관심 매물의 가격과 조건을 입력해 비슷한 실거래가와 비교하세요.'
          : 'Enter one property’s conditions and asking price to compare with compatible reported contracts.'}</p></div>
      ) : result.status !== 'ready' ? (
        <div className={styles.resultEmpty} data-result-state={result.status}>
          <h3>{result.status === 'insufficient' ? 'Not enough compatible contracts' : c.unavailable}</h3>
          <p>{resultReason(result, locale)}</p>
        </div>
      ) : (
        <div className={styles.resultBody} data-single-result={result.verdict}>
          <section aria-label={locale === 'ko' ? '구와 단지 기준 비교' : 'District and building comparisons'} className={styles.scopeComparison}>
            {([{ label: locale === 'ko' ? '이 구 같은 면적대 기준' : 'Same-size contracts in this district', value: model.districtResult }, { label: locale === 'ko' ? `${model.buildingName ?? '이 단지'} 기준` : `This building: ${model.buildingName ?? ''}`, value: model.buildingResult }]).map(({label,value}) => value?.status === 'ready' ? <div key={label}><h3>{label}</h3><p>{locale === 'ko' ? `비교 계약 중 ${value.pricePercentile}%보다 높은 가격` : `Above ${value.pricePercentile}% of comparable contract values`}</p><p>{locale === 'ko' ? '중앙값' : 'Median'} {won.format(value.distribution.medianWon)} · {value.sample.count}{locale === 'ko' ? '건' : ' contracts'} · {completedMonthWindowLabel(value.evidenceWindow,locale)}</p></div> : null)}
          </section>
          {model.buildingResult?.status === 'insufficient' && <p>{locale === 'ko' ? `이 단지 같은 면적대는 ${model.buildingResult.sample.count}건으로 비교 기준인 5건에 못 미칩니다. 아래 결과는 구 기준입니다.` : `This building has only ${model.buildingResult.sample.count} compatible contracts; five are needed. The result below uses district contracts.`}</p>}
          <EvidencePositionCard check={result} locale={locale} order="single-offer" title={locale === 'ko' ? '이 가격의 위치' : 'Where this price sits'} />
          <div className={styles.verdictPanel} data-result-order="verdict">
            <p className={styles.verdict}>{result.verdict === 'below'
              ? (locale === 'ko' ? '중간 50% 구간보다 낮음' : 'Below the middle half')
              : result.verdict === 'above' ? (locale === 'ko' ? '중간 50% 구간보다 높음' : 'Above the middle half') : (locale === 'ko' ? '중간 50% 구간 안' : 'Within the middle half')}</p>
            <p>{result.filters.scope === 'building' ? model.buildingName : locale === 'ko' ? '이 구 같은 면적대 계약 기준' : 'Same-size district contracts'}</p>
          </div>
          <section className={styles.keyFigures} data-result-order="key-figures">
            <h3>{c.keyFigures}</h3>
            <div><dl>
              <div><dt>{c.median}</dt><dd>{won.format(result.distribution.medianWon)}</dd></div>
              <div><dt>{c.middle}</dt><dd>{won.format(result.distribution.p25Won)}–{won.format(result.distribution.p75Won)}</dd></div>
              <div><dt>{c.percentile}</dt><dd>{result.pricePercentile}</dd></div>
            </dl></div>
          </section>
          <section className={styles.marketEvidence} data-check-section="evidence" data-result-order="market-evidence">
            <h3>{c.evidence}</h3>
            <p>{result.sample.count} {c.sample} · ±{result.filters.areaTolerancePct}% area · {completedMonthWindowLabel(result.evidenceWindow, locale)}</p>
            <div className={styles.comparableRows}>
              {result.comparableRows.map((row, index) => (
                <p key={`${row.buildingId}-${row.filedMonth}-${index}`}>
                  {row.filedMonth} · {row.areaSqm}㎡ · {won.format(row.adjustedValueWon)}
                  {entityContext === null ? null : <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/${row.districtSlug}/${row.buildingId}/?transaction=${model.selection.transaction}&propertyType=${model.selection.housingType}&district=${row.districtSlug}&buildingId=${row.buildingId}`}>Open building evidence</Link>}
                </p>
              ))}
            </div>
          </section>
          <ResultLinkCopy locale={locale} tool="single-quote" />
          <section className={styles.disclosure} data-check-section="disclosure" data-result-order="disclosure">
            <h3>{c.disclosure}</h3>
            <p>{result.fallbackDisclosure ?? 'At least five matching reported contracts are used for each comparison.'}</p>
            <p>{result.comparisonBasis === 'verified-deposit-adjusted-monthly-rent'
              ? 'Filed deposit and monthly rent remain visible; only the installed verified conversion curve normalizes the comparison.'
              : 'Official reported values are compared directly within the selected transaction market.'}</p>
            <p>{c.reference}</p>
          </section>
        </div>
      )}
    </section>
  );
}

export function SingleQuoteCheckWorkspace({ model, locale = 'en', entityContext = null, pending = false, error = false, onRetry }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  pending?: boolean; error?: boolean; onRetry?: () => void;
  locale?: ProductLocale;
  entityContext?: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const [district, setDistrict] = useState(model.selection.districtSlug);
  const [housing, setHousing] = useState(model.selection.housingType);
  const [buildingId, setBuildingId] = useState(model.selection.buildingId);
  const [buildingName, setBuildingName] = useState(model.buildingName);
  const [buildingQuery, setBuildingQuery] = useState('');
  const [area, setArea] = useState(String(model.selection.areaSqm ?? ''));
  const clearBuilding = () => { setBuildingId(null); setBuildingName(null); };
  const [draft, setDraft] = useState<QuoteDraft>(() => ({
    transaction: model.selection.transaction,
    salePriceWon: model.selection.salePriceWon?.toString() ?? '',
    depositWon: model.selection.depositWon?.toString() ?? '',
    monthlyRentWon: model.selection.monthlyRentWon?.toString() ?? '',
  }));
  const edit = (field: keyof QuoteDraft, value: string) => setDraft((current) => ({
    ...current, [field]: value,
  }));
  return (
    <div className={styles.page} data-primary-check="single-quote" lang={locale}>
      <SiteHeader copy={checkHeader(locale)} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>{locale === 'ko' ? '서울 · 실거래가 비교' : 'Seoul · Official transaction evidence'}</p>
          <h1>{locale === 'ko' ? '이 매물, 실거래가와 얼마나 다를까?' : 'Check one asking price.'}</h1>
          <p>{locale === 'ko'
            ? '매매가격이나 보증금·월세를 입력해 비슷한 거래와 비교하세요.'
            : 'Compare a sale, jeonse or monthly-rent quote with compatible reported contracts.'}</p>
        </section>
        <nav aria-label={c.mode} className={styles.modeSelector} data-check-mode-selector="true">
          <span aria-current="page" data-check-mode="single">{c.single}</span>
          <Link data-check-mode="compare" href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
        </nav>
        {pending && <p role="status">{error ? (locale === 'ko' ? '비교 자료를 불러오지 못했습니다.' : 'Comparison data could not be loaded.') : (locale === 'ko' ? '입력한 조건으로 거래를 비교하고 있습니다…' : 'Comparing contracts for your inputs…')}{error && <button type="button" onClick={onRetry}>{locale === 'ko' ? '다시 시도' : 'Retry'}</button>}</p>}<form inert={pending} aria-busy={pending} action={localizedCheckHref(locale, '/')} className={styles.form} method="get">
          <input name="check" type="hidden" value="1" />
          {entityContext === null || buildingId !== model.selection.buildingId ? null : <>
            <input name="market" type="hidden" value={entityContext.market} />
            <input name="entity" type="hidden" value={entityContext.entity} />
            <input name="returnTo" type="hidden" value={entityContext.returnTo} />
          </>}
          <fieldset className={styles.conditions} data-check-section="conditions">
            <legend><span>01</span>{c.conditions}</legend>
            <div className={styles.conditionGrid}>
              <label className={styles.field}><span>{c.district}</span><select value={district} onChange={event => { setDistrict(event.target.value); clearBuilding(); }} name="district">
                {model.districts.map((district) => <option key={district.slug} value={district.slug}>{locale === 'ko' ? district.nameKo : district.nameEn}</option>)}
              </select></label>
              <label className={styles.field}><span>{c.housing}</span><select value={housing} onChange={event => { setHousing(event.target.value as typeof housing); clearBuilding(); }} name="housing">
                <option value="apartment">{locale === 'ko' ? '아파트' : 'Apartment'}</option><option value="officetel">{locale === 'ko' ? '오피스텔' : 'Officetel'}</option>
                <option value="villa_multifamily">{locale === 'ko' ? '연립·다세대' : 'Villa / multifamily'}</option><option value="detached">{locale === 'ko' ? '단독·다가구' : 'Detached'}</option>
              </select></label>
              <label className={styles.field}><span>{c.area} <small>㎡</small></span><input value={area} onChange={e => setArea(e.target.value)} inputMode="decimal" name="area" /></label>
              <input type="hidden" name="building" value={buildingId ?? ''} />
              <CheckBuildingSearch text={buildingQuery} onText={value => { setBuildingQuery(value); clearBuilding(); }} locale={locale} onSelect={item => { setBuildingId(item.id); setBuildingName(item.name); setDistrict(item.district); setHousing(item.housing); if (item.area !== null) setArea(String(item.area)); setBuildingQuery(''); }} />
              {buildingName && <p>{locale === 'ko' ? '선택한 단지' : 'Selected building'}: {buildingName} <button type="button" onClick={clearBuilding}>{locale === 'ko' ? '해제' : 'Clear'}</button></p>}
            </div>
          </fieldset>
          <fieldset className={styles.singleOffer} data-offer="single">
            <legend><span>02</span>{locale === 'ko' ? '매물 가격' : 'Single offer'}</legend>
            <TransactionSelect
              availability={model.availability}
              locale={locale}
              name="transaction"
              onChange={(transaction) => setDraft({
                transaction, salePriceWon: '', depositWon: '', monthlyRentWon: '',
              })}
              value={draft.transaction}
            />
            {draft.transaction === 'sale' ? <MoneyField name="price" label={c.price} value={draft.salePriceWon} onChange={(value) => edit('salePriceWon', value)} /> : null}
            {draft.transaction === 'jeonse' || draft.transaction === 'monthly' ? <MoneyField name="deposit" label={c.deposit} value={draft.depositWon} onChange={(value) => edit('depositWon', value)} /> : null}
            {draft.transaction === 'monthly' ? <MoneyField name="monthly-rent" label={c.rent} value={draft.monthlyRentWon} onChange={(value) => edit('monthlyRentWon', value)} /> : null}
          </fieldset>
          <div className={styles.actions}><button type="submit">{locale === 'ko' ? '실거래가와 비교하기' : 'Check this quote'}</button></div>
        </form>
        <SingleResult model={model} locale={locale} entityContext={entityContext} />
        <nav className={styles.contextLinks} aria-label={c.evidence}>
          {entityContext === null ? null : <Link href={entityContext.returnTo}>
            Return to {model.buildingName ?? 'selected building'}
          </Link>}
          <Link href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
          <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
          <Link href="/kr/seoul/guide/">{c.guide}</Link>
        </nav>
        <BuyerNextSteps market="seoul" locale={locale} />
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </div>
  );
}
