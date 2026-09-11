import {localizedSeoulHref, type ProductLocale} from '../../lib/locale/product-copy';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import type { EvidenceEmptyState } from '@signedprice/market-core';
import Link from 'next/link';

import type {
  BuildingDecisionModel,
  BuildingDecisionReadiness,
} from '../../lib/public-market/building-decision-model';
import { buildingDecisionHref } from '../../lib/public-market/building-decision-state';
import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import { EvidenceSectionHeading } from '../evidence-ui/section-heading';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { EvidenceEmptyStatePanel } from '../trust/evidence-empty-state';
import { BoxPlot } from './box-plot';
import styles from './building-detail.module.css';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function OverviewDecisionView({ model, decision, base, locale = 'en' }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
  locale?: ProductLocale;
}>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <div className={styles.decisionLayout}>
      <div>
        <p className={styles.decisionEyebrow}>{locale === 'ko' ? '임대차 가격 비교' : locale === 'zh-CN' ? '租赁价格比较' : 'Rent comparison'}</p>
        <h2>{locale === 'ko' ? '신고된 임대차 거래와 비교하세요' : locale === 'zh-CN' ? '与申报租赁合同比较' : 'Compare with reported rental contracts'}</h2>
        <p>
          {locale === 'ko' ? `집계 기간에 ${model.distribution.n}건의 계약이 있습니다. 매매·투자 판단에 필요한 자료는 아직 부족합니다.` : `${model.distribution.n} reported contracts are published for the declared period. Sale and investment evidence is not yet sufficient.`}
        </p>
        <Link
          className={styles.primaryAction}
          href={buildingDecisionHref({ base, mode: decision.overview.primaryMode, contract: 'all' })}
        >
          {locale === 'ko' ? '임대차 거래 비교' : locale === 'zh-CN' ? '比较租赁合同' : 'Compare rental contracts'}
        </Link>
      </div>
      <dl className={styles.decisionMetrics} aria-label={t('Building evidence readiness')}>
        <div><dt>{t('Rent evidence')}</dt><dd>{t('Published')} · {model.distribution.n}{locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}</dd></div>
        <div><dt>{t('Buy evidence')}</dt><dd>{decision.buy.readiness.state === 'published'
          ? t('Published')
          : t(decision.buy.readiness.title)}</dd></div>
        <div><dt>{t('Investment scenario')}</dt><dd>{decision.invest.readiness.state === 'published'
          ? t('Published')
          : t(decision.invest.readiness.title)}</dd></div>
      </dl>
    </div>
  );
}

function GatedDecisionView({
  mode,
  readiness,
  base,
  locale = 'en',
}: Readonly<{
  mode: 'Buy' | 'Invest';
  readiness: BuildingDecisionReadiness;
  base: string;
  locale?: ProductLocale;
}>) {
  const t = (value: string) => seoulDetailText(locale, value);
  if (readiness.state === 'published') {
    return (
      <section className={styles.decisionView} aria-label={locale === 'ko' ? `${t(mode)} 거래 자료` : `${mode} evidence`}>
        <h2>{locale === 'ko' ? `${t(mode)} 거래 자료` : `${mode} evidence is published`}</h2>
        <p>{locale === 'ko' ? `집계 조건에 맞는 거래 ${readiness.count}건` : `${readiness.count} eligible records are ready.`}</p>
      </section>
    );
  }
  const emptyState: EvidenceEmptyState = {
    title: t(readiness.title),
    reason: t(readiness.reason),
    nextAction: t(readiness.nextAction),
    detail: {
      code: 'NOT_REPORTABLE',
      note: readiness.reason,
    },
  };
  return (
    <div className={styles.decisionView} data-gated-mode={mode.toLowerCase()}>
      <EvidenceEmptyStatePanel
        state={emptyState}
        actionHref={buildingDecisionHref({ base, mode: 'evidence', contract: 'new' })}
      />
    </div>
  );
}

