'use client';
import toolSurface from '../tools/tool-surface.module.css';
import { BuyerNextSteps } from '../buyer-next-steps';
import { ResultLinkCopy } from './result-link-copy';
import { CheckBuildingSearch } from './check-building-search';

import type { CheckTransaction, SingleQuoteCheckResult } from '@signedprice/market-core';
import { PassportLink as Link, PassportFormContext } from '../passport/passport-journey';
import { useState, type FormEventHandler } from 'react';

import { localizeContractText, type ProductLocale } from '../../lib/locale/product-copy';
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
import { ToolResearchShare } from '../tools/tool-research-share';
import { createSingleQuoteResearchSnapshot } from '../../lib/tool-research/client';

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
    return locale === 'ko'
      ? `${completedMonthWindowLabel(result.evidenceWindow, locale)}의 비교 거래는 ${result.sample.count}건입니다. 최소 5건이 필요합니다.`
      : locale === 'zh-CN' ? `${completedMonthWindowLabel(result.evidenceWindow, locale)}内只有 ${result.sample.count} 份符合条件的申报合同，至少需要五份。` : `Only ${result.sample.count} compatible reported contracts within ${completedMonthWindowLabel(result.evidenceWindow, locale)}; five are required.`;
  }
  return localizeContractText(result.message, locale);
}

