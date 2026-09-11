import Link from 'next/link';
import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';

import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import { EvidenceSectionHeading } from '../evidence-ui/section-heading';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { EvidencePeriodStrip } from './evidence-period-strip';
import styles from './building-detail.module.css';
import detailStyles from '../market-ui/detail-layout.module.css';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function contractTypeLabel(value: 'new' | 'renewal' | 'unknown'): string {
  if (value === 'new') return 'New';
  if (value === 'renewal') return 'Renewal';
  return 'Unclassified';
}

function floorLabel(contract: PublicBuildingModel['building']['recentContracts'][number]): string {
  if (contract.floor !== null) return String(contract.floor);
  return 'Floor was not retained in this verified snapshot.';
}

function CohortEvidence({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <section className={styles.evidence} aria-labelledby="building-distribution-heading">
      <EvidenceSectionHeading
        eyebrow={t("01 / Reported distribution")}
        title={t(model.presentation.distributionHeading)}
        id="building-distribution-heading"
      />
      <EvidencePeriodStrip model={model.period} label={t("Building evidence period")} locale={locale} />
      <dl className={styles.findingGrid}>
        <div>
          <dt>{t("Recent change")}</dt>
          <dd>
            <strong>{t(model.display.changeLabel)}</strong>
            {model.display.change.reasons.map((reason) => (
              <span key={reason}>{t(reason)}</span>
            ))}
          </dd>
        </div>
      </dl>
      <dl className={styles.findingGrid} aria-label={t('Contract type evidence')}>
        <div>
          <dt>{t("New contracts")}</dt>
          <dd>{model.building.groups.new.published
            ? `${money.format(model.building.groups.new.med)} · ${model.building.groups.new.n}${locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}`
            : `${t('Not published')} · ${model.building.groups.new.n}${locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}`}</dd>
        </div>
        <div>
          <dt>{t("Renewal contracts")}</dt>
          <dd>{model.building.groups.renewal.published
            ? `${money.format(model.building.groups.renewal.med)} · ${model.building.groups.renewal.n}${locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}`
            : `${t('Not published')} · ${model.building.groups.renewal.n}${locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}`}</dd>
        </div>
        <div><dt>{t("Unclassified type")}</dt><dd>{model.building.unknownContractCount}{locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔记录' : ' records'}</dd></div>
      </dl>
    </section>
  );
}

function FloorEvidence({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <section className={styles.areaBands} aria-labelledby="floor-coefficient-heading">
      <EvidenceSectionHeading
        eyebrow={t("02 / Floor evidence")}
        title={t("Floor adjustment evidence")}
        id="floor-coefficient-heading"
      />
      <div data-floor-coefficient={model.floorCoefficient.status}>
        {model.floorCoefficient.status === 'unavailable' ? (
          <strong>{t(model.floorCoefficient.reason)}</strong>
        ) : (
          <strong>{model.floorCoefficient.coefficient}</strong>
        )}
        <p>{model.floorCoefficient.pairCount}{locale === 'ko' ? '쌍의 비교 가능한 거래' : locale === 'zh-CN' ? '组合格配对' : ' eligible pairs'}</p>
        <p>{t(model.floorCoefficient.basis)}</p>
      </div>
    </section>
  );
}

function AreaBandEvidence({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <section className={styles.areaBands} aria-labelledby="building-area-heading">
      <EvidenceSectionHeading
        eyebrow={t("03 / Area bands")}
        title={t("Evidence by filed area band")}
        id="building-area-heading"
      />
      {model.building.areaBands.length === 1
        && model.building.areaBands[0]?.band === '45–55㎡' ? (
          <div data-area-band-state="single-fixed-band">
            <strong>{t("Other floor-area bands are not available yet.")}</strong>
            <p>{t("Published contract evidence is currently fixed to the 45–55㎡ floor-area band.")}</p>
            <p>{t("Additional bands will open after the collection scope expands.")}</p>
          </div>
        ) : model.building.areaBands.length === 0 ? (
          <p>{t("No area-band distribution is published for this record.")}</p>
        ) : (
          <ul>
            {model.building.areaBands.map(({ band, summary }) => (
              <li key={band}>
                <strong>{band}</strong>
                <span>{t(`${summary.n} reported contract${summary.n === 1 ? '' : 's'}`)}</span>
                <span>{summary.published ? money.format(summary.med) : t('Not published')}</span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

function RecentContractEvidence({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <section className={styles.contracts} aria-labelledby="recent-contracts-heading" data-detail-order="history">
      <EvidenceSectionHeading
        eyebrow={t("04 / Recent records")}
        title={t("Privacy-safe reported contracts")}
        id="recent-contracts-heading"
      />
      {model.building.recentContracts.length === 0 ? (
        <p>{t("No recent public contract rows are included in this artifact.")}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>{t("Filed month")}</th>
                <th>{t("Area")}</th>
                <th>{t("Floor")}</th>
                <th>{t("Contract")}</th>
                <th>{t("Jeonse deposit")}</th>
              </tr>
            </thead>
            <tbody>
              {model.building.recentContracts.map((contract, index) => (
                <tr key={`${contract.filedMonth}-${contract.areaSqm}-${index}`}>
                  <td>{contract.filedMonth}</td>
                  <td>{contract.areaSqm}㎡</td>
                  <td>{t(floorLabel(contract))}</td>
                  <td>{t(contractTypeLabel(contract.contractType))}</td>
                  <td>{money.format(contract.depositWon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function BuildingSourceEvidence({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <section id="building-source" className={styles.source} aria-labelledby="building-source-heading">
      <EvidenceSectionHeading
        eyebrow={t("05 / Source and limits")}
        title={t("Use this evidence within its boundary")}
        id="building-source-heading"
      />
      <EvidenceDisclosure locale={locale}
        model={model.evidence.descriptor}
        boundary={t(model.presentation.sourceBoundary)}
        attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
      />
      <details className={styles.sourceDetails}>
        <summary>{t("Filters and publication rules")}</summary>
        <dl className={styles.sourceGrid}>
          <div><dt>{t("Supported deals")}</dt><dd>{t('jeonse')}</dd></div>
          <div><dt>{t(model.presentation.periodLabel)}</dt><dd>{model.evidence.period}</dd></div>
          <div><dt>{t("Publication minimum")}</dt><dd>{model.evidence.publicationMinimum}</dd></div>
          <div><dt>{t("Exclusions")}</dt><dd>{model.evidence.exclusions.map(t).join(' · ')}</dd></div>
        </dl>
      </details>
      <div className={styles.actions}>
        <Link href="/trust/">{t("Read SignedPrice Trust")}</Link>
        <Link href={localizedSeoulHref("/kr/seoul/corrections/", locale)}>{t("Review Seoul corrections")}</Link>
      </div>
    </section>
  );
}

function BuildingNavigation({ model, locale = 'en' }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return (
    <nav className={styles.navigation} aria-label={t("Building evidence navigation")}>
      <Link href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/`, locale)}>
        {locale === 'ko' ? `${model.district.nameKo} 거래 보기` : `Back to ${model.district.nameEn} evidence`}
      </Link>
      <Link href={localizedSeoulHref(`/kr/seoul/explore/?district=${model.district.slug}`, locale)}>
        {t('Back to Seoul map')}
      </Link>
      <Link href={localizedSeoulHref("/kr/seoul/rankings/", locale)}>{t("View district rankings")}</Link>
      <Link href={localizedSeoulHref("/kr/seoul/corrections/", locale)}>{t("Review Seoul corrections")}</Link>
    </nav>
  );
}

export function BuildingEvidenceDetails({ model, locale = 'en', includeSource = true }: Readonly<{ model: PublicBuildingModel; locale?: ProductLocale; includeSource?: boolean }>) {
  return (
    <div data-building-section="evidence">
      <CohortEvidence model={model} locale={locale} />
      <RecentContractEvidence model={model} locale={locale} />
      <details className={detailStyles.disclosure}>
        <summary>{locale === 'ko' ? '층·면적별 분석과 집계 기준' : locale === 'zh-CN' ? '楼层与面积分析及统计方法' : 'Floor and size analysis and methodology'}</summary>
        <FloorEvidence model={model} locale={locale} />
        <AreaBandEvidence model={model} locale={locale} />
        <BuildingNavigation model={model} locale={locale} />
      </details>
      {includeSource ? <BuildingSourceEvidence model={model} locale={locale} /> : null}
    </div>
  );
}
