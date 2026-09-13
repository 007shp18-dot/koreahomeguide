import { PropertyLivingContext } from '../market-ui/living-context';
import { seoulBuildingLocationHref } from '../../lib/public-market/seoul-building-location';
import { buildingDisplayName, neighborhoodDisplayName } from '../../lib/public-market/seoul-display-names';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { RecentTransactionPlot, SizeCohortResearch } from '../market-ui/transaction-research';
import { DetailTools } from '../market-ui/detail-tools';
import detailStyles from '../market-ui/detail-layout.module.css';
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
import { BuildingSaveButton } from './building-save-button';
import { BuildingDetailHeader } from './building-detail-header';
import { ProjectedEntityMedia } from './projected-entity-media';
import styles from './building-detail.module.css';
import { BuildingSummaryCard } from './building-summary-card';
import { RecordPlaceVisit } from '../discovery/recent-places';
import { DiscoveryReading } from '../discovery/discovery-reading';

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

function SeoulBuildingContext({ locale, name, href }: Readonly<{ locale: ProductLocale; name: string; href: string }>) {
  return <ProjectedEntityMedia locale={locale} buildingName={name} media={null} showLocationAction={false} fallbackMarket="seoul" locationHref={seoulBuildingLocationHref(href)} />;
}


function KnownBuildingFacts({ facts, locale = 'en' }: Readonly<{ locale?: ProductLocale; facts: readonly Readonly<{ label: string; value: string }>[] }>) {
  const t = (value: string) => seoulDetailText(locale, value);
  return <section className={styles.knownFacts} aria-labelledby="known-building-facts-heading" data-building-facts="known">
    <div className={styles.sectionHeading}><p>{t('Building profile')}</p><h2 id="known-building-facts-heading">{t('Building profile')}</h2></div>
    <dl className={styles.findingGrid}>{facts.filter(fact => !/not reported|pending|unavailable|unverified/i.test(fact.value)).map((fact) => <div key={fact.label}><dt>{t(fact.label)}</dt><dd>{t(fact.value)}</dd></div>)}</dl>
  </section>;
}