function RentDecisionView({ model, decision, base, locale = 'en' }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
  locale?: ProductLocale;
}>) {
  const { readiness, summary } = decision.rent;
  const t = (value: string) => seoulDetailText(locale, value);
  if (summary === null || readiness.state !== 'published') {
    const count = readiness.state === 'insufficient' ? readiness.count : 0;
    const title = readiness.state === 'published'
      ? 'Contract evidence is not available'
      : readiness.title;
    const reason = readiness.state === 'published'
      ? 'The selected cohort has no independently publishable summary.'
      : readiness.reason;
    const nextAction = readiness.state === 'published'
      ? 'Return to district evidence'
      : readiness.nextAction;
    const emptyState: EvidenceEmptyState = {
      title: t(title),
      reason: t(reason),
      nextAction: t(nextAction),
      detail: {
        code: 'INSUFFICIENT',
        count,
        threshold: model.evidence.publicationMinimum,
      },
    };
    const actionHref = decision.rent.cohort === 'all'
      ? `/kr/seoul/explore/${model.district.slug}/`
      : buildingDecisionHref({ base, mode: 'rent', contract: 'all' });
    return <EvidenceEmptyStatePanel state={emptyState} actionHref={localizedSeoulHref(actionHref, locale)} />;
  }
  return (
    <div className={styles.decisionView}>
      <p className={styles.decisionEyebrow}>{locale === 'ko' ? '신고 거래 분포' : locale === 'zh-CN' ? '申报交易分布' : 'Reported transaction distribution'}</p>
      <h2>{locale === 'ko' ? `${t(decision.rent.cohort)} 계약 거래` : `${decision.rent.cohort === 'all' ? 'All' : decision.rent.cohort === 'new' ? 'New' : 'Renewal'} contract evidence`}</h2>
      <p>{t(`${summary.n} reported contract${summary.n === 1 ? '' : 's'}`)}</p>
      <div data-building-distribution="true">
        <BoxPlot
          summary={summary}
          axis={decision.rent.axis}
          formatValue={(value) => money.format(value)}
        />
      </div>
      <Link className={styles.primaryAction} href={localizedSeoulHref(decision.rentCheckHref,locale)}>
        {locale === 'ko' ? '매물 가격 비교' : locale === 'zh-CN' ? '比较挂牌租金' : 'Compare an asking rent'}
      </Link>
    </div>
  );
}

function EvidenceDecisionView({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <div className={styles.decisionView}>
      <EvidenceSectionHeading
        eyebrow={t('Evidence ledger')}
        title={t('What supports this building page')}
      />
      <EvidenceDisclosure locale={locale}
        model={model.evidence.descriptor}
        boundary={t(model.presentation.sourceBoundary)}
        attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
      />
      <dl className={styles.evidenceLedger}>
        <div><dt>{t('Building identity')}</dt><dd>{t('Verified by the signed building artifact.')}</dd></div>
        <div><dt>{t('Rent contracts')}</dt><dd>{locale === 'ko' ? `${model.evidence.period} · 집계 조건을 충족한 거래 ${model.evidence.publicationMinimum}건 이상일 때 가격을 표시합니다.` : `Published for ${model.evidence.period} with a minimum of ${model.evidence.publicationMinimum} eligible records.`}</dd></div>
        <div><dt>{t('Official sale evidence')}</dt><dd>{locale === 'ko' ? '현재 이 단지 자료에 포함되지 않습니다.' : locale === 'zh-CN' ? '当前楼盘数据中未包含。' : 'Not included in this building dataset.'}</dd></div>
        <div><dt>{t('Building visual')}</dt><dd>{t('No rights-cleared source is connected.')}</dd></div>
        <div><dt>{t('Community')}</dt><dd>{t('Independent threshold state; never merged with official evidence.')}</dd></div>
      </dl>
    </div>
  );
}

export function BuildingDecisionView({ model, decision, base, locale = 'en' }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
  locale?: ProductLocale;
}>) {
  const mode = decision.selection.mode;
  const content = (() => {
    switch (mode) {
      case 'rent':
        return <RentDecisionView model={model} decision={decision} base={base} locale={locale} />;
      case 'buy':
        return <GatedDecisionView mode="Buy" readiness={decision.buy.readiness} base={base} locale={locale} />;
      case 'invest':
        return <GatedDecisionView mode="Invest" readiness={decision.invest.readiness} base={base} locale={locale} />;
      case 'evidence':
        return <EvidenceDecisionView model={model} locale={locale} />;
      default:
        return <OverviewDecisionView model={model} decision={decision} base={base} locale={locale} />;
    }
  })();
  return (
    <section
      id="building-mode-panel"
      role="tabpanel"
      aria-labelledby={`building-mode-${mode}-tab`}
      data-selected-mode={mode}
    >
      {content}
    </section>
  );
}
