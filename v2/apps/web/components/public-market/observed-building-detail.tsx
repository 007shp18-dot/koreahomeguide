import { buildingDisplayName, neighborhoodDisplayName } from '../../lib/public-market/seoul-display-names';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { RecentTransactionPlot, SizeCohortResearch } from '../market-ui/transaction-research';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import { PassportLink as Link } from '../passport/passport-journey';
import type { ReactNode } from 'react';

import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import { createEntityCheckHref } from '../../lib/navigation/explorer-selection';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { BuildingDetailHeader } from './building-detail-header';
import styles from './building-detail.module.css';

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul building identity, with price publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const exactEvidenceFooter: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Seoul reported prices, with dates, sample counts and sources.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const countLabel = (count: number) => `${count} observed contract${count === 1 ? '' : 's'}`;


function KnownBuildingFacts({ facts, locale = 'en' }: Readonly<{ locale?: ProductLocale; facts: readonly Readonly<{ label: string; value: string }>[] }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return <section className={styles.knownFacts} aria-labelledby="known-building-facts-heading" data-building-facts="known">
    <div className={styles.sectionHeading}><p>{t('Building profile')}</p><h2 id="known-building-facts-heading">{t('Verified facts already attached')}</h2></div>
    <dl className={styles.findingGrid}>{facts.filter(fact => !/not reported|pending|unavailable|unverified/i.test(fact.value)).map((fact) => <div key={fact.label}><dt>{t(fact.label)}</dt><dd>{t(fact.value)}</dd></div>)}</dl>
  </section>;
}

const proximityCopy = Object.freeze({
  en: Object.freeze({
    heading: 'Proximity',
    unavailable: 'Proximity data unavailable',
    pending: 'Distance not confirmed',
    coordinateUnavailable: 'Coordinate unavailable',
    station: 'Nearest station · straight-line distance',
    school: 'School proximity · straight-line distance',
    unavailableFact: 'Unavailable',
    stationSource: 'Station source',
    schoolSource: 'School source',
    coordinateSource: 'Coordinate source',
    methodology: 'Methodology',
    version: 'Version',
    asOf: 'As of',
    attendanceDisclaimer: 'School proximity is not an attendance-zone assignment.',
    methodologySuffix: '',
  }),
  ko: Object.freeze({
    heading: '인접성',
    unavailable: '인접성 데이터를 확인할 수 없습니다.',
    pending: '거리 미확정',
    coordinateUnavailable: '좌표 확인 불가',
    station: '가까운 역 · 직선거리',
    school: '학교 인접성 · 직선거리',
    unavailableFact: '확인 불가',
    stationSource: '역 출처',
    schoolSource: '학교 출처',
    coordinateSource: '좌표 출처',
    methodology: '산정 방법',
    version: '버전',
    asOf: '기준',
    attendanceDisclaimer: '학교 인접성은 배정 학군이 아닙니다.',
    methodologySuffix: ' · 직선거리',
  }),
} satisfies Readonly<Record<ProductLocale, Readonly<Record<string, string>>>>);

export function BuildingProximityDisclosure({ proximity, locale = 'en' }: Readonly<{
  proximity: ObservedBuildingIdentityModel['proximity'] | undefined;
  locale?: ProductLocale;
}>) {
  const copy = proximityCopy[locale];
  if (proximity === undefined || proximity.status !== 'ready' || proximity.coordinateStatus !== 'ready' || (!proximity.nearestStation && !proximity.nearestSchool)) return null;
  return <section className={styles.proximityDetails} data-building-proximity="ready">
    <h3>{copy.heading}</h3>
    <dl className={styles.findingGrid}>
      {proximity.nearestStation && <div><dt>{copy.station}</dt><dd>{proximity.nearestStation.name} · {proximity.nearestStation.lines.join(', ')} · {Math.round(proximity.nearestStation.distanceMeters)} m</dd></div>}
      {proximity.nearestSchool && <div><dt>{copy.school}</dt><dd>{proximity.nearestSchool.name} · {Math.round(proximity.nearestSchool.distanceMeters)} m</dd></div>}
    </dl>
    <p>{copy.attendanceDisclaimer}</p>
    {proximity.provenance === undefined ? null : <dl className={styles.sourceGrid}>
      <div><dt>{copy.stationSource}</dt><dd>{proximity.provenance.stationSource.landingPage} · {copy.version} {proximity.provenance.stationSource.sourceVersion} · {copy.asOf} {proximity.provenance.stationSource.asOf}</dd></div>
      <div><dt>{copy.schoolSource}</dt><dd>{proximity.provenance.schoolSource.landingPage} · {copy.version} {proximity.provenance.schoolSource.sourceVersion} · {copy.asOf} {proximity.provenance.schoolSource.asOf}</dd></div>
      <div><dt>{copy.coordinateSource}</dt><dd>{proximity.provenance.coordinateSource.landingPage} · {copy.version} {proximity.provenance.coordinateSource.sourceVersion} · {copy.asOf} {proximity.provenance.coordinateSource.asOf}</dd></div>
      <div><dt>{copy.methodology}</dt><dd>{proximity.provenance.methodology}{copy.methodologySuffix}</dd></div>
    </dl>}
  </section>;
}