function SingleResult({ model, locale, entityContext }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale: ProductLocale;
  entityContext: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const result = model.result;
  const researchSnapshot = model.submitted && result?.status === 'ready'
    ? createSingleQuoteResearchSnapshot(result)
    : null;
  const researchRevision = model.submitted && result?.status === 'ready'
    ? JSON.stringify(result)
    : 'no-result';
  return (
    <section data-tool-result aria-live="polite" className={styles.resultPanel} data-check-section="verdict" data-result-focus-target="true">
      <header><span>03</span><h2>{c.result}</h2></header>
      {!model.submitted || result === null ? (
        <div className={styles.resultEmpty} data-result-state="blank"><p>{locale === 'ko'
          ? '관심 매물의 가격과 조건을 입력해 비슷한 실거래가와 비교하세요.'
          : locale === 'zh-CN' ? "输入房屋条件与报价，与条件相近的申报成交比较。" : 'Enter one property’s conditions and asking price to compare with compatible reported contracts.'}</p></div>
      ) : result.status !== 'ready' ? (
        <div className={styles.resultEmpty} data-result-state={result.status}>
          <h3>{result.status === 'insufficient' ? (locale === 'ko' ? '비교할 거래가 부족합니다' : locale === 'zh-CN' ? "符合条件的合同不足" : 'Not enough compatible contracts') : c.unavailable}</h3>
          <p>{resultReason(result, locale)}</p>
        </div>
      ) : (
        <div className={styles.resultBody} data-single-result={result.verdict}>
          <section aria-label={locale === 'ko' ? '구와 단지 기준 비교' : locale === 'zh-CN' ? "行政区与楼宇比较" : 'District and building comparisons'} className={styles.scopeComparison}>
            {([{ label: locale === 'ko' ? '이 구 같은 면적대 기준' : locale === 'zh-CN' ? "本区相近面积的合同" : 'Same-size contracts in this district', value: model.districtResult }, { label: locale === 'ko' ? `${model.buildingName ?? '이 단지'} 기준` : locale === 'zh-CN' ? `本楼宇：${model.buildingName ?? ''}` : `This building: ${model.buildingName ?? ''}`, value: model.buildingResult }]).map(({label,value}) => value?.status === 'ready' ? <div key={label}><h3>{label}</h3><p>{locale === 'ko' ? `비교 계약 중 ${value.pricePercentile}%보다 높은 가격` : locale === 'zh-CN' ? `高于 ${value.pricePercentile}% 的可比合同金额` : `Above ${value.pricePercentile}% of comparable contract values`}</p><p>{locale === 'ko' ? '중앙값' : locale === 'zh-CN' ? "中位数" : 'Median'} {won.format(value.distribution.medianWon)} · {value.sample.count}{locale === 'ko' ? '건' : locale === 'zh-CN' ? "份合同" : ' contracts'} · {completedMonthWindowLabel(value.evidenceWindow,locale)}</p></div> : null)}
          </section>
          {model.buildingResult?.status === 'insufficient' && <p>{locale === 'ko' ? `이 단지 같은 면적대는 ${model.buildingResult.sample.count}건으로 비교 기준인 5건에 못 미칩니다. 아래 결과는 구 기준입니다.` : locale === 'zh-CN' ? `本楼宇仅有 ${model.buildingResult.sample.count} 份符合条件的合同，未达到五份门槛。以下结果采用行政区合同。` : `This building has only ${model.buildingResult.sample.count} compatible contracts; five are needed. The result below uses district contracts.`}</p>}
          <EvidencePositionCard check={result} locale={locale} order="single-offer" title={locale === 'ko' ? '이 가격의 위치' : locale === 'zh-CN' ? "此价格所处位置" : 'Where this price sits'} />
          <div className={styles.verdictPanel} data-result-order="verdict">
            <p className={styles.verdict}>{result.verdict === 'below'
              ? (locale === 'ko' ? '중간 50% 구간보다 낮음' : locale === 'zh-CN' ? "低于中间 50% 区间" : 'Below the middle half')
              : result.verdict === 'above' ? (locale === 'ko' ? '중간 50% 구간보다 높음' : locale === 'zh-CN' ? "高于中间 50% 区间" : 'Above the middle half') : (locale === 'ko' ? '중간 50% 구간 안' : locale === 'zh-CN' ? "处于中间 50% 区间" : 'Within the middle half')}</p>
            <p>{result.filters.scope === 'building' ? model.buildingName : locale === 'ko' ? '이 구 같은 면적대 계약 기준' : locale === 'zh-CN' ? "本区相近面积合同" : 'Same-size district contracts'}</p>
          </div>
          <section className={styles.keyFigures} data-result-order="key-figures">
            <h3>{c.keyFigures}</h3>
            <div><dl>
              <div><dt>{c.median}</dt><dd><span className={styles.moneyValue}>{won.format(result.distribution.medianWon)}</span></dd></div>
              <div><dt>{c.middle}</dt><dd className={styles.moneyRange}><span className={styles.moneyValue}>{won.format(result.distribution.p25Won)}</span><span>–</span><span className={styles.moneyValue}>{won.format(result.distribution.p75Won)}</span></dd></div>
              <div><dt>{c.percentile}</dt><dd>{result.pricePercentile}</dd></div>
            </dl></div>
          </section>
          <section className={styles.marketEvidence} data-check-section="evidence" data-result-order="market-evidence">
            <h3>{c.evidence}</h3>
            <p>{result.sample.count} {c.sample} · ±{result.filters.areaTolerancePct}% {locale === 'ko' ? '면적 범위' : locale === 'zh-CN' ? "面积范围" : 'area'} · {completedMonthWindowLabel(result.evidenceWindow, locale)}</p>
            <div className={styles.comparableRows}>
              {result.comparableRows.map((row, index) => (
                <p key={`${row.buildingId}-${row.filedMonth}-${index}`}>
                  {row.filedMonth} · {row.areaSqm}㎡ · {won.format(row.adjustedValueWon)}
                  {entityContext === null ? null : <Link href={`${locale === 'zh-CN' ? '/zh-cn' : locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/${row.districtSlug}/${row.buildingId}/?transaction=${model.selection.transaction}&propertyType=${model.selection.housingType}&district=${row.districtSlug}&buildingId=${row.buildingId}`}>{locale === 'ko' ? '단지 거래 보기' : locale === 'zh-CN' ? "查看楼宇成交" : 'View building transactions'}</Link>}
                </p>
              ))}
            </div>
          </section>
          <ResultLinkCopy locale={locale} tool="single-quote" />
          <section className={styles.disclosure} data-check-section="disclosure" data-result-order="disclosure">
            <h3>{c.disclosure}</h3>
            <p>{(result.fallbackDisclosure === null ? null : localizeContractText(result.fallbackDisclosure, locale)) ?? (locale === 'ko' ? '각 비교에는 조건이 맞는 신고 거래를 최소 5건 사용합니다.' : locale === 'zh-CN' ? "每次比较至少使用五份条件相符的申报合同。" : 'At least five matching reported contracts are used for each comparison.')}</p>
            <p>{result.comparisonBasis === 'verified-deposit-adjusted-monthly-rent'
              ? (locale === 'ko' ? '신고 보증금과 월세는 그대로 표시하며, 검증된 전환율 자료로만 비교 금액을 환산합니다.' : locale === 'zh-CN' ? "保留展示申报保证金与月租，并使用经验证的折算曲线调整比较。" : 'Filed deposit and monthly rent remain visible; a verified conversion curve adjusts the comparison.')
              : (locale === 'ko' ? '선택한 거래 유형의 공식 신고 금액을 직접 비교합니다.' : locale === 'zh-CN' ? "在所选交易类型内直接比较官方申报金额。" : 'Official reported values are compared directly within the selected transaction market.')}</p>
            <p>{c.reference}</p>
          </section>
        </div>
      )}
      <ToolResearchShare locale={locale} resultRevision={researchRevision} snapshot={researchSnapshot} />
    </section>
  );
}