const proximityCopy = Object.freeze({
  en: Object.freeze({
    heading: 'Nearby schools and stations',
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
    heading: '주변 학교와 지하철',
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
  'zh-CN': Object.freeze({ heading: '附近学校与车站', unavailable: '暂无周边距离数据', pending: '距离待核实', coordinateUnavailable: '暂无坐标', station: '最近车站 · 直线距离', school: '邻近学校 · 直线距离', unavailableFact: '无法核实', stationSource: '车站来源', schoolSource: '学校来源', coordinateSource: '坐标来源', methodology: '计算方法', version: '版本', asOf: '截至', attendanceDisclaimer: '学校距离不代表学区分配或入学资格。', methodologySuffix: ' · 直线距离' }),
} satisfies Readonly<Record<ProductLocale, Readonly<Record<string, string>>>>);

export function BuildingProximityDisclosure({ proximity, locale = 'en' }: Readonly<{
  proximity: ObservedBuildingIdentityModel['proximity'] | undefined;
  locale?: ProductLocale;
}>) {
  const copy = proximityCopy[locale];
  if (proximity === undefined || proximity.status !== 'ready' || proximity.coordinateStatus !== 'ready' || (!proximity.nearestStation && !proximity.nearestSchool)) return <section className={styles.proximityDetails} data-building-proximity="unavailable"><h3>{copy.heading}</h3><p>{locale === 'ko' ? '이 건물과 정확히 연결된 학교·역의 거리 정보는 아직 확인되지 않았습니다.' : locale === 'zh-CN' ? '该楼盘到学校和车站的距离尚未核实。' : 'School and station distances for this exact building have not been confirmed yet.'}</p></section>;
  return <section className={styles.proximityDetails} data-building-proximity="ready">
    <h3>{copy.heading}</h3>
    <dl className={styles.findingGrid}>
      {proximity.nearestStation && <div><dt>{copy.station}</dt><dd>{[proximity.nearestStation.name, proximity.nearestStation.lines.join(', '), `${Math.round(proximity.nearestStation.distanceMeters)} m`].filter(Boolean).join(' · ')}</dd></div>}
      {proximity.nearestSchool && <div><dt>{copy.school}</dt><dd>{proximity.nearestSchool.name} · {Math.round(proximity.nearestSchool.distanceMeters)} m</dd></div>}
    </dl>
    <p>{copy.attendanceDisclaimer}</p>
    {proximity.provenance === undefined ? null : <details><summary>{locale === 'ko' ? '거리 정보 출처' : locale === 'zh-CN' ? '距离数据来源' : 'Distance sources'}</summary><dl className={styles.sourceGrid}>
      <div><dt>{copy.stationSource}</dt><dd>{proximity.provenance.stationSource.landingPage} · {copy.version} {proximity.provenance.stationSource.sourceVersion} · {copy.asOf} {proximity.provenance.stationSource.asOf}</dd></div>
      <div><dt>{copy.schoolSource}</dt><dd>{proximity.provenance.schoolSource.landingPage} · {copy.version} {proximity.provenance.schoolSource.sourceVersion} · {copy.asOf} {proximity.provenance.schoolSource.asOf}</dd></div>
      <div><dt>{copy.coordinateSource}</dt><dd>{proximity.provenance.coordinateSource.landingPage} · {copy.version} {proximity.provenance.coordinateSource.sourceVersion} · {copy.asOf} {proximity.provenance.coordinateSource.asOf}</dd></div>
      <div><dt>{copy.methodology}</dt><dd>{proximity.provenance.methodology}{copy.methodologySuffix}</dd></div>
    </dl></details>}
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
      <main className={`${styles.main} ${detailStyles.root}`} data-detail-layout="unified" data-building-detail="identity-only">
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          <div data-detail-order="media">{visual ?? <SeoulBuildingContext locale={locale} name={model.building.officialName} href={backHref} />}</div>

          <div className={styles.identitySummary}>
            <Link className={styles.backAction} href={backHref}>
              {locale === 'ko' ? `${model.district.nameKo} 탐색으로` : `Back to ${model.district.nameEn} Explore`}
            </Link>
            <h1>{buildingDisplayName(model.building.officialName, locale)}</h1>
            <p>{neighborhoodDisplayName(model.building.neighborhoodName, locale)} · {locale === 'ko' ? model.district.nameKo : model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>{t('Housing type')}</dt><dd>{t(model.building.housingType)}</dd></div>
            </dl>
            <BuildingSaveButton
              buildingKey={`${model.district.slug}/${model.building.buildingId}`}
              buildingName={model.building.officialName}
              locale={locale}
              variant="detail"
            />
          </div>
        </section>

        <nav className={styles.mockupTabs} aria-label={t('Building page sections')}><a href="#building-overview">{t('Overview')}</a><a href="#building-facts">{t('Building profile')}</a><a href="#building-source">{t('Source')}</a></nav>
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
        <div id="building-facts" className={detailStyles.section}>
          {facts ?? <KnownBuildingFacts locale={locale} facts={[{ label: 'Map identity', value: coordinateLabel }]} />}
        </div>
        <PropertyLivingContext entity={`kr-seoul:estate:${model.building.buildingId}`} locale={locale} />
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
  const checkHref = createEntityCheckHref(localizedSeoulHref('/kr/seoul/check/', locale), {
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
  // Carry an exact filed size only when the visible cohort identifies one size.
  // A range such as 60–85㎡ is not an individual unit area.
  const sizes = [...new Set(model.recentTransactions.map(row => row.areaSqm).filter(area => Number.isFinite(area) && area > 0))];
  if (sizes.length !== 1) return checkHref;
  const target = new URL(checkHref, 'https://signedprice.invalid');
  target.searchParams.set('area', String(sizes[0]));
  return `${target.pathname}${target.search}`;
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
  const transactionLabel = locale === 'ko' ? {sale:'매매',jeonse:'전세',monthly:'월세'}[model.selection.transaction] : locale === 'zh-CN' ? {sale:'买卖',jeonse:'全租',monthly:'月租'}[model.selection.transaction] : transactionLabels[model.selection.transaction];
  const publicationHeading = model.evidence.state === 'published'
    ? (model.selection.areaBand === 'all' ? (locale === 'ko' ? '이 단지 신고 거래 · 전체 면적' : locale === 'zh-CN' ? '申报合同 · 全部面积' : 'Reported contracts · all sizes') : (locale === 'ko' ? '같은 면적대 신고 거래' : locale === 'zh-CN' ? '申报合同 · 相同面积区间' : 'Reported contracts · same size'))
    : model.evidence.state === 'withheld'
      ? (locale === 'ko' ? '최근 신고 거래' : locale === 'zh-CN' ? '近期申报合同' : 'Recent reported contracts')
      : (locale === 'ko' ? '선택한 조건의 신고 거래가 없습니다' : locale === 'zh-CN' ? '暂无符合条件的合同' : 'No matching contracts');

  const monthlyUnit = model.evidence.primaryMetric === 'monthly-rent' ? (locale === 'ko' ? ' /월' : locale === 'zh-CN' ? ' /月' : ' /month') : '';
  const money = (value: number) => locale === 'ko' ? (value >= 100_000_000 ? `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억 원` : value >= 10_000 ? `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만 원` : `${Math.round(value).toLocaleString('ko-KR')}원`) : `₩${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;
  const sourceLine = `${locale === 'ko' ? '출처: 국토교통부' : locale === 'zh-CN' ? '来源：韩国国土交通部' : 'Source: MOLIT'} · ${model.period} · ${locale === 'ko' ? '갱신' : locale === 'zh-CN' ? '更新' : 'Updated'} ${model.generatedAt.slice(0,10)}`;
  const recentTarget = new URL(backHref, 'https://signedprice.invalid');
  recentTarget.pathname = `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`;
  recentTarget.searchParams.set('transaction', model.selection.transaction);
  recentTarget.searchParams.set('area', model.selection.areaBand);
  recentTarget.searchParams.set('propertyType', model.building.housingType);
  if (model.selection.contractGroup === 'not-applicable') recentTarget.searchParams.delete('contractType');
  else recentTarget.searchParams.set('contractType', model.selection.contractGroup);
  return (
    <div id="top" className={styles.page}>
      <BuildingDetailHeader locale={locale} />
      <main className={`${styles.main} ${detailStyles.root}`} data-detail-layout="unified" data-building-detail="exact-evidence" data-detail-locale={locale}>
        <RecordPlaceVisit place={{ market: 'seoul', key: `${model.district.slug}/${model.building.buildingId}`, name: buildingDisplayName(model.building.officialName, locale), href: `${recentTarget.pathname}${recentTarget.search}` }} />
        <BuildingSummaryCard model={model} backHref={backHref} locale={locale} />
        <div className={styles.summaryMedia} data-detail-order="media">{visual ?? <SeoulBuildingContext locale={locale} name={model.building.officialName} href={backHref} />}</div>

        <nav className={styles.mockupTabs} aria-label={locale === 'ko' ? '건물 상세 항목' : locale === 'zh-CN' ? '楼盘详情栏目' : 'Building detail sections'}>
          <a href="#building-overview">{locale === 'ko' ? '개요' : locale === 'zh-CN' ? '概览' : 'Overview'}</a>
          <a href="#building-transactions">{locale === 'ko' ? '실거래' : locale === 'zh-CN' ? '交易记录' : 'Transactions'}</a>
          <a href="#building-facts">{locale === 'ko' ? '단지 정보' : locale === 'zh-CN' ? '楼盘资料' : 'Building facts'}</a>
          <a href="#building-tools">{locale === 'ko' ? '내 조건 비교' : locale === 'zh-CN' ? '比较' : 'Compare'}</a>
          <a href="#building-source">{locale === 'ko' ? '출처' : locale === 'zh-CN' ? '来源' : 'Sources'}</a>
        </nav>


        <section id="building-area-prices" className={styles.areaBands} data-detail-order="comparable-range" aria-labelledby="building-area-prices-heading">
          <div className={styles.sectionHeading}>
            <p>{locale === 'ko' ? '면적별 가격' : locale === 'zh-CN' ? '按面积查看价格' : 'Price by home size'}</p>
            <h2 id="building-area-prices-heading">{locale === 'ko' ? '면적별 가격 비교' : locale === 'zh-CN' ? '各面积价格比较' : 'Prices by home size'}</h2>
          </div>
          {model.sizeCohorts ? <SizeCohortResearch rows={model.sizeCohorts} currency="KRW" locale={locale} periodUnit={model.evidence.primaryMetric === 'monthly-rent' ? 'month' : undefined} /> : null}

        </section>

        <section className={styles.evidence} data-building-section="exact-evidence">
          <nav className={detailStyles.filters} aria-label={locale === 'ko' ? '거래 유형' : locale === 'zh-CN' ? '交易类型' : 'Transaction type'}>
            {(['sale', 'jeonse', 'monthly'] as const).map(transaction => <Link key={transaction} aria-current={transaction === model.selection.transaction ? 'true' : undefined} href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${transaction}&area=${model.selection.areaBand}`,locale)}>{t(transactionLabels[transaction])}</Link>)}
          </nav>
          <nav className={detailStyles.filters} aria-label={locale === 'ko' ? '면적 선택' : locale === 'zh-CN' ? '住宅面积' : 'Home size'}>
            {Object.entries(areaLabels).map(([id, label]) => <Link key={id} aria-current={id === model.selection.areaBand ? 'true' : undefined} href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${model.selection.transaction}&area=${id}${model.selection.contractGroup === 'not-applicable' ? '' : `&contractType=${model.selection.contractGroup}`}`, locale)}>{t(label)}</Link>)}
          </nav>
          <div className={styles.sectionHeading}>
            <p>{transactionLabel} · {areaLabel}</p>
            <h2>{publicationHeading}</h2>
          </div>
          {model.evidence.primaryMetric === 'monthly-rent' ? <p>{locale === 'ko' ? '월세와 반환 보증금을 별도로 표시합니다.' : locale === 'zh-CN' ? '月租与可退还押金分别显示。' : 'Monthly rent and refundable deposits are shown separately.'}</p> : null}

          <RecentTransactionPlot rows={model.recentTransactions} locale={locale} periodUnit={model.evidence.primaryMetric === 'monthly-rent' ? 'month' : undefined} />

          <div id="building-transactions" className={styles.sectionHeading} data-detail-order="history"><p>{locale === 'ko' ? '실제 신고 거래' : locale === 'zh-CN' ? '实际申报合同' : 'Reported contracts'}</p><h2>{locale === 'ko' ? '선택한 면적대의 최근 실거래' : locale === 'zh-CN' ? '符合当前筛选条件的近期合同' : 'Recent contracts matching these filters'}</h2></div>
          {model.recentTransactions.length === 0 ? (
            <p>{t('No privacy-safe recent rows remain in this selected cohort.')}</p>
          ) : (
            <div className={`${styles.tableWrap} ${styles.recentTable}`} tabIndex={0} role="region" aria-label={locale === 'ko' ? '실거래표 · 가로로 스크롤' : locale === 'zh-CN' ? '申报交易表 · 可横向滚动' : 'Reported transactions · scroll horizontally'}>
              <table>
                <thead>
                  <tr>
                    <th>{locale === 'ko' ? '계약 월' : locale === 'zh-CN' ? '合同月份' : 'Filed month'}</th>
                    <th>{locale === 'ko' ? '전용면적' : locale === 'zh-CN' ? '专有面积' : 'Area'}</th>
                    <th>{locale === 'ko' ? (model.evidence.primaryMetric === 'sale-price' ? '신고 매매가격' : model.evidence.primaryMetric === 'deposit' ? '신고 보증금' : '신고 월세') : (model.evidence.primaryMetric === 'sale-price' ? 'Filed sale price' : model.evidence.primaryMetric === 'deposit' ? 'Filed deposit' : 'Filed monthly rent')}</th>
                    {model.evidence.primaryMetric === 'monthly-rent' ? <th>{t('Filed deposit')}</th> : null}
                    <th>{locale === 'ko' ? '㎡당 금액' : locale === 'zh-CN' ? '每㎡价格' : 'Price / m²'}{monthlyUnit}</th><th>{locale === 'ko' ? '층·계약 구분' : locale === 'zh-CN' ? '楼层／合同类别' : 'Floor / contract'}</th>
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
                      <td>{row.areaSqm > 0 ? `${money(row.primaryWon / row.areaSqm)}${monthlyUnit}` : '—'}</td><td>{row.contractType === null ? (row.floor === null ? (locale === 'ko' ? '신고 계약' : locale === 'zh-CN' ? '申报合同' : 'Reported contract') : locale === 'ko' ? `${row.floor}층` : `Floor ${row.floor}`) : t(row.contractType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div id="building-facts" className={styles.factsAnchor} data-detail-order="facts">
          {facts ?? <KnownBuildingFacts locale={locale} facts={[
            { label: 'Housing type', value: model.building.housingType },
          ]} />}
        </div>
        <PropertyLivingContext entity={`kr-seoul:estate:${model.building.buildingId}`} locale={locale} />
        <DetailTools locale={locale} id="building-tools" checkHref={buildKoreaEvidenceCheckHref(model, locale)}
          calculatorHref={model.selection.transaction === 'sale' ? createPropertyScenarioHref({locale,market:'kr-seoul',currency:'KRW',entity:model.building.buildingId,propertyName:model.building.officialName,transaction:'sale',housing:model.building.housingType,areaBand:model.selection.areaBand,price:model.evidence.state === 'published' ? model.evidence.medianWon : null,annualRent:model.rentStartingPoint?.annualRent,returnTo:localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${model.selection.transaction}&area=${model.selection.areaBand}`,locale)}) : undefined} />

        <details id="building-source" className={styles.sourceDetails} data-detail-order="sources">
          <summary>{locale === 'ko' ? '출처·기간·표본 기준' : locale === 'zh-CN' ? '来源、期间与样本说明' : 'Source and sample details'}</summary>
          <p className={styles.sourceLine}>{sourceLine}</p>
          <dl className={styles.sourceGrid}>
            <div><dt>{t('Source')}</dt><dd>{t('MOLIT reported contracts')}</dd></div>
            <div><dt>{t('Source period')}</dt><dd>{model.period}</dd></div>
            <div><dt>{t('Generated')}</dt><dd>{model.generatedAt.slice(0, 10)}</dd></div>
            <div><dt>{t('Publication minimum')}</dt><dd>{t('5 eligible contracts')}</dd></div>
          </dl>
        </details>

        {!!model.nearbyBuildings?.length && <section data-detail-order="related-actions" className={styles.areaBands} aria-label={locale === 'ko' ? '주변 다른 건물' : locale === 'zh-CN' ? '附近其他楼盘' : 'Other buildings nearby'}>
          <h2>{locale === 'ko' ? '주변 다른 건물' : locale === 'zh-CN' ? '附近其他楼盘' : 'Other buildings nearby'}</h2>

          {!!model.nearbyBuildings?.length && <><h3>{locale === 'ko' ? '같은 동 · 같은 검색 조건' : locale === 'zh-CN' ? '相同街区与筛选条件' : 'Same neighbourhood and filters'}</h3><ul>{model.nearbyBuildings.map(b => <li key={b.id}><Link href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${b.id}/?transaction=${model.selection.transaction}&area=${model.selection.areaBand}`,locale)}>{buildingDisplayName(b.name,locale)} · {money(b.median)} · {b.count}{locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔合同' : ' contracts'}</Link></li>)}</ul></>}
        </section>}
        <DiscoveryReading market="seoul" locale={locale} />
      </main>
      <SiteFooter locale={locale} copy={locale === 'ko' ? { ...exactEvidenceFooter, descriptor: '서울 실거래가와 집계 기간·거래 건수·출처를 확인하세요.' } : locale === 'zh-CN' ? { ...exactEvidenceFooter, descriptor: '首尔申报交易价格、统计期间、交易笔数与来源。' } : exactEvidenceFooter} />
    </div>
  );
}