export function ObservedBuildingDetail({
  model,
  backHref,
  visual,
  facts,
  locale = 'en',
}: Readonly<{
  model: ObservedBuildingIdentityModel;
  backHref: string;
  visual?: ReactNode;
  facts?: ReactNode;
  locale?: ProductLocale;
}>) {
  const hasMonthly = model.observations.monthly > 0;
  const t = (value: string) => seoulDetailText(locale, value);
  const hasJeonse = model.observations.jeonse > 0;
  const evidenceKinds = [
    hasJeonse ? t('Jeonse') : null,
    hasMonthly ? t('Monthly rent') : null,
  ].filter((value): value is string => value !== null).join(' + ');
  const coordinateLabel = model.coordinate.status === 'ready'
    ? 'Verified coordinate available'
    : 'Coordinate verification pending';

  return (
    <div id="top" className={styles.page}>
      <BuildingDetailHeader locale={locale} />
      <main className={styles.main} data-building-detail="identity-only">
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          {visual && <div data-detail-order="media">{visual}</div>}

          <div className={styles.identitySummary}>
            <Link className={styles.backAction} href={backHref}>
              {locale === 'ko' ? `${model.district.nameKo} 탐색으로` : `Back to ${model.district.nameEn} Explore`}
            </Link>
            <h1>{buildingDisplayName(model.building.officialName, locale)}</h1>
            <p>{neighborhoodDisplayName(model.building.neighborhoodName, locale)} · {locale === 'ko' ? model.district.nameKo : model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>{t('Housing type')}</dt><dd>{t(model.building.housingType)}</dd></div>
            </dl>
          </div>
        </section>

        <nav className={styles.mockupTabs} aria-label={t('Building page sections')}><a href="#building-overview">{t('Overview')}</a><a href="#building-source">{t('Source')}</a></nav>
        <section id="building-overview" className={styles.evidence} data-building-section="identity-evidence">
          <div className={styles.sectionHeading}>
            <p>{t('Evidence boundary')}</p>
            <h2>{t('Price evidence unavailable')}</h2>
          </div>
          <p>{locale === 'ko' ? '전용면적 45~55㎡·월세 없는 전세 조건에 가격을 표시할 수 있는 거래 자료가 없습니다.' : model.evidence.message}</p>
          <p>{t(countLabel(model.observations.total))} · {model.observations.firstMonth}–{model.observations.lastMonth} · {evidenceKinds}</p>
          <dl className={styles.findingGrid}>
            <div><dt>{t('All observed')}</dt><dd>{model.observations.total}</dd></div>
            <div><dt>{t('Jeonse')}</dt><dd>{model.observations.jeonse}</dd></div>
            <div><dt>{t('Monthly rent')}</dt><dd>{model.observations.monthly}</dd></div>
            <div><dt>{t('Map status')}</dt><dd>{t(coordinateLabel)}</dd></div>
          </dl>
        </section>
        <KnownBuildingFacts locale={locale} facts={[
          { label: 'Official identity', value: model.building.officialName },
          { label: 'Area', value: `${model.building.neighborhoodName} · ${locale === 'ko' ? model.district.nameKo : model.district.nameEn}` },
          { label: 'Housing type', value: model.building.housingType },
          { label: 'Observed evidence', value: countLabel(model.observations.total) },
          { label: 'Evidence period', value: `${model.observations.firstMonth}–${model.observations.lastMonth}` },
          { label: 'Map identity', value: coordinateLabel },
        ]} />
        {facts}
        {facts === undefined ? <BuildingProximityDisclosure proximity={model.proximity} locale={locale} /> : null}
        <section id="building-source" className={styles.source}>
          <details className={styles.sourceDetails}>
            <summary>{t('Source and observation details')}</summary>
            <dl className={styles.sourceGrid}>
              <div><dt>{t('Source')}</dt><dd>{model.source.provider} {model.source.dataset}</dd></div>
              <div><dt>{t('Source period')}</dt><dd>{model.source.period}</dd></div>
              <div><dt>{t('Observed first')}</dt><dd>{model.observations.firstMonth}</dd></div>
              <div><dt>{t('Observed latest')}</dt><dd>{model.observations.lastMonth}</dd></div>
            </dl>
          </details>
          <div className={styles.actions}>
            <Link href={backHref}>{t('Return to Explore')}</Link>
            <Link href="/trust/">{t('Read the evidence policy')}</Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} copy={locale === 'ko' ? { ...footer, descriptor: '확인된 서울 단지 정보와 가격 자료의 제공 범위를 표시합니다.' } : footer} />
    </div>
  );
}