export function SingleQuoteCheckWorkspace({ model, locale = 'en', entityContext = null, pending = false, error = false, onRetry, onSubmit }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  pending?: boolean; error?: boolean; onRetry?: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
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
      <main className={`${styles.main} ${toolSurface.surface}`}>
        <section data-tool-header className={styles.hero}>
          <p>{locale === 'ko' ? '서울 · 실거래가 비교' : locale === 'zh-CN' ? "首尔 · 官方成交数据" : 'Seoul · Official transaction evidence'}</p>
          <h1>{locale === 'ko' ? '매물 가격 비교' : locale === 'zh-CN' ? "比较报价" : 'Compare an asking price'}</h1>
          <p>{locale === 'ko'
            ? '매매가격이나 보증금·월세를 입력해 비슷한 거래와 비교하세요.'
            : locale === 'zh-CN' ? "将买卖报价、全租保证金或月租与条件相近的申报合同比较。" : 'Compare a sale, jeonse or monthly-rent quote with compatible reported contracts.'}</p>
        </section>
        <nav aria-label={c.mode} className={styles.modeSelector} data-check-mode-selector="true">
          <span aria-current="page" data-check-mode="single">{c.single}</span>
          <Link data-check-mode="compare" href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
        </nav>
        {pending && <p className={styles.requestStatus} role="status">{error ? (locale === 'ko' ? '비교 자료를 불러오지 못했습니다.' : locale === 'zh-CN' ? "无法加载比较数据。" : 'Comparison data could not be loaded.') : (locale === 'ko' ? '입력한 조건으로 거래를 비교하고 있습니다…' : locale === 'zh-CN' ? "正在按输入条件比较合同…" : 'Comparing contracts for your inputs…')}{error && <button type="button" className={styles.secondaryAction} onClick={onRetry}>{locale === 'ko' ? '다시 시도' : locale === 'zh-CN' ? "重试" : 'Retry'}</button>}</p>}<div data-tool-layout><form data-tool-input inert={pending && !error} aria-busy={pending && !error} onSubmit={onSubmit} action={localizedCheckHref(locale, '/')} className={styles.form} method="get"><PassportFormContext />
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
                <option value="apartment">{locale === 'ko' ? '아파트' : locale === 'zh-CN' ? "公寓" : 'Apartment'}</option><option value="officetel">{locale === 'ko' ? '오피스텔' : locale === 'zh-CN' ? "商住公寓（Officetel）" : 'Officetel'}</option>
                <option value="villa_multifamily">{locale === 'ko' ? '연립·다세대' : locale === 'zh-CN' ? "多户住宅" : 'Villa / multifamily'}</option><option value="detached">{locale === 'ko' ? '단독·다가구' : locale === 'zh-CN' ? "独栋住宅" : 'Detached'}</option>
              </select></label>
              <label className={styles.field}><span>{c.area} <small>㎡</small></span><input value={area} onChange={e => setArea(e.target.value)} inputMode="decimal" name="area" /></label>
              <input type="hidden" name="building" value={buildingId ?? ''} />
              <CheckBuildingSearch text={buildingQuery} onText={value => { setBuildingQuery(value); clearBuilding(); }} locale={locale} onSelect={item => { setBuildingId(item.id); setBuildingName(item.name); setDistrict(item.district); setHousing(item.housing); if (item.area !== null) setArea(String(item.area)); setBuildingQuery(''); }} />
            </div>
            {buildingName && <div className={styles.selectedBuilding} data-selected-building={buildingId}><div><span>{locale === 'ko' ? '선택한 단지' : locale === 'zh-CN' ? "已选楼宇" : 'Selected building'}</span><strong>{buildingName}</strong></div><button className={styles.secondaryAction} type="button" onClick={clearBuilding} aria-label={locale === 'ko' ? `${buildingName} 선택 해제` : `Clear ${buildingName}`}>{locale === 'ko' ? '해제' : locale === 'zh-CN' ? "清除" : 'Clear'}</button></div>}
          </fieldset>
          <fieldset className={styles.singleOffer} data-offer="single">
            <legend><span>02</span>{locale === 'ko' ? '매물 가격' : locale === 'zh-CN' ? "报价" : 'Asking price'}</legend>
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
          <div className={styles.actions}><button type="submit">{locale === 'ko' ? '매물 가격 비교' : locale === 'zh-CN' ? "比较报价" : 'Compare an asking price'}</button></div>
        </form>
        <SingleResult model={model} locale={locale} entityContext={entityContext} /></div>
        <nav className={styles.contextLinks} aria-label={c.evidence}>
          {entityContext === null ? null : <Link href={entityContext.returnTo}>
            {locale === 'ko' ? `${model.buildingName ?? '선택한 단지'} 돌아가기` : locale === 'zh-CN' ? `返回${model.buildingName ?? '所选楼宇'}` : `Return to ${model.buildingName ?? 'selected building'}`}
          </Link>}
          <Link href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
          <Link href={`${locale === 'zh-CN' ? '/zh-cn' : locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
          <Link href={locale === 'zh-CN' ? '/zh-cn/guides/?market=seoul' : locale === 'ko' ? '/ko/guides/?market=seoul' : '/kr/seoul/guide/'}>{c.guide}</Link>
        </nav>
        <BuyerNextSteps market="seoul" locale={locale} />
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </div>
  );
}