const areaLabels = Object.freeze({
  all: 'All home sizes',
  'under-40': 'Under 40㎡',
  '40-60': '40–60㎡',
  '60-85': '60–85㎡',
  '85-plus': '85㎡ and above',
} as const);

const transactionLabels = Object.freeze({
  jeonse: 'Jeonse',
  monthly: 'Monthly rent',
  sale: 'Sale',
} as const);

const primaryMetricLabels = Object.freeze({
  deposit: 'Deposit median',
  'monthly-rent': 'Monthly rent median',
  'sale-price': 'Sale price median',
} as const);

export function buildKoreaEvidenceCheckHref(
  model: KoreaExplorerBuildingDetailModel,
  locale: ProductLocale = 'en',
): string {
  const detailQuery = new URLSearchParams();
  detailQuery.set('transaction', model.selection.transaction);
  detailQuery.set('area', model.selection.areaBand);
  detailQuery.set('propertyType', model.building.housingType);
  detailQuery.set('district', model.district.slug);
  detailQuery.set('neighborhood', model.building.neighborhoodId);
  detailQuery.set('buildingId', model.building.buildingId);
  const detailHref = localizedSeoulHref(
    `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?${detailQuery.toString()}`,
    locale,
  );
  return createEntityCheckHref(localizedSeoulHref('/kr/seoul/check/', locale), {
    market: 'kr-seoul',
    locale,
    entity: model.building.buildingId,
    returnTo: detailHref,
    selection: {
      market: 'kr',
      transaction: model.selection.transaction,
      propertyType: model.building.housingType,
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
    },
  });
}

export function KoreaEvidenceBuildingDetail({
  model,
  backHref,
  visual,
  facts,
  locale = 'en',
}: Readonly<{
  model: KoreaExplorerBuildingDetailModel;
  backHref: string;
  visual?: ReactNode;
  facts?: ReactNode;
  locale?: ProductLocale;
}>) {
  const areaLabel = locale === 'ko' ? {all:'전체 면적','under-40':'40㎡ 미만','40-60':'40~60㎡','60-85':'60~85㎡','85-plus':'85㎡ 이상'}[model.selection.areaBand] : areaLabels[model.selection.areaBand];
  const t = (value: string) => seoulDetailText(locale, value);
  const transactionLabel = locale === 'ko' ? {sale:'매매',jeonse:'전세',monthly:'월세'}[model.selection.transaction] : transactionLabels[model.selection.transaction];
  const primaryLabel = locale === 'ko' ? {'sale-price':'매매가격 중앙값',deposit:'보증금 중앙값','monthly-rent':'월세 중앙값'}[model.evidence.primaryMetric] : primaryMetricLabels[model.evidence.primaryMetric];
  const publicationHeading = model.evidence.state === 'published'
    ? (model.selection.areaBand === 'all' ? (locale === 'ko' ? '이 단지 신고 거래 · 전체 면적' : 'Reported contracts · all sizes') : (locale === 'ko' ? '같은 면적대 신고 거래' : 'Reported contracts · same size'))
    : model.evidence.state === 'withheld'
      ? (locale === 'ko' ? '최근 신고 거래' : 'Recent reported contracts')
      : (locale === 'ko' ? '선택한 조건의 신고 거래가 없습니다' : 'No matching contracts');

  const monthlyUnit = model.evidence.primaryMetric === 'monthly-rent' ? (locale === 'ko' ? ' /월' : ' /month') : '';
  const money = (value: number) => locale === 'ko' ? (value >= 100_000_000 ? `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억 원` : value >= 10_000 ? `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만 원` : `${Math.round(value).toLocaleString('ko-KR')}원`) : `₩${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;
  const sourceLine = `${locale === 'ko' ? '출처: 국토교통부' : 'Source: MOLIT'} · ${model.period} · ${locale === 'ko' ? '갱신' : 'Updated'} ${model.generatedAt.slice(0,10)}`;
  return (
    <div id="top" className={styles.page}>
      <BuildingDetailHeader locale={locale} />
      <main className={styles.main} data-building-detail="exact-evidence" data-detail-locale={locale}>
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          {visual && <div data-detail-order="media">{visual}</div>}
          <div className={styles.identitySummary} data-detail-order="identity">
            <Link className={styles.backAction} href={backHref}>
              {locale === 'ko' ? `${model.district.nameKo} 탐색으로` : `Back to ${model.district.nameEn} Explore`}
            </Link>
            <h1>{buildingDisplayName(model.building.officialName, locale)}</h1>
            <p>{neighborhoodDisplayName(model.building.neighborhoodName, locale)} · {locale === 'ko' ? model.district.nameKo : model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>{t('Housing type')}</dt><dd>{t(model.building.housingType)}</dd></div>
            </dl>
          </div>
        </section>

        <nav className={styles.mockupTabs} aria-label={locale === 'ko' ? '건물 상세 항목' : 'Building detail sections'}>
          <a href="#building-overview">{locale === 'ko' ? '개요' : 'Overview'}</a>
          <a href="#building-transactions">{locale === 'ko' ? '실거래' : 'Transactions'}</a>
          <a href="#building-area-prices">{locale === 'ko' ? '면적별 가격' : 'Price by area'}</a>
          <a href="#building-facts">{locale === 'ko' ? '단지 정보' : 'Building facts'}</a>
          <a href="#building-source">{locale === 'ko' ? '출처' : 'Sources'}</a>
        </nav>


        <section id="building-overview" data-detail-order="current-evidence" className={styles.evidence} data-building-section="exact-evidence">
          <div className={styles.sectionHeading}>
            <p>{transactionLabel} · {areaLabel}</p>
            <h2>{publicationHeading}</h2>
          </div>
          <dl className={styles.findingGrid}>
            {model.evidence.medianWon !== null && <div className={styles.primaryFinding}><dt>{primaryLabel}</dt><dd>{money(model.evidence.medianWon)}{monthlyUnit}</dd><small>{t(model.evidence.sampleLabel)} · {model.period}</small></div>}
            {model.evidence.medianWon === null && <div><dt>{t('Observed contracts')}</dt><dd>{t(model.evidence.sampleLabel)} · {model.period}</dd></div>}
            {model.evidence.middleHalfLabel && <div><dt>{locale === 'ko' ? '중간 50%' : 'Middle half'}</dt><dd>{model.evidence.middleHalfLabel}{monthlyUnit}</dd></div>}
            
          </dl>
          {model.evidence.primaryMetric === 'monthly-rent' ? (
            <dl className={styles.sourceGrid}>
              <div>
                <dt>{t('Filed deposit median')}</dt>
                <dd>{model.evidence.filedDepositMedianLabel ?? t('Not published')}</dd>
              </div>
              <div><dt>{t('Monthly rent metric')}</dt><dd>{t('Filed monthly rent only')}</dd></div>
              <div><dt>{t('Area scope')}</dt><dd>{areaLabel}</dd></div>
              <div><dt>{t('Contract group')}</dt><dd>{t(model.selection.contractGroup)}</dd></div>
            </dl>
          ) : null}

          <RecentTransactionPlot rows={model.recentTransactions} locale={locale} periodUnit={model.evidence.primaryMetric === 'monthly-rent' ? 'month' : undefined} />

          <div id="building-transactions" className={styles.sectionHeading} data-detail-order="history"><p>{locale === 'ko' ? '실제 신고 거래' : 'Reported contracts'}</p><h2>{locale === 'ko' ? '선택한 면적대의 최근 실거래' : 'Recent contracts matching these filters'}</h2></div>
          {model.recentTransactions.length === 0 ? (
            <p>{t('No privacy-safe recent rows remain in this selected cohort.')}</p>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>{locale === 'ko' ? '계약 월' : 'Filed month'}</th>
                    <th>{locale === 'ko' ? '전용면적' : 'Area'}</th>
                    <th>{locale === 'ko' ? (model.evidence.primaryMetric === 'sale-price' ? '신고 매매가격' : model.evidence.primaryMetric === 'deposit' ? '신고 보증금' : '신고 월세') : (model.evidence.primaryMetric === 'sale-price' ? 'Filed sale price' : model.evidence.primaryMetric === 'deposit' ? 'Filed deposit' : 'Filed monthly rent')}</th>
                    {model.evidence.primaryMetric === 'monthly-rent' ? <th>{t('Filed deposit')}</th> : null}
                    <th>{locale === 'ko' ? '㎡당 금액' : 'Price / m²'}{monthlyUnit}</th><th>{locale === 'ko' ? '층·계약 구분' : 'Floor / contract'}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.recentTransactions.map((row, index) => (
                    <tr key={`${row.filedMonth}-${row.areaSqm}-${row.primaryWon}-${index}`}>
                      <td>{row.filedMonth}</td>
                      <td>{row.areaLabel}</td>
                      <td>{row.primaryLabel}{monthlyUnit}</td>
                      {model.evidence.primaryMetric === 'monthly-rent'
                        ? <td>{row.filedDepositLabel ?? '—'}</td>
                        : null}
                      <td>{row.areaSqm > 0 ? `${money(row.primaryWon / row.areaSqm)}${monthlyUnit}` : '—'}</td><td>{row.contractType === null ? (row.floor === null ? (locale === 'ko' ? '신고 계약' : 'Reported contract') : locale === 'ko' ? `${row.floor}층` : `Floor ${row.floor}`) : t(row.contractType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="building-area-prices" className={styles.areaBands} data-detail-order="comparable-range" aria-labelledby="building-area-prices-heading">
          <div className={styles.sectionHeading}>
            <p>{locale === 'ko' ? '면적별 가격' : 'Price by home size'}</p>
            <h2 id="building-area-prices-heading">{locale === 'ko' ? '같은 건물의 면적 구간을 전환합니다.' : 'Switch between verified size cohorts for this building.'}</h2>
          </div>
          {model.sizeCohorts ? <SizeCohortResearch rows={model.sizeCohorts} currency="KRW" locale={locale} periodUnit={model.evidence.primaryMetric === 'monthly-rent' ? 'month' : undefined} /> : null}
          <ul>{Object.entries(areaLabels).map(([id, label]) => <li key={id}>
            <strong>{t(label)}</strong>
            <span>{id === model.selection.areaBand ? (locale === 'ko' ? '현재 선택한 면적' : 'Selected size cohort') : (locale === 'ko' ? '선택해 거래 내역 보기' : 'Open this evidence cohort')}</span>
            <Link href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${model.selection.transaction}&area=${id}${model.selection.contractGroup === 'not-applicable' ? '' : `&contractType=${model.selection.contractGroup}`}`, locale)}>{locale === 'ko' ? '이 면적 보기' : 'View size cohort'}</Link>
          </li>)}</ul>
        </section>

        {model.selection.transaction === 'sale' ? <div className={styles.areaBands}><PropertyScenarioCalculator key={`${model.building.buildingId}-${model.selection.areaBand}`} price={model.evidence.medianWon} housingType={model.building.housingType} annualRent={model.rentStartingPoint?.annualRent} rentSource={model.rentStartingPoint ? `MOLIT · ${model.rentStartingPoint.period} · ${model.rentStartingPoint.count} contracts · refundable deposit ${money(model.rentStartingPoint.deposit)} (not deducted from purchase cash)` : undefined} currency="KRW" locale={locale} analytics={{market:'kr-seoul',surface:'property-detail'}} /><Link href={createPropertyScenarioHref({locale,market:'kr-seoul',currency:'KRW',entity:model.building.buildingId,propertyName:model.building.officialName,transaction:'sale',price:model.evidence.state === 'published' ? model.evidence.medianWon : null,returnTo:localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`,locale)})}>{locale === 'ko' ? '전체 계산기 열기' : 'Open calculator'}</Link></div> : null}

        <div id="building-facts" className={styles.factsAnchor} data-detail-order="facts"><KnownBuildingFacts locale={locale} facts={[
          { label: locale === 'ko' ? '공식 건물명' : 'Official identity', value: model.building.officialName },
          { label: locale === 'ko' ? '지역' : 'Area', value: `${model.building.neighborhoodName} · ${locale === 'ko' ? model.district.nameKo : model.district.nameEn}` },
          { label: locale === 'ko' ? '주택 유형' : 'Housing type', value: locale === 'ko' ? ({apartment:'아파트',officetel:'오피스텔',villa_multifamily:'연립·다세대',detached:'단독·다가구'}[model.building.housingType]) : model.building.housingType },
          { label: locale === 'ko' ? '거래 유형' : 'Transaction', value: transactionLabel },
          { label: locale === 'ko' ? '면적 구간' : 'Area cohort', value: areaLabel },
          { label: locale === 'ko' ? '집계 기간' : 'Evidence period', value: model.period },
        ]} /></div>
        <div data-detail-order="proximity">{facts}</div>


        <details id="building-source" className={styles.sourceDetails} data-detail-order="sources">
          <summary>{locale === 'ko' ? '출처·기간·표본 기준' : 'Source and sample details'}</summary>
          <p className={styles.sourceLine}>{sourceLine}</p>
          <dl className={styles.sourceGrid}>
            <div><dt>{t('Source')}</dt><dd>{t('MOLIT reported contracts')}</dd></div>
            <div><dt>{t('Source period')}</dt><dd>{model.period}</dd></div>
            <div><dt>{t('Generated')}</dt><dd>{model.generatedAt.slice(0, 10)}</dd></div>
            <div><dt>{t('Publication minimum')}</dt><dd>{t('5 eligible contracts')}</dd></div>
          </dl>
        </details>

        <section data-detail-order="related-actions" className={styles.areaBands} aria-label={locale === 'ko' ? '다음으로 확인하기' : 'Continue your search'}>
          <h2>{locale === 'ko' ? '다음으로 확인하기' : 'Continue your search'}</h2>
          <div className={styles.actions}>{(['sale','jeonse','monthly'] as const).map(transaction => <Link key={transaction} href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${transaction}&area=${model.selection.areaBand}`,locale)}>{locale === 'ko' ? {sale:'매매',jeonse:'전세',monthly:'월세'}[transaction] : transactionLabels[transaction]}</Link>)}<Link href={buildKoreaEvidenceCheckHref(model,locale)}>{locale === 'ko' ? '매물 가격 비교' : 'Compare an asking price'}</Link></div>
          {!!model.nearbyBuildings?.length && <><h3>{locale === 'ko' ? '같은 동 다른 단지 · 같은 검색 조건' : 'Other buildings in this neighbourhood · same filters'}</h3><ul>{model.nearbyBuildings.map(b => <li key={b.id}><Link href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${b.id}/?transaction=${model.selection.transaction}&area=${model.selection.areaBand}`,locale)}>{buildingDisplayName(b.name,locale)} · {money(b.median)} · {b.count}{locale === 'ko' ? '건' : ' contracts'}</Link></li>)}</ul></>}
        </section>
      </main>
      <SiteFooter locale={locale} copy={locale === 'ko' ? { ...exactEvidenceFooter, descriptor: '서울 실거래가와 집계 기간·거래 건수·출처를 확인하세요.' } : exactEvidenceFooter} />
    </div>
  );
}
